import { NextRequest, NextResponse } from 'next/server';
import { accountingRepo } from '@/repositories/accounting.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import { z } from 'zod';

const lineSchema = z.object({
  accountId: z.string().uuid(),
  debitPaise: z.number().int().min(0),
  creditPaise: z.number().int().min(0),
});

const createSchema = z.object({
  verticalId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  voucherType: z.enum([
    'RECEIPT',
    'PAYMENT',
    'CONTRA',
    'JOURNAL',
    'SALES_INVOICE',
    'PURCHASE_BILL',
    'CONTRACTOR_BILL',
    'CREDIT_NOTE',
    'DEBIT_NOTE',
  ]),
  voucherDate: z.string(),
  narration: z.string().min(1),
  lines: z.array(lineSchema).min(2),
  idempotencyKey: z.string().optional(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'ACCOUNTS', 'VIEW');
  const { searchParams } = new URL(req.url);
  const vouchers = accountingRepo.getVouchers(session.companyId, {
    type: searchParams.get('type') || undefined,
    fromDate: searchParams.get('fromDate') || undefined,
    toDate: searchParams.get('toDate') || undefined,
    verticalId: searchParams.get('verticalId') || undefined,
  });
  return NextResponse.json(vouchers);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'ACCOUNTS', 'CREATE');
  const body = createSchema.parse(await req.json());
  const id = accountingRepo.postVoucher({
    ...body,
    companyId: session.companyId,
    createdBy: session.userId,
  });
  return NextResponse.json({ id }, { status: 201 });
});
