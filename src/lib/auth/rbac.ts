import { db } from '../db/connection';
import { getSession } from './session';
import { NextRequest, NextResponse } from 'next/server';
import { SessionData } from './session';
import crypto from 'crypto';
import {
  ActionCode,
  ModuleCode,
  ALL_MODULES,
  DEPARTMENT_MODULE_MAP,
  getAllowedModulesForUser,
} from './constants';

export * from './constants';

export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

// Check if user has permission via DB
export function checkPermission(
  userId: string,
  module: ModuleCode,
  action: ActionCode,
  verticalId?: string
): boolean {
  // Super admin bypass
  const isSuperAdmin = db.prepare(`
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ? AND r.code = 'SUPER_ADMIN'
  `).get(userId);
  if (isSuperAdmin) return true;

  // Check role_permissions
  const perm = db.prepare(`
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    WHERE ur.user_id = ?
      AND rp.module_code = ?
      AND rp.action_code = ?
      AND (rp.vertical_id IS NULL OR rp.vertical_id = ?)
  `).get(userId, module, action, verticalId || null);
  
  return !!perm;
}

// Record an audit log entry in SQLite
export function recordAuditLog(params: {
  companyId?: string;
  tableName: string;
  action: string;
  recordId: string;
  changedBy: string;
  department?: string;
  details?: any;
}) {
  try {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, module_code, entity_table, entity_id, new_values)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.changedBy,
      params.action,
      params.department || 'GENERAL',
      params.tableName,
      params.recordId,
      params.details ? JSON.stringify(params.details) : null
    );
  } catch (err) {
    console.error('[Audit Log Error]', err);
  }
}

// Server-side auth guard for API routes
export async function requireAuth(
  req: NextRequest,
  module: ModuleCode,
  action: ActionCode,
  verticalId?: string
): Promise<{ session: SessionData }> {
  const session = await getSession();

  // If user is not logged in, enforce 401
  if (!session.isLoggedIn || !session.userId) {
    throw new HttpError(401, 'Unauthorized: Please log into Proficient ERP');
  }

  // Super Admin has full authorization
  if (session.roles?.includes('SUPER_ADMIN')) {
    return { session };
  }

  const allowed = checkPermission(session.userId, module, action, verticalId);
  if (!allowed) {
    throw new HttpError(403, `Forbidden: Department role (${session.departmentCode || session.roles?.[0]}) does not have ${action} permission on ${module}`);
  }

  return { session };
}

// Helper to wrap API route handlers with error handling
export function withErrorHandler(
  handler: (req: NextRequest, ctx?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx?: any): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.statusCode });
      }
      console.error('[API Error]', err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
