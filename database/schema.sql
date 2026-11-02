PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ============================================================
-- CORE / AUTH
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
    id                          TEXT PRIMARY KEY,
    code                        TEXT NOT NULL UNIQUE,
    legal_name                  TEXT NOT NULL,
    trade_name                  TEXT,
    gstin                       TEXT UNIQUE,
    pan                         TEXT,
    registered_address          TEXT,
    phone                       TEXT,
    email                       TEXT,
    logo_url                    TEXT,
    base_currency               TEXT NOT NULL DEFAULT 'INR',
    financial_year_start_month  INTEGER NOT NULL DEFAULT 4,
    is_active                   INTEGER NOT NULL DEFAULT 1,
    created_at                  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS business_verticals (
    id          TEXT PRIMARY KEY,
    company_id  TEXT NOT NULL REFERENCES companies(id),
    code        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    description TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS roles (
    id                      TEXT PRIMARY KEY,
    code                    TEXT NOT NULL UNIQUE,
    name                    TEXT NOT NULL,
    description             TEXT,
    max_approval_limit_paise INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    company_id    TEXT NOT NULL REFERENCES companies(id),
    username      TEXT NOT NULL UNIQUE,
    email         TEXT NOT NULL UNIQUE,
    full_name     TEXT NOT NULL,
    phone         TEXT,
    password_hash TEXT NOT NULL,
    avatar_url    TEXT,
    is_active     INTEGER NOT NULL DEFAULT 1,
    last_login_at TEXT,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL REFERENCES users(id),
    role_id TEXT NOT NULL REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id          TEXT PRIMARY KEY,
    role_id     TEXT NOT NULL REFERENCES roles(id),
    module_code TEXT NOT NULL,
    action_code TEXT NOT NULL,
    vertical_id TEXT REFERENCES business_verticals(id),
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (role_id, module_code, action_code, vertical_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id),
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id           TEXT PRIMARY KEY,
    user_id      TEXT REFERENCES users(id),
    action       TEXT NOT NULL,
    module_code  TEXT NOT NULL,
    entity_table TEXT NOT NULL,
    entity_id    TEXT NOT NULL,
    old_values   TEXT,
    new_values   TEXT,
    ip_address   TEXT,
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TRIGGER IF NOT EXISTS trg_audit_no_update BEFORE UPDATE ON audit_logs BEGIN SELECT RAISE(ABORT,'audit_logs are immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_audit_no_delete BEFORE DELETE ON audit_logs BEGIN SELECT RAISE(ABORT,'audit_logs are immutable'); END;

-- ============================================================
-- MASTERS
-- ============================================================

CREATE TABLE IF NOT EXISTS cost_centres (
    id          TEXT PRIMARY KEY,
    company_id  TEXT NOT NULL REFERENCES companies(id),
    code        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    vertical_id TEXT REFERENCES business_verticals(id),
    parent_id   TEXT REFERENCES cost_centres(id),
    is_active   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tax_codes (
    id                       TEXT PRIMARY KEY,
    company_id               TEXT NOT NULL REFERENCES companies(id),
    code                     TEXT NOT NULL UNIQUE,
    name                     TEXT NOT NULL,
    rate_percent             REAL NOT NULL,
    component_cgst_percent   REAL NOT NULL DEFAULT 0,
    component_sgst_percent   REAL NOT NULL DEFAULT 0,
    component_igst_percent   REAL NOT NULL DEFAULT 0,
    is_active                INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS customers (
    id                  TEXT PRIMARY KEY,
    company_id          TEXT NOT NULL REFERENCES companies(id),
    customer_code       TEXT NOT NULL UNIQUE,
    full_name           TEXT NOT NULL,
    company_name        TEXT,
    phone               TEXT NOT NULL,
    email               TEXT,
    pan                 TEXT,
    aadhaar_last4       TEXT,
    gstin               TEXT,
    billing_address     TEXT,
    shipping_address    TEXT,
    vertical_id         TEXT REFERENCES business_verticals(id),
    assigned_crm_user_id TEXT REFERENCES users(id),
    credit_limit_paise  INTEGER NOT NULL DEFAULT 0,
    is_active           INTEGER NOT NULL DEFAULT 1,
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS vendors (
    id                 TEXT PRIMARY KEY,
    company_id         TEXT NOT NULL REFERENCES companies(id),
    vendor_code        TEXT NOT NULL UNIQUE,
    name               TEXT NOT NULL,
    contact_person     TEXT,
    phone              TEXT,
    email              TEXT,
    gstin              TEXT,
    pan                TEXT,
    payment_terms_days INTEGER NOT NULL DEFAULT 30,
    bank_account_name  TEXT,
    bank_account_number TEXT,
    bank_ifsc          TEXT,
    is_active          INTEGER NOT NULL DEFAULT 1,
    created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS material_categories (
    id          TEXT PRIMARY KEY,
    company_id  TEXT NOT NULL REFERENCES companies(id),
    name        TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS materials (
    id                 TEXT PRIMARY KEY,
    company_id         TEXT NOT NULL REFERENCES companies(id),
    category_id        TEXT NOT NULL REFERENCES material_categories(id),
    material_code      TEXT NOT NULL UNIQUE,
    name               TEXT NOT NULL,
    unit_of_measure    TEXT NOT NULL,
    hsn_code           TEXT,
    standard_rate_paise INTEGER NOT NULL DEFAULT 0,
    min_stock_qty      REAL NOT NULL DEFAULT 0,
    is_active          INTEGER NOT NULL DEFAULT 1
);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
    id                      TEXT PRIMARY KEY,
    company_id              TEXT NOT NULL REFERENCES companies(id),
    vertical_id             TEXT NOT NULL REFERENCES business_verticals(id),
    project_code            TEXT NOT NULL UNIQUE,
    name                    TEXT NOT NULL,
    description             TEXT,
    client_id               TEXT REFERENCES customers(id),
    status                  TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ON_HOLD','COMPLETED','CANCELLED')),
    start_date              TEXT,
    target_completion_date  TEXT,
    actual_completion_date  TEXT,
    estimated_budget_paise  INTEGER NOT NULL DEFAULT 0,
    location_address        TEXT,
    location_city           TEXT,
    location_state          TEXT,
    created_by              TEXT NOT NULL REFERENCES users(id),
    created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS project_members (
    project_id      TEXT NOT NULL REFERENCES projects(id),
    user_id         TEXT NOT NULL REFERENCES users(id),
    role_in_project TEXT,
    assigned_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS project_milestones (
    id                  TEXT PRIMARY KEY,
    project_id          TEXT NOT NULL REFERENCES projects(id),
    name                TEXT NOT NULL,
    description         TEXT,
    target_date         TEXT,
    completion_percent  REAL NOT NULL DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'PENDING',
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================================
-- CRM
-- ============================================================

CREATE TABLE IF NOT EXISTS enquiries (
    id                      TEXT PRIMARY KEY,
    company_id              TEXT NOT NULL REFERENCES companies(id),
    vertical_id             TEXT NOT NULL REFERENCES business_verticals(id),
    enquiry_number          TEXT NOT NULL UNIQUE,
    source                  TEXT CHECK (source IN ('WALK_IN','PHONE','WEBSITE','REFERRAL','SOCIAL_MEDIA')),
    customer_name           TEXT NOT NULL,
    phone                   TEXT NOT NULL,
    email                   TEXT,
    requirement_description TEXT,
    budget_paise            INTEGER,
    assigned_to             TEXT REFERENCES users(id),
    lead_score              INTEGER NOT NULL DEFAULT 0,
    status                  TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','CONTACTED','SITE_VISIT_SCHEDULED','SITE_VISIT_DONE','NEGOTIATION','WON','LOST','DROPPED')),
    follow_up_date          TEXT,
    project_id              TEXT REFERENCES projects(id),
    created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS follow_ups (
    id                  TEXT PRIMARY KEY,
    enquiry_id          TEXT NOT NULL REFERENCES enquiries(id),
    user_id             TEXT NOT NULL REFERENCES users(id),
    follow_up_type      TEXT NOT NULL CHECK (follow_up_type IN ('CALL','EMAIL','WHATSAPP','MEETING','SITE_VISIT')),
    notes               TEXT,
    next_follow_up_date TEXT,
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS quotations (
    id                  TEXT PRIMARY KEY,
    company_id          TEXT NOT NULL REFERENCES companies(id),
    enquiry_id          TEXT REFERENCES enquiries(id),
    project_id          TEXT REFERENCES projects(id),
    customer_id         TEXT NOT NULL REFERENCES customers(id),
    quotation_number    TEXT NOT NULL UNIQUE,
    quotation_date      TEXT NOT NULL,
    valid_until         TEXT NOT NULL,
    scope_of_work       TEXT,
    total_amount_paise  INTEGER NOT NULL,
    discount_paise      INTEGER NOT NULL DEFAULT 0,
    tax_amount_paise    INTEGER NOT NULL DEFAULT 0,
    grand_total_paise   INTEGER NOT NULL,
    status              TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED')),
    terms_conditions    TEXT,
    created_by          TEXT NOT NULL REFERENCES users(id),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS quotation_items (
    id             TEXT PRIMARY KEY,
    quotation_id   TEXT NOT NULL REFERENCES quotations(id),
    description    TEXT NOT NULL,
    quantity       REAL NOT NULL,
    unit           TEXT,
    unit_rate_paise INTEGER NOT NULL,
    amount_paise   INTEGER NOT NULL,
    sort_order     INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- LAND DEVELOPMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS land_parcels (
    id                    TEXT PRIMARY KEY,
    company_id            TEXT NOT NULL REFERENCES companies(id),
    project_id            TEXT NOT NULL REFERENCES projects(id),
    survey_number         TEXT NOT NULL UNIQUE,
    village               TEXT,
    taluk                 TEXT,
    district              TEXT,
    total_area_acres      REAL,
    acquisition_cost_paise INTEGER,
    acquisition_date      TEXT,
    status                TEXT NOT NULL DEFAULT 'OWNED' CHECK (status IN ('OWNED','JV','DISPUTED','SOLD')),
    notes                 TEXT,
    created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS jv_agreements (
    id                       TEXT PRIMARY KEY,
    company_id               TEXT NOT NULL REFERENCES companies(id),
    land_parcel_id           TEXT NOT NULL REFERENCES land_parcels(id),
    landowner_name           TEXT NOT NULL,
    landowner_pan            TEXT,
    landowner_phone          TEXT,
    agreement_date           TEXT NOT NULL,
    agreement_number         TEXT NOT NULL,
    our_share_percent        REAL NOT NULL,
    landowner_share_percent  REAL NOT NULL,
    development_cost_sharing TEXT,
    agreement_document_url   TEXT,
    status                   TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS plot_inventory (
    id                       TEXT PRIMARY KEY,
    project_id               TEXT NOT NULL REFERENCES projects(id),
    plot_number              TEXT NOT NULL,
    phase_block              TEXT,
    area_sqft                REAL NOT NULL,
    dimensions               TEXT,
    facing                   TEXT,
    plot_type                TEXT NOT NULL DEFAULT 'RESIDENTIAL' CHECK (plot_type IN ('RESIDENTIAL','COMMERCIAL','CORNER')),
    base_rate_per_sqft_paise INTEGER NOT NULL,
    total_price_paise        INTEGER NOT NULL,
    amenity_charges_paise    INTEGER NOT NULL DEFAULT 0,
    status                   TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','BLOCKED','BOOKED','REGISTERED','CANCELLED')),
    notes                    TEXT,
    UNIQUE (project_id, plot_number)
);

CREATE TABLE IF NOT EXISTS plot_bookings (
    id                  TEXT PRIMARY KEY,
    plot_id             TEXT NOT NULL REFERENCES plot_inventory(id),
    customer_id         TEXT NOT NULL REFERENCES customers(id),
    booking_number      TEXT NOT NULL UNIQUE,
    booking_date        TEXT NOT NULL,
    token_amount_paise  INTEGER NOT NULL,
    agreement_value_paise INTEGER NOT NULL,
    payment_plan        TEXT NOT NULL CHECK (payment_plan IN ('MILESTONE','EMI','LUMP_SUM')),
    status              TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','AGREEMENT_SIGNED','REGISTERED','CANCELLED')),
    booked_by           TEXT NOT NULL REFERENCES users(id),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_plot_bookings_active ON plot_bookings(plot_id) WHERE status NOT IN ('CANCELLED');

-- ============================================================
-- ACCOUNTING (defined before plot_instalments & contractor_bills)
-- ============================================================

CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id                   TEXT PRIMARY KEY,
    company_id           TEXT NOT NULL REFERENCES companies(id),
    account_code         TEXT NOT NULL UNIQUE,
    name                 TEXT NOT NULL,
    account_type         TEXT NOT NULL CHECK (account_type IN ('ASSET','LIABILITY','EQUITY','INCOME','EXPENSE')),
    account_group        TEXT,
    sub_group            TEXT,
    parent_account_id    TEXT REFERENCES chart_of_accounts(id),
    is_control_account   INTEGER NOT NULL DEFAULT 0,
    is_bank_account      INTEGER NOT NULL DEFAULT 0,
    bank_name            TEXT,
    bank_account_number  TEXT,
    opening_balance_paise INTEGER NOT NULL DEFAULT 0,
    is_active            INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS vouchers (
    id               TEXT PRIMARY KEY,
    company_id       TEXT NOT NULL REFERENCES companies(id),
    vertical_id      TEXT NOT NULL REFERENCES business_verticals(id),
    project_id       TEXT REFERENCES projects(id),
    cost_centre_id   TEXT REFERENCES cost_centres(id),
    voucher_number   TEXT NOT NULL UNIQUE,
    voucher_type     TEXT NOT NULL CHECK (voucher_type IN ('RECEIPT','PAYMENT','CONTRA','JOURNAL','SALES_INVOICE','PURCHASE_BILL','CONTRACTOR_BILL','CREDIT_NOTE','DEBIT_NOTE')),
    voucher_date     TEXT NOT NULL,
    narration        TEXT NOT NULL,
    total_debit_paise  INTEGER NOT NULL,
    total_credit_paise INTEGER NOT NULL,
    status           TEXT NOT NULL DEFAULT 'POSTED' CHECK (status IN ('DRAFT','POSTED','CANCELLED')),
    idempotency_key  TEXT NOT NULL UNIQUE,
    created_by       TEXT NOT NULL REFERENCES users(id),
    created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    CHECK (total_debit_paise = total_credit_paise)
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id           TEXT PRIMARY KEY,
    voucher_id   TEXT NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
    account_id   TEXT NOT NULL REFERENCES chart_of_accounts(id),
    debit_paise  INTEGER NOT NULL DEFAULT 0,
    credit_paise INTEGER NOT NULL DEFAULT 0,
    CHECK ((debit_paise > 0 AND credit_paise = 0) OR (credit_paise > 0 AND debit_paise = 0))
);

CREATE TABLE IF NOT EXISTS bank_reconciliation (
    id                       TEXT PRIMARY KEY,
    account_id               TEXT NOT NULL REFERENCES chart_of_accounts(id),
    company_id               TEXT NOT NULL REFERENCES companies(id),
    statement_date           TEXT NOT NULL,
    bank_closing_balance_paise INTEGER NOT NULL,
    book_closing_balance_paise INTEGER NOT NULL,
    reconciled_by            TEXT NOT NULL REFERENCES users(id),
    created_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================================
-- LAND DEVELOPMENT (continued — depends on vouchers)
-- ============================================================

CREATE TABLE IF NOT EXISTS plot_instalments (
    id                TEXT PRIMARY KEY,
    booking_id        TEXT NOT NULL REFERENCES plot_bookings(id),
    instalment_number INTEGER NOT NULL,
    due_date          TEXT NOT NULL,
    amount_paise      INTEGER NOT NULL,
    description       TEXT,
    status            TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','OVERDUE')),
    paid_date         TEXT,
    voucher_id        TEXT REFERENCES vouchers(id)
);

CREATE TABLE IF NOT EXISTS sale_agreements (
    id                      TEXT PRIMARY KEY,
    booking_id              TEXT NOT NULL UNIQUE REFERENCES plot_bookings(id),
    agreement_number        TEXT NOT NULL UNIQUE,
    agreement_date          TEXT NOT NULL,
    registration_date       TEXT,
    registration_number     TEXT,
    stamp_duty_paise        INTEGER NOT NULL DEFAULT 0,
    registration_charges_paise INTEGER NOT NULL DEFAULT 0,
    document_url            TEXT,
    created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================================
-- CONSTRUCTION
-- ============================================================

CREATE TABLE IF NOT EXISTS boq_items (
    id          TEXT PRIMARY KEY,
    project_id  TEXT NOT NULL REFERENCES projects(id),
    work_package TEXT NOT NULL,
    description TEXT NOT NULL,
    unit        TEXT NOT NULL,
    quantity    REAL NOT NULL,
    rate_paise  INTEGER NOT NULL,
    amount_paise INTEGER NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS work_packages (
    id                 TEXT PRIMARY KEY,
    project_id         TEXT NOT NULL REFERENCES projects(id),
    parent_id          TEXT REFERENCES work_packages(id),
    code               TEXT NOT NULL,
    name               TEXT NOT NULL,
    status             TEXT NOT NULL DEFAULT 'NOT_STARTED',
    planned_start      TEXT,
    planned_end        TEXT,
    actual_start       TEXT,
    actual_end         TEXT,
    completion_percent REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS daily_progress_reports (
    id                       TEXT PRIMARY KEY,
    project_id               TEXT NOT NULL REFERENCES projects(id),
    report_date              TEXT NOT NULL,
    weather                  TEXT,
    overall_progress_percent REAL,
    summary                  TEXT,
    submitted_by             TEXT NOT NULL REFERENCES users(id),
    status                   TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','APPROVED')),
    created_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (project_id, report_date)
);

CREATE TABLE IF NOT EXISTS dpr_work_items (
    id               TEXT PRIMARY KEY,
    dpr_id           TEXT NOT NULL REFERENCES daily_progress_reports(id),
    work_package_id  TEXT NOT NULL REFERENCES work_packages(id),
    description      TEXT,
    qty_today        REAL,
    qty_cumulative   REAL,
    unit             TEXT,
    remarks          TEXT
);

CREATE TABLE IF NOT EXISTS labour_attendance (
    id                  TEXT PRIMARY KEY,
    project_id          TEXT NOT NULL REFERENCES projects(id),
    attendance_date     TEXT NOT NULL,
    trade_category      TEXT NOT NULL CHECK (trade_category IN ('MASON','CARPENTER','ELECTRICIAN','PLUMBER','HELPER','SUPERVISOR')),
    contractor_name     TEXT NOT NULL,
    count_present       INTEGER NOT NULL,
    wages_per_day_paise INTEGER NOT NULL,
    total_wages_paise   INTEGER NOT NULL,
    created_by          TEXT NOT NULL REFERENCES users(id),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (project_id, attendance_date, trade_category, contractor_name)
);

CREATE TABLE IF NOT EXISTS contractors (
    id             TEXT PRIMARY KEY,
    company_id     TEXT NOT NULL REFERENCES companies(id),
    name           TEXT NOT NULL,
    contact_person TEXT,
    phone          TEXT,
    email          TEXT,
    gstin          TEXT,
    pan            TEXT,
    specialization TEXT,
    is_active      INTEGER NOT NULL DEFAULT 1,
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS contractor_measurement_sheets (
    id             TEXT PRIMARY KEY,
    project_id     TEXT NOT NULL REFERENCES projects(id),
    contractor_id  TEXT NOT NULL REFERENCES contractors(id),
    ms_number      TEXT NOT NULL UNIQUE,
    ms_date        TEXT NOT NULL,
    period_from    TEXT NOT NULL,
    period_to      TEXT NOT NULL,
    total_amount_paise INTEGER NOT NULL,
    status         TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','BILLED')),
    submitted_by   TEXT NOT NULL REFERENCES users(id),
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS cms_line_items (
    id           TEXT PRIMARY KEY,
    cms_id       TEXT NOT NULL REFERENCES contractor_measurement_sheets(id),
    boq_item_id  TEXT REFERENCES boq_items(id),
    description  TEXT NOT NULL,
    unit         TEXT NOT NULL,
    quantity     REAL NOT NULL,
    rate_paise   INTEGER NOT NULL,
    amount_paise INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS contractor_bills (
    id                TEXT PRIMARY KEY,
    cms_id            TEXT NOT NULL REFERENCES contractor_measurement_sheets(id),
    project_id        TEXT NOT NULL REFERENCES projects(id),
    contractor_id     TEXT NOT NULL REFERENCES contractors(id),
    bill_number       TEXT NOT NULL UNIQUE,
    bill_date         TEXT NOT NULL,
    gross_amount_paise INTEGER NOT NULL,
    tds_percent       REAL NOT NULL DEFAULT 0,
    tds_amount_paise  INTEGER NOT NULL DEFAULT 0,
    retention_paise   INTEGER NOT NULL DEFAULT 0,
    net_payable_paise INTEGER NOT NULL,
    voucher_id        TEXT REFERENCES vouchers(id),
    status            TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','PAID','CANCELLED')),
    created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================================
-- INTERIORS
-- ============================================================

CREATE TABLE IF NOT EXISTS interior_projects (
    id                        TEXT PRIMARY KEY,
    project_id                TEXT NOT NULL UNIQUE REFERENCES projects(id),
    scope_description         TEXT,
    design_style              TEXT,
    total_contract_value_paise INTEGER NOT NULL,
    advance_paid_paise        INTEGER NOT NULL DEFAULT 0,
    status                    TEXT NOT NULL DEFAULT 'DESIGN_PHASE' CHECK (status IN ('DESIGN_PHASE','EXECUTION_PHASE','PUNCH_LIST','COMPLETED')),
    site_measurement_done     INTEGER NOT NULL DEFAULT 0,
    created_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS design_revisions (
    id                TEXT PRIMARY KEY,
    project_id        TEXT NOT NULL REFERENCES projects(id),
    revision_number   INTEGER NOT NULL,
    description       TEXT,
    created_by        TEXT NOT NULL REFERENCES users(id),
    customer_approved INTEGER NOT NULL DEFAULT 0,
    approval_date     TEXT,
    document_url      TEXT,
    created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (project_id, revision_number)
);

CREATE TABLE IF NOT EXISTS change_orders (
    id                  TEXT PRIMARY KEY,
    project_id          TEXT NOT NULL REFERENCES projects(id),
    co_number           TEXT NOT NULL UNIQUE,
    description         TEXT NOT NULL,
    reason              TEXT,
    amount_change_paise INTEGER NOT NULL,
    approved_by         TEXT REFERENCES users(id),
    status              TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================================
-- PROCUREMENT & INVENTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS material_requisitions (
    id             TEXT PRIMARY KEY,
    project_id     TEXT NOT NULL REFERENCES projects(id),
    mr_number      TEXT NOT NULL UNIQUE,
    requested_by   TEXT NOT NULL REFERENCES users(id),
    required_date  TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','APPROVED','PO_CREATED','FULFILLED')),
    approved_by    TEXT REFERENCES users(id),
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS mr_items (
    id                TEXT PRIMARY KEY,
    mr_id             TEXT NOT NULL REFERENCES material_requisitions(id),
    material_id       TEXT NOT NULL REFERENCES materials(id),
    quantity_required REAL NOT NULL,
    quantity_approved REAL NOT NULL DEFAULT 0,
    unit              TEXT NOT NULL,
    remarks           TEXT
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id                    TEXT PRIMARY KEY,
    company_id            TEXT NOT NULL REFERENCES companies(id),
    mr_id                 TEXT REFERENCES material_requisitions(id),
    vendor_id             TEXT NOT NULL REFERENCES vendors(id),
    po_number             TEXT NOT NULL UNIQUE,
    po_date               TEXT NOT NULL,
    expected_delivery_date TEXT,
    project_id            TEXT REFERENCES projects(id),
    status                TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SENT','PARTIAL_RECEIVED','RECEIVED','CANCELLED')),
    payment_terms         TEXT,
    total_amount_paise    INTEGER NOT NULL,
    approved_by           TEXT REFERENCES users(id),
    created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS po_items (
    id             TEXT PRIMARY KEY,
    po_id          TEXT NOT NULL REFERENCES purchase_orders(id),
    material_id    TEXT NOT NULL REFERENCES materials(id),
    mr_item_id     TEXT REFERENCES mr_items(id),
    description    TEXT,
    quantity       REAL NOT NULL,
    unit           TEXT NOT NULL,
    unit_rate_paise INTEGER NOT NULL,
    tax_code_id    TEXT REFERENCES tax_codes(id),
    tax_amount_paise INTEGER NOT NULL DEFAULT 0,
    total_paise    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS goods_receipt_notes (
    id                 TEXT PRIMARY KEY,
    po_id              TEXT NOT NULL REFERENCES purchase_orders(id),
    grn_number         TEXT NOT NULL UNIQUE,
    grn_date           TEXT NOT NULL,
    received_by        TEXT NOT NULL REFERENCES users(id),
    vehicle_number     TEXT,
    supplier_dc_number TEXT,
    status             TEXT NOT NULL DEFAULT 'PENDING_QC' CHECK (status IN ('PENDING_QC','ACCEPTED','PARTIALLY_ACCEPTED','REJECTED')),
    created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS grn_items (
    id                TEXT PRIMARY KEY,
    grn_id            TEXT NOT NULL REFERENCES goods_receipt_notes(id),
    po_item_id        TEXT NOT NULL REFERENCES po_items(id),
    quantity_received REAL NOT NULL,
    quantity_accepted REAL NOT NULL,
    quantity_rejected REAL NOT NULL DEFAULT 0,
    rejection_reason  TEXT
);

CREATE TABLE IF NOT EXISTS stock_ledger (
    id               TEXT PRIMARY KEY,
    company_id       TEXT NOT NULL REFERENCES companies(id),
    material_id      TEXT NOT NULL REFERENCES materials(id),
    project_id       TEXT REFERENCES projects(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('GRN','ISSUE','RETURN','ADJUSTMENT')),
    reference_id     TEXT NOT NULL,
    reference_type   TEXT NOT NULL,
    quantity_in      REAL NOT NULL DEFAULT 0,
    quantity_out     REAL NOT NULL DEFAULT 0,
    balance_qty      REAL NOT NULL,
    transaction_date TEXT NOT NULL,
    created_by       TEXT NOT NULL REFERENCES users(id),
    created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================================
-- HR & PAYROLL
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
    id          TEXT PRIMARY KEY,
    company_id  TEXT NOT NULL REFERENCES companies(id),
    name        TEXT NOT NULL UNIQUE,
    vertical_id TEXT REFERENCES business_verticals(id)
);

CREATE TABLE IF NOT EXISTS employees (
    id                     TEXT PRIMARY KEY,
    company_id             TEXT NOT NULL REFERENCES companies(id),
    user_id                TEXT REFERENCES users(id),
    employee_code          TEXT NOT NULL UNIQUE,
    full_name              TEXT NOT NULL,
    phone                  TEXT,
    email                  TEXT NOT NULL UNIQUE,
    department_id          TEXT NOT NULL REFERENCES departments(id),
    designation            TEXT,
    date_of_joining        TEXT NOT NULL,
    date_of_leaving        TEXT,
    employment_type        TEXT NOT NULL CHECK (employment_type IN ('PERMANENT','CONTRACT','PROBATION')),
    pan                    TEXT,
    aadhaar_last4          TEXT,
    bank_account_number    TEXT,
    bank_ifsc              TEXT,
    basic_salary_paise     INTEGER NOT NULL,
    hra_paise              INTEGER NOT NULL DEFAULT 0,
    other_allowances_paise INTEGER NOT NULL DEFAULT 0,
    pf_applicable          INTEGER NOT NULL DEFAULT 1,
    is_active              INTEGER NOT NULL DEFAULT 1,
    created_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS leave_types (
    id             TEXT PRIMARY KEY,
    company_id     TEXT NOT NULL REFERENCES companies(id),
    code           TEXT NOT NULL UNIQUE,
    name           TEXT NOT NULL,
    days_per_year  INTEGER NOT NULL,
    is_paid        INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id             TEXT PRIMARY KEY,
    employee_id    TEXT NOT NULL REFERENCES employees(id),
    leave_type_id  TEXT NOT NULL REFERENCES leave_types(id),
    from_date      TEXT NOT NULL,
    to_date        TEXT NOT NULL,
    days           REAL NOT NULL,
    reason         TEXT,
    status         TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
    approved_by    TEXT REFERENCES users(id),
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS shift_attendance (
    id              TEXT PRIMARY KEY,
    employee_id     TEXT NOT NULL REFERENCES employees(id),
    attendance_date TEXT NOT NULL,
    check_in_time   TEXT,
    check_out_time  TEXT,
    status          TEXT NOT NULL CHECK (status IN ('PRESENT','ABSENT','HALF_DAY','LEAVE','HOLIDAY')),
    overtime_hours  REAL NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (employee_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS payroll_runs (
    id             TEXT PRIMARY KEY,
    company_id     TEXT NOT NULL REFERENCES companies(id),
    payroll_month  TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PROCESSED','APPROVED','DISBURSED')),
    processed_by   TEXT NOT NULL REFERENCES users(id),
    approved_by    TEXT REFERENCES users(id),
    voucher_id     TEXT REFERENCES vouchers(id),
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (company_id, payroll_month)
);

CREATE TABLE IF NOT EXISTS payroll_entries (
    id                     TEXT PRIMARY KEY,
    payroll_run_id         TEXT NOT NULL REFERENCES payroll_runs(id),
    employee_id            TEXT NOT NULL REFERENCES employees(id),
    working_days           INTEGER NOT NULL,
    present_days           INTEGER NOT NULL,
    basic_paise            INTEGER NOT NULL,
    hra_paise              INTEGER NOT NULL,
    other_allowances_paise INTEGER NOT NULL,
    gross_paise            INTEGER NOT NULL,
    pf_employee_paise      INTEGER NOT NULL DEFAULT 0,
    pf_employer_paise      INTEGER NOT NULL DEFAULT 0,
    tds_paise              INTEGER NOT NULL DEFAULT 0,
    other_deductions_paise INTEGER NOT NULL DEFAULT 0,
    net_paise              INTEGER NOT NULL,
    created_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (payroll_run_id, employee_id)
);

-- ============================================================
-- DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS document_folders (
    id          TEXT PRIMARY KEY,
    company_id  TEXT NOT NULL REFERENCES companies(id),
    name        TEXT NOT NULL,
    parent_id   TEXT REFERENCES document_folders(id),
    project_id  TEXT REFERENCES projects(id),
    vertical_id TEXT REFERENCES business_verticals(id),
    created_by  TEXT NOT NULL REFERENCES users(id),
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS documents (
    id                 TEXT PRIMARY KEY,
    folder_id          TEXT NOT NULL REFERENCES document_folders(id),
    company_id         TEXT NOT NULL REFERENCES companies(id),
    project_id         TEXT REFERENCES projects(id),
    file_name          TEXT NOT NULL,
    original_name      TEXT NOT NULL,
    file_size_bytes    INTEGER NOT NULL,
    mime_type          TEXT NOT NULL,
    storage_path       TEXT NOT NULL UNIQUE,
    version            INTEGER NOT NULL DEFAULT 1,
    parent_document_id TEXT REFERENCES documents(id),
    tags               TEXT,
    uploaded_by        TEXT NOT NULL REFERENCES users(id),
    created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(company_id, voucher_date);
CREATE INDEX IF NOT EXISTS idx_ledger_account ON ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(company_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_vertical ON projects(vertical_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_material ON stock_ledger(material_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON shift_attendance(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_instalments_booking ON plot_instalments(booking_id, status);
