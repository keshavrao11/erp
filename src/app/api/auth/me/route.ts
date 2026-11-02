import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/connection';
import { getAllowedModulesForUser } from '@/lib/auth/rbac';

export async function GET() {
  const session = await getSession();
  
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Get user details, custom SaaS module overrides, org & dashboard preference
  let deptCode = session.departmentCode;
  let deptName = session.departmentName;
  let orgName = 'Proficient Transforms HQ';
  let defaultDashboard = 'DASHBOARD';
  let customModules: string[] | null = null;

  if (session.userId) {
    const userRow = db.prepare(`
      SELECT u.custom_modules, u.org_name, u.default_dashboard,
             d.code as department_code, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id
      WHERE u.id = ?
    `).get(session.userId) as any;
    if (userRow) {
      if (userRow.department_code) deptCode = userRow.department_code;
      if (userRow.department_name) deptName = userRow.department_name;
      if (userRow.org_name) orgName = userRow.org_name;
      if (userRow.default_dashboard) defaultDashboard = userRow.default_dashboard;
      if (userRow.custom_modules) {
        try {
          const parsed = JSON.parse(userRow.custom_modules);
          if (Array.isArray(parsed) && parsed.length > 0) {
            customModules = parsed;
          }
        } catch {}
      }
    }
  }

  const baseAllowed = getAllowedModulesForUser(
    session.roles,
    deptCode,
    session.activeDepartmentOverride
  );

  const allowedModules = (customModules && (!session.roles.includes('SUPER_ADMIN') || (session.activeDepartmentOverride && session.activeDepartmentOverride !== 'ALL')))
    ? customModules
    : baseAllowed;

  return NextResponse.json({
    userId: session.userId,
    username: session.username,
    fullName: session.fullName,
    email: session.email,
    roles: session.roles,
    departmentCode: deptCode || 'OPERATIONS',
    departmentName: deptName || 'Operations & Projects',
    activeDepartment: session.activeDepartmentOverride || 'ALL',
    orgName,
    defaultDashboard,
    customModules,
    allowedModules,
  });
}
