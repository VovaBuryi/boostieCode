import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/mysql-server';
import { RowDataPacket } from 'mysql2/promise';

interface LessonProgressRow extends RowDataPacket {
  lesson_id: string;
  completed: boolean;
}

interface ModuleRow extends RowDataPacket {
  id: string;
  course_id: string;
}

interface LessonRow extends RowDataPacket {
  id: string;
  module_id: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const moduleRows = await query<ModuleRow[]>(
      'SELECT id FROM modules WHERE course_id = ?',
      [courseId]
    );

    if (moduleRows.length === 0) {
      return NextResponse.json({ completedLessons: 0, totalLessons: 0, percentage: 0 });
    }

    const moduleIds = moduleRows.map(m => m.id);
    const lessonRows = await query<LessonRow[]>(
      'SELECT id FROM lessons WHERE module_id IN (?)',
      [moduleIds]
    );

    const totalLessons = lessonRows.length;
    if (totalLessons === 0) {
      return NextResponse.json({ completedLessons: 0, totalLessons: 0, percentage: 0 });
    }

    const lessonIds = lessonRows.map(l => l.id);
    const progressRows = await query<LessonProgressRow[]>(
      'SELECT lesson_id, completed FROM lesson_progress WHERE user_id = ? AND lesson_id IN (?) AND completed = true',
      [session.user.id, lessonIds]
    );

    const completedLessons = progressRows.length;
    const percentage = Math.round((completedLessons / totalLessons) * 100);

    return NextResponse.json({ completedLessons, totalLessons, percentage });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}