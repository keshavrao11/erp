import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from './lib/auth/session';
import { DEPARTMENT_MODULE_MAP, ROUTE_MODULE_MAP, PUBLIC_PATHS } from './lib/auth/constants';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }
  
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  // 1. Not logged in -> Redirect to login
  if (!session.isLoggedIn || !session.userId) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Super Admin has unrestricted access
  if (session.roles?.includes('SUPER_ADMIN')) {
    return res;
  }

  // 3. Department Authorization Check for Page Routes
  const matchedRoute = Object.keys(ROUTE_MODULE_MAP).find(
    r => pathname === r || pathname.startsWith(r + '/')
  );

  if (matchedRoute) {
    const requiredModule = ROUTE_MODULE_MAP[matchedRoute];
    const userDept = session.departmentCode || 'OPERATIONS';
    const allowedModules = DEPARTMENT_MODULE_MAP[userDept] || ['DASHBOARD'];

    if (!allowedModules.includes(requiredModule as any)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: `Forbidden: Access restricted to authorized department (${userDept})` },
          { status: 403 }
        );
      }
      const deniedUrl = new URL('/dashboard', req.url);
      deniedUrl.searchParams.set('denied', 'true');
      deniedUrl.searchParams.set('module', requiredModule);
      return NextResponse.redirect(deniedUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
