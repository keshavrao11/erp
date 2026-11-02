import { NextRequest, NextResponse } from 'next/server';
import { procurementRepo } from '@/repositories/procurement.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'PROCUREMENT', 'CREATE');
  const draft = procurementRepo.createDraftMR(session.companyId, session.userId);
  return NextResponse.json(draft, { status: 201 });
});

