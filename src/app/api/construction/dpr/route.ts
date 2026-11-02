import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import crypto from 'crypto';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'CONSTRUCTION', 'VIEW');
  const dprs = db.prepare(`
    SELECT d.*, p.name as project_name, u.full_name as submitted_by_name
    FROM daily_progress_reports d
    JOIN projects p ON p.id = d.project_id
    JOIN users u ON u.id = d.submitted_by
    ORDER BY d.report_date DESC
    LIMIT 100
  `).all();
  return NextResponse.json(dprs);
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
  const reportDate = body.reportDate || new Date().toISOString().slice(0, 10);

  // Upsert or insert
  db.prepare(`
    INSERT INTO daily_progress_reports (
      id, project_id, report_date, weather, overall_progress_percent, summary, submitted_by, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_id, report_date) DO UPDATE SET
      weather = excluded.weather,
      overall_progress_percent = excluded.overall_progress_percent,
      summary = excluded.summary,
      status = excluded.status
  `).run(
    id,
    projectId,
    reportDate,
    body.weather || 'Clear, 28°C',
    body.overallProgressPercent ?? 38.5,
    body.summary || 'Daily progress logged by site engineer.',
    session.userId,
    body.status || 'SUBMITTED'
  );

  return NextResponse.json({ id, success: true }, { status: 201 });
});

