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
  params?: unknown[]
): Promise<T> {
  const [rows] = await getPool().query<T>(sql, params as any[]);
  return rows;
}

export async function execute(
  sql: string,
  params?: unknown[]
): Promise<ResultSetHeader> {
  const [result] = await getPool().query<ResultSetHeader>(sql, params as any[]);
  return result;
}