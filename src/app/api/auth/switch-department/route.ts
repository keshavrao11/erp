import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.roles.includes('SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    const { department } = await req.json();
    const validDepts = ['ALL', 'SALES', 'PURCHASE', 'ACCOUNTS', 'HR', 'INVENTORY', 'OPERATIONS'];
    if (!validDepts.includes(department)) {
      return NextResponse.json({ error: 'Invalid department' }, { status: 400 });
    }

    session.activeDepartmentOverride = department;
    await session.save();

    return NextResponse.json({
      success: true,
      activeDepartment: department,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

