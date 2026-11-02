import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import crypto from 'crypto';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'CONSTRUCTION', 'VIEW');
  const items = db.prepare(`
    SELECT b.*, p.name as project_name
    FROM boq_items b
    JOIN projects p ON p.id = b.project_id
    WHERE p.company_id = ?
    ORDER BY b.sort_order ASC
  `).all(session.companyId);
  return NextResponse.json(items);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'CONSTRUCTION', 'CREATE');
  const prj = db.prepare(`SELECT p.id FROM projects p JOIN business_verticals bv ON bv.id = p.vertical_id WHERE bv.code = 'CONSTRUCTION' AND p.company_id = ? LIMIT 1`).get(session.companyId) as any;
  const projectId = prj ? prj.id : null;
  const id = crypto.randomUUID();
  const count = (db.prepare(`SELECT COUNT(*) as c FROM boq_items WHERE project_id = ?`).get(projectId) as any).c;

  db.prepare(`
    INSERT INTO boq_items (id, project_id, work_package, description, unit, quantity, rate_paise, amount_paise, sort_order)
    VALUES (?, ?, 'New Civil Package', 'Detailed scope of works', 'CUM', 100, 50000, 5000000, ?)
  `).run(id, projectId, count + 1);

  const created = db.prepare(`SELECT * FROM boq_items WHERE id = ?`).get(id);
  return NextResponse.json(created, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'CONSTRUCTION', 'EDIT');
  const body = await req.json();
  const { id, workPackage, description, unit, quantity, ratePaise } = body;

  const setClauses: string[] = [];
  const values: any[] = [];
  if (workPackage !== undefined) { setClauses.push('work_package = ?'); values.push(workPackage); }
  if (description !== undefined) { setClauses.push('description = ?'); values.push(description); }
  if (unit !== undefined) { setClauses.push('unit = ?'); values.push(unit); }
  if (quantity !== undefined) { setClauses.push('quantity = ?'); values.push(quantity); }
  if (ratePaise !== undefined) { setClauses.push('rate_paise = ?'); values.push(ratePaise); }

  if (quantity !== undefined || ratePaise !== undefined) {
    setClauses.push('amount_paise = CAST(quantity * rate_paise AS INTEGER)');
  }

  if (setClauses.length > 0) {
    values.push(id);
    db.prepare(`UPDATE boq_items SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  }

  const updated = db.prepare(`SELECT * FROM boq_items WHERE id = ?`).get(id);
  return NextResponse.json({ success: true, item: updated });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'CONSTRUCTION', 'DELETE');
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    db.prepare(`DELETE FROM boq_items WHERE id = ?`).run(id);
  }
  return NextResponse.json({ success: true });
});

