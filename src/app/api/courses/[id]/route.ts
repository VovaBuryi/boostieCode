import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/mysql-server';
import { RowDataPacket } from 'mysql2/promise';

interface CourseRow extends RowDataPacket {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  created_by: string;
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

interface LessonProgressRow extends RowDataPacket {
  lesson_id: string;
  completed: boolean;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  try {
    const courseRows = await query<CourseRow[]>(
      'SELECT * FROM courses WHERE id = ?',
      [id],
    );

    if (courseRows.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const courseData = courseRows[0];

    const moduleRows = await query<ModuleRow[]>(
      'SELECT * FROM modules WHERE course_id = ? ORDER BY order_index ASC',
      [id],
    );

    const modulesWithLessons = await Promise.all(
      moduleRows.map(async (module) => {
        const lessonRows = await query<LessonRow[]>(
          'SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index ASC',
          [module.id],
        );
        return { ...module, lessons: lessonRows };
      }),
    );

    let modulesWithCompletion = modulesWithLessons;
    if (session?.user?.id) {
      const allLessonIds = modulesWithLessons.flatMap(m => m.lessons.map(l => l.id));
      
      if (allLessonIds.length > 0) {
        const progressRows = await query<LessonProgressRow[]>(
          `SELECT lesson_id, completed FROM lesson_progress 
           WHERE user_id = ? AND lesson_id IN (?)`,
          [session.user.id, allLessonIds]
        );
        
        const progressMap = new Map(progressRows.map(p => [p.lesson_id, p.completed]));
        
        modulesWithCompletion = modulesWithLessons.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => ({
            ...lesson,
            completed: progressMap.get(lesson.id) || false,
          })),
        }));
      }
    }

    return NextResponse.json({
      ...courseData,
      modules: modulesWithCompletion,
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
