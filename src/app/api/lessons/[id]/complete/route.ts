import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute } from '@/lib/mysql-server';
import { RowDataPacket } from 'mysql2/promise';

interface LessonProgressRow extends RowDataPacket {
  id: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: lessonId } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existing = await query<LessonProgressRow[]>(
      'SELECT id FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
      [session.user.id, lessonId]
    );

    if (existing.length > 0) {
      await execute(
        'UPDATE lesson_progress SET completed = true, completed_at = NOW() WHERE user_id = ? AND lesson_id = ?',
        [session.user.id, lessonId]
      );
    } else {
      const id = crypto.randomUUID();
      await execute(
        'INSERT INTO lesson_progress (id, user_id, lesson_id, completed, completed_at) VALUES (?, ?, ?, ?, NOW())',
        [id, session.user.id, lessonId, true]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    return NextResponse.json({ error: 'Failed to mark lesson complete' }, { status: 500 });
  }
}