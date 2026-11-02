import { notFound } from 'next/navigation';

const MODULES: Record<string, { title: string; description: string }> = {
  crm: {
    title: 'CRM',
    description: 'Manage customer relationships, leads, and follow-ups.',
  },
  projects: {
    title: 'Projects',
    description: 'Organize project plans, teams, schedules, and progress.',
  },
  construction: {
    title: 'Construction',
    description: 'Coordinate construction activities, sites, and progress.',
  },
  interiors: {
    title: 'Interiors',
    description: 'Coordinate interior design and execution work.',
  },
  'land-development': {
    title: 'Land Development',
    description: 'Track land development and real estate activities.',
  },
  procurement: {
    title: 'Procurement',
    description: 'Coordinate purchasing, supplier information, and orders.',
  },
  inventory: {
    title: 'Inventory',
    description: 'Keep track of stock, materials, and inventory movements.',
  },
  accounts: {
    title: 'Accounts & Finance',
    description: 'Access finance and accounting workflows.',
  },
  hr: {
    title: 'HR & Payroll',
    description: 'Manage employee and payroll workflows.',
  },
  reports: {
    title: 'Reports',
    description: 'Review business reports across ERP modules.',
  },
  documents: {
    title: 'Document Management',
    description: 'Organize and access business documents.',
  },
  masters: {
    title: 'Masters',
    description: 'Maintain shared reference data for the ERP.',
  },
  users: {
    title: 'User Management',
    description: 'Manage ERP users and their access.',
  },
  settings: {
    title: 'Settings',
    description: 'Configure ERP preferences and system options.',
  },
};

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  const page = MODULES[module];

  if (!page) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">ERP Module</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{page.title}</h1>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-700">{page.description}</p>
        <div className="mt-5 rounded-md bg-amber-50 p-4 text-sm text-amber-900">
          This starter page is ready to navigate to. Module workflows and data
          views have not been implemented yet.
        </div>
      </div>
    </section>
  );
}
