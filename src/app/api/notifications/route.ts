import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';

export async function GET(req: NextRequest) {
  try {
    // 1. Pending Requisitions
    const requisitions = db.prepare(`
      SELECT id, requisition_number, status, priority, created_at, 'requisition' as type
      FROM requisitions 
      WHERE status IN ('PENDING_APPROVAL', 'SUBMITTED', 'DRAFT')
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();

    // 2. Plot Bookings pending approval / agreement
    const bookings = db.prepare(`
      SELECT b.id, b.booking_number, b.status, b.created_at, p.plot_number, 'booking' as type
      FROM plot_bookings b
      LEFT JOIN plots p ON b.plot_id = p.id
      WHERE b.status IN ('TOKEN_RECEIVED', 'AGREEMENT_PENDING')
      ORDER BY b.created_at DESC
      LIMIT 5
    `).all();

    // 3. Recent Audit Logs
    const auditLogs = db.prepare(`
      SELECT id, table_name, action, record_id, changed_by, timestamp
      FROM audit_logs
      ORDER BY timestamp DESC
      LIMIT 6
    `).all();

    const items = [
      ...requisitions.map((r: any) => ({
        id: r.id,
        title: `Requisition ${r.requisition_number} (${r.status})`,
        description: `Priority: ${r.priority} · Awaiting procurement approval`,
        type: 'requisition',
        url: '/procurement',
        timestamp: r.created_at,
        urgency: r.priority === 'CRITICAL' ? 'high' : 'normal',
      })),
      ...bookings.map((b: any) => ({
        id: b.id,
        title: `Plot ${b.plot_number} Booking (${b.booking_number})`,
        description: `Status: ${b.status} · Allotment verification required`,
        type: 'booking',
        url: '/land-development',
        timestamp: b.created_at,
        urgency: 'high',
      })),
      ...auditLogs.map((a: any) => ({
        id: a.id,
        title: `${a.action} on ${a.table_name}`,
        description: `By user ${a.changed_by || 'Admin'} · Record: ${a.record_id.slice(0, 8)}...`,
        type: 'audit',
        url: '/settings',
        timestamp: a.timestamp,
        urgency: 'low',
      })),
    ];

    return NextResponse.json({
      count: requisitions.length + bookings.length,
      notifications: items,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

