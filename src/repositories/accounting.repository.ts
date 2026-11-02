import { db, runInTransaction } from '../lib/db/connection';
import crypto from 'crypto';

export interface VoucherLine {
  accountId: string;
  debitPaise: number;
  creditPaise: number;
  narration?: string;
}

export interface CreateVoucherInput {
  companyId: string;
  verticalId: string;
  projectId?: string;
  costCentreId?: string;
  voucherType: string;
  voucherDate: string;
  narration: string;
  lines: VoucherLine[];
  createdBy: string;
  idempotencyKey?: string;
}

export class AccountingRepository {
  postVoucher(input: CreateVoucherInput): string {
    const { lines } = input;
    const totalDebit = lines.reduce((s, l) => s + l.debitPaise, 0);
    const totalCredit = lines.reduce((s, l) => s + l.creditPaise, 0);
    if (totalDebit !== totalCredit) {
      throw new Error(`Voucher imbalance: debit=${totalDebit} credit=${totalCredit}`);
    }
    if (totalDebit === 0) {
      throw new Error('Voucher cannot have zero value');
    }

    const voucherId = crypto.randomUUID();
    const idempotencyKey = input.idempotencyKey || crypto.randomUUID();
    const voucherNumber = this.generateVoucherNumber(input.voucherType, input.voucherDate);

    runInTransaction((tx) => {
      tx.prepare(`
        INSERT INTO vouchers (id, company_id, vertical_id, project_id, cost_centre_id, voucher_number,
          voucher_type, voucher_date, narration, total_debit_paise, total_credit_paise, status, idempotency_key, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'POSTED', ?, ?)
      `).run(voucherId, input.companyId, input.verticalId, input.projectId || null,
        input.costCentreId || null, voucherNumber, input.voucherType,
        input.voucherDate, input.narration, totalDebit, totalCredit, idempotencyKey, input.createdBy);

      const insertLine = tx.prepare(`
        INSERT INTO ledger_entries (id, voucher_id, account_id, debit_paise, credit_paise)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const line of lines) {
        insertLine.run(crypto.randomUUID(), voucherId, line.accountId, line.debitPaise, line.creditPaise);
      }
    });

    return voucherId;
  }

  private generateVoucherNumber(type: string, date: string): string {
    const prefix: Record<string, string> = {
      RECEIPT: 'REC', PAYMENT: 'PAY', CONTRA: 'CON', JOURNAL: 'JNL',
      SALES_INVOICE: 'INV', PURCHASE_BILL: 'PB', CONTRACTOR_BILL: 'CB',
    };
    const p = prefix[type] || 'VCH';
    const fy = this.getCurrentFY(date);
    const seq = (db.prepare(`SELECT COUNT(*) as cnt FROM vouchers WHERE voucher_type = ? AND voucher_date LIKE ?`)
      .get(type, `${date.substring(0,4)}%`) as { cnt: number }).cnt + 1;
    return `${p}/${fy}/${String(seq).padStart(5, '0')}`;
  }

  private getCurrentFY(date: string): string {
    const d = new Date(date);
    const yr = d.getFullYear();
    const mo = d.getMonth() + 1;
    const startYear = mo >= 4 ? yr : yr - 1;
    return `${startYear}-${String(startYear + 1).slice(2)}`;
  }

  getAccountBalance(accountId: string): { debit: number; credit: number; balance: number } {
    const row = db.prepare(`
      SELECT 
        COALESCE(SUM(le.debit_paise), 0) as total_debit,
        COALESCE(SUM(le.credit_paise), 0) as total_credit
      FROM ledger_entries le
      JOIN vouchers v ON v.id = le.voucher_id
      WHERE le.account_id = ? AND v.status = 'POSTED'
    `).get(accountId) as { total_debit: number; total_credit: number };
    return { debit: row.total_debit, credit: row.total_credit, balance: row.total_debit - row.total_credit };
  }

  getTrialBalance(companyId: string): any[] {
    return db.prepare(`
      SELECT 
        coa.account_code, coa.name, coa.account_type, coa.account_group,
        COALESCE(SUM(le.debit_paise), 0) as total_debit,
        COALESCE(SUM(le.credit_paise), 0) as total_credit
      FROM chart_of_accounts coa
      LEFT JOIN ledger_entries le ON le.account_id = coa.id
      LEFT JOIN vouchers v ON v.id = le.voucher_id AND v.status = 'POSTED' AND v.company_id = ?
      WHERE coa.company_id = ? AND coa.is_active = 1
      GROUP BY coa.id
      ORDER BY coa.account_code
    `).all(companyId, companyId);
  }

  getVouchers(companyId: string, filters?: { type?: string; fromDate?: string; toDate?: string; verticalId?: string }): any[] {
    let query = `
      SELECT v.*, u.full_name as created_by_name, bv.name as vertical_name, p.name as project_name
      FROM vouchers v
      LEFT JOIN users u ON u.id = v.created_by
      LEFT JOIN business_verticals bv ON bv.id = v.vertical_id
      LEFT JOIN projects p ON p.id = v.project_id
      WHERE v.company_id = ?
    `;
    const params: any[] = [companyId];
    if (filters?.type) { query += ` AND v.voucher_type = ?`; params.push(filters.type); }
    if (filters?.fromDate) { query += ` AND v.voucher_date >= ?`; params.push(filters.fromDate); }
    if (filters?.toDate) { query += ` AND v.voucher_date <= ?`; params.push(filters.toDate); }
    if (filters?.verticalId) { query += ` AND v.vertical_id = ?`; params.push(filters.verticalId); }
    query += ` ORDER BY v.voucher_date DESC, v.created_at DESC LIMIT 200`;
    return db.prepare(query).all(...params);
  }

  getVoucherWithLines(voucherId: string): any {
    const voucher = db.prepare(`SELECT * FROM vouchers WHERE id = ?`).get(voucherId);
    if (!voucher) return null;
    const lines = db.prepare(`
      SELECT le.*, coa.account_code, coa.name as account_name
      FROM ledger_entries le JOIN chart_of_accounts coa ON coa.id = le.account_id
      WHERE le.voucher_id = ?
    `).all(voucherId);
    return { ...voucher, lines };
  }

  getChartOfAccounts(companyId: string): any[] {
    return db.prepare(`
      SELECT * FROM chart_of_accounts WHERE company_id = ? AND is_active = 1 ORDER BY account_code
    `).all(companyId);
  }
}

export const accountingRepo = new AccountingRepository();
