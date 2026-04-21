import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute } from '@/lib/mysql-server';
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

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await query<CourseRow[]>(
      'SELECT c.*, (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as modules_count FROM courses c ORDER BY c.created_at DESC',
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 },
      );
    }

    await execute('DELETE FROM courses WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, image_url } = await request.json();

    if (!title || !String(title).trim()) {
      return NextResponse.json(
        { error: 'Course title is required' },
        { status: 400 },
      );
    }

    const id = crypto.randomUUID();

    await execute(
      'INSERT INTO courses (id, title, description, image_url, created_by) VALUES (?, ?, ?, ?, ?)',
      [
        id,
        String(title).trim(),
        description ? String(description).trim() : null,
        image_url ? String(image_url).trim() : null,
        session.user.id,
      ],
    );

    const rows = await query<CourseRow[]>(
      'SELECT * FROM courses WHERE id = ?',
      [id],
    );

    return NextResponse.json(rows[0] ?? { id });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 },
    );
  }
}
