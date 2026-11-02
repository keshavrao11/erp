import { NextRequest, NextResponse } from 'next/server';
import { hrRepo } from '@/repositories/hr.repository';
import { requireAuth, withErrorHandler, HttpError } from '@/lib/auth/rbac';

export const GET = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'HR', 'VIEW');
  const { id } = await ctx.params;
  const employee = hrRepo.getEmployeeById(id);
  if (!employee) throw new HttpError(404, 'Employee not found');
  return NextResponse.json(employee);
});

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'HR', 'EDIT');
  const { id } = await ctx.params;
  const updates = await req.json();
  hrRepo.updateEmployeeField(id, updates);
  const updated = hrRepo.getEmployeeById(id);
  return NextResponse.json({ success: true, employee: updated });
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'HR', 'DELETE');
  const { id } = await ctx.params;
  hrRepo.deleteEmployee(id);
  return NextResponse.json({ success: true });
});

