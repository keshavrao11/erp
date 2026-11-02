import { NextRequest, NextResponse } from 'next/server';
import { mastersRepo } from '@/repositories/masters.repository';
import { requireAuth, withErrorHandler, HttpError } from '@/lib/auth/rbac';

export const GET = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'MASTERS', 'VIEW');
  const { id } = await ctx.params;
  const item = mastersRepo.getCustomerById(id);
  if (!item) throw new HttpError(404, 'Customer not found');
  return NextResponse.json(item);
});

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'MASTERS', 'EDIT');
  const { id } = await ctx.params;
  const updates = await req.json();
  mastersRepo.updateCustomerField(id, updates);
  const updated = mastersRepo.getCustomerById(id);
  return NextResponse.json({ success: true, customer: updated });
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'MASTERS', 'DELETE');
  const { id } = await ctx.params;
  mastersRepo.deleteCustomer(id);
  return NextResponse.json({ success: true });
});

