import { NextRequest, NextResponse } from 'next/server';
import { crmRepo } from '@/repositories/crm.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'CRM', 'EDIT');
  const { id } = await params;
  const body = await req.json();

  const itemId = crmRepo.saveQuotationItem({
    id: body.id,
    quotationId: id,
    description: body.description || 'New Scope Item',
    quantity: Number(body.quantity) || 1,
    unit: body.unit || 'NOS',
    unitRatePaise: Math.round((Number(body.unitRateRupees) || 0) * 100),
    sortOrder: body.sortOrder ?? 0,
  });

  const updatedQuotation = crmRepo.getQuotationById(id);
  return NextResponse.json({ itemId, quotation: updatedQuotation });
});

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'CRM', 'EDIT');
  const { id } = await params;
  const itemId = req.nextUrl.searchParams.get('itemId');
  if (itemId) {
    crmRepo.deleteQuotationItem(itemId);
  }
  const updatedQuotation = crmRepo.getQuotationById(id);
  return NextResponse.json({ quotation: updatedQuotation });
});

