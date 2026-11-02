import { NextRequest, NextResponse } from 'next/server';
import { mastersRepo } from '@/repositories/masters.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2),
  contactPerson: z.string().optional(),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  paymentTermsDays: z.number().int().optional(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'MASTERS', 'VIEW');
  const search = new URL(req.url).searchParams.get('search') || undefined;
  return NextResponse.json(mastersRepo.getVendors(session.companyId, search));
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'MASTERS', 'CREATE');
  const body = createSchema.parse(await req.json());
  const id = mastersRepo.createVendor({ ...body, companyId: session.companyId });
  return NextResponse.json({ id }, { status: 201 });
});
