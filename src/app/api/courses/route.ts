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
  modules_count: number;
}

interface EnrollmentRow extends RowDataPacket {
  course_id: string;
}

export async function GET() {
  try {
    const courses = await query<CourseRow[]>(
      'SELECT c.*, (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as modules_count FROM courses c ORDER BY c.created_at DESC'
    );

    const session = await getServerSession(authOptions);
    
    if (session?.user?.id) {
      const enrollments = await query<EnrollmentRow[]>(
        'SELECT course_id FROM enrollments WHERE user_id = ?',
        [session.user.id]
      );
      
      const enrolledIds = new Set(enrollments.map(e => e.course_id));
      
      const coursesWithEnrollment = courses.map(course => ({
        ...course,
        enrolled: enrolledIds.has(course.id),
      }));
      
      return NextResponse.json(coursesWithEnrollment);
    }
    
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}