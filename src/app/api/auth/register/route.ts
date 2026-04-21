import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { execute, query } from '@/lib/mysql-server';
import { RowDataPacket } from 'mysql2/promise';

export const runtime = 'nodejs';

interface ProfileRow extends RowDataPacket {
  id: string;
  email: string;
}

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();
    const normalizedEmail = String(email || '')
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    const existing = await query<ProfileRow[]>(
      'SELECT id FROM profiles WHERE email = ?',
      [normalizedEmail],
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 },
      );
    }

    const passwordHash = await hash(password, 10);
    const id = crypto.randomUUID();

    await execute(
      'INSERT INTO profiles (id, email, full_name, password_hash, is_admin) VALUES (?, ?, ?, ?, ?)',
      [id, normalizedEmail, fullName || null, passwordHash, false],
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Registration error:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ER_DUP_ENTRY'
    ) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : 'Unknown registration error';

    return NextResponse.json(
      { error: `Registration failed: ${message}` },
      { status: 500 },
    );
  }
}
