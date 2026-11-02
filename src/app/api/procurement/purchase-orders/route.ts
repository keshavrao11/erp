import { NextRequest, NextResponse } from 'next/server';
import { procurementRepo } from '@/repositories/procurement.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import { db } from '@/lib/db/connection';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'PROCUREMENT', 'VIEW');
  const poId = req.nextUrl.searchParams.get('id');

  // Single PO detail view
  if (poId) {
    const po = db.prepare(`
      SELECT po.*, v.name as vendor_name, v.city as vendor_city, v.gstin as vendor_gstin,
             v.contact_person, v.phone as vendor_phone, v.email as vendor_email,
             p.name as project_name, p.project_code, p.location_city as project_city,
             mr.mr_number
      FROM purchase_orders po
      JOIN vendors v ON v.id = po.vendor_id
      LEFT JOIN projects p ON p.id = po.project_id
      LEFT JOIN material_requisitions mr ON mr.id = po.mr_id
      WHERE po.id = ? AND po.company_id = ?
    `).get(poId, session.companyId) as any;

    if (!po) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
    }

    const items = db.prepare(`
      SELECT pi.*, m.item_code, m.name as material_name, m.uom as material_uom
      FROM po_items pi
      LEFT JOIN materials m ON m.id = pi.material_id
      WHERE pi.po_id = ?
    `).all(poId);

    return NextResponse.json({ po, items });
  }

  // Next PO Number generator endpoint
  if (req.nextUrl.searchParams.get('action') === 'next_number') {
    const count = (db.prepare(`SELECT COUNT(*) as c FROM purchase_orders WHERE company_id = ?`).get(session.companyId) as any).c;
    const nextNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    return NextResponse.json({ nextNumber });
  }

  // List all POs
  const pos = db.prepare(`
    SELECT po.*, v.name as vendor_name, v.city as vendor_city, v.gstin as vendor_gstin,
           p.name as project_name, p.project_code,
           (SELECT COUNT(*) FROM po_items WHERE po_id = po.id) as item_count
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

  const items = Array.isArray(body.items) && body.items.length > 0 ? body.items.map((i: any) => ({
    materialId: i.materialId || materialId,
    description: i.description || 'Structural Materials Supply',
    quantity: Number(i.quantity) || 1,
    unit: i.unit || 'BAG',
    unitRatePaise: Math.round((Number(i.unitRateRupees || i.unit_rate_paise / 100) || 385) * 100),
  })) : [
    {
      materialId: materialId,
      description: body.description || 'UltraTech Super PPC Cement & TMT 550D Steel',
      quantity: Number(body.quantity) || 100,
      unit: body.unit || 'BAG',
      unitRatePaise: Math.round((Number(body.unitRateRupees) || 385) * 100),
    }
  ];

  const result = procurementRepo.createPO({
    companyId: session.companyId,
    vendorId,
    projectId,
    mrId: body.mrId || undefined,
    poNumber: body.poNumber || undefined,
    poDate: body.poDate || new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: body.expectedDeliveryDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    paymentTerms: body.paymentTerms || '30 Days Net from Delivery',
    items,
    createdBy: session.userId,
  });

  return NextResponse.json({ id: result.id, poNumber: result.poNumber, success: true }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'PROCUREMENT', 'EDIT');
  const body = await req.json();

  if (body.id && body.status) {
    db.prepare(`UPDATE purchase_orders SET status = ? WHERE id = ?`).run(body.status, body.id);
  }

  return NextResponse.json({ success: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'PROCUREMENT', 'DELETE');
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'PO ID required' }, { status: 400 });

  db.prepare(`DELETE FROM po_items WHERE po_id = ?`).run(id);
  db.prepare(`DELETE FROM purchase_orders WHERE id = ?`).run(id);
  return NextResponse.json({ success: true });
});
