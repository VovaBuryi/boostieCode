import { NextResponse } from 'next/server';
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const courseRows = await query<CourseRow[]>(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );

    if (courseRows.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const courseData = courseRows[0];
    
    const moduleRows = await query<ModuleRow[]>(
      'SELECT * FROM modules WHERE course_id = ? ORDER BY order_index ASC',
      [id]
    );

    const modulesWithLessons = await Promise.all(
      moduleRows.map(async (module) => {
        const lessonRows = await query<LessonRow[]>(
          'SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index ASC',
          [module.id]
        );
        const cleanLessons = lessonRows.map(l => {
          const obj: Record<string, unknown> = {};
          for (const key of Object.keys(l)) {
            if (l[key] instanceof Uint8Array || Buffer.isBuffer(l[key])) {
              obj[key] = new TextDecoder('utf-8').decode(Buffer.from(l[key]));
            } else {
              obj[key] = l[key];
            }
          }
          return obj as LessonRow;
        });
        return { ...module, lessons: cleanLessons };
      })
    );

    const body = JSON.stringify({
      ...courseData,
      modules: modulesWithLessons,
    });

    return new Response(body, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}