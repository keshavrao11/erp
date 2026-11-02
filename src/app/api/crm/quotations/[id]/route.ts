import { NextRequest, NextResponse } from 'next/server';
import { crmRepo } from '@/repositories/crm.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import { db } from '@/lib/db/connection';

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'CRM', 'VIEW');
  const { id } = await params;
  const quotation = crmRepo.getQuotationById(id);
  if (!quotation) {
    return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
  }
  return NextResponse.json(quotation);
});

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'CRM', 'EDIT');
  const { id } = await params;
  const body = await req.json();
  crmRepo.updateQuotationHeader(id, body);
  const updated = crmRepo.getQuotationById(id);
  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'CRM', 'DELETE');
  const { id } = await params;
  db.prepare(`DELETE FROM quotation_items WHERE quotation_id = ?`).run(id);
  db.prepare(`DELETE FROM quotations WHERE id = ?`).run(id);
  return NextResponse.json({ success: true });
});

