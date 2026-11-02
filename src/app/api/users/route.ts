import { NextRequest, NextResponse } from 'next/server';
import { db, runInTransaction } from '@/lib/db/connection';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import argon2 from 'argon2';
import crypto from 'crypto';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'USERS', 'VIEW');
  const users = db.prepare(`
    SELECT u.id, u.username, u.email, u.full_name, u.is_active, u.last_login_at, u.created_at,
           u.department_id, u.role_id,
           d.name as department_name, d.code as department_code,
           r.name as role_name, r.code as role_code,
           GROUP_CONCAT(r.name, ', ') as roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id OR r.id = u.role_id
    LEFT JOIN departments d ON d.id = u.department_id
    WHERE u.company_id = ?
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all(session.companyId);

  const roles = db.prepare(`SELECT id, code, name FROM roles ORDER BY name`).all();
  const departments = db.prepare(`SELECT id, code, name FROM departments ORDER BY name`).all();

  return NextResponse.json({ users, roles, departments });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'USERS', 'CREATE');
  const body = await req.json();

  if (!body.username || !body.fullName || !body.email || !body.password) {
    return NextResponse.json({ error: 'Username, Full Name, Email, and Password required' }, { status: 400 });
  }

  const existing = db.prepare(`SELECT id FROM users WHERE username = ? OR email = ?`).get(body.username, body.email);
  if (existing) {
    return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
  }

  const userId = crypto.randomUUID();
  const hash = await argon2.hash(body.password);

  // Pick first role & dept if not provided
  let roleId = body.roleId;
  if (!roleId) {
    const r = db.prepare(`SELECT id FROM roles WHERE code = 'CRM' LIMIT 1`).get() as any;
    roleId = r?.id;
  }

  let departmentId = body.departmentId;
  if (!departmentId) {
    const d = db.prepare(`SELECT id FROM departments WHERE code = 'SALES' LIMIT 1`).get() as any;
    departmentId = d?.id;
  }

  runInTransaction((tx) => {
    tx.prepare(`
      INSERT INTO users (id, company_id, username, email, full_name, phone, password_hash, department_id, role_id, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    `).run(userId, session.companyId, body.username, body.email, body.fullName, body.phone || null, hash, departmentId, roleId);

    tx.prepare(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`).run(userId, roleId);
  });

  return NextResponse.json({ id: userId, success: true }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'USERS', 'EDIT');
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  if (body.isActive !== undefined) {
    db.prepare(`UPDATE users SET is_active = ? WHERE id = ?`).run(body.isActive ? 1 : 0, body.id);
  }

  if (body.departmentId) {
    db.prepare(`UPDATE users SET department_id = ? WHERE id = ?`).run(body.departmentId, body.id);
  }

  if (body.roleId) {
    db.prepare(`UPDATE users SET role_id = ? WHERE id = ?`).run(body.roleId, body.id);
    db.prepare(`DELETE FROM user_roles WHERE user_id = ?`).run(body.id);
    db.prepare(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`).run(body.id, body.roleId);
  }

  return NextResponse.json({ success: true });
});
