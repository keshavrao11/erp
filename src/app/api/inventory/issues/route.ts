import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import crypto from 'crypto';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'INVENTORY', 'VIEW');
  const issues = db.prepare(`
    SELECT sl.*, m.name as material_name, m.item_code, p.name as project_name
    FROM stock_ledger sl
    JOIN materials m ON m.id = sl.material_id
    LEFT JOIN projects p ON p.id = sl.project_id
    ORDER BY sl.created_at DESC
    LIMIT 100
  `).all();
  return NextResponse.json(issues);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'INVENTORY', 'CREATE');
  const body = await req.json();

  let materialId = body.materialId;
  if (!materialId) {
    const mat = db.prepare(`SELECT id FROM materials WHERE company_id = ? LIMIT 1`).get(session.companyId) as any;
    materialId = mat?.id;
  }

  let projectId = body.projectId;
  if (!projectId) {
    const proj = db.prepare(`SELECT id FROM projects WHERE company_id = ? LIMIT 1`).get(session.companyId) as any;
    projectId = proj?.id;
  }

  const id = crypto.randomUUID();
  const qty = Number(body.quantity) || 10;
  const unitRatePaise = Math.round((Number(body.rateRupees) || 350) * 100);
  const totalValuePaise = qty * unitRatePaise;

  // Insert ISSUE entry in stock_ledger
  db.prepare(`
    INSERT INTO stock_ledger (
      id, material_id, project_id, transaction_type, reference_type,
      reference_id, quantity, unit_cost_paise, total_cost_paise
    ) VALUES (?, ?, ?, 'ISSUE', 'SITE_ISSUE_NOTE', ?, ?, ?, ?)
  `).run(
    id,
    materialId,
    projectId,
    `MIN-${new Date().toISOString().slice(0, 10)}`,
    -Math.abs(qty),
    unitRatePaise,
    totalValuePaise
  );

  return NextResponse.json({ id, success: true }, { status: 201 });
});

