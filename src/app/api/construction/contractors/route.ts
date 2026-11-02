import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import crypto from 'crypto';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'CONSTRUCTION', 'VIEW');

  const contractors = db.prepare(`SELECT * FROM contractors WHERE is_active = 1`).all();
  const bills = db.prepare(`
    SELECT b.*, c.name as contractor_name, p.name as project_name
    FROM contractor_bills b
    JOIN contractors c ON c.id = b.contractor_id
    JOIN projects p ON p.id = b.project_id
    ORDER BY b.bill_date DESC
    LIMIT 100
  `).all();

  return NextResponse.json({ contractors, bills });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'CONSTRUCTION', 'CREATE');
  const body = await req.json();

  let projectId = body.projectId;
  if (!projectId) {
    const proj = db.prepare(`SELECT id FROM projects WHERE company_id = ? LIMIT 1`).get(session.companyId) as any;
    projectId = proj?.id;
  }

  // Ensure contractor exists or pick first
  let contractorId = body.contractorId;
  if (!contractorId) {
    let cont = db.prepare(`SELECT id FROM contractors LIMIT 1`).get() as any;
    if (!cont) {
      cont = { id: crypto.randomUUID() };
      db.prepare(`
        INSERT INTO contractors (id, company_id, name, specialization)
        VALUES (?, ?, 'Cauvery Civil Works & Contractors', 'Civil & Concrete')
      `).run(cont.id, session.companyId);
    }
    contractorId = cont.id;
  }

  // Ensure CMS exists or create dummy
  let cmsId = body.cmsId;
  if (!cmsId) {
    cmsId = crypto.randomUUID();
    const cmsCount = (db.prepare(`SELECT COUNT(*) as c FROM contractor_measurement_sheets`).get() as any).c;
    db.prepare(`
      INSERT INTO contractor_measurement_sheets (id, project_id, contractor_id, sheet_number, period_from, period_to, status)
      VALUES (?, ?, ?, ?, date('now','-15 days'), date('now'), 'APPROVED')
    `).run(cmsId, projectId, contractorId, `CMS-2026-${String(cmsCount + 1).padStart(4, '0')}`);
  }

  const id = crypto.randomUUID();
  const count = (db.prepare(`SELECT COUNT(*) as c FROM contractor_bills`).get() as any).c;
  const billNumber = `CB-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  const grossPaise = Math.round((Number(body.grossRupees) || 150000) * 100);
  const tdsPercent = 2.0;
  const tdsPaise = Math.round(grossPaise * 0.02);
  const retentionPaise = Math.round(grossPaise * 0.05); // 5% retention
  const netPaise = grossPaise - tdsPaise - retentionPaise;

  db.prepare(`
    INSERT INTO contractor_bills (
      id, cms_id, project_id, contractor_id, bill_number, bill_date,
      gross_amount_paise, tds_percent, tds_amount_paise, retention_paise,
      net_payable_paise, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
  `).run(
    id,
    cmsId,
    projectId,
    contractorId,
    billNumber,
    body.billDate || new Date().toISOString().slice(0, 10),
    grossPaise,
    tdsPercent,
    tdsPaise,
    retentionPaise,
    netPaise
  );

  return NextResponse.json({ id, billNumber, success: true }, { status: 201 });
});

