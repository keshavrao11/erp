import { NextRequest, NextResponse } from 'next/server';
import { crmRepo } from '@/repositories/crm.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'CRM', 'CREATE');
  const draft = crmRepo.createDraftEnquiry(session.companyId, session.userId);
  return NextResponse.json(draft, { status: 201 });
});

