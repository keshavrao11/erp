import { NextRequest, NextResponse } from 'next/server';
import { mastersRepo } from '@/repositories/masters.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import { z } from 'zod';

const createSchema = z.object({
  fullName: z.string().min(2),
  companyName: z.string().optional(),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  pan: z.string().optional(),
  billingAddress: z.string().optional(),
  verticalId: z.string().uuid().optional(),
  assignedCrmUserId: z.string().uuid().optional(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'MASTERS', 'VIEW');
  const search = new URL(req.url).searchParams.get('search') || undefined;
  return NextResponse.json(mastersRepo.getCustomers(session.companyId, search));
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'MASTERS', 'CREATE');
  const body = createSchema.parse(await req.json());
  const id = mastersRepo.createCustomer({ ...body, companyId: session.companyId });
  return NextResponse.json({ id }, { status: 201 });
});
