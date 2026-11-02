import { db, runInTransaction } from '../lib/db/connection';
import crypto from 'crypto';

export class ProjectsRepository {
  getAll(companyId: string, filters?: { verticalId?: string; status?: string; search?: string }): any[] {
    let q = `SELECT p.*, bv.name as vertical_name, bv.code as vertical_code,
        c.full_name as client_name, u.full_name as created_by_name
      FROM projects p
      LEFT JOIN business_verticals bv ON bv.id = p.vertical_id
      LEFT JOIN customers c ON c.id = p.client_id
      LEFT JOIN users u ON u.id = p.created_by
      WHERE p.company_id = ?`;
    const params: any[] = [companyId];
    if (filters?.verticalId) { q += ` AND p.vertical_id = ?`; params.push(filters.verticalId); }
    if (filters?.status) { q += ` AND p.status = ?`; params.push(filters.status); }
    if (filters?.search) { q += ` AND (p.name LIKE ? OR p.project_code LIKE ? OR p.location_city LIKE ?)`; params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`); }
    q += ` ORDER BY p.created_at DESC`;
    return db.prepare(q).all(...params);
  }

  getById(id: string): any {
    const project = db.prepare(`
      SELECT p.*, bv.name as vertical_name, bv.code as vertical_code, c.full_name as client_name
      FROM projects p
      LEFT JOIN business_verticals bv ON bv.id = p.vertical_id
      LEFT JOIN customers c ON c.id = p.client_id
      WHERE p.id = ?
    `).get(id);
    if (!project) return null;
    const milestones = db.prepare(`SELECT * FROM project_milestones WHERE project_id = ? ORDER BY target_date`).all(id);
    const members = db.prepare(`
      SELECT pm.*, u.full_name, u.email FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ?
    `).all(id);
    return { ...project, milestones, members };
  }

  createDraft(companyId: string, createdBy: string): any {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM projects WHERE company_id = ?`).get(companyId) as any).c;
    const code = `PRJ-${String(count + 1).padStart(4,'0')}`;
    const vertical = db.prepare(`SELECT id FROM business_verticals WHERE company_id = ? LIMIT 1`).get(companyId) as any;
    const verticalId = vertical ? vertical.id : null;

    db.prepare(`
      INSERT INTO projects (id, company_id, vertical_id, project_code, name, description, client_id,
        start_date, target_completion_date, estimated_budget_paise, location_address, location_city, location_state,
        status, created_by, created_at)
      VALUES (?, ?, ?, ?, 'New Project Workspace', '', NULL,
        strftime('%Y-%m-%d', 'now'), strftime('%Y-%m-%d', 'now', '+6 months'), 10000000,
        '', 'Mysuru', 'Karnataka', 'ACTIVE', ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    `).run(id, companyId, verticalId, code, createdBy);

    return this.getById(id);
  }

  create(data: {
    companyId: string; verticalId: string; name: string; description?: string;
    clientId?: string; startDate: string; targetCompletionDate: string;
    estimatedBudgetPaise: number; locationCity: string; locationState?: string;
    locationAddress?: string; createdBy: string;
  }): string {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM projects WHERE company_id = ?`).get(data.companyId) as any).c;
    const code = `PRJ-${String(count + 1).padStart(4,'0')}`;
    db.prepare(`
      INSERT INTO projects (id, company_id, vertical_id, project_code, name, description, client_id,
        start_date, target_completion_date, estimated_budget_paise, location_address, location_city, location_state,
        status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    `).run(id, data.companyId, data.verticalId, code, data.name, data.description || null, data.clientId || null,
      data.startDate, data.targetCompletionDate, data.estimatedBudgetPaise,
      data.locationAddress || null, data.locationCity, data.locationState || null, data.createdBy);
    return id;
  }

  updateProjectField(id: string, updates: Record<string, any>): void {
    const fieldMap: Record<string, string> = {
      name: 'name',
      description: 'description',
      verticalId: 'vertical_id',
      vertical_id: 'vertical_id',
      clientId: 'client_id',
      client_id: 'client_id',
      startDate: 'start_date',
      start_date: 'start_date',
      targetCompletionDate: 'target_completion_date',
      target_completion_date: 'target_completion_date',
      estimatedBudgetPaise: 'estimated_budget_paise',
      estimated_budget_paise: 'estimated_budget_paise',
      locationCity: 'location_city',
      location_city: 'location_city',
      locationAddress: 'location_address',
      location_address: 'location_address',
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
      db.prepare(`UPDATE projects SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
    }
  }

  deleteProject(id: string): void {
    runInTransaction((tx) => {
      tx.prepare(`DELETE FROM boq_items WHERE project_id = ?`).run(id);
      tx.prepare(`DELETE FROM project_milestones WHERE project_id = ?`).run(id);
      tx.prepare(`DELETE FROM project_members WHERE project_id = ?`).run(id);
      tx.prepare(`DELETE FROM projects WHERE id = ?`).run(id);
    });
  }

  updateStatus(id: string, status: string): void {
    db.prepare(`UPDATE projects SET status = ? WHERE id = ?`).run(status, id);
  }
}

export const projectsRepo = new ProjectsRepository();
