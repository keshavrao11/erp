import { NextRequest, NextResponse } from 'next/server';
import { procurementRepo } from '@/repositories/procurement.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import { z } from 'zod';

const createSchema = z.object({
  projectId: z.string().uuid(),
  requiredDate: z.string(),
  items: z.array(z.object({
    materialId: z.string().uuid(),
    quantityRequired: z.number().positive(),
    unit: z.string(),
    remarks: z.string().optional(),
  })).min(1),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'PROCUREMENT', 'VIEW');
  const { searchParams } = new URL(req.url);
  return NextResponse.json(procurementRepo.getMRs(session.companyId, {
    status: searchParams.get('status') || undefined,
    projectId: searchParams.get('projectId') || undefined,
  }));
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'PROCUREMENT', 'CREATE');
  const body = createSchema.parse(await req.json());
  const id = procurementRepo.createMR({ ...body, requestedBy: session.userId });
  return NextResponse.json({ id }, { status: 201 });
});
