import { db, runInTransaction } from '../lib/db/connection';
import crypto from 'crypto';

export class HrRepository {
  getEmployees(companyId: string, filters?: { departmentId?: string; isActive?: boolean; search?: string }): any[] {
    let q = `SELECT e.*, d.name as department_name FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id WHERE e.company_id = ?`;
    const p: any[] = [companyId];
    if (filters?.departmentId) { q += ` AND e.department_id = ?`; p.push(filters.departmentId); }
    if (filters?.isActive !== undefined) { q += ` AND e.is_active = ?`; p.push(filters.isActive ? 1 : 0); }
    if (filters?.search) { q += ` AND (e.full_name LIKE ? OR e.employee_code LIKE ? OR e.designation LIKE ?)`; p.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`); }
    q += ` ORDER BY e.created_at DESC`;
    return db.prepare(q).all(...p);
  }

  getEmployeeById(id: string): any {
    return db.prepare(`SELECT e.*, d.name as department_name FROM employees e LEFT JOIN departments d ON d.id = e.department_id WHERE e.id = ?`).get(id);
  }

  createDraftEmployee(companyId: string): any {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM employees WHERE company_id = ?`).get(companyId) as any).c;
    const code = `EMP-${String(count + 1).padStart(4,'0')}`;
    const dept = db.prepare(`SELECT id FROM departments WHERE company_id = ? LIMIT 1`).get(companyId) as any;
    const deptId = dept ? dept.id : null;
    const email = `emp.${count + 1}@proficienttransforms.com`;

    db.prepare(`
      INSERT INTO employees (id, company_id, employee_code, full_name, phone, email, department_id, designation,
        date_of_joining, employment_type, basic_salary_paise, hra_paise, other_allowances_paise, pf_applicable, is_active, created_at)
      VALUES (?, ?, ?, 'New Employee', '', ?, ?, 'Staff Associate', strftime('%Y-%m-%d', 'now'), 'PERMANENT', 3500000, 1400000, 500000, 1, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    `).run(id, companyId, code, email, deptId);

    return this.getEmployeeById(id);
  }

  createEmployee(data: {
    companyId: string; userId?: string; fullName: string; phone: string; email: string;
    departmentId: string; designation: string; dateOfJoining: string;
    employmentType: string; pan?: string; aadhaarLast4?: string;
    bankAccountNumber?: string; bankIfsc?: string;
    basicSalaryPaise: number; hraPaise?: number; otherAllowancesPaise?: number;
    pfApplicable?: boolean;
  }): string {
    const id = crypto.randomUUID();
    const count = (db.prepare(`SELECT COUNT(*) as c FROM employees WHERE company_id = ?`).get(data.companyId) as any).c;
    const code = `EMP-${String(count + 1).padStart(4,'0')}`;
    db.prepare(`
      INSERT INTO employees (id, company_id, user_id, employee_code, full_name, phone, email, department_id, designation,
        date_of_joining, employment_type, pan, aadhaar_last4, bank_account_number, bank_ifsc,
        basic_salary_paise, hra_paise, other_allowances_paise, pf_applicable, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    `).run(id, data.companyId, data.userId || null, code, data.fullName, data.phone, data.email,
      data.departmentId, data.designation, data.dateOfJoining, data.employmentType,
      data.pan || null, data.aadhaarLast4 || null, data.bankAccountNumber || null, data.bankIfsc || null,
      data.basicSalaryPaise, data.hraPaise || 0, data.otherAllowancesPaise || 0, data.pfApplicable !== false ? 1 : 0);
    return id;
  }

  updateEmployeeField(id: string, updates: Record<string, any>): void {
    const fieldMap: Record<string, string> = {
      fullName: 'full_name',
      full_name: 'full_name',
      phone: 'phone',
      email: 'email',
      designation: 'designation',
      departmentId: 'department_id',
      department_id: 'department_id',
      dateOfJoining: 'date_of_joining',
      date_of_joining: 'date_of_joining',
      employmentType: 'employment_type',
      employment_type: 'employment_type',
      basicSalaryPaise: 'basic_salary_paise',
      basic_salary_paise: 'basic_salary_paise',
      hraPaise: 'hra_paise',
      hra_paise: 'hra_paise',
      otherAllowancesPaise: 'other_allowances_paise',
      other_allowances_paise: 'other_allowances_paise',
      pan: 'pan',
      aadhaarLast4: 'aadhaar_last4',
      bankAccountNumber: 'bank_account_number',
      bankIfsc: 'bank_ifsc',
      isActive: 'is_active',
      is_active: 'is_active',
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
      db.prepare(`UPDATE employees SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
    }
  }

  deleteEmployee(id: string): void {
    db.prepare(`UPDATE employees SET is_active = 0 WHERE id = ?`).run(id);
  }

  getDepartments(companyId: string): any[] {
    return db.prepare(`SELECT * FROM departments WHERE company_id = ? ORDER BY name`).all(companyId);
  }

  processPayrollRun(companyId: string, payrollMonth: string, processedBy: string): string {
    const id = crypto.randomUUID();
    const employees = this.getEmployees(companyId, { isActive: true });

    runInTransaction((tx) => {
      tx.prepare(`
        INSERT INTO payroll_runs (id, company_id, payroll_month, status, processed_by, created_at)
        VALUES (?, ?, ?, 'PROCESSED', ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      `).run(id, companyId, payrollMonth, processedBy);

      const ins = tx.prepare(`
        INSERT INTO payroll_entries (id, payroll_run_id, employee_id, working_days, present_days,
          basic_paise, hra_paise, other_allowances_paise, gross_paise,
          pf_employee_paise, pf_employer_paise, tds_paise, other_deductions_paise, net_paise, created_at)
        VALUES (?, ?, ?, 26, 26, ?, ?, ?, ?, ?, ?, 0, 0, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      `);

      for (const emp of employees as any[]) {
        const gross = emp.basic_salary_paise + emp.hra_paise + emp.other_allowances_paise;
        const pfEmployee = emp.pf_applicable ? Math.round(emp.basic_salary_paise * 0.12) : 0;
        const pfEmployer = emp.pf_applicable ? Math.round(emp.basic_salary_paise * 0.12) : 0;
        const net = gross - pfEmployee;
        ins.run(crypto.randomUUID(), id, emp.id, 26, 26, emp.basic_salary_paise, emp.hra_paise,
          emp.other_allowances_paise, gross, pfEmployee, pfEmployer, net);
      }
    });
    return id;
  }

  markAttendance(data: {
    employeeId: string; date: string; status: string;
    checkIn?: string; checkOut?: string; overtimeHours?: number;
  }): void {
    db.prepare(`
      INSERT OR REPLACE INTO shift_attendance (id, employee_id, attendance_date, check_in_time, check_out_time, status, overtime_hours, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    `).run(crypto.randomUUID(), data.employeeId, data.date, data.checkIn || null,
      data.checkOut || null, data.status, data.overtimeHours || 0);
  }
}

export const hrRepo = new HrRepository();
