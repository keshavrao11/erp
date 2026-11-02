import { db, runInTransaction } from '../lib/db/connection';
import crypto from 'crypto';

export class ProcurementRepository {
  createDraftMR(companyId: string, requestedBy: string): any {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM material_requisitions`).get() as any).c;
    const number = `MR-${new Date().getFullYear()}-${String(count + 1).padStart(5,'0')}`;
    const prj = db.prepare(`SELECT id FROM projects WHERE company_id = ? LIMIT 1`).get(companyId) as any;
    const projectId = prj ? prj.id : null;

    db.prepare(`
      INSERT INTO material_requisitions (id, project_id, mr_number, requested_by, required_date, status, created_at)
      VALUES (?, ?, ?, ?, strftime('%Y-%m-%d', 'now', '+7 days'), 'DRAFT', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    `).run(id, projectId, number, requestedBy);

    return this.getMRById(id);
  }

  getMRById(id: string): any {
    const mr = db.prepare(`
      SELECT mr.*, p.name as project_name, u.full_name as requested_by_name
      FROM material_requisitions mr
      LEFT JOIN projects p ON p.id = mr.project_id
      LEFT JOIN users u ON u.id = mr.requested_by
      WHERE mr.id = ?
    `).get(id);
    if (!mr) return null;
    const items = db.prepare(`
      SELECT mri.*, m.name as material_name, m.material_code, m.unit_of_measure
      FROM mr_items mri
      JOIN materials m ON m.id = mri.material_id
      WHERE mri.mr_id = ?
    `).all(id);
    return { ...mr, items };
  }

  updateMRField(id: string, updates: Record<string, any>): void {
    const fieldMap: Record<string, string> = {
      projectId: 'project_id',
      project_id: 'project_id',
      requiredDate: 'required_date',
      required_date: 'required_date',
      status: 'status',
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
      db.prepare(`UPDATE material_requisitions SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
    }
  }

  deleteMR(id: string): void {
    runInTransaction((tx) => {
      tx.prepare(`DELETE FROM mr_items WHERE mr_id = ?`).run(id);
      tx.prepare(`DELETE FROM material_requisitions WHERE id = ?`).run(id);
    });
  }

  createMR(data: {
    projectId: string; requestedBy: string; requiredDate: string;
    items: { materialId: string; quantityRequired: number; unit: string; remarks?: string }[];
  }): string {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM material_requisitions`).get() as any).c;
    const number = `MR-${new Date().getFullYear()}-${String(count + 1).padStart(5,'0')}`;

    runInTransaction((tx) => {
      tx.prepare(`
        INSERT INTO material_requisitions (id, project_id, mr_number, requested_by, required_date, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'DRAFT', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      `).run(id, data.projectId, number, data.requestedBy, data.requiredDate);

      const ins = tx.prepare(`
        INSERT INTO mr_items (id, mr_id, material_id, quantity_required, quantity_approved, unit, remarks)
        VALUES (?, ?, ?, ?, 0, ?, ?)
      `);
      for (const item of data.items) {
        ins.run(crypto.randomUUID(), id, item.materialId, item.quantityRequired, item.unit, item.remarks || null);
      }
    });
    return id;
  }

  getMRs(companyId: string, filters?: { status?: string; projectId?: string }): any[] {
    let q = `SELECT mr.*, p.name as project_name, u.full_name as requested_by_name
      FROM material_requisitions mr
      JOIN projects p ON p.id = mr.project_id
      JOIN users u ON u.id = mr.requested_by
      WHERE p.company_id = ?`;
    const params: any[] = [companyId];
    if (filters?.status) { q += ` AND mr.status = ?`; params.push(filters.status); }
    if (filters?.projectId) { q += ` AND mr.project_id = ?`; params.push(filters.projectId); }
    q += ` ORDER BY mr.created_at DESC`;
    return db.prepare(q).all(...params);
  }

  createPO(data: {
    companyId: string; vendorId: string; poDate: string; expectedDeliveryDate: string;
    projectId?: string; mrId?: string; paymentTerms: string; poNumber?: string;
    items: { materialId: string; mrItemId?: string; description: string; quantity: number; unit: string; unitRatePaise: number; taxCodeId?: string }[];
    createdBy: string;
  }): { id: string; poNumber: string } {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM purchase_orders WHERE company_id = ?`).get(data.companyId) as any).c;
    const number = data.poNumber?.trim() || `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5,'0')}`;
    
    const total = data.items.reduce((s, i) => s + i.quantity * i.unitRatePaise, 0);

    runInTransaction((tx) => {
      tx.prepare(`
        INSERT INTO purchase_orders (id, company_id, mr_id, vendor_id, po_number, po_date, expected_delivery_date,
          project_id, status, payment_terms, total_amount_paise, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      `).run(id, data.companyId, data.mrId || null, data.vendorId, number, data.poDate,
        data.expectedDeliveryDate, data.projectId || null, data.paymentTerms, total);

      const ins = tx.prepare(`
        INSERT INTO po_items (id, po_id, material_id, mr_item_id, description, quantity, unit, unit_rate_paise, tax_code_id, tax_amount_paise, total_paise)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `);
      for (const item of data.items) {
        ins.run(crypto.randomUUID(), id, item.materialId, item.mrItemId || null, item.description,
          item.quantity, item.unit, item.unitRatePaise, item.taxCodeId || null, item.quantity * item.unitRatePaise);
      }
      if (data.mrId) {
        tx.prepare(`UPDATE material_requisitions SET status = 'PO_CREATED' WHERE id = ?`).run(data.mrId);
      }
    });
    return { id, poNumber: number };
  }

  createGRN(data: {
    poId: string; grnDate: string; receivedBy: string; vehicleNumber?: string; supplierDcNumber?: string;
    items: { poItemId: string; quantityReceived: number; quantityAccepted: number; quantityRejected?: number; rejectionReason?: string }[];
  }): string {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM goods_receipt_notes`).get() as any).c;
    const number = `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(5,'0')}`;

    runInTransaction((tx) => {
      tx.prepare(`
        INSERT INTO goods_receipt_notes (id, po_id, grn_number, grn_date, received_by, vehicle_number, supplier_dc_number, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING_QC', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      `).run(id, data.poId, number, data.grnDate, data.receivedBy, data.vehicleNumber || null, data.supplierDcNumber || null);

      const ins = tx.prepare(`
        INSERT INTO grn_items (id, grn_id, po_item_id, quantity_received, quantity_accepted, quantity_rejected, rejection_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of data.items) {
        ins.run(crypto.randomUUID(), id, item.poItemId, item.quantityReceived, item.quantityAccepted,
          item.quantityRejected || 0, item.rejectionReason || null);
      }
    });
    return id;
  }

  getStockLedger(companyId: string, materialId?: string): any[] {
    let q = `SELECT sl.*, m.name as material_name, m.unit_of_measure, p.name as project_name
      FROM stock_ledger sl
      JOIN materials m ON m.id = sl.material_id
      LEFT JOIN projects p ON p.id = sl.project_id
      WHERE sl.company_id = ?`;
    const params: any[] = [companyId];
    if (materialId) { q += ` AND sl.material_id = ?`; params.push(materialId); }
    q += ` ORDER BY sl.transaction_date DESC, sl.created_at DESC`;
    return db.prepare(q).all(...params);
  }
}

export const procurementRepo = new ProcurementRepository();
