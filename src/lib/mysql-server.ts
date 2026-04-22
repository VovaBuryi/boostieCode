import { dbConfig } from '@/lib/db';
import mysql, { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      // Force 4-byte UTF-8 for emojis/symbols in TEXT fields.
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
    });
  }
  return pool;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function query<T extends RowDataPacket[]>(
  sql: string,
  params?: unknown[],
): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    // Ensure read/write uses utf8mb4 for every request (avoids charset drift).
    await connection.query('SET NAMES utf8mb4');
    const [rows] = await connection.query<T>(sql, params as any[]);
    return rows;
  } finally {
    connection.release();
  }
}

export async function execute(
  sql: string,
  params?: unknown[],
): Promise<ResultSetHeader> {
  const connection = await getPool().getConnection();
  try {
    // Ensure read/write uses utf8mb4 for every request (avoids charset drift).
    await connection.query('SET NAMES utf8mb4');
    const [result] = await connection.query<ResultSetHeader>(
      sql,
      params as any[],
    );
    return result;
  } finally {
    connection.release();
  }
}
