import { NextRequest, NextResponse } from 'next/server';
import { procurementRepo } from '@/repositories/procurement.repository';
import { requireAuth, withErrorHandler, HttpError } from '@/lib/auth/rbac';

export const GET = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'PROCUREMENT', 'VIEW');
  const { id } = await ctx.params;
  const mr = procurementRepo.getMRById(id);
  if (!mr) throw new HttpError(404, 'Material Requisition not found');
  return NextResponse.json(mr);
});

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'PROCUREMENT', 'EDIT');
  const { id } = await ctx.params;
  const updates = await req.json();
  procurementRepo.updateMRField(id, updates);
  const updated = procurementRepo.getMRById(id);
  return NextResponse.json({ success: true, mr: updated });
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'PROCUREMENT', 'DELETE');
  const { id } = await ctx.params;
  procurementRepo.deleteMR(id);
  return NextResponse.json({ success: true });
});

