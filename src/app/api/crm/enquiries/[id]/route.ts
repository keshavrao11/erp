import { NextRequest, NextResponse } from 'next/server';
import { crmRepo } from '@/repositories/crm.repository';
import { requireAuth, withErrorHandler, HttpError } from '@/lib/auth/rbac';

export const GET = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'CRM', 'VIEW');
  const { id } = await ctx.params;
  const enquiry = crmRepo.getEnquiryById(id);
  if (!enquiry) throw new HttpError(404, 'Enquiry not found');
  const followUps = crmRepo.getFollowUps(id);
  return NextResponse.json({ ...enquiry, followUps });
});

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'CRM', 'EDIT');
  const { id } = await ctx.params;
  const updates = await req.json();
  crmRepo.updateEnquiryField(id, updates);
  const updated = crmRepo.getEnquiryById(id);
  return NextResponse.json({ success: true, enquiry: updated });
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'CRM', 'DELETE');
  const { id } = await ctx.params;
  crmRepo.deleteEnquiry(id);
  return NextResponse.json({ success: true });
});

