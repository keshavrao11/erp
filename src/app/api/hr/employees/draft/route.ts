import { NextRequest, NextResponse } from 'next/server';
import { hrRepo } from '@/repositories/hr.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'HR', 'CREATE');
  const draft = hrRepo.createDraftEmployee(session.companyId);
  return NextResponse.json(draft, { status: 201 });
});

