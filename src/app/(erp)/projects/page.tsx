'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FolderKanban, MapPin, Calendar, DollarSign, Building, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { AutoSaveIndicator, SaveStatus } from '@/components/ui/AutoSaveIndicator';
import { AutoSaveInput } from '@/components/ui/AutoSaveInput';
import { AutoSaveSelect } from '@/components/ui/AutoSaveSelect';
import { AutoSaveTextarea } from '@/components/ui/AutoSaveTextarea';

function formatInr(paise: number) {
  const rupees = paise / 100;
  if (rupees >= 10000000) return `₹${(rupees / 10000000).toFixed(2)} Cr`;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(2)} L`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<any | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const fetchProjects = useCallback(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => {
        setProjects(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleOpenNewProject() {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/projects/draft', { method: 'POST' });
      const draft = await res.json();
      setActiveProject(draft);
      setSaveStatus('saved');
      setLastSaved(new Date());
      fetchProjects();
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleFieldSave(field: string, value: any) {
    if (!activeProject) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/projects/${activeProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (data.project) {
        setActiveProject(data.project);
      } else {
        setActiveProject((prev: any) => ({ ...prev, [field]: value }));
      }
      setSaveStatus('saved');
      setLastSaved(new Date());
      fetchProjects();
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleDeleteProject(id: string) {
    if (!confirm('Are you sure you want to delete this project workspace?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (activeProject?.id === id) setActiveProject(null);
    fetchProjects();
  }

  const columns = [
    {
      key: 'project_code',
      header: 'Project Code',
      render: (row: any) => (
        <button
          onClick={() => setActiveProject(row)}
          className="font-mono font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded text-xs transition-colors"
        >
          {row.project_code}
        </button>
      ),
    },
    {
      key: 'name',
      header: 'Project Name & Client',
      render: (row: any) => (
        <div
          onClick={() => setActiveProject(row)}
          className="cursor-pointer hover:text-blue-600 transition-colors"
        >
          <div className="font-semibold text-slate-800 text-xs">{row.name}</div>
          <div className="text-[11px] text-slate-400">{row.client_name || 'Internal Development'}</div>
        </div>
      ),
    },
    {
      key: 'vertical_name',
      header: 'Business Vertical',
      render: (row: any) => (
        <Badge variant={row.vertical_code === 'CONSTRUCTION' ? 'info' : row.vertical_code === 'INTERIORS' ? 'purple' : 'success'}>
          {row.vertical_name || 'General'}
        </Badge>
      ),
    },
    {
      key: 'location_city',
      header: 'Location',
      render: (row: any) => (
        <div className="flex items-center gap-1 text-slate-600 text-xs">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.location_city || '—'}</span>
        </div>
      ),
    },
    {
      key: 'estimated_budget_paise',
      header: 'Estimated Budget',
      render: (row: any) => (
        <span className="font-mono font-bold text-slate-800 text-xs">
          {formatInr(row.estimated_budget_paise || 0)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => (
        <select
          value={row.status}
          onChange={async (e) => {
            await fetch(`/api/projects/${row.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: e.target.value }),
            });
            fetchProjects();
          }}
          className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-slate-700"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="ON_HOLD">ON HOLD</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setActiveProject(row)}>
            Edit
          </Button>
          <button
            onClick={() => handleDeleteProject(row.id)}
            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
            title="Delete Project"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Multi-Vertical Project Workspaces</h1>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Zero-Click AutoSave
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Civil construction schedules, interior turnkey fit-outs, and plotted real estate schemes with instant persistence.
          </p>
        </div>
        <Button onClick={handleOpenNewProject} icon={<Plus className="w-4 h-4" />}>
          New Project (AutoSave)
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Active Projects" value={projects.length} subtext="Across All 3 Verticals" icon={<FolderKanban className="w-4 h-4" />} />
        <StatCard label="Combined Pipeline Budget" value="₹65.00 Cr" subtext="Construction + Interiors + Land" icon={<DollarSign className="w-4 h-4" />} colorClass="text-emerald-600" />
        <StatCard label="On-Time Delivery Index" value="98.2%" subtext="Within Target Baseline" icon={<Building className="w-4 h-4" />} colorClass="text-blue-600" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">Master Project Register</span>
          <Badge variant="default">{projects.length} Registered</Badge>
        </div>
        <DataTable
          columns={columns}
          data={projects}
          onRowDoubleClick={(row) => setActiveProject(row)}
          searchable
          searchPlaceholder="Search projects by code, name, city..."
          searchFilter={(item, q) =>
            item.name?.toLowerCase().includes(q) ||
            item.project_code?.toLowerCase().includes(q) ||
            item.location_city?.toLowerCase().includes(q)
          }
        />
      </div>

      {/* AutoSave Project Editor Modal */}
      {activeProject && (
        <Modal
          open={!!activeProject}
          onClose={() => setActiveProject(null)}
          title={`Project Workspace: ${activeProject.project_code}`}
          size="lg"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-600">
                Workspace ID: <span className="font-mono text-slate-900 font-semibold">{activeProject.id.slice(0, 8)}...</span>
              </div>
              <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSaved} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name</label>
                <AutoSaveInput
                  value={activeProject.name || ''}
                  onSave={(val) => handleFieldSave('name', val)}
                  placeholder="e.g. Royal Palm Luxury Villas"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location City</label>
                <AutoSaveInput
                  value={activeProject.location_city || ''}
                  onSave={(val) => handleFieldSave('locationCity', val)}
                  placeholder="e.g. Mysuru"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                <AutoSaveInput
                  type="date"
                  value={activeProject.start_date || ''}
                  onSave={(val) => handleFieldSave('startDate', val)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Completion Date</label>
                <AutoSaveInput
                  type="date"
                  value={activeProject.target_completion_date || ''}
                  onSave={(val) => handleFieldSave('targetCompletionDate', val)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Status</label>
                <AutoSaveSelect
                  value={activeProject.status || 'ACTIVE'}
                  onSave={(val) => handleFieldSave('status', val)}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_HOLD">ON HOLD</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </AutoSaveSelect>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Budget (Paise)</label>
              <AutoSaveInput
                type="number"
                value={activeProject.estimated_budget_paise || 0}
                onSave={(val) => handleFieldSave('estimatedBudgetPaise', Number(val))}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Formatted: {formatInr(activeProject.estimated_budget_paise || 0)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Site Address</label>
              <AutoSaveInput
                value={activeProject.location_address || ''}
                onSave={(val) => handleFieldSave('locationAddress', val)}
                placeholder="Survey number, road, landmark..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scope & Engineering Description</label>
              <AutoSaveTextarea
                rows={3}
                value={activeProject.description || ''}
                onSave={(val) => handleFieldSave('description', val)}
                placeholder="Detailed scope of works, structural highlights, specifications..."
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteProject(activeProject.id)}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Project
              </Button>
              <Button variant="secondary" onClick={() => setActiveProject(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
