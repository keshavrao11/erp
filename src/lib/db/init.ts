import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export function ensureDatabaseInitialized(database: Database.Database) {
  try {
    // Check if companies table exists
    const row = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='companies'").get();
    if (!row) {
      console.log('[Database] Initializing fresh SQLite schema...');
      const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        database.exec(schemaSql);
        console.log('[Database] Schema created successfully.');
      }

      // Check if users exist, if not seed
      const userCount = database.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='users'").get() as any;
      if (userCount) {
        console.log('[Database] Seeding initial business data...');
        // Dynamically require to avoid circular dependency
        const { seedDatabase } = require('../../../database/seeds/seed');
        seedDatabase();
        console.log('[Database] Seed completed.');
      }
    }
  } catch (err) {
    console.warn('[Database Init Warning]', err);
  }
}
