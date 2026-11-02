import { NextRequest, NextResponse } from 'next/server';
import { mastersRepo } from '@/repositories/masters.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import { z } from 'zod';

const createSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(2),
  unitOfMeasure: z.string(),
  hsnCode: z.string().optional(),
  standardRatePaise: z.number().int().optional(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'MASTERS', 'VIEW');
  const search = new URL(req.url).searchParams.get('search') || undefined;
  return NextResponse.json(mastersRepo.getMaterials(session.companyId, search));
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'MASTERS', 'CREATE');
  const body = createSchema.parse(await req.json());
  const id = mastersRepo.createMaterial({ ...body, companyId: session.companyId });
  return NextResponse.json({ id }, { status: 201 });
});
