'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute } from '@/lib/mysql-server';
import { Course, CourseWithDetails, Module, Lesson } from '@/types';
import { RowDataPacket } from 'mysql2/promise';

interface CourseRow extends RowDataPacket {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  modules_count: number;
}

interface ModuleRow extends RowDataPacket {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface LessonRow extends RowDataPacket {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  order_index: number;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export async function getCourses(): Promise<Course[]> {
  const courseRows = await query<CourseRow[]>(
    'SELECT c.*, (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as modules_count FROM courses c ORDER BY c.created_at DESC',
  );

  const courses = courseRows.map((course) => ({
    ...course,
    modules_count: course.modules_count,
  }));

  return courses as Course[];
}

export async function getCourseById(
  id: string,
): Promise<CourseWithDetails | null> {
  const courseRows = await query<CourseRow[]>(
    'SELECT * FROM courses WHERE id = ?',
    [id],
  );

  if (courseRows.length === 0) return null;

  const courseData = courseRows[0];
  const moduleRows = await query<ModuleRow[]>(
    'SELECT * FROM modules WHERE course_id = ? ORDER BY order_index ASC',
    [id],
  );

  const modules = moduleRows as Module[];

  if (modules.length === 0) {
    return {
      ...courseData,
      modules: [],
    } as CourseWithDetails;
  }

  const moduleIds = modules.map((m) => m.id);

  const lessonRows = await query<LessonRow[]>(
    'SELECT * FROM lessons WHERE module_id IN (?) ORDER BY order_index ASC',
    [moduleIds],
  );

  console.log(lessonRows);

  const lessons = lessonRows as Lesson[];

  const lessonsByModule = lessons.reduce(
    (acc, lesson) => {
      if (!acc[lesson.module_id]) {
        acc[lesson.module_id] = [];
      }
      acc[lesson.module_id].push(lesson);
      return acc;
    },
    {} as Record<string, Lesson[]>,
  );

  const modulesWithLessons = modules.map((module) => ({
    ...module,
    lessons: (lessonsByModule[module.id] || []).sort(
      (a, b) => a.order_index - b.order_index,
    ),
  })) as ModuleWithLessons[];

  return {
    ...courseData,
    modules: modulesWithLessons,
  } as CourseWithDetails;
}

export async function createCourse(courseData: {
  title: string;
  description?: string | null;
  image_url?: string | null;
}): Promise<Course | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const id = crypto.randomUUID();
  await execute(
    'INSERT INTO courses (id, title, description, image_url, created_by) VALUES (?, ?, ?, ?, ?)',
    [
      id,
      courseData.title,
      courseData.description || null,
      courseData.image_url || null,
      session.user.id,
    ],
  );

  const rows = await query<CourseRow[]>('SELECT * FROM courses WHERE id = ?', [
    id,
  ]);

  return rows[0] as Course;
}

export async function updateCourse(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    image_url?: string | null;
  },
): Promise<Course | null> {
  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.image_url !== undefined) {
    updates.push('image_url = ?');
    values.push(data.image_url);
  }

  if (updates.length === 0) return null;

  values.push(id);
  await execute(
    `UPDATE courses SET ${updates.join(', ')} WHERE id = ?`,
    values,
  );

  const rows = await query<CourseRow[]>('SELECT * FROM courses WHERE id = ?', [
    id,
  ]);

  return rows[0] as Course;
}

export async function deleteCourse(id: string): Promise<boolean> {
  await execute('DELETE FROM courses WHERE id = ?', [id]);
  return true;
}

export async function createModule(moduleData: {
  course_id: string;
  title: string;
  description?: string | null;
  order_index: number;
}): Promise<Module | null> {
  const id = crypto.randomUUID();
  await execute(
    'INSERT INTO modules (id, course_id, title, description, order_index) VALUES (?, ?, ?, ?, ?)',
    [
      id,
      moduleData.course_id,
      moduleData.title,
      moduleData.description || null,
      moduleData.order_index,
    ],
  );

  const rows = await query<ModuleRow[]>('SELECT * FROM modules WHERE id = ?', [
    id,
  ]);

  return rows[0] as Module;
}

export async function updateModule(
  id: string,
  data: { title?: string; description?: string | null; order_index?: number },
): Promise<Module | null> {
  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.order_index !== undefined) {
    updates.push('order_index = ?');
    values.push(data.order_index);
  }

  if (updates.length === 0) return null;

  values.push(id);
  await execute(
    `UPDATE modules SET ${updates.join(', ')} WHERE id = ?`,
    values,
  );

  const rows = await query<ModuleRow[]>('SELECT * FROM modules WHERE id = ?', [
    id,
  ]);

  return rows[0] as Module;
}

export async function deleteModule(id: string): Promise<boolean> {
  await execute('DELETE FROM modules WHERE id = ?', [id]);
  return true;
}

export async function createLesson(lessonData: {
  module_id: string;
  title: string;
  content?: string | null;
  video_url?: string | null;
  order_index: number;
  duration_minutes?: number | null;
}): Promise<Lesson | null> {
  const id = crypto.randomUUID();
  await execute(
    'INSERT INTO lessons (id, module_id, title, content, video_url, order_index, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      lessonData.module_id,
      lessonData.title,
      lessonData.content ?? null,
      lessonData.video_url ?? null,
      lessonData.order_index,
      lessonData.duration_minutes ?? null,
    ],
  );

  const rows = await query<LessonRow[]>('SELECT * FROM lessons WHERE id = ?', [
    id,
  ]);

  return rows[0] as Lesson;
}

export async function updateLesson(
  id: string,
  data: {
    title?: string;
    content?: string | null;
    video_url?: string | null;
    order_index?: number;
    duration_minutes?: number | null;
  },
): Promise<Lesson | null> {
  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.content !== undefined) {
    updates.push('content = ?');
    values.push(data.content);
  }
  if (data.video_url !== undefined) {
    updates.push('video_url = ?');
    values.push(data.video_url);
  }
  if (data.order_index !== undefined) {
    updates.push('order_index = ?');
    values.push(data.order_index);
  }
  if (data.duration_minutes !== undefined) {
    updates.push('duration_minutes = ?');
    values.push(data.duration_minutes);
  }

  if (updates.length === 0) return null;

  values.push(id);
  await execute(
    `UPDATE lessons SET ${updates.join(', ')} WHERE id = ?`,
    values,
  );

  const rows = await query<LessonRow[]>('SELECT * FROM lessons WHERE id = ?', [
    id,
  ]);

  return rows[0] as Lesson;
}

export async function deleteLesson(id: string): Promise<boolean> {
  await execute('DELETE FROM lessons WHERE id = ?', [id]);
  return true;
}
