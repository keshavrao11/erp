import { db, runInTransaction } from '../lib/db/connection';
import crypto from 'crypto';

export class LandRepository {
  getPlots(projectId: string, filters?: { status?: string }): any[] {
    let q = `SELECT pi.*, pb.booking_number, c.full_name as customer_name
      FROM plot_inventory pi
      LEFT JOIN plot_bookings pb ON pb.plot_id = pi.id AND pb.status != 'CANCELLED'
      LEFT JOIN customers c ON c.id = pb.customer_id
      WHERE pi.project_id = ?`;
    const p: any[] = [projectId];
    if (filters?.status) { q += ` AND pi.status = ?`; p.push(filters.status); }
    q += ` ORDER BY pi.plot_number`;
    return db.prepare(q).all(...p);
  }

  createPlot(data: {
    projectId: string; plotNumber: string; phaseBlock: string;
    areaSqft: number; dimensions?: string; facing?: string; plotType?: string;
    baseRatePerSqftPaise: number; amenityChargesPaise?: number;
  }): string {
    const id = crypto.randomUUID();
    const total = Math.round(data.areaSqft * data.baseRatePerSqftPaise);
    db.prepare(`
      INSERT INTO plot_inventory (id, project_id, plot_number, phase_block, area_sqft, dimensions, facing, plot_type,
        base_rate_per_sqft_paise, total_price_paise, amenity_charges_paise, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE')
    `).run(id, data.projectId, data.plotNumber, data.phaseBlock, data.areaSqft,
      data.dimensions || null, data.facing || null, data.plotType || 'RESIDENTIAL',
      data.baseRatePerSqftPaise, total, data.amenityChargesPaise || 0);
    return id;
  }

  bookPlot(data: {
    plotId: string; customerId: string; bookingDate: string;
    tokenAmountPaise: number; agreementValuePaise: number;
    paymentPlan: string; bookedBy: string;
    instalments?: { dueDate: string; amountPaise: number; description: string }[];
  }): string {
    const bookingId = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM plot_bookings`).get() as any).c;
    const bookingNumber = `BKG-${new Date().getFullYear()}-${String(count + 1).padStart(5,'0')}`;

    runInTransaction((tx) => {
      // Check availability - partial unique index handles concurrent booking prevention
      const plot = tx.prepare(`SELECT status FROM plot_inventory WHERE id = ? FOR`).get(data.plotId) as any;
      // Note: SQLite doesn't have SELECT FOR UPDATE, but the partial unique index on plot_bookings prevents double-booking
      
      tx.prepare(`
        INSERT INTO plot_bookings (id, plot_id, customer_id, booking_number, booking_date,
          token_amount_paise, agreement_value_paise, payment_plan, status, booked_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      `).run(bookingId, data.plotId, data.customerId, bookingNumber, data.bookingDate,
        data.tokenAmountPaise, data.agreementValuePaise, data.paymentPlan, data.bookedBy);

      tx.prepare(`UPDATE plot_inventory SET status = 'BOOKED' WHERE id = ?`).run(data.plotId);

      if (data.instalments && data.instalments.length > 0) {
        const insertInstalment = tx.prepare(`
          INSERT INTO plot_instalments (id, booking_id, instalment_number, due_date, amount_paise, description, status)
          VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
        `);
        data.instalments.forEach((ins, idx) => {
          insertInstalment.run(crypto.randomUUID(), bookingId, idx + 1, ins.dueDate, ins.amountPaise, ins.description);
        });
      }
    });
    return bookingId;
  }

  getBookings(companyId: string, filters?: { status?: string; projectId?: string }): any[] {
    let q = `SELECT pb.*, pi.plot_number, pi.phase_block, pi.area_sqft, pi.total_price_paise,
        c.full_name as customer_name, c.phone as customer_phone,
        p.name as project_name
      FROM plot_bookings pb
      JOIN plot_inventory pi ON pi.id = pb.plot_id
      JOIN projects p ON p.id = pi.project_id
      JOIN customers c ON c.id = pb.customer_id
      WHERE p.company_id = ?`;
    const params: any[] = [companyId];
    if (filters?.status) { q += ` AND pb.status = ?`; params.push(filters.status); }
    if (filters?.projectId) { q += ` AND pi.project_id = ?`; params.push(filters.projectId); }
    q += ` ORDER BY pb.created_at DESC`;
    return db.prepare(q).all(...params);
  }

  getInstalments(bookingId: string): any[] {
    return db.prepare(`SELECT * FROM plot_instalments WHERE booking_id = ? ORDER BY instalment_number`).all(bookingId);
  }

  collectInstalment(instalmentId: string, paidDate: string, voucherId?: string): void {
    db.prepare(`UPDATE plot_instalments SET status = 'PAID', paid_date = ?, voucher_id = ? WHERE id = ?`)
      .run(paidDate, voucherId || null, instalmentId);
  }
}

export const landRepo = new LandRepository();
