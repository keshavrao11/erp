import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/connection';
import { getAllowedModulesForUser } from '@/lib/auth/rbac';

export async function GET() {
  const session = await getSession();
  
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Get department info if not in session
  let deptCode = session.departmentCode;
  let deptName = session.departmentName;

  if (!deptCode && session.userId) {
    const userRow = db.prepare(`
      SELECT d.code as department_code, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id
      WHERE u.id = ?
    `).get(session.userId) as any;
    if (userRow) {
      deptCode = userRow.department_code;
      deptName = userRow.department_name;
    }
  }

  const allowedModules = getAllowedModulesForUser(
    session.roles,
    deptCode,
    session.activeDepartmentOverride
  );

  return NextResponse.json({
    userId: session.userId,
    username: session.username,
    fullName: session.fullName,
    email: session.email,
    roles: session.roles,
    departmentCode: deptCode || 'OPERATIONS',
    departmentName: deptName || 'Operations & Projects',
    activeDepartment: session.activeDepartmentOverride || 'ALL',
    allowedModules,
  });
}
