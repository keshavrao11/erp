import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import crypto from 'crypto';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'CONSTRUCTION', 'VIEW');
  const logs = db.prepare(`
    SELECT l.*, p.name as project_name
    FROM labour_attendance l
    JOIN projects p ON p.id = l.project_id
    ORDER BY l.attendance_date DESC
    LIMIT 100
  `).all();
  return NextResponse.json(logs);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'CONSTRUCTION', 'CREATE');
  const body = await req.json();

  let projectId = body.projectId;
  if (!projectId) {
    const proj = db.prepare(`SELECT id FROM projects WHERE company_id = ? LIMIT 1`).get(session.companyId) as any;
    projectId = proj?.id;
  }

  const id = crypto.randomUUID();
  const date = body.attendanceDate || new Date().toISOString().slice(0, 10);
  const count = Number(body.countPresent) || 1;
  const wagePaise = Math.round((Number(body.wagesPerDayRupees) || 850) * 100);
  const totalPaise = count * wagePaise;

  db.prepare(`
    INSERT INTO labour_attendance (
      id, project_id, attendance_date, trade_category, contractor_name,
      count_present, wages_per_day_paise, total_wages_paise, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_id, attendance_date, trade_category, contractor_name) DO UPDATE SET
      count_present = excluded.count_present,
      wages_per_day_paise = excluded.wages_per_day_paise,
      total_wages_paise = excluded.total_wages_paise
  `).run(
    id,
    projectId,
    date,
    body.tradeCategory || 'MASON',
    body.contractorName || 'Cauvery Civil Works',
    count,
    wagePaise,
    totalPaise,
    session.userId
  );

  return NextResponse.json({ id, success: true }, { status: 201 });
});

