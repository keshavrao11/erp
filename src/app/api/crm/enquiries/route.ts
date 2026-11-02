import { NextRequest, NextResponse } from 'next/server';
import { crmRepo } from '@/repositories/crm.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import { z } from 'zod';

const createSchema = z.object({
  verticalId: z.string().uuid(),
  source: z.enum(['WALK_IN','PHONE','WEBSITE','REFERRAL','SOCIAL_MEDIA']),
  customerName: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  requirementDescription: z.string().min(5),
  budgetPaise: z.number().int().positive().optional(),
  assignedTo: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'CRM', 'VIEW');
  const { searchParams } = new URL(req.url);
  const data = crmRepo.getEnquiries(session.companyId, {
    status: searchParams.get('status') || undefined,
    verticalId: searchParams.get('verticalId') || undefined,
    search: searchParams.get('search') || undefined,
  });
  return NextResponse.json(data);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'CRM', 'CREATE');
  const body = createSchema.parse(await req.json());
  const id = crmRepo.createEnquiry({ ...body, companyId: session.companyId });
  return NextResponse.json({ id }, { status: 201 });
});
