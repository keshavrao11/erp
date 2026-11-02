import { NextRequest, NextResponse } from 'next/server';
import { mastersRepo } from '@/repositories/masters.repository';
import { requireAuth, withErrorHandler, HttpError } from '@/lib/auth/rbac';

export const GET = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'MASTERS', 'VIEW');
  const { id } = await ctx.params;
  const item = mastersRepo.getVendorById(id);
  if (!item) throw new HttpError(404, 'Vendor not found');
  return NextResponse.json(item);
});

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'MASTERS', 'EDIT');
  const { id } = await ctx.params;
  const updates = await req.json();
  mastersRepo.updateVendorField(id, updates);
  const updated = mastersRepo.getVendorById(id);
  return NextResponse.json({ success: true, vendor: updated });
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'MASTERS', 'DELETE');
  const { id } = await ctx.params;
  mastersRepo.deleteVendor(id);
  return NextResponse.json({ success: true });
});

