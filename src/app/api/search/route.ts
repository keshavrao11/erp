import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const pattern = `%${q}%`;

    const projects = db.prepare(`
      SELECT id, code, name, 'project' as type, '/projects' as url
      FROM projects 
      WHERE (name LIKE ? OR code LIKE ?) AND is_active = 1
      LIMIT 4
    `).all(pattern, pattern);

    const leads = db.prepare(`
      SELECT id, enquiry_number as code, customer_name as name, 'lead' as type, '/crm' as url
      FROM enquiries 
      WHERE customer_name LIKE ? OR enquiry_number LIKE ?
      LIMIT 4
    `).all(pattern, pattern);

    const materials = db.prepare(`
      SELECT id, item_code as code, name, 'material' as type, '/masters' as url
      FROM materials 
      WHERE name LIKE ? OR item_code LIKE ?
      LIMIT 4
    `).all(pattern, pattern);

    const plots = db.prepare(`
      SELECT id, plot_number as code, ('Plot ' || plot_number || ' (' || status || ')') as name, 'plot' as type, '/land-development' as url
      FROM plots 
      WHERE plot_number LIKE ?
      LIMIT 4
    `).all(pattern);

    const employees = db.prepare(`
      SELECT id, employee_code as code, (first_name || ' ' || last_name || ' · ' || designation) as name, 'employee' as type, '/hr' as url
      FROM employees 
      WHERE (first_name LIKE ? OR last_name LIKE ? OR employee_code LIKE ?) AND is_active = 1
      LIMIT 4
    `).all(pattern, pattern, pattern);

    const vouchers = db.prepare(`
      SELECT id, voucher_number as code, narration as name, 'voucher' as type, '/accounts' as url
      FROM vouchers 
      WHERE voucher_number LIKE ? OR narration LIKE ?
      LIMIT 4
    `).all(pattern, pattern);

    const results = [
      ...projects,
      ...leads,
      ...plots,
      ...materials,
      ...employees,
      ...vouchers,
    ];

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

