import { NextRequest, NextResponse } from 'next/server';
import { procurementRepo } from '@/repositories/procurement.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import { db } from '@/lib/db/connection';
import crypto from 'crypto';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'PROCUREMENT', 'VIEW');
  const pos = db.prepare(`
    SELECT po.*, v.name as vendor_name, p.name as project_name
    FROM purchase_orders po
    JOIN vendors v ON v.id = po.vendor_id
    LEFT JOIN projects p ON p.id = po.project_id
    WHERE po.company_id = ?
    ORDER BY po.created_at DESC
  `).all(session.companyId);
  return NextResponse.json(pos);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'PROCUREMENT', 'CREATE');
  const body = await req.json();

  let vendorId = body.vendorId;
  if (!vendorId) {
    const v = db.prepare(`SELECT id FROM vendors WHERE company_id = ? LIMIT 1`).get(session.companyId) as any;
    vendorId = v?.id;
  }

  let projectId = body.projectId;
  if (!projectId) {
    const p = db.prepare(`SELECT id FROM projects WHERE company_id = ? LIMIT 1`).get(session.companyId) as any;
    projectId = p?.id;
  }

  let materialId = body.materialId;
  if (!materialId) {
    const m = db.prepare(`SELECT id FROM materials WHERE company_id = ? LIMIT 1`).get(session.companyId) as any;
    materialId = m?.id;
  }

  const items = body.items && body.items.length > 0 ? body.items : [
    {
      materialId: materialId,
      description: body.description || 'Structural TMT Steel & PPC Cement Supply',
      quantity: Number(body.quantity) || 100,
      unit: body.unit || 'BAG',
      unitRatePaise: Math.round((Number(body.unitRateRupees) || 385) * 100),
    }
  ];

  const id = procurementRepo.createPO({
    companyId: session.companyId,
    vendorId,
    projectId,
    mrId: body.mrId || undefined,
    poDate: body.poDate || new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: body.expectedDeliveryDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    paymentTerms: body.paymentTerms || '30 Days Net from Gate Inward',
    items,
    createdBy: session.userId,
  });

  return NextResponse.json({ id, success: true }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'PROCUREMENT', 'EDIT');
  const body = await req.json();

  if (body.id && body.status) {
    db.prepare(`UPDATE purchase_orders SET status = ? WHERE id = ?`).run(body.status, body.id);
  }

  return NextResponse.json({ success: true });
});
