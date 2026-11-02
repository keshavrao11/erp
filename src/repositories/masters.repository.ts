import { db } from '../lib/db/connection';
import crypto from 'crypto';

export class MastersRepository {
  // Customers
  getCustomers(companyId: string, search?: string): any[] {
    let q = `SELECT c.*, bv.name as vertical_name FROM customers c
      LEFT JOIN business_verticals bv ON bv.id = c.vertical_id WHERE c.company_id = ?`;
    const p: any[] = [companyId];
    if (search) { q += ` AND (c.full_name LIKE ? OR c.phone LIKE ? OR c.customer_code LIKE ?)`; const s = `%${search}%`; p.push(s,s,s); }
    q += ` AND c.is_active = 1 ORDER BY c.created_at DESC`;
    return db.prepare(q).all(...p);
  }

  getCustomerById(id: string): any {
    return db.prepare(`SELECT * FROM customers WHERE id = ?`).get(id);
  }

  createDraftCustomer(companyId: string): any {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM customers WHERE company_id = ?`).get(companyId) as any).c;
    const code = `CUST-${String(count + 1).padStart(5,'0')}`;
    db.prepare(`
      INSERT INTO customers (id, company_id, customer_code, full_name, company_name, phone, email, pan, billing_address, is_active, created_at)
      VALUES (?, ?, ?, 'New Customer', '', '', NULL, NULL, '', 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    `).run(id, companyId, code);
    return this.getCustomerById(id);
  }

  createCustomer(data: { companyId: string; fullName: string; companyName?: string; phone: string; email?: string; pan?: string; billingAddress?: string; verticalId?: string; assignedCrmUserId?: string }): string {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM customers WHERE company_id = ?`).get(data.companyId) as any).c;
    const code = `CUST-${String(count + 1).padStart(5,'0')}`;
    db.prepare(`INSERT INTO customers (id, company_id, customer_code, full_name, company_name, phone, email, pan, billing_address, vertical_id, assigned_crm_user_id, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
      .run(id, data.companyId, code, data.fullName, data.companyName||null, data.phone, data.email||null, data.pan||null, data.billingAddress||null, data.verticalId||null, data.assignedCrmUserId||null);
    return id;
  }

  updateCustomerField(id: string, updates: Record<string, any>): void {
    const fieldMap: Record<string, string> = {
      fullName: 'full_name',
      full_name: 'full_name',
      companyName: 'company_name',
      company_name: 'company_name',
      phone: 'phone',
      email: 'email',
      pan: 'pan',
      billingAddress: 'billing_address',
      billing_address: 'billing_address',
      verticalId: 'vertical_id',
      vertical_id: 'vertical_id',
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
      db.prepare(`UPDATE customers SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
    }
  }

  deleteCustomer(id: string): void {
    db.prepare(`UPDATE customers SET is_active = 0 WHERE id = ?`).run(id);
  }

  // Vendors
  getVendors(companyId: string, search?: string): any[] {
    let q = `SELECT * FROM vendors WHERE company_id = ?`;
    const p: any[] = [companyId];
    if (search) { q += ` AND (name LIKE ? OR vendor_code LIKE ? OR contact_person LIKE ?)`; p.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    q += ` AND is_active = 1 ORDER BY created_at DESC`;
    return db.prepare(q).all(...p);
  }

  getVendorById(id: string): any {
    return db.prepare(`SELECT * FROM vendors WHERE id = ?`).get(id);
  }

  createDraftVendor(companyId: string): any {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM vendors WHERE company_id = ?`).get(companyId) as any).c;
    const code = `VND-${String(count + 1).padStart(5,'0')}`;
    db.prepare(`
      INSERT INTO vendors (id, company_id, vendor_code, name, contact_person, phone, email, gstin, pan, payment_terms_days, is_active, created_at)
      VALUES (?, ?, ?, 'New Vendor Partner', '', '', NULL, NULL, NULL, 30, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    `).run(id, companyId, code);
    return this.getVendorById(id);
  }

  createVendor(data: { companyId: string; name: string; contactPerson?: string; phone: string; email?: string; gstin?: string; pan?: string; paymentTermsDays?: number }): string {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM vendors WHERE company_id = ?`).get(data.companyId) as any).c;
    const code = `VND-${String(count + 1).padStart(5,'0')}`;
    db.prepare(`INSERT INTO vendors (id, company_id, vendor_code, name, contact_person, phone, email, gstin, pan, payment_terms_days, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
      .run(id, data.companyId, code, data.name, data.contactPerson||null, data.phone, data.email||null, data.gstin||null, data.pan||null, data.paymentTermsDays||30);
    return id;
  }

  updateVendorField(id: string, updates: Record<string, any>): void {
    const fieldMap: Record<string, string> = {
      name: 'name',
      contactPerson: 'contact_person',
      contact_person: 'contact_person',
      phone: 'phone',
      email: 'email',
      gstin: 'gstin',
      pan: 'pan',
      paymentTermsDays: 'payment_terms_days',
      payment_terms_days: 'payment_terms_days',
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
      db.prepare(`UPDATE vendors SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
    }
  }

  deleteVendor(id: string): void {
    db.prepare(`UPDATE vendors SET is_active = 0 WHERE id = ?`).run(id);
  }

  // Materials
  getMaterials(companyId: string, search?: string): any[] {
    let q = `SELECT m.*, mc.name as category_name FROM materials m JOIN material_categories mc ON mc.id = m.category_id WHERE m.company_id = ?`;
    const p: any[] = [companyId];
    if (search) { q += ` AND (m.name LIKE ? OR m.material_code LIKE ?)`; p.push(`%${search}%`, `%${search}%`); }
    q += ` AND m.is_active = 1 ORDER BY m.name`;
    return db.prepare(q).all(...p);
  }

  getMaterialById(id: string): any {
    return db.prepare(`SELECT m.*, mc.name as category_name FROM materials m JOIN material_categories mc ON mc.id = m.category_id WHERE m.id = ?`).get(id);
  }

  createDraftMaterial(companyId: string): any {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM materials WHERE company_id = ?`).get(companyId) as any).c;
    const code = `MAT-${String(count + 1).padStart(5,'0')}`;
    const cat = db.prepare(`SELECT id FROM material_categories WHERE company_id = ? LIMIT 1`).get(companyId) as any;
    const catId = cat ? cat.id : null;
    db.prepare(`
      INSERT INTO materials (id, company_id, category_id, material_code, name, unit_of_measure, hsn_code, standard_rate_paise, min_stock_qty, is_active)
      VALUES (?, ?, ?, ?, 'New Material Item', 'UNIT', '', 0, 10, 1)
    `).run(id, companyId, catId, code);
    return this.getMaterialById(id);
  }

  createMaterial(data: { companyId: string; categoryId: string; name: string; unitOfMeasure: string; hsnCode?: string; standardRatePaise?: number }): string {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM materials WHERE company_id = ?`).get(data.companyId) as any).c;
    const code = `MAT-${String(count + 1).padStart(5,'0')}`;
    db.prepare(`INSERT INTO materials (id, company_id, category_id, material_code, name, unit_of_measure, hsn_code, standard_rate_paise, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`)
      .run(id, data.companyId, data.categoryId, code, data.name, data.unitOfMeasure, data.hsnCode||null, data.standardRatePaise||0);
    return id;
  }

  updateMaterialField(id: string, updates: Record<string, any>): void {
    const fieldMap: Record<string, string> = {
      name: 'name',
      unitOfMeasure: 'unit_of_measure',
      unit_of_measure: 'unit_of_measure',
      hsnCode: 'hsn_code',
      hsn_code: 'hsn_code',
      standardRatePaise: 'standard_rate_paise',
      standard_rate_paise: 'standard_rate_paise',
      categoryId: 'category_id',
      category_id: 'category_id',
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
      db.prepare(`UPDATE materials SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
    }
  }

  deleteMaterial(id: string): void {
    db.prepare(`UPDATE materials SET is_active = 0 WHERE id = ?`).run(id);
  }

  getVerticals(companyId: string): any[] {
    return db.prepare(`SELECT * FROM business_verticals WHERE company_id = ? AND is_active = 1 ORDER BY name`).all(companyId);
  }

  getCategories(companyId: string): any[] {
    return db.prepare(`SELECT * FROM material_categories WHERE company_id = ? ORDER BY name`).all(companyId);
  }
}

export const mastersRepo = new MastersRepository();
