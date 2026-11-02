import { NextRequest, NextResponse } from 'next/server';
import { crmRepo } from '@/repositories/crm.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'CRM', 'VIEW');
  const enquiryId = req.nextUrl.searchParams.get('enquiryId') || undefined;
  const list = crmRepo.getQuotations(session.companyId, enquiryId);
  return NextResponse.json(list);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'CRM', 'CREATE');
  const body = await req.json().catch(() => ({}));
  const draft = crmRepo.createDraftQuotation(
    session.companyId,
    body.enquiryId,
    body.customerId,
    session.userId
  );
  return NextResponse.json(draft, { status: 201 });
});

