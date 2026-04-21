import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/mysql-server';
import { RowDataPacket } from 'mysql2/promise';

interface EnrollmentRow extends RowDataPacket {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed: boolean;
  completed_at: string | null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await query<EnrollmentRow[]>(
      'SELECT e.*, c.title, c.description, c.image_url FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = ? ORDER BY e.enrolled_at DESC',
      [session.user.id]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}