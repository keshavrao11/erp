import { describe, it, expect } from 'vitest';
import { db } from '../src/lib/db/connection';

describe('ERP Database & Foundation Tests', () => {
  it('should enforce SQLite foreign key constraints and WAL mode', () => {
    const wal = db.pragma('journal_mode', { simple: true });
    const fk = db.pragma('foreign_keys', { simple: true });
    expect(String(wal).toLowerCase()).toBe('wal');
    expect(fk).toBe(1);
  });
});
