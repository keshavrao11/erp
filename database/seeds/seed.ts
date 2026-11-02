import { db, runInTransaction } from '../../src/lib/db/connection';
import crypto from 'crypto';

export function seedDatabase() {
  runInTransaction((tx) => {
    // 1. Company
    const companyId = crypto.randomUUID();
    tx.prepare(`
      INSERT OR IGNORE INTO companies (id, code, legal_name, trade_name, gstin, pan, registered_address, base_currency, financial_year_start_month)
      VALUES (?, 'PT-HQ', 'Proficient Transforms Private Limited', 'Proficient Transforms', '29AAACP0000A1Z5', 'AAACP0000A', 'BM Habitat Mall, Jayalakshmipuram, Mysuru, Karnataka 570012', 'INR', 4)
    `).run(companyId);

    const comp = tx.prepare(`SELECT id FROM companies WHERE code = 'PT-HQ'`).get() as { id: string };
    const cid = comp.id;

    // 2. Verticals
    const verticals = [
      { id: crypto.randomUUID(), code: 'CONSTRUCTION', name: 'Construction', desc: 'Civil engineering, structural works, and commercial/residential building construction' },
      { id: crypto.randomUUID(), code: 'INTERIORS', name: 'Interior Design & Execution', desc: 'Turnkey interior design, modular joinery, fit-outs, and bespoke luxury interiors' },
      { id: crypto.randomUUID(), code: 'LAND_DEVELOPMENT', name: 'Land Development & Real Estate', desc: 'Plotted layouts, gated communities, JV agreements, and land registry' },
    ];
    for (const v of verticals) {
      tx.prepare(`INSERT OR IGNORE INTO business_verticals (id, company_id, code, name, description) VALUES (?, ?, ?, ?, ?)`).run(v.id, cid, v.code, v.name, v.desc);
    }

    const constrVert = tx.prepare(`SELECT id FROM business_verticals WHERE code = 'CONSTRUCTION'`).get() as { id: string };
    const intVert = tx.prepare(`SELECT id FROM business_verticals WHERE code = 'INTERIORS'`).get() as { id: string };
    const landVert = tx.prepare(`SELECT id FROM business_verticals WHERE code = 'LAND_DEVELOPMENT'`).get() as { id: string };

    // 3. Roles (10 Enterprise Roles)
    const rolesData = [
      { code: 'SUPER_ADMIN', name: 'Super Administrator', desc: 'Unrestricted system access across all modules, entities, and settings', limit: 100000000000 },
      { code: 'DIRECTOR', name: 'Managing Director / Board', desc: 'Executive oversight, consolidated financials, and highest level approvals', limit: 50000000000 },
      { code: 'CRM', name: 'CRM & Sales Executive', desc: 'Leads, customer enquiries, site visits, quotations, and client relations', limit: 50000000 },
      { code: 'PROJECT_MANAGER', name: 'Project Manager', desc: 'Multi-vertical project milestones, work breakdown, and DPR oversight', limit: 250000000 },
      { code: 'SITE_ENGINEER', name: 'Site Engineer', desc: 'Daily progress reporting, contractor measurements, and site labor attendance', limit: 10000000 },
      { code: 'INTERIOR_DESIGNER', name: 'Senior Interior Designer', desc: 'Space planning, CAD drawings, design revisions, and client sign-offs', limit: 50000000 },
      { code: 'LAND_DEV_MANAGER', name: 'Land Development Manager', desc: 'Land records, JV revenue shares, layout approvals, and plot allocations', limit: 1000000000 },
      { code: 'PURCHASE_EXECUTIVE', name: 'Procurement Specialist', desc: 'Material requisitions, RFQs, purchase orders, and goods receipt tracking', limit: 100000000 },
      { code: 'ACCOUNTANT', name: 'Chief Financial Accountant', desc: 'Chart of accounts, general ledger vouchers, bank reconciliation, and P&L', limit: 500000000 },
      { code: 'HR_ADMIN', name: 'HR & Payroll Administrator', desc: 'Employee records, biometric shift attendance, leave requests, and payroll runs', limit: 100000000 },
    ];
    for (const r of rolesData) {
      tx.prepare(`INSERT OR IGNORE INTO roles (id, code, name, description, max_approval_limit_paise) VALUES (?, ?, ?, ?, ?)`).run(crypto.randomUUID(), r.code, r.name, r.desc, r.limit);
    }

    // 4. Admin user (password: admin123)
    const adminId = crypto.randomUUID();
    tx.prepare(`
      INSERT OR IGNORE INTO users (id, company_id, username, email, full_name, password_hash, is_active)
      VALUES (?, ?, 'admin', 'admin@proficienttransforms.com', 'Jaisimha Rao (Director)', 'admin123', 1)
    `).run(adminId, cid);
    const adminUser = tx.prepare(`SELECT id FROM users WHERE username = 'admin'`).get() as { id: string };
    const superAdminRole = tx.prepare(`SELECT id FROM roles WHERE code = 'SUPER_ADMIN'`).get() as { id: string };
    tx.prepare(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`).run(adminUser.id, superAdminRole.id);

    // 5. Cost Centres
    const costCentres = [
      { code: 'CC-HQ', name: 'Corporate Head Office' },
      { code: 'CC-CONST', name: 'Construction Division Operations' },
      { code: 'CC-INT', name: 'Interiors Design Studio & Workshop' },
      { code: 'CC-LAND', name: 'Land & Plotted Layouts Branch' },
    ];
    for (const cc of costCentres) {
      tx.prepare(`INSERT OR IGNORE INTO cost_centres (id, company_id, code, name) VALUES (?, ?, ?, ?)`).run(crypto.randomUUID(), cid, cc.code, cc.name);
    }
    const ccHq = tx.prepare(`SELECT id FROM cost_centres WHERE code = 'CC-HQ'`).get() as { id: string };

    // 6. Tax Codes
    const taxCodes = [
      { code: 'GST-18', name: 'GST 18% (Works Contract & Services)', rate: 18.0, cgst: 9.0, sgst: 9.0, igst: 0.0 },
      { code: 'GST-12', name: 'GST 12% (Construction Materials)', rate: 12.0, cgst: 6.0, sgst: 6.0, igst: 0.0 },
      { code: 'GST-5', name: 'GST 5% (Affordable Housing)', rate: 5.0, cgst: 2.5, sgst: 2.5, igst: 0.0 },
      { code: 'EXEMPT', name: 'Exempt / Zero Rate (Land Sale)', rate: 0.0, cgst: 0.0, sgst: 0.0, igst: 0.0 },
    ];
    for (const tc of taxCodes) {
      tx.prepare(`INSERT OR IGNORE INTO tax_codes (id, company_id, code, name, rate_percent, component_cgst_percent, component_sgst_percent, component_igst_percent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(crypto.randomUUID(), cid, tc.code, tc.name, tc.rate, tc.cgst, tc.sgst, tc.igst);
    }

    // 7. Chart of Accounts (Complete General Ledger Setup)
    const accounts = [
      // Assets
      { code: '1010', name: 'HDFC Current Account (Main)', type: 'ASSET', group: 'Current Assets', sub: 'Cash & Bank Balances', isBank: 1, bank: 'HDFC Bank Ltd', accNo: '50200012345678' },
      { code: '1020', name: 'ICICI Project Escrow Account', type: 'ASSET', group: 'Current Assets', sub: 'Cash & Bank Balances', isBank: 1, bank: 'ICICI Bank Ltd', accNo: '001205012345' },
      { code: '1030', name: 'Petty Cash - Site Office', type: 'ASSET', group: 'Current Assets', sub: 'Cash & Bank Balances', isBank: 0 },
      { code: '1110', name: 'Trade Debtors (Accounts Receivable)', type: 'ASSET', group: 'Current Assets', sub: 'Receivables', isBank: 0 },
      { code: '1210', name: 'Raw Material Inventory - Construction', type: 'ASSET', group: 'Current Assets', sub: 'Inventories', isBank: 0 },
      { code: '1220', name: 'Work-in-Progress (WIP Projects)', type: 'ASSET', group: 'Current Assets', sub: 'Inventories', isBank: 0 },
      { code: '1310', name: 'Land Bank Stock (Parcels at Cost)', type: 'ASSET', group: 'Current Assets', sub: 'Real Estate Inventory', isBank: 0 },
      // Liabilities
      { code: '2010', name: 'Trade Creditors (Accounts Payable)', type: 'LIABILITY', group: 'Current Liabilities', sub: 'Payables', isBank: 0 },
      { code: '2020', name: 'Contractor Retention Payable', type: 'LIABILITY', group: 'Current Liabilities', sub: 'Holdbacks & Retention', isBank: 0 },
      { code: '2110', name: 'Customer Advances & Booking Tokens', type: 'LIABILITY', group: 'Current Liabilities', sub: 'Unearned Revenue', isBank: 0 },
      { code: '2210', name: 'TDS Payable (Section 194C / 194J)', type: 'LIABILITY', group: 'Current Liabilities', sub: 'Statutory Dues', isBank: 0 },
      { code: '2220', name: 'GST Output Liability', type: 'LIABILITY', group: 'Current Liabilities', sub: 'Statutory Dues', isBank: 0 },
      { code: '2230', name: 'PF & ESI Payable', type: 'LIABILITY', group: 'Current Liabilities', sub: 'Payroll Liabilities', isBank: 0 },
      // Equity
      { code: '3010', name: 'Paid-up Share Capital', type: 'EQUITY', group: 'Equity', sub: 'Shareholders Equity', isBank: 0 },
      { code: '3110', name: 'Retained Earnings', type: 'EQUITY', group: 'Equity', sub: 'Reserves & Surplus', isBank: 0 },
      // Income
      { code: '4010', name: 'Revenue - Civil Construction Contracts', type: 'INCOME', group: 'Operating Revenue', sub: 'Construction Income', isBank: 0 },
      { code: '4020', name: 'Revenue - Interior Design & Turnkey Projects', type: 'INCOME', group: 'Operating Revenue', sub: 'Interior Income', isBank: 0 },
      { code: '4030', name: 'Revenue - Plotted Land & Real Estate Sales', type: 'INCOME', group: 'Operating Revenue', sub: 'Real Estate Sales', isBank: 0 },
      // Expenses
      { code: '5010', name: 'Direct Material Consumed (Cement/Steel/Sand)', type: 'EXPENSE', group: 'Direct Costs', sub: 'Site Material Cost', isBank: 0 },
      { code: '5020', name: 'Subcontractor & Labour Contract Charges', type: 'EXPENSE', group: 'Direct Costs', sub: 'Site Labour Cost', isBank: 0 },
      { code: '5030', name: 'Interior Hardware & Modular Fit-out Expense', type: 'EXPENSE', group: 'Direct Costs', sub: 'Interior Materials', isBank: 0 },
      { code: '5110', name: 'Employee Salaries & Allowances', type: 'EXPENSE', group: 'Operating Expenses', sub: 'Payroll Expense', isBank: 0 },
      { code: '5120', name: 'Employer Provident Fund (PF) Contribution', type: 'EXPENSE', group: 'Operating Expenses', sub: 'Payroll Expense', isBank: 0 },
      { code: '5210', name: 'Site Office Rent & Utilities', type: 'EXPENSE', group: 'Operating Expenses', sub: 'Administrative Overhead', isBank: 0 },
    ];
    for (const acc of accounts) {
      tx.prepare(`
        INSERT OR IGNORE INTO chart_of_accounts (id, company_id, account_code, name, account_type, account_group, sub_group, is_bank_account, bank_name, bank_account_number, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(crypto.randomUUID(), cid, acc.code, acc.name, acc.type, acc.group, acc.sub, acc.isBank, acc.bank || null, acc.accNo || null);
    }

    const accHdfc = tx.prepare(`SELECT id FROM chart_of_accounts WHERE account_code = '1010'`).get() as { id: string };
    const accDebtors = tx.prepare(`SELECT id FROM chart_of_accounts WHERE account_code = '1110'`).get() as { id: string };
    const accCreditors = tx.prepare(`SELECT id FROM chart_of_accounts WHERE account_code = '2010'`).get() as { id: string };
    const accCustAdvance = tx.prepare(`SELECT id FROM chart_of_accounts WHERE account_code = '2110'`).get() as { id: string };
    const accConstRev = tx.prepare(`SELECT id FROM chart_of_accounts WHERE account_code = '4010'`).get() as { id: string };
    const accIntRev = tx.prepare(`SELECT id FROM chart_of_accounts WHERE account_code = '4020'`).get() as { id: string };
    const accLandRev = tx.prepare(`SELECT id FROM chart_of_accounts WHERE account_code = '4030'`).get() as { id: string };
    const accMaterialExp = tx.prepare(`SELECT id FROM chart_of_accounts WHERE account_code = '5010'`).get() as { id: string };
    const accLabourExp = tx.prepare(`SELECT id FROM chart_of_accounts WHERE account_code = '5020'`).get() as { id: string };

    // 8. Customers
    const customers = [
      { code: 'CUST-00001', name: 'Dr. Ramesh Narayan', company: 'Narayan Health Trust', phone: '9845012345', email: 'ramesh.n@narayanhealth.org', pan: 'ABCPN1234F', addr: 'Vidyaranyapuram, Mysuru, Karnataka', vertId: constrVert.id },
      { code: 'CUST-00002', name: 'Mrs. Ananya Sundaram', company: 'Sundaram Design Studio', phone: '9880198765', email: 'ananya.sundaram@gmail.com', pan: 'BCDPS5678G', addr: 'Gokulam 3rd Stage, Mysuru, Karnataka', vertId: intVert.id },
      { code: 'CUST-00003', name: 'Mr. Vikramaditya Hegde', company: 'Hegde Agro Logistics', phone: '9740055443', email: 'vikram.hegde@hegdegroup.in', pan: 'CDEPH9012H', addr: 'Jayalakshmipuram, Mysuru, Karnataka', vertId: landVert.id },
    ];
    for (const c of customers) {
      tx.prepare(`
        INSERT OR IGNORE INTO customers (id, company_id, customer_code, full_name, company_name, phone, email, pan, billing_address, vertical_id, assigned_crm_user_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(crypto.randomUUID(), cid, c.code, c.name, c.company, c.phone, c.email, c.pan, c.addr, c.vertId, adminUser.id);
    }
    const cust1 = tx.prepare(`SELECT id FROM customers WHERE customer_code = 'CUST-00001'`).get() as { id: string };
    const cust2 = tx.prepare(`SELECT id FROM customers WHERE customer_code = 'CUST-00002'`).get() as { id: string };
    const cust3 = tx.prepare(`SELECT id FROM customers WHERE customer_code = 'CUST-00003'`).get() as { id: string };

    // 9. Vendors
    const vendors = [
      { code: 'VND-00001', name: 'UltraTech Cement Dealership (Mysuru)', contact: 'Kishore Kumar', phone: '9448011223', email: 'mysuru.sales@ultratechdealers.com', gstin: '29AAACU1234A1Z1', pan: 'AAACU1234A', days: 30 },
      { code: 'VND-00002', name: 'Tata Tiscon Steel Suppliers', contact: 'Raghavan Pillai', phone: '9844033445', email: 'orders@tatatisconkarnataka.com', gstin: '29AABCT5678B1Z2', pan: 'AABCT5678B', days: 45 },
      { code: 'VND-00003', name: 'Hettich Hardware & Plywoods', contact: 'Deepak Jain', phone: '9845077889', email: 'deepak@hettichdistributors.com', gstin: '29AADCH9876C1Z3', pan: 'AADCH9876C', days: 21 },
    ];
    for (const v of vendors) {
      tx.prepare(`
        INSERT OR IGNORE INTO vendors (id, company_id, vendor_code, name, contact_person, phone, email, gstin, pan, payment_terms_days, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(crypto.randomUUID(), cid, v.code, v.name, v.contact, v.phone, v.email, v.gstin, v.pan, v.days);
    }
    const vend1 = tx.prepare(`SELECT id FROM vendors WHERE vendor_code = 'VND-00001'`).get() as { id: string };

    // 10. Material Categories & Materials
    const catCivilId = crypto.randomUUID();
    const catIntId = crypto.randomUUID();
    tx.prepare(`INSERT OR IGNORE INTO material_categories (id, company_id, name, description) VALUES (?, ?, 'Civil Structural Materials', 'Cement, TMT Steel, Aggregates, Sand, Bricks')`).run(catCivilId, cid);
    tx.prepare(`INSERT OR IGNORE INTO material_categories (id, company_id, name, description) VALUES (?, ?, 'Interior Architectural Finishes', 'Veneers, Acrylic laminates, Hardware, Lighting fixtures')`).run(catIntId, cid);

    const materials = [
      { code: 'MAT-00001', catId: catCivilId, name: 'UltraTech Super PPC Cement (50kg Bag)', uom: 'BAG', hsn: '252329', rate: 38500 },
      { code: 'MAT-00002', catId: catCivilId, name: 'Tata Tiscon 550D TMT Rebars (12mm)', uom: 'TON', hsn: '721420', rate: 6450000 },
      { code: 'MAT-00003', catId: catCivilId, name: 'Manufactured M-Sand (Zone II Coarse)', uom: 'TON', hsn: '250590', rate: 110000 },
      { code: 'MAT-00004', catId: catIntId, name: 'Greenply 18mm BWP Marine Plywood 8x4', uom: 'SHEET', hsn: '441231', rate: 320000 },
    ];
    for (const m of materials) {
      tx.prepare(`
        INSERT OR IGNORE INTO materials (id, company_id, category_id, material_code, name, unit_of_measure, hsn_code, standard_rate_paise, min_stock_qty, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 10, 1)
      `).run(crypto.randomUUID(), cid, m.catId, m.code, m.name, m.uom, m.hsn, m.rate);
    }

    // 11. Projects (One per Vertical)
    const projectsData = [
      {
        code: 'PRJ-CONST-001',
        name: 'The Grand Heritage Villas (Phase 1)',
        vertId: constrVert.id,
        clientId: cust1.id,
        status: 'ACTIVE',
        start: '2026-04-01',
        end: '2027-03-31',
        budget: 1850000000, // 18.50 Cr in paise
        city: 'Mysuru',
        addr: 'Survey No. 42/1, Chamundi Hill Foothills Road',
      },
      {
        code: 'PRJ-INT-001',
        name: 'Penthouse Luxe Suite - Interior Fit-out',
        vertId: intVert.id,
        clientId: cust2.id,
        status: 'ACTIVE',
        start: '2026-06-15',
        end: '2026-12-15',
        budget: 450000000, // 4.50 Cr in paise
        city: 'Mysuru',
        addr: 'Flat 1201, Brigade Symphony, KRS Road',
      },
      {
        code: 'PRJ-LAND-001',
        name: 'Green Meadows Gated Plotted Community',
        vertId: landVert.id,
        clientId: cust3.id,
        status: 'ACTIVE',
        start: '2026-01-10',
        end: '2027-06-30',
        budget: 4200000000, // 42.00 Cr in paise
        city: 'Mysuru',
        addr: 'Sy. No. 88, 89, Hunsur Highway Bypass',
      },
    ];

    for (const p of projectsData) {
      tx.prepare(`
        INSERT OR IGNORE INTO projects (id, company_id, vertical_id, project_code, name, client_id, status, start_date, target_completion_date, estimated_budget_paise, location_city, location_address, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(crypto.randomUUID(), cid, p.vertId, p.code, p.name, p.clientId, p.status, p.start, p.end, p.budget, p.city, p.addr, adminUser.id);
    }

    const prjConst = tx.prepare(`SELECT id FROM projects WHERE project_code = 'PRJ-CONST-001'`).get() as { id: string };
    const prjInt = tx.prepare(`SELECT id FROM projects WHERE project_code = 'PRJ-INT-001'`).get() as { id: string };
    const prjLand = tx.prepare(`SELECT id FROM projects WHERE project_code = 'PRJ-LAND-001'`).get() as { id: string };

    // 12. Land Development: Parcels & Plots
    const parcelId = crypto.randomUUID();
    tx.prepare(`
      INSERT OR IGNORE INTO land_parcels (id, company_id, project_id, survey_number, village, taluk, district, total_area_acres, acquisition_cost_paise, acquisition_date, status)
      VALUES (?, ?, ?, 'Sy. No. 88/1 & 88/2', 'Yelawala', 'Mysuru Taluk', 'Mysuru District', 14.5, 1250000000, '2025-11-20', 'OWNED')
    `).run(parcelId, cid, prjLand.id);

    // Seed 12 plots in Green Meadows
    const plots = [
      { no: 'Plot-01', block: 'Phase A', area: 2400, rate: 320000, type: 'RESIDENTIAL', status: 'BOOKED', facing: 'East' },
      { no: 'Plot-02', block: 'Phase A', area: 2400, rate: 320000, type: 'RESIDENTIAL', status: 'AVAILABLE', facing: 'East' },
      { no: 'Plot-03', block: 'Phase A', area: 3000, rate: 350000, type: 'CORNER', status: 'AVAILABLE', facing: 'North-East' },
      { no: 'Plot-04', block: 'Phase A', area: 1500, rate: 310000, type: 'RESIDENTIAL', status: 'AVAILABLE', facing: 'West' },
      { no: 'Plot-05', block: 'Phase B', area: 2400, rate: 320000, type: 'RESIDENTIAL', status: 'AVAILABLE', facing: 'North' },
      { no: 'Plot-06', block: 'Phase B', area: 4000, rate: 450000, type: 'COMMERCIAL', status: 'AVAILABLE', facing: 'Main Road Front' },
      { no: 'Plot-07', block: 'Phase B', area: 2400, rate: 320000, type: 'RESIDENTIAL', status: 'AVAILABLE', facing: 'South' },
      { no: 'Plot-08', block: 'Phase B', area: 1800, rate: 315000, type: 'RESIDENTIAL', status: 'BOOKED', facing: 'East' },
      { no: 'Plot-09', block: 'Phase C', area: 2400, rate: 320000, type: 'RESIDENTIAL', status: 'AVAILABLE', facing: 'North' },
      { no: 'Plot-10', block: 'Phase C', area: 2400, rate: 320000, type: 'RESIDENTIAL', status: 'AVAILABLE', facing: 'East' },
      { no: 'Plot-11', block: 'Phase C', area: 3600, rate: 360000, type: 'CORNER', status: 'AVAILABLE', facing: 'North-West' },
      { no: 'Plot-12', block: 'Phase C', area: 1500, rate: 310000, type: 'RESIDENTIAL', status: 'AVAILABLE', facing: 'South' },
    ];
    for (const pl of plots) {
      const price = Math.round(pl.area * pl.rate);
      tx.prepare(`
        INSERT OR IGNORE INTO plot_inventory (id, project_id, plot_number, phase_block, area_sqft, base_rate_per_sqft_paise, total_price_paise, plot_type, facing, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(crypto.randomUUID(), prjLand.id, pl.no, pl.block, pl.area, pl.rate, price, pl.type, pl.facing, pl.status);
    }

    // Active Plot Booking for Plot-01
    const plot1 = tx.prepare(`SELECT id, total_price_paise FROM plot_inventory WHERE plot_number = 'Plot-01' AND project_id = ?`).get(prjLand.id) as { id: string; total_price_paise: number };
    if (plot1) {
      const bkgId = crypto.randomUUID();
      tx.prepare(`
        INSERT OR IGNORE INTO plot_bookings (id, plot_id, customer_id, booking_number, booking_date, token_amount_paise, agreement_value_paise, payment_plan, status, booked_by)
        VALUES (?, ?, ?, 'BKG-2026-00001', '2026-10-15', 50000000, ?, 'MILESTONE', 'ACTIVE', ?)
      `).run(bkgId, plot1.id, cust3.id, plot1.total_price_paise, adminUser.id);

      // Instalments
      const instData = [
        { num: 1, due: '2026-10-15', amt: 50000000, desc: 'Booking Token Deposit', status: 'PAID' },
        { num: 2, due: '2026-11-15', amt: 200000000, desc: 'Agreement Signing Milestone (25%)', status: 'PENDING' },
        { num: 3, due: '2026-12-15', amt: 250000000, desc: 'Roads & Drainage Completion (35%)', status: 'PENDING' },
        { num: 4, due: '2027-01-31', amt: plot1.total_price_paise - 500000000, desc: 'Registration & Khata Handover', status: 'PENDING' },
      ];
      for (const ins of instData) {
        tx.prepare(`
          INSERT OR IGNORE INTO plot_instalments (id, booking_id, instalment_number, due_date, amount_paise, description, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(crypto.randomUUID(), bkgId, ins.num, ins.due, ins.amt, ins.desc, ins.status);
      }
    }

    // 13. CRM Enquiries
    const enquiries = [
      { no: 'ENQ-2026-0001', name: 'Dr. Ramesh Narayan', phone: '9845012345', vertId: constrVert.id, prjId: prjConst.id, src: 'REFERRAL', budget: 1850000000, score: 85, status: 'WON', req: 'Premium 4BHK architectural heritage villa with exposed brick and landscaped courtyard' },
      { no: 'ENQ-2026-0002', name: 'Mrs. Ananya Sundaram', phone: '9880198765', vertId: intVert.id, prjId: prjInt.id, src: 'WALK_IN', budget: 450000000, score: 90, status: 'WON', req: 'Luxury bespoke interior execution with Italian marble flooring, ducted AC, and modular German kitchen' },
      { no: 'ENQ-2026-0003', name: 'Sanjay Kumar IRS', phone: '9448099887', vertId: landVert.id, prjId: prjLand.id, src: 'WEBSITE', budget: 85000000, score: 75, status: 'SITE_VISIT_DONE', req: 'Corner residential plot 60x40 facing north for retirement residence' },
      { no: 'ENQ-2026-0004', name: 'Kavitha Mahesh', phone: '9845511223', vertId: constrVert.id, prjId: prjConst.id, src: 'PHONE', budget: 120000000, score: 60, status: 'NEGOTIATION', req: 'Commercial clinic complex G+2 building execution' },
    ];
    for (const e of enquiries) {
      tx.prepare(`
        INSERT OR IGNORE INTO enquiries (id, company_id, vertical_id, project_id, enquiry_number, source, customer_name, phone, requirement_description, budget_paise, lead_score, status, assigned_to)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(crypto.randomUUID(), cid, e.vertId, e.prjId, e.no, e.src, e.name, e.phone, e.req, e.budget, e.score, e.status, adminUser.id);
    }

    // 14. Construction: BOQ & Work Packages
    const boqs = [
      { pkg: 'Civil Earthwork & Foundation', desc: 'Site clearance, excavation in hard soil up to 2.5m depth, and PCC 1:4:8 bed', uom: 'CUM', qty: 450.0, rate: 85000 },
      { pkg: 'Reinforced Concrete Structure', desc: 'M25 grade ready-mix concrete for footings, plinth beams, and columns', uom: 'CUM', qty: 320.0, rate: 750000 },
      { pkg: 'Superstructure Brickwork', desc: 'Table-moulded wire-cut red brick masonry in cement mortar 1:6', uom: 'SQM', qty: 1200.0, rate: 145000 },
      { pkg: 'Plumbing & Drainage Works', desc: 'CPVC internal concealed water lines and UPVC soil waste pipe fittings', uom: 'LOT', qty: 1.0, rate: 85000000 },
    ];
    for (let i = 0; i < boqs.length; i++) {
      const b = boqs[i];
      const amt = Math.round(b.qty * b.rate);
      tx.prepare(`
        INSERT OR IGNORE INTO boq_items (id, project_id, work_package, description, unit, quantity, rate_paise, amount_paise, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(crypto.randomUUID(), prjConst.id, b.pkg, b.desc, b.uom, b.qty, b.rate, amt, i + 1);
    }

    // DPR for Construction
    const dprId = crypto.randomUUID();
    tx.prepare(`
      INSERT OR IGNORE INTO daily_progress_reports (id, project_id, report_date, weather, overall_progress_percent, summary, submitted_by, status)
      VALUES (?, ?, '2026-11-01', 'Clear, Sunny 28°C', 38.5, 'Completed footing cast for Villa Blocks 3 & 4. Shuttering removal and curing underway. Steel reinforcement delivered by Tata Tiscon.', ?, 'APPROVED')
    `).run(dprId, prjConst.id, adminUser.id);

    // Labour Attendance
    const labourLog = [
      { trade: 'MASON', contractor: 'Cauvery Civil Works', count: 12, wage: 95000 },
      { trade: 'CARPENTER', contractor: 'Mysuru Shuttering Experts', count: 8, wage: 90000 },
      { trade: 'HELPER', contractor: 'Cauvery Civil Works', count: 20, wage: 65000 },
      { trade: 'SUPERVISOR', contractor: 'Direct Company Roll', count: 2, wage: 150000 },
    ];
    for (const l of labourLog) {
      const tot = l.count * l.wage;
      tx.prepare(`
        INSERT OR IGNORE INTO labour_attendance (id, project_id, attendance_date, trade_category, contractor_name, count_present, wages_per_day_paise, total_wages_paise, created_by)
        VALUES (?, ?, '2026-11-01', ?, ?, ?, ?, ?, ?)
      `).run(crypto.randomUUID(), prjConst.id, l.trade, l.contractor, l.count, l.wage, tot, adminUser.id);
    }

    // 15. Balanced General Ledger Vouchers (Double-Entry General Ledger Engine)
    const vouchersToSeed = [
      {
        no: 'REC/2026-27/00001',
        type: 'RECEIPT',
        date: '2026-10-15',
        vertId: landVert.id,
        prjId: prjLand.id,
        narration: 'Received booking token deposit from Mr. Vikramaditya Hegde for Green Meadows Plot-01 via NEFT',
        lines: [
          { accId: accHdfc.id, dr: 50000000, cr: 0 },
          { accId: accCustAdvance.id, dr: 0, cr: 50000000 },
        ],
      },
      {
        no: 'PAY/2026-27/00001',
        type: 'PAYMENT',
        date: '2026-10-20',
        vertId: constrVert.id,
        prjId: prjConst.id,
        narration: 'Advance payment disbursed to UltraTech Cement Dealership for 500 bags of Super PPC cement',
        lines: [
          { accId: accMaterialExp.id, dr: 19250000, cr: 0 },
          { accId: accHdfc.id, dr: 0, cr: 19250000 },
        ],
      },
      {
        no: 'INV/2026-27/00001',
        type: 'SALES_INVOICE',
        date: '2026-10-25',
        vertId: constrVert.id,
        prjId: prjConst.id,
        narration: 'Running Account (RA) Bill 01 billed to Dr. Ramesh Narayan for Plinth Level completion',
        lines: [
          { accId: accDebtors.id, dr: 350000000, cr: 0 },
          { accId: accConstRev.id, dr: 0, cr: 350000000 },
        ],
      },
      {
        no: 'JNL/2026-27/00001',
        type: 'JOURNAL',
        date: '2026-10-31',
        vertId: constrVert.id,
        prjId: prjConst.id,
        narration: 'Accrual of site labour charges for October 2026 payable to Cauvery Civil Works',
        lines: [
          { accId: accLabourExp.id, dr: 45000000, cr: 0 },
          { accId: accCreditors.id, dr: 0, cr: 45000000 },
        ],
      },
    ];

    for (const v of vouchersToSeed) {
      const vId = crypto.randomUUID();
      const drSum = v.lines.reduce((s, l) => s + l.dr, 0);
      const crSum = v.lines.reduce((s, l) => s + l.cr, 0);
      tx.prepare(`
        INSERT OR IGNORE INTO vouchers (id, company_id, vertical_id, project_id, voucher_number, voucher_type, voucher_date, narration, total_debit_paise, total_credit_paise, status, idempotency_key, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'POSTED', ?, ?)
      `).run(vId, cid, v.vertId, v.prjId, v.no, v.type, v.date, v.narration, drSum, crSum, crypto.randomUUID(), adminUser.id);

      for (const line of v.lines) {
        tx.prepare(`
          INSERT OR IGNORE INTO ledger_entries (id, voucher_id, account_id, debit_paise, credit_paise)
          VALUES (?, ?, ?, ?, ?)
        `).run(crypto.randomUUID(), vId, line.accId, line.dr, line.cr);
      }
    }

    // 16. HR & Employees
    const deptId = crypto.randomUUID();
    tx.prepare(`INSERT OR IGNORE INTO departments (id, company_id, name) VALUES (?, ?, 'Engineering & Site Execution')`).run(deptId, cid);

    const employees = [
      { code: 'EMP-0001', name: 'Siddharth Varma', phone: '9845022334', email: 'siddharth.v@proficienttransforms.com', desig: 'Senior Project Engineer', join: '2024-05-01', basic: 7500000, hra: 3000000 },
      { code: 'EMP-0002', name: 'Pooja Bhatt', phone: '9880044556', email: 'pooja.bhatt@proficienttransforms.com', desig: 'Lead Interior Architect', join: '2025-01-15', basic: 6500000, hra: 2600000 },
      { code: 'EMP-0003', name: 'Manjunath Swamy', phone: '9740066778', email: 'manju.swamy@proficienttransforms.com', desig: 'Surveyor & Land Coordinator', join: '2023-08-01', basic: 5000000, hra: 2000000 },
    ];
    for (const emp of employees) {
      tx.prepare(`
        INSERT OR IGNORE INTO employees (id, company_id, employee_code, full_name, phone, email, department_id, designation, date_of_joining, employment_type, basic_salary_paise, hra_paise, other_allowances_paise, pf_applicable, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PERMANENT', ?, ?, 1000000, 1, 1)
      `).run(crypto.randomUUID(), cid, emp.code, emp.name, emp.phone, emp.email, deptId, emp.desig, emp.join, emp.basic, emp.hra);
    }

    // 17. Document repository folder
    const folderId = crypto.randomUUID();
    tx.prepare(`
      INSERT OR IGNORE INTO document_folders (id, company_id, name, project_id, vertical_id, created_by)
      VALUES (?, ?, 'Architectural Layout Blueprints', ?, ?, ?)
    `).run(folderId, cid, prjConst.id, constrVert.id, adminUser.id);

    console.log('Production database seeded successfully with comprehensive multi-vertical enterprise data.');
  });
}

if (require.main === module) {
  seedDatabase();
}
