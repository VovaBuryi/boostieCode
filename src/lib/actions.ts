'use server';

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

export async function enrollInCourseServer(courseId: string): Promise<EnrollmentRow | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  const existing = await query<EnrollmentRow[]>(
    'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
    [session.user.id, courseId]
  );

  if (existing.length > 0) {
    return existing[0];
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

  return newEnrollment[0] || null;
}