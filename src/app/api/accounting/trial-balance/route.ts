import { NextRequest, NextResponse } from 'next/server';
import { accountingRepo } from '@/repositories/accounting.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'ACCOUNTS', 'VIEW');
  const data = accountingRepo.getTrialBalance(session.companyId);
  return NextResponse.json(data);
});
