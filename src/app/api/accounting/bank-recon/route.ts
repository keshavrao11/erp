import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import crypto from 'crypto';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'ACCOUNTS', 'VIEW');
  const companyId = session.companyId;

  // 1. Bank Accounts
  const bankAccounts = db.prepare(`
    SELECT id, account_code, name, description
    FROM chart_of_accounts
    WHERE company_id = ? AND is_bank_account = 1
  `).all(companyId);

  // 2. Book balance
  const balanceRow = db.prepare(`
    SELECT COALESCE(SUM(le.debit_paise - le.credit_paise), 0) as book_balance_paise
    FROM ledger_entries le
    JOIN chart_of_accounts coa ON coa.id = le.account_id
    JOIN vouchers v ON v.id = le.voucher_id
    WHERE coa.company_id = ? AND coa.is_bank_account = 1 AND v.status = 'POSTED'
  `).get(companyId) as { book_balance_paise: number };

  // 3. Bank transactions from General Ledger
  const transactions = db.prepare(`
    SELECT 
      v.id as voucher_id,
      v.voucher_number,
      v.voucher_date,
      v.narration,
      v.voucher_type,
      le.debit_paise,
      le.credit_paise
    FROM ledger_entries le
    JOIN chart_of_accounts coa ON coa.id = le.account_id
    JOIN vouchers v ON v.id = le.voucher_id
    WHERE coa.company_id = ? AND coa.is_bank_account = 1 AND v.status = 'POSTED'
    ORDER BY v.voucher_date DESC
    LIMIT 20
  `).all(companyId);

  // 4. Past reconciliation statements
  const history = db.prepare(`
    SELECT br.*, coa.name as account_name, u.full_name as reconciled_by_name
    FROM bank_reconciliation br
    JOIN chart_of_accounts coa ON coa.id = br.account_id
    LEFT JOIN users u ON u.id = br.reconciled_by
    WHERE br.company_id = ?
    ORDER BY br.created_at DESC
    LIMIT 10
  `).all(companyId);

  return NextResponse.json({
    bankAccounts,
    bookBalancePaise: balanceRow?.book_balance_paise || 0,
    transactions,
    history,
  });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'ACCOUNTS', 'CREATE');
  const body = await req.json();

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO bank_reconciliation (
      id, account_id, company_id, statement_date,
      bank_closing_balance_paise, book_closing_balance_paise, reconciled_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    body.accountId,
    session.companyId,
    body.statementDate || new Date().toISOString().slice(0, 10),
    body.bankClosingBalancePaise,
    body.bookClosingBalancePaise,
    session.userId
  );

  return NextResponse.json({ id, message: 'Bank reconciliation statement saved' }, { status: 201 });
});

