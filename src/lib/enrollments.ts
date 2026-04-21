'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute } from '@/lib/mysql-server';
import { Enrollment, LessonProgress } from '@/types';
import { RowDataPacket } from 'mysql2/promise';

interface EnrollmentRow extends RowDataPacket {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed: boolean;
  completed_at: string | null;
}

interface LessonProgressRow extends RowDataPacket {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  last_position_seconds: number | null;
  created_at: string;
  updated_at: string;
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

export async function enrollInCourse(
  courseId: string,
): Promise<Enrollment | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const rows = await query<EnrollmentRow[]>(
    'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
    [session.user.id, courseId],
  );

  if (rows.length > 0) {
    return rows[0];
  }

  const id = crypto.randomUUID();
  await execute(
    'INSERT INTO enrollments (id, user_id, course_id, completed) VALUES (?, ?, ?, ?)',
    [id, session.user.id, courseId, false],
  );

  const newRows = await query<EnrollmentRow[]>(
    'SELECT * FROM enrollments WHERE id = ?',
    [id],
  );

  return newRows[0] || null;
}

export async function getUserEnrollments(): Promise<Enrollment[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const rows = await query<EnrollmentRow[]>(
    `SELECT e.*, c.title, c.description, c.image_url, c.created_at as course_created_at, c.updated_at as course_updated_at
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     WHERE e.user_id = ?
     ORDER BY e.enrolled_at DESC`,
    [session.user.id],
  );

  return rows as Enrollment[];
}

export async function isUserEnrolled(courseId: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;

  const rows = await query<EnrollmentRow[]>(
    'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
    [session.user.id, courseId],
  );

  return rows.length > 0;
}

export async function markLessonComplete(
  lessonId: string,
  completed: boolean = true,
): Promise<LessonProgress | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const rows = await query<LessonProgressRow[]>(
    'SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
    [session.user.id, lessonId],
  );

  if (rows.length > 0) {
    await execute(
      'UPDATE lesson_progress SET completed = ?, completed_at = ? WHERE user_id = ? AND lesson_id = ?',
      [
        completed,
        completed ? new Date().toISOString() : null,
        session.user.id,
        lessonId,
      ],
    );
  } else {
    const id = crypto.randomUUID();
    await execute(
      'INSERT INTO lesson_progress (id, user_id, lesson_id, completed, completed_at) VALUES (?, ?, ?, ?, ?)',
      [
        id,
        session.user.id,
        lessonId,
        completed,
        completed ? new Date().toISOString() : null,
      ],
    );
  }

  const updated = await query<LessonProgressRow[]>(
    'SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
    [session.user.id, lessonId],
  );

  return updated[0] || null;
}

export async function updateLessonProgress(
  lessonId: string,
  positionSeconds: number,
): Promise<LessonProgress | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const rows = await query<LessonProgressRow[]>(
    'SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
    [session.user.id, lessonId],
  );

  if (rows.length > 0) {
    await execute(
      'UPDATE lesson_progress SET last_position_seconds = ? WHERE user_id = ? AND lesson_id = ?',
      [positionSeconds, session.user.id, lessonId],
    );
  } else {
    const id = crypto.randomUUID();
    await execute(
      'INSERT INTO lesson_progress (id, user_id, lesson_id, last_position_seconds) VALUES (?, ?, ?, ?)',
      [id, session.user.id, lessonId, positionSeconds],
    );
  }

  const updated = await query<LessonProgressRow[]>(
    'SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
    [session.user.id, lessonId],
  );

  return updated[0] || null;
}

export async function getLessonProgress(
  lessonId: string,
): Promise<LessonProgress | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const rows = await query<LessonProgressRow[]>(
    'SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
    [session.user.id, lessonId],
  );

  return rows[0] || null;
}

export async function getCourseProgress(courseId: string): Promise<{
  completedLessons: number;
  totalLessons: number;
  percentage: number;
}> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return { completedLessons: 0, totalLessons: 0, percentage: 0 };

  const modules = await query<ModuleRow[]>(
    'SELECT id FROM modules WHERE course_id = ?',
    [courseId],
  );

  if (modules.length === 0) {
    return { completedLessons: 0, totalLessons: 0, percentage: 0 };
  }

  const moduleIds = modules.map((m) => m.id);
  const lessons = await query<LessonRow[]>(
    'SELECT id FROM lessons WHERE module_id IN (?)',
    [moduleIds],
  );

  const totalLessons = lessons.length;
  if (totalLessons === 0) {
    return { completedLessons: 0, totalLessons: 0, percentage: 0 };
  }

  const lessonIds = lessons.map((l) => l.id);
  const progress = await query<LessonProgressRow[]>(
    'SELECT completed FROM lesson_progress WHERE user_id = ? AND lesson_id IN (?) AND completed = true',
    [session.user.id, lessonIds],
  );

  const completedLessons = progress.length;
  const percentage = Math.round((completedLessons / totalLessons) * 100);

  return { completedLessons, totalLessons, percentage };
}

export async function getCoursesProgress(
  courseIds: string[],
): Promise<
  Map<
    string,
    { completedLessons: number; totalLessons: number; percentage: number }
  >
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Map();

  if (courseIds.length === 0) return new Map();

  const modules = await query<ModuleRow[]>(
    'SELECT id, course_id FROM modules WHERE course_id IN (?)',
    [courseIds],
  );

  const moduleIds = modules.map((m) => m.id);
  if (moduleIds.length === 0) {
    const map = new Map<
      string,
      { completedLessons: number; totalLessons: number; percentage: number }
    >();
    courseIds.forEach((id) =>
      map.set(id, { completedLessons: 0, totalLessons: 0, percentage: 0 }),
    );
    return map;
  }

  const lessons = await query<LessonRow[]>(
    'SELECT id, module_id FROM lessons WHERE module_id IN (?)',
    [moduleIds],
  );

  const lessonIds = lessons.map((l) => l.id);
  if (lessonIds.length === 0) {
    const map = new Map<
      string,
      { completedLessons: number; totalLessons: number; percentage: number }
    >();
    courseIds.forEach((id) =>
      map.set(id, { completedLessons: 0, totalLessons: 0, percentage: 0 }),
    );
    return map;
  }

  const progress = await query<LessonProgressRow[]>(
    'SELECT lesson_id, completed FROM lesson_progress WHERE user_id = ? AND lesson_id IN (?)',
    [session.user.id, lessonIds],
  );

  const progressMap = new Map<string, boolean>();
  progress.forEach((p) => {
    progressMap.set(p.lesson_id, p.completed);
  });

  const moduleToCourse = new Map(modules.map((m) => [m.id, m.course_id]));

  const courseIdToLessonIds: Record<string, string[]> = {};
  courseIds.forEach((id) => {
    courseIdToLessonIds[id] = [];
  });

  lessons.forEach((lesson) => {
    const courseId = moduleToCourse.get(lesson.module_id);
    if (courseId && courseIdToLessonIds[courseId]) {
      courseIdToLessonIds[courseId].push(lesson.id);
    }
  });

  const result = new Map<
    string,
    { completedLessons: number; totalLessons: number; percentage: number }
  >();
  courseIds.forEach((id) => {
    const lessonIdsForCourse = courseIdToLessonIds[id] || [];
    const totalLessons = lessonIdsForCourse.length;
    const completedLessons = lessonIdsForCourse.filter((lessonId) =>
      progressMap.get(lessonId),
    ).length;
    const percentage =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;
    result.set(id, { completedLessons, totalLessons, percentage });
  });

  return result;
}

export async function getUserStatistics(): Promise<{
  totalEnrolled: number;
  completedCourses: number;
  totalLessonsWatched: number;
  totalHoursLearned: number;
}> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      totalEnrolled: 0,
      completedCourses: 0,
      totalLessonsWatched: 0,
      totalHoursLearned: 0,
    };
  }

  const enrollments = await query<EnrollmentRow[]>(
    'SELECT id, completed, course_id FROM enrollments WHERE user_id = ?',
    [session.user.id],
  );

  const totalEnrolled = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.completed).length;

  const progress = await query<LessonProgressRow[]>(
    'SELECT id FROM lesson_progress WHERE user_id = ?',
    [session.user.id],
  );

  const totalLessonsWatched = progress.length;

  if (totalEnrolled === 0) {
    return {
      totalEnrolled: 0,
      completedCourses: 0,
      totalLessonsWatched: 0,
      totalHoursLearned: 0,
    };
  }

  const courseIds = enrollments.map((e) => e.course_id);

  const modules = await query<ModuleRow[]>(
    'SELECT id FROM modules WHERE course_id IN (?)',
    [courseIds],
  );

  const moduleIds = modules.map((m) => m.id);

  const lessons = await query<LessonRow[]>(
    'SELECT duration_minutes FROM lessons WHERE module_id IN (?)',
    [moduleIds],
  );

  const totalMinutes = lessons.reduce((sum, lesson) => {
    return sum + (lesson.duration_minutes || 0);
  }, 0);

  const totalHoursLearned = Math.round((totalMinutes / 60) * 10) / 10;

  return {
    totalEnrolled,
    completedCourses,
    totalLessonsWatched,
    totalHoursLearned,
  };
}
