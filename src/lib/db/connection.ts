import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { ensureDatabaseInitialized } from './init';

const isVercel = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const DB_DIR = process.env.ERP_DATA_DIR || (isVercel ? '/tmp/data' : path.join(process.cwd(), 'data'));
const DB_PATH = process.env.ERP_DB_PATH || path.join(DB_DIR, 'erp.db');

if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (err) {
    console.warn('[DB Init Directory Warning]', err);
  }
}

// When running in Vercel serverless environment, copy the populated database from the deployment bundle to /tmp
if (isVercel && !fs.existsSync(DB_PATH)) {
  const seedDbPath = path.join(process.cwd(), 'data', 'erp.db');
  if (fs.existsSync(seedDbPath)) {
    try {
      fs.copyFileSync(seedDbPath, DB_PATH);
    } catch (e) {
      console.warn('[Vercel DB Bundle Copy Warning]', e);
    }
  }
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Ensure schema and tables exist
ensureDatabaseInitialized(db);

export function runInTransaction<T>(fn: (db: Database.Database) => T): T {
  const tx = db.transaction(fn);
  return tx.immediate(db);
}
