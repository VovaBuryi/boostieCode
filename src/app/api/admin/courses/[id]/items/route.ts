import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute } from '@/lib/mysql-server';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const modules = await query<RowDataPacket[]>(
      'SELECT * FROM modules WHERE course_id = ? ORDER BY order_index ASC',
      [id],
    );

    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await query<RowDataPacket[]>(
          'SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index ASC',
          [module.id],
        );
        return { ...module, lessons };
      }),
    );

    return NextResponse.json(modulesWithLessons);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const type = formData.get('type') as string;
    const title = formData.get('title') as string;
    const description = formData.get('content') as string;
    const video_url = formData.get('video_url') as string;
    const order_index = parseInt(formData.get('order_index') as string) || 0;
    const duration_minutes = formData.get('duration_minutes') as string;
    const module_id = formData.get('module_id') as string;

    if (type === 'module') {
      const modId = crypto.randomUUID();
      await execute(
        'INSERT INTO modules (id, course_id, title, description, order_index) VALUES (?, ?, ?, ?, ?)',
        [modId, (await params).id, title, description || null, order_index],
      );
      return NextResponse.json({ id: modId, success: true });
    } else if (type === 'lesson' && module_id) {
      const lessId = crypto.randomUUID();
      await execute(
        'INSERT INTO lessons (id, module_id, title, content, video_url, order_index, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          lessId,
          module_id,
          title,
          description || null,
          video_url || null,
          order_index,
          duration_minutes || null,
        ],
      );
      return NextResponse.json({ id: lessId, success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const itemId = searchParams.get('itemId');

    if (!type || !itemId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    if (type === 'module') {
      await execute('DELETE FROM modules WHERE id = ?', [itemId]);
    } else if (type === 'lesson') {
      await execute('DELETE FROM lessons WHERE id = ?', [itemId]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const type = formData.get('type') as string;
    const itemId = formData.get('itemId') as string;
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const video_url = formData.get('video_url') as string;
    const order_index = parseInt(formData.get('order_index') as string) || 0;
    const duration_minutes = formData.get('duration_minutes') as string;

    if (type === 'module') {
      await execute(
        'UPDATE modules SET title = ?, description = ?, order_index = ? WHERE id = ?',
        [title, content || null, order_index, itemId],
      );
    } else if (type === 'lesson') {
      await execute(
        'UPDATE lessons SET title = ?, content = ?, video_url = ?, order_index = ?, duration_minutes = ? WHERE id = ?',
        [
          title,
          content || null,
          video_url || null,
          order_index,
          duration_minutes || null,
          itemId,
        ],
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
