import { NextRequest, NextResponse } from 'next/server';
import { projectsRepo } from '@/repositories/projects.repository';
import { requireAuth, withErrorHandler, HttpError } from '@/lib/auth/rbac';

export const GET = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'PROJECTS', 'VIEW');
  const { id } = await ctx.params;
  const project = projectsRepo.getById(id);
  if (!project) throw new HttpError(404, 'Project not found');
  return NextResponse.json(project);
});

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'PROJECTS', 'EDIT');
  const { id } = await ctx.params;
  const updates = await req.json();
  projectsRepo.updateProjectField(id, updates);
  const updated = projectsRepo.getById(id);
  return NextResponse.json({ success: true, project: updated });
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAuth(req, 'PROJECTS', 'DELETE');
  const { id } = await ctx.params;
  projectsRepo.deleteProject(id);
  return NextResponse.json({ success: true });
});

