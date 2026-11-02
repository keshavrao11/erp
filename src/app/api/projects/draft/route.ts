import { NextRequest, NextResponse } from 'next/server';
import { projectsRepo } from '@/repositories/projects.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'PROJECTS', 'CREATE');
  const draft = projectsRepo.createDraft(session.companyId, session.userId);
  return NextResponse.json(draft, { status: 201 });
});

