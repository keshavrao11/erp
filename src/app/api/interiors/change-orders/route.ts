import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import crypto from 'crypto';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'INTERIORS', 'VIEW');
  const cos = db.prepare(`
    SELECT co.*, p.name as project_name
    FROM change_orders co
    JOIN projects p ON p.id = co.project_id
    ORDER BY co.created_at DESC
  `).all();
  return NextResponse.json(cos);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'INTERIORS', 'CREATE');
  const body = await req.json();

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
  const count = (db.prepare(`SELECT COUNT(*) as c FROM change_orders`).get() as any).c;
  const coNumber = `CO-INT-${String(count + 1).padStart(3, '0')}`;
  const amountPaise = Math.round((Number(body.amountRupees) || 50000) * 100);

  db.prepare(`
    INSERT INTO change_orders (
      id, project_id, co_number, description, reason, amount_change_paise, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'APPROVED')
  `).run(
    id,
    projectId,
    coNumber,
    body.description || 'Client specification upgrade',
    body.reason || 'Architectural alteration',
    amountPaise
  );

  return NextResponse.json({ id, coNumber, success: true }, { status: 201 });
});

