import { NextRequest, NextResponse } from 'next/server';
import { hrRepo } from '@/repositories/hr.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import { z } from 'zod';

const createSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  departmentId: z.string().uuid(),
  designation: z.string(),
  dateOfJoining: z.string(),
  employmentType: z.enum(['PERMANENT','CONTRACT','PROBATION']),
  pan: z.string().optional(),
  aadhaarLast4: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfsc: z.string().optional(),
  basicSalaryPaise: z.number().int().positive(),
  hraPaise: z.number().int().optional(),
  otherAllowancesPaise: z.number().int().optional(),
  pfApplicable: z.boolean().optional(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'HR', 'VIEW');
  const { searchParams } = new URL(req.url);
  return NextResponse.json(hrRepo.getEmployees(session.companyId, {
    departmentId: searchParams.get('departmentId') || undefined,
    isActive: searchParams.get('isActive') !== 'false',
    search: searchParams.get('search') || undefined,
  }));
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'HR', 'CREATE');
  const body = createSchema.parse(await req.json());
  const id = hrRepo.createEmployee({ ...body, companyId: session.companyId });
  return NextResponse.json({ id }, { status: 201 });
});
