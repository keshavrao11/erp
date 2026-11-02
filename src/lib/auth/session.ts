import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export interface SessionData {
  userId: string;
  username: string;
  fullName: string;
  email: string;
  companyId: string;
  roles: string[]; // role codes
  departmentId?: string;
  departmentCode?: string;
  departmentName?: string;
  activeDepartmentOverride?: string; // For Super Admin view switching ('ALL' | 'SALES' | 'PURCHASE' | 'ACCOUNTS' | 'HR' | 'INVENTORY' | 'OPERATIONS')
  isLoggedIn: boolean;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long!!',
  cookieName: 'erp_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getSessionFromRequest(
  req: NextRequest,
  res: NextResponse
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, sessionOptions);
}
