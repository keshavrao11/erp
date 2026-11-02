import { NextRequest, NextResponse } from 'next/server';
import { landRepo } from '@/repositories/land.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import { z } from 'zod';

const bookingSchema = z.object({
  plotId: z.string().uuid(),
  customerId: z.string().uuid(),
  bookingDate: z.string(),
  tokenAmountPaise: z.number().int().positive(),
  agreementValuePaise: z.number().int().positive(),
  paymentPlan: z.enum(['MILESTONE','EMI','LUMP_SUM']),
  instalments: z.array(z.object({
    dueDate: z.string(),
    amountPaise: z.number().int().positive(),
    description: z.string(),
  })).optional(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'LAND_DEVELOPMENT', 'VIEW');
  const { searchParams } = new URL(req.url);
  return NextResponse.json(landRepo.getBookings(session.companyId, {
    status: searchParams.get('status') || undefined,
    projectId: searchParams.get('projectId') || undefined,
  }));
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'LAND_DEVELOPMENT', 'CREATE');
  const body = bookingSchema.parse(await req.json());
  const id = landRepo.bookPlot({ ...body, bookedBy: session.userId });
  return NextResponse.json({ id }, { status: 201 });
});
