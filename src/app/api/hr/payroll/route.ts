import { NextRequest, NextResponse } from 'next/server';
import { hrRepo } from '@/repositories/hr.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import { db } from '@/lib/db/connection';
import { z } from 'zod';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'HR', 'VIEW');
  const runs = db.prepare(`
    SELECT pr.*, u.full_name as processed_by_name FROM payroll_runs pr
    JOIN users u ON u.id = pr.processed_by WHERE pr.company_id = ? ORDER BY pr.payroll_month DESC
  `).all(session.companyId);
  return NextResponse.json(runs);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'HR', 'CREATE');
  const { payrollMonth } = z.object({ payrollMonth: z.string().regex(/^\d{4}-\d{2}$/) }).parse(await req.json());
  const id = hrRepo.processPayrollRun(session.companyId, payrollMonth, session.userId);
  return NextResponse.json({ id }, { status: 201 });
});
