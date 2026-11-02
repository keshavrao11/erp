import { db, runInTransaction } from '../lib/db/connection';
import crypto from 'crypto';

export class CrmRepository {
  getEnquiries(companyId: string, filters?: { status?: string; verticalId?: string; search?: string }): any[] {
    let q = `SELECT e.*, bv.name as vertical_name, u.full_name as assigned_to_name
      FROM enquiries e
      LEFT JOIN business_verticals bv ON bv.id = e.vertical_id
      LEFT JOIN users u ON u.id = e.assigned_to
      WHERE e.company_id = ?`;
    const p: any[] = [companyId];
    if (filters?.status) { q += ` AND e.status = ?`; p.push(filters.status); }
    if (filters?.verticalId) { q += ` AND e.vertical_id = ?`; p.push(filters.verticalId); }
    if (filters?.search) { q += ` AND (e.customer_name LIKE ? OR e.phone LIKE ? OR e.enquiry_number LIKE ?)`; p.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`); }
    q += ` ORDER BY e.created_at DESC LIMIT 200`;
    return db.prepare(q).all(...p);
  }

  getEnquiryById(id: string): any {
    return db.prepare(`
      SELECT e.*, bv.name as vertical_name, u.full_name as assigned_to_name
      FROM enquiries e
      LEFT JOIN business_verticals bv ON bv.id = e.vertical_id
      LEFT JOIN users u ON u.id = e.assigned_to
      WHERE e.id = ?
    `).get(id);
  }

  createDraftEnquiry(companyId: string, userId?: string): any {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM enquiries WHERE company_id = ?`).get(companyId) as any).c;
    const number = `ENQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    // Pick the first business vertical by default
    const vertical = db.prepare(`SELECT id FROM business_verticals WHERE company_id = ? LIMIT 1`).get(companyId) as any;
    const verticalId = vertical ? vertical.id : null;

    db.prepare(`
      INSERT INTO enquiries (id, company_id, vertical_id, enquiry_number, source, customer_name, phone, email,
        requirement_description, budget_paise, assigned_to, lead_score, status, follow_up_date, created_at)
      VALUES (?, ?, ?, ?, 'WALK_IN', 'New Lead', '', NULL, '', 0, ?, 10, 'NEW', NULL, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    `).run(id, companyId, verticalId, number, userId || null);

    return this.getEnquiryById(id);
  }

  createEnquiry(data: {
    companyId: string; verticalId?: string; source: string;
    customerName: string; phone: string; email?: string;
    requirementDescription?: string; budgetPaise?: number;
    assignedTo?: string; projectId?: string;
  }): string {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM enquiries WHERE company_id = ?`).get(data.companyId) as any).c;
    const number = `ENQ-${new Date().getFullYear()}-${String(count + 1).padStart(4,'0')}`;
    db.prepare(`
      INSERT INTO enquiries (id, company_id, vertical_id, enquiry_number, source, customer_name, phone, email,
        requirement_description, budget_paise, assigned_to, project_id, lead_score, status, follow_up_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 20, 'NEW', NULL, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    `).run(id, data.companyId, data.verticalId || null, number, data.source, data.customerName, data.phone,
      data.email || null, data.requirementDescription || null, data.budgetPaise || null, data.assignedTo || null, data.projectId || null);
    return id;
  }

  updateEnquiryField(id: string, updates: Record<string, any>): void {
    const fieldMap: Record<string, string> = {
      customerName: 'customer_name',
      customer_name: 'customer_name',
      phone: 'phone',
      email: 'email',
      source: 'source',
      status: 'status',
      leadScore: 'lead_score',
      lead_score: 'lead_score',
      budgetPaise: 'budget_paise',
      budget_paise: 'budget_paise',
      requirementDescription: 'requirement_description',
      requirement_description: 'requirement_description',
      verticalId: 'vertical_id',
      vertical_id: 'vertical_id',
      assignedTo: 'assigned_to',
      assigned_to: 'assigned_to',
      followUpDate: 'follow_up_date',
      follow_up_date: 'follow_up_date',
    };

    const setClauses: string[] = [];
    const values: any[] = [];

    for (const [key, val] of Object.entries(updates)) {
      const col = fieldMap[key];
      if (col) {
        setClauses.push(`${col} = ?`);
        values.push(val === '' ? null : val);
      }
    }

    if (setClauses.length > 0) {
      values.push(id);
      db.prepare(`UPDATE enquiries SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
    }
  }

  deleteEnquiry(id: string): void {
    runInTransaction((tx) => {
      tx.prepare(`DELETE FROM follow_ups WHERE enquiry_id = ?`).run(id);
      tx.prepare(`DELETE FROM quotations WHERE enquiry_id = ?`).run(id);
      tx.prepare(`DELETE FROM enquiries WHERE id = ?`).run(id);
    });
  }

  updateEnquiryStatus(id: string, status: string, followUpDate?: string): void {
    db.prepare(`UPDATE enquiries SET status = ?, follow_up_date = ? WHERE id = ?`).run(status, followUpDate || null, id);
  }

  addFollowUp(data: { enquiryId: string; userId: string; type: string; notes: string; nextDate?: string }): string {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO follow_ups (id, enquiry_id, user_id, follow_up_type, notes, next_follow_up_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    `).run(id, data.enquiryId, data.userId, data.type, data.notes, data.nextDate || null);
    return id;
  }

  getFollowUps(enquiryId: string): any[] {
    return db.prepare(`
      SELECT f.*, u.full_name as user_name FROM follow_ups f
      JOIN users u ON u.id = f.user_id WHERE f.enquiry_id = ? ORDER BY f.created_at DESC
    `).all(enquiryId);
  }

  // --- QUOTATIONS ---
  getQuotations(companyId: string, enquiryId?: string): any[] {
    let q = `
      SELECT q.*, COALESCE(c.full_name, c.company_name, 'Unknown Customer') as customer_name, e.enquiry_number, p.name as project_name,
        (SELECT COUNT(*) FROM quotation_items WHERE quotation_id = q.id) as item_count
      FROM quotations q
      LEFT JOIN customers c ON c.id = q.customer_id
      LEFT JOIN enquiries e ON e.id = q.enquiry_id
      LEFT JOIN projects p ON p.id = q.project_id
      WHERE q.company_id = ?
    `;
    const params: any[] = [companyId];
    if (enquiryId) {
      q += ` AND q.enquiry_id = ?`;
      params.push(enquiryId);
    }
    q += ` ORDER BY q.created_at DESC`;
    return db.prepare(q).all(...params);
  }

  getQuotationById(id: string): any {
    const quotation = db.prepare(`
      SELECT q.*, COALESCE(c.full_name, c.company_name, 'Unknown Customer') as customer_name, c.email as customer_email, c.phone as customer_phone,
        e.enquiry_number, p.name as project_name
      FROM quotations q
      LEFT JOIN customers c ON c.id = q.customer_id
      LEFT JOIN enquiries e ON e.id = q.enquiry_id
      LEFT JOIN projects p ON p.id = q.project_id
      WHERE q.id = ?
    `).get(id) as any;

    if (!quotation) return null;

    const items = db.prepare(`
      SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY sort_order ASC, id ASC
    `).all(id);

    return { ...quotation, items };
  }

  createDraftQuotation(companyId: string, enquiryId?: string, customerId?: string, createdBy?: string): any {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM quotations WHERE company_id = ?`).get(companyId) as any).c;
    const quotationNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const today = new Date().toISOString().slice(0, 10);
    const validUntil = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    // Pick first customer if not specified
    let targetCustomerId = customerId;
    if (!targetCustomerId) {
      const cust = db.prepare(`SELECT id FROM customers WHERE company_id = ? LIMIT 1`).get(companyId) as any;
      targetCustomerId = cust ? cust.id : null;
    }

    // Default admin user if not specified
    let targetUserId = createdBy;
    if (!targetUserId) {
      const u = db.prepare(`SELECT id FROM users WHERE company_id = ? LIMIT 1`).get(companyId) as any;
      targetUserId = u ? u.id : null;
    }

    db.prepare(`
      INSERT INTO quotations (
        id, company_id, enquiry_id, project_id, customer_id,
        quotation_number, quotation_date, valid_until, scope_of_work,
        total_amount_paise, discount_paise, tax_amount_paise, grand_total_paise,
        status, terms_conditions, created_by
      ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, 'Turnkey Construction & Execution Scope', 0, 0, 0, 0, 'DRAFT', '1. Payment terms: 30% advance, 70% milestone-linked.\n2. Validity: 30 calendar days.\n3. GST applicable as per statutory guidelines.', ?)
    `).run(id, companyId, enquiryId || null, targetCustomerId, quotationNumber, today, validUntil, targetUserId);

    // Add 2 initial template lines
    this.saveQuotationItem({
      quotationId: id,
      description: 'Site Mobilization, Layout Demarcation & Foundation Trenching',
      quantity: 1,
      unit: 'LS',
      unitRatePaise: 15000000, // 1.5 Lakhs
      sortOrder: 1,
    });

    this.saveQuotationItem({
      quotationId: id,
      description: 'RCC Structural Framework (M25 Concrete & Fe550D Steel Reinforcement)',
      quantity: 1200,
      unit: 'SQFT',
      unitRatePaise: 185000, // 1850 / sqft
      sortOrder: 2,
    });

    return this.getQuotationById(id);
  }

  saveQuotationItem(data: {
    id?: string;
    quotationId: string;
    description: string;
    quantity: number;
    unit?: string;
    unitRatePaise: number;
    sortOrder?: number;
  }): string {
    const itemId = data.id || crypto.randomUUID();
    const amountPaise = Math.round(data.quantity * data.unitRatePaise);

    if (data.id) {
      db.prepare(`
        UPDATE quotation_items 
        SET description = ?, quantity = ?, unit = ?, unit_rate_paise = ?, amount_paise = ?, sort_order = ?
        WHERE id = ?
      `).run(
        data.description,
        data.quantity,
        data.unit || 'NOS',
        data.unitRatePaise,
        amountPaise,
        data.sortOrder ?? 0,
        data.id
      );
    } else {
      db.prepare(`
        INSERT INTO quotation_items (id, quotation_id, description, quantity, unit, unit_rate_paise, amount_paise, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        itemId,
        data.quotationId,
        data.description,
        data.quantity,
        data.unit || 'NOS',
        data.unitRatePaise,
        amountPaise,
        data.sortOrder ?? 0
      );
    }

    this.recalculateQuotationTotals(data.quotationId);
    return itemId;
  }

  deleteQuotationItem(itemId: string): void {
    const item = db.prepare(`SELECT quotation_id FROM quotation_items WHERE id = ?`).get(itemId) as any;
    if (item) {
      db.prepare(`DELETE FROM quotation_items WHERE id = ?`).run(itemId);
      this.recalculateQuotationTotals(item.quotation_id);
    }
  }

  recalculateQuotationTotals(quotationId: string): void {
    const sumRow = db.prepare(`
      SELECT COALESCE(SUM(amount_paise), 0) as subtotal
      FROM quotation_items
      WHERE quotation_id = ?
    `).get(quotationId) as any;

    const subtotalPaise = sumRow ? sumRow.subtotal : 0;
    const gstPaise = Math.round(subtotalPaise * 0.18); // 18% GST standard
    const grandTotalPaise = subtotalPaise + gstPaise;

    db.prepare(`
      UPDATE quotations
      SET total_amount_paise = ?, tax_amount_paise = ?, grand_total_paise = ?
      WHERE id = ?
    `).run(subtotalPaise, gstPaise, grandTotalPaise, quotationId);
  }

  updateQuotationHeader(id: string, updates: Record<string, any>): void {
    const fieldMap: Record<string, string> = {
      scopeOfWork: 'scope_of_work',
      termsConditions: 'terms_conditions',
      validUntil: 'valid_until',
      status: 'status',
      discountPaise: 'discount_paise',
    };

    const setClauses: string[] = [];
    const values: any[] = [];

    for (const [key, val] of Object.entries(updates)) {
      const col = fieldMap[key];
      if (col) {
        setClauses.push(`${col} = ?`);
        values.push(val);
      }
    }

    if (setClauses.length > 0) {
      values.push(id);
      db.prepare(`UPDATE quotations SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
    }
  }
}

export const crmRepo = new CrmRepository();
