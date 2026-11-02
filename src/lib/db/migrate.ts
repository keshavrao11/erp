import fs from 'fs';
import path from 'path';
import { db, runInTransaction } from './connection';

export function runMigrations() {
  const schemaSql = fs.readFileSync(path.join(process.cwd(), 'database', 'schema.sql'), 'utf-8');
  runInTransaction((database) => {
    database.exec(schemaSql);
  });
  console.log('Migrations executed successfully.');
}

if (require.main === module) {
  runMigrations();
}
