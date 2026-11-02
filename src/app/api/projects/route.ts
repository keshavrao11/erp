import { NextRequest, NextResponse } from 'next/server';
import { projectsRepo } from '@/repositories/projects.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import { z } from 'zod';

const createSchema = z.object({
  verticalId: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional(),
  clientId: z.string().uuid().optional(),
  startDate: z.string(),
  targetCompletionDate: z.string(),
  estimatedBudgetPaise: z.number().int().min(0),
  locationCity: z.string(),
  locationState: z.string().optional(),
  locationAddress: z.string().optional(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'PROJECTS', 'VIEW');
  const { searchParams } = new URL(req.url);
  const data = projectsRepo.getAll(session.companyId, {
    verticalId: searchParams.get('verticalId') || undefined,
    status: searchParams.get('status') || undefined,
    search: searchParams.get('search') || undefined,
  });
  return NextResponse.json(data);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'PROJECTS', 'CREATE');
  const body = createSchema.parse(await req.json());
  const id = projectsRepo.create({ ...body, companyId: session.companyId, createdBy: session.userId });
  return NextResponse.json({ id }, { status: 201 });
});
