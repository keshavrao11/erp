import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import crypto from 'crypto';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'INTERIORS', 'VIEW');
  const revisions = db.prepare(`
    SELECT r.*, p.name as project_name, u.full_name as author_name
    FROM design_revisions r
    JOIN projects p ON p.id = r.project_id
    LEFT JOIN users u ON u.id = r.created_by
    ORDER BY r.revision_number DESC
  `).all();
  return NextResponse.json(revisions);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'INTERIORS', 'CREATE');
  const body = await req.json().catch(() => ({}));

  let projectId = body.projectId;
  if (!projectId) {
    const proj = db.prepare(`
      SELECT p.id FROM projects p
      JOIN business_verticals bv ON bv.id = p.vertical_id
      WHERE bv.code = 'INTERIORS' OR p.company_id = ?
      LIMIT 1
    `).get(session.companyId) as any;
    projectId = proj?.id;
  }

  const id = crypto.randomUUID();
  const maxRev = (db.prepare(`SELECT COALESCE(MAX(revision_number), 0) as m FROM design_revisions WHERE project_id = ?`).get(projectId) as any).m;
  const nextRev = maxRev + 1;

  db.prepare(`
    INSERT INTO design_revisions (
      id, project_id, revision_number, description, created_by, customer_approved, approval_date
    ) VALUES (?, ?, ?, ?, ?, 0, NULL)
  `).run(
    id,
    projectId,
    nextRev,
    body.description || `Design Iteration Rev ${nextRev}.0`,
    session.userId
  );

  const created = db.prepare(`SELECT * FROM design_revisions WHERE id = ?`).get(id);
  return NextResponse.json(created, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'INTERIORS', 'EDIT');
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  if (body.description !== undefined) {
    db.prepare(`UPDATE design_revisions SET description = ? WHERE id = ?`).run(body.description, body.id);
  }
  if (body.customerApproved !== undefined) {
    db.prepare(`
      UPDATE design_revisions 
      SET customer_approved = ?, approval_date = CASE WHEN ? = 1 THEN date('now') ELSE NULL END 
      WHERE id = ?
    `).run(body.customerApproved ? 1 : 0, body.customerApproved ? 1 : 0, body.id);
  }

  const updated = db.prepare(`SELECT * FROM design_revisions WHERE id = ?`).get(body.id);
  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'INTERIORS', 'DELETE');
  const id = req.nextUrl.searchParams.get('id');
  if (id) {
    db.prepare(`DELETE FROM design_revisions WHERE id = ?`).run(id);
  }
  return NextResponse.json({ success: true });
});

