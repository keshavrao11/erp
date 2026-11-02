import { NextRequest, NextResponse } from 'next/server';
import { accountingRepo } from '@/repositories/accounting.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import { db } from '@/lib/db/connection';
import { z } from 'zod';
import crypto from 'crypto';

const createSchema = z.object({
  accountCode: z.string(),
  name: z.string(),
  accountType: z.enum(['ASSET','LIABILITY','EQUITY','INCOME','EXPENSE']),
  accountGroup: z.string(),
  subGroup: z.string(),
  isBankAccount: z.boolean().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'ACCOUNTS', 'VIEW');
  return NextResponse.json(accountingRepo.getChartOfAccounts(session.companyId));
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'ACCOUNTS', 'CREATE');
  const body = createSchema.parse(await req.json());
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO chart_of_accounts (id, company_id, account_code, name, account_type, account_group, sub_group, is_bank_account, bank_name, bank_account_number, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, session.companyId, body.accountCode, body.name, body.accountType, body.accountGroup, body.subGroup,
    body.isBankAccount ? 1 : 0, body.bankName || null, body.bankAccountNumber || null);
  return NextResponse.json({ id }, { status: 201 });
});
