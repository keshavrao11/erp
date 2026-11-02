import { NextRequest, NextResponse } from 'next/server';
import { mastersRepo } from '@/repositories/masters.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'MASTERS', 'CREATE');
  const draft = mastersRepo.createDraftCustomer(session.companyId);
  return NextResponse.json(draft, { status: 201 });
});

