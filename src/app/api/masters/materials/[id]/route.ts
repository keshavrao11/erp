import { NextRequest, NextResponse } from 'next/server';
import { mastersRepo } from '@/repositories/masters.repository';
import { requireAuth, withErrorHandler, HttpError } from '@/lib/auth/rbac';

export const GET = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'MASTERS', 'VIEW');
  const { id } = await ctx.params;
  const item = mastersRepo.getMaterialById(id);
  if (!item) throw new HttpError(404, 'Material not found');
  return NextResponse.json(item);
});

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'MASTERS', 'EDIT');
  const { id } = await ctx.params;
  const updates = await req.json();
  mastersRepo.updateMaterialField(id, updates);
  const updated = mastersRepo.getMaterialById(id);
  return NextResponse.json({ success: true, material: updated });
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'MASTERS', 'DELETE');
  const { id } = await ctx.params;
  mastersRepo.deleteMaterial(id);
  return NextResponse.json({ success: true });
});

