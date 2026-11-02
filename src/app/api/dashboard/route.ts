import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'DASHBOARD', 'VIEW');
  const companyId = session.companyId;

  // Active Projects Count
  const activeProjects = db.prepare(`SELECT COUNT(*) as count FROM projects WHERE company_id = ? AND status = 'ACTIVE'`).get(companyId) as { count: number };

  // Vertical breakdown
  const verticalStats = db.prepare(`
    SELECT bv.name, bv.code, COUNT(p.id) as project_count,
      COALESCE(SUM(p.estimated_budget_paise), 0) as total_budget_paise
    FROM business_verticals bv
    LEFT JOIN projects p ON p.vertical_id = bv.id AND p.status = 'ACTIVE'
    WHERE bv.company_id = ?
    GROUP BY bv.id
  `).all(companyId);

  // Plot Inventory Available vs Booked
  const plotStats = db.prepare(`
    SELECT 
      COUNT(CASE WHEN pi.status = 'AVAILABLE' THEN 1 END) as available,
      COUNT(CASE WHEN pi.status = 'BOOKED' THEN 1 END) as booked,
      COUNT(CASE WHEN pi.status = 'REGISTERED' THEN 1 END) as registered,
      COUNT(*) as total
    FROM plot_inventory pi
    JOIN projects p ON p.id = pi.project_id
    WHERE p.company_id = ?
  `).get(companyId) as { available: number; booked: number; registered: number; total: number };

  // Cash / Bank Balance from posted general ledger vouchers
  const bankBalance = db.prepare(`
    SELECT COALESCE(SUM(le.debit_paise - le.credit_paise), 0) as balance_paise
    FROM ledger_entries le
    JOIN chart_of_accounts coa ON coa.id = le.account_id
    JOIN vouchers v ON v.id = le.voucher_id
    WHERE coa.company_id = ? AND coa.is_bank_account = 1 AND v.status = 'POSTED'
  `).get(companyId) as { balance_paise: number };

  // Accounts Receivable
  const receivables = db.prepare(`
    SELECT COALESCE(SUM(le.debit_paise - le.credit_paise), 0) as balance_paise
    FROM ledger_entries le
    JOIN chart_of_accounts coa ON coa.id = le.account_id
    JOIN vouchers v ON v.id = le.voucher_id
    WHERE coa.company_id = ? AND coa.account_code = '1110' AND v.status = 'POSTED'
  `).get(companyId) as { balance_paise: number };

  // Recent GL Vouchers
  const recentVouchers = db.prepare(`
    SELECT v.voucher_number, v.voucher_type, v.voucher_date, v.total_debit_paise, v.narration, v.status,
      bv.name as vertical_name
    FROM vouchers v
    LEFT JOIN business_verticals bv ON bv.id = v.vertical_id
    WHERE v.company_id = ?
    ORDER BY v.voucher_date DESC, v.created_at DESC
    LIMIT 6
  `).all(companyId);

  // Active Projects Summary
  const projectsList = db.prepare(`
    SELECT p.id, p.project_code, p.name, p.status, p.start_date, p.target_completion_date,
      p.estimated_budget_paise, bv.name as vertical_name
    FROM projects p
    JOIN business_verticals bv ON bv.id = p.vertical_id
    WHERE p.company_id = ? AND p.status = 'ACTIVE'
    ORDER BY p.created_at DESC
    LIMIT 5
  `).all(companyId);

  return NextResponse.json({
    activeProjects: activeProjects.count,
    verticalStats,
    plotStats,
    cashBankBalancePaise: bankBalance.balance_paise,
    receivablesPaise: receivables.balance_paise,
    recentVouchers,
    projectsList,
  });
});
