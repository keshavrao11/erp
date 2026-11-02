import { db, runInTransaction } from './connection';
import argon2 from 'argon2';
import crypto from 'crypto';

export async function migrateDepartmentsAndRBAC() {
  console.log('--- Starting Department & RBAC Migration ---');

  // 1. Check if department_id, role_id, custom_modules, org_name exist in users table
  const userCols = db.prepare('PRAGMA table_info(users)').all().map((c: any) => c.name);
  if (!userCols.includes('department_id')) {
    console.log('Adding department_id to users...');
    db.prepare('ALTER TABLE users ADD COLUMN department_id TEXT REFERENCES departments(id)').run();
  }
  if (!userCols.includes('role_id')) {
    console.log('Adding role_id to users...');
    db.prepare('ALTER TABLE users ADD COLUMN role_id TEXT REFERENCES roles(id)').run();
  }
  if (!userCols.includes('custom_modules')) {
    console.log('Adding custom_modules to users...');
    db.prepare('ALTER TABLE users ADD COLUMN custom_modules TEXT').run();
  }
  if (!userCols.includes('org_name')) {
    console.log('Adding org_name to users...');
    db.prepare("ALTER TABLE users ADD COLUMN org_name TEXT DEFAULT 'Proficient Transforms HQ'").run();
  }
  if (!userCols.includes('default_dashboard')) {
    console.log('Adding default_dashboard to users...');
    db.prepare("ALTER TABLE users ADD COLUMN default_dashboard TEXT DEFAULT 'DASHBOARD'").run();
  }

  // 2. Check if code column exists in departments
  const deptCols = db.prepare('PRAGMA table_info(departments)').all().map((c: any) => c.name);
  if (!deptCols.includes('code')) {
    console.log('Adding code to departments...');
    db.prepare('ALTER TABLE departments ADD COLUMN code TEXT').run();
  }

  // Get company ID
  const company = db.prepare('SELECT id FROM companies LIMIT 1').get() as any;
  const companyId = company ? company.id : '50360ab3-f112-401e-951f-b1fb5b1a00e4';

  // 3. Populate 6 Core Departments
  const departmentsData = [
    { code: 'SALES', name: 'Sales & Business Development', id: 'd1000000-0000-0000-0000-000000000001' },
    { code: 'PURCHASE', name: 'Procurement & Purchase', id: 'd2000000-0000-0000-0000-000000000002' },
    { code: 'ACCOUNTS', name: 'Finance & Accounts', id: 'd3000000-0000-0000-0000-000000000003' },
    { code: 'HR', name: 'Human Resources & Payroll', id: 'd4000000-0000-0000-0000-000000000004' },
    { code: 'INVENTORY', name: 'Warehouse & Inventory', id: 'd5000000-0000-0000-0000-000000000005' },
    { code: 'OPERATIONS', name: 'Site Operations & Projects', id: 'd6000000-0000-0000-0000-000000000006' },
  ];

  for (const dept of departmentsData) {
    const existing = db.prepare('SELECT id FROM departments WHERE code = ? OR name = ?').get(dept.code, dept.name) as any;
    if (existing) {
      db.prepare('UPDATE departments SET code = ?, name = ? WHERE id = ?').run(dept.code, dept.name, existing.id);
    } else {
      db.prepare('INSERT INTO departments (id, company_id, code, name) VALUES (?, ?, ?, ?)').run(
        dept.id,
        companyId,
        dept.code,
        dept.name
      );
    }
  }

  // 4. Ensure Roles exist
  const rolesData = [
    { code: 'SUPER_ADMIN', name: 'Super Administrator', id: 'r0000000-0000-0000-0000-000000000000' },
    { code: 'CRM', name: 'Sales & CRM Specialist', id: 'r1000000-0000-0000-0000-000000000001' },
    { code: 'PURCHASE_EXECUTIVE', name: 'Purchase & Procurement Manager', id: 'r2000000-0000-0000-0000-000000000002' },
    { code: 'ACCOUNTANT', name: 'Chief Financial Accountant', id: 'r3000000-0000-0000-0000-000000000003' },
    { code: 'HR_ADMIN', name: 'HR & Payroll Administrator', id: 'r4000000-0000-0000-0000-000000000004' },
    { code: 'INVENTORY_MANAGER', name: 'Warehouse & Stores Manager', id: 'r5000000-0000-0000-0000-000000000005' },
    { code: 'PROJECT_MANAGER', name: 'Operations & Project Manager', id: 'r6000000-0000-0000-0000-000000000006' },
  ];

  for (const r of rolesData) {
    const existing = db.prepare('SELECT id FROM roles WHERE code = ?').get(r.code) as any;
    if (!existing) {
      db.prepare('INSERT INTO roles (id, code, name) VALUES (?, ?, ?)').run(r.id, r.code, r.name);
    }
  }

  // 5. Seed Department Users with Hashed Passwords
  const usersToSeed = [
    {
      username: 'admin',
      password: 'admin123',
      fullName: 'Super Administrator',
      email: 'admin@proficienterp.com',
      roleCode: 'SUPER_ADMIN',
      deptCode: 'OPERATIONS',
    },
    {
      username: 'sales_user',
      password: 'sales123',
      fullName: 'Vikram Mehta (Sales Lead)',
      email: 'sales@proficienterp.com',
      roleCode: 'CRM',
      deptCode: 'SALES',
    },
    {
      username: 'purchase_user',
      password: 'purchase123',
      fullName: 'Ananya Roy (Purchase Exec)',
      email: 'purchase@proficienterp.com',
      roleCode: 'PURCHASE_EXECUTIVE',
      deptCode: 'PURCHASE',
    },
    {
      username: 'accounts_user',
      password: 'accounts123',
      fullName: 'Ramesh Kulkarni (Accountant)',
      email: 'accounts@proficienterp.com',
      roleCode: 'ACCOUNTANT',
      deptCode: 'ACCOUNTS',
    },
    {
      username: 'hr_user',
      password: 'hr123',
      fullName: 'Pooja Hegde (HR Admin)',
      email: 'hr@proficienterp.com',
      roleCode: 'HR_ADMIN',
      deptCode: 'HR',
    },
    {
      username: 'inventory_user',
      password: 'inventory123',
      fullName: 'Suresh Kumar (Stores Manager)',
      email: 'inventory@proficienterp.com',
      roleCode: 'INVENTORY_MANAGER',
      deptCode: 'INVENTORY',
    },
    {
      username: 'ops_user',
      password: 'ops123',
      fullName: 'Rajesh Nair (Operations Head)',
      email: 'ops@proficienterp.com',
      roleCode: 'PROJECT_MANAGER',
      deptCode: 'OPERATIONS',
    },
  ];

  for (const u of usersToSeed) {
    const hash = await argon2.hash(u.password);
    const roleRow = db.prepare('SELECT id FROM roles WHERE code = ?').get(u.roleCode) as any;
    const deptRow = db.prepare('SELECT id FROM departments WHERE code = ?').get(u.deptCode) as any;

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(u.username) as any;

    if (existingUser) {
      db.prepare(`
        UPDATE users 
        SET password_hash = ?, full_name = ?, email = ?, department_id = ?, role_id = ?, is_active = 1
        WHERE id = ?
      `).run(hash, u.fullName, u.email, deptRow?.id || null, roleRow?.id || null, existingUser.id);

      // Ensure user_roles has record
      db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(existingUser.id);
      db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(existingUser.id, roleRow.id);
    } else {
      const newUserId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO users (id, company_id, username, email, full_name, password_hash, department_id, role_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(newUserId, companyId, u.username, u.email, u.fullName, hash, deptRow?.id || null, roleRow?.id || null);

      db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(newUserId, roleRow.id);
    }
  }

  // 6. Role Permissions Matrix
  const rolePermissions: Record<string, string[]> = {
    SUPER_ADMIN: [
      'DASHBOARD', 'CRM', 'PROJECTS', 'CONSTRUCTION', 'INTERIORS',
      'LAND_DEVELOPMENT', 'PROCUREMENT', 'INVENTORY', 'ACCOUNTS', 'HR',
      'REPORTS', 'DOCUMENTS', 'MASTERS', 'USERS', 'SETTINGS'
    ],
    CRM: ['DASHBOARD', 'CRM', 'MASTERS', 'DOCUMENTS'],
    PURCHASE_EXECUTIVE: ['DASHBOARD', 'PROCUREMENT', 'MASTERS', 'DOCUMENTS'],
    ACCOUNTANT: ['DASHBOARD', 'ACCOUNTS', 'REPORTS', 'MASTERS', 'DOCUMENTS'],
    HR_ADMIN: ['DASHBOARD', 'HR', 'USERS', 'DOCUMENTS'],
    INVENTORY_MANAGER: ['DASHBOARD', 'INVENTORY', 'MASTERS', 'DOCUMENTS'],
    PROJECT_MANAGER: ['DASHBOARD', 'PROJECTS', 'CONSTRUCTION', 'INTERIORS', 'LAND_DEVELOPMENT', 'DOCUMENTS'],
  };

  const actions = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT'];

  for (const [roleCode, modules] of Object.entries(rolePermissions)) {
    const roleRow = db.prepare('SELECT id FROM roles WHERE code = ?').get(roleCode) as any;
    if (!roleRow) continue;

    for (const mod of modules) {
      for (const act of actions) {
        const permId = crypto.randomUUID();
        const existing = db.prepare(`
          SELECT id FROM role_permissions 
          WHERE role_id = ? AND module_code = ? AND action_code = ?
        `).get(roleRow.id, mod, act);

        if (!existing) {
          db.prepare(`
            INSERT INTO role_permissions (id, role_id, module_code, action_code)
            VALUES (?, ?, ?, ?)
          `).run(permId, roleRow.id, mod, act);
        }
      }
    }
  }

  console.log('--- Department & RBAC Migration Completed Successfully ---');
}

migrateDepartmentsAndRBAC().catch(console.error);

