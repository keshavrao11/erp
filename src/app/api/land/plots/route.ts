import { NextRequest, NextResponse } from 'next/server';
import { landRepo } from '@/repositories/land.repository';
import { requireAuth, withErrorHandler } from '@/lib/auth/rbac';
import { db } from '@/lib/db/connection';
import { z } from 'zod';

const createSchema = z.object({
  projectId: z.string().uuid(),
  plotNumber: z.string(),
  phaseBlock: z.string(),
  areaSqft: z.number().positive(),
  dimensions: z.string().optional(),
  facing: z.string().optional(),
  plotType: z.string().optional(),
  baseRatePerSqftPaise: z.number().int().positive(),
  amenityChargesPaise: z.number().int().optional(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { session } = await requireAuth(req, 'LAND_DEVELOPMENT', 'VIEW');
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  
  if (projectId) {
    return NextResponse.json(landRepo.getPlots(projectId, { status: searchParams.get('status') || undefined }));
  }

  // If no projectId specified, get all plots for the company's land development projects
  const plots = db.prepare(`
    SELECT pi.*, p.name as project_name, pb.booking_number, c.full_name as customer_name
    FROM plot_inventory pi
    JOIN projects p ON p.id = pi.project_id
    LEFT JOIN plot_bookings pb ON pb.plot_id = pi.id AND pb.status != 'CANCELLED'
    LEFT JOIN customers c ON c.id = pb.customer_id
    WHERE p.company_id = ?
    ORDER BY pi.plot_number
  `).all(session.companyId);

  return NextResponse.json(plots);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'LAND_DEVELOPMENT', 'CREATE');
  const body = createSchema.parse(await req.json());
  const id = landRepo.createPlot(body);
  return NextResponse.json({ id }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  await requireAuth(req, 'LAND_DEVELOPMENT', 'EDIT');
  const { id, status, baseRatePerSqftPaise, notes } = await req.json();
  if (status) {
    db.prepare(`UPDATE plot_inventory SET status = ? WHERE id = ?`).run(status, id);
  }
  if (baseRatePerSqftPaise !== undefined) {
    db.prepare(`UPDATE plot_inventory SET base_rate_per_sqft_paise = ?, total_price_paise = CAST(area_sqft * ? AS INTEGER) WHERE id = ?`)
      .run(baseRatePerSqftPaise, baseRatePerSqftPaise, id);
  }
  if (notes !== undefined) {
    db.prepare(`UPDATE plot_inventory SET notes = ? WHERE id = ?`).run(notes, id);
  }
  return NextResponse.json({ success: true });
});
