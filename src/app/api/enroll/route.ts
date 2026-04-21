import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute } from '@/lib/mysql-server';
import { RowDataPacket } from 'mysql2/promise';

interface EnrollmentRow extends RowDataPacket {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed: boolean;
  completed_at: string | null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    const existing = await query<EnrollmentRow[]>(
      'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
      [session.user.id, courseId]
    );

    if (existing.length > 0) {
      return NextResponse.json(existing[0]);
    }

    const id = crypto.randomUUID();
    await execute(
      'INSERT INTO enrollments (id, user_id, course_id, completed) VALUES (?, ?, ?, ?)',
      [id, session.user.id, courseId, false]
    );

    const newEnrollment = await query<EnrollmentRow[]>(
      'SELECT * FROM enrollments WHERE id = ?',
      [id]
    );

    return NextResponse.json(newEnrollment[0] || { id, success: true });
  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
  }
}