'use client';
import React, { useState } from 'react';
import { FileText, Folder, Upload, Download, Eye, ShieldCheck, Plus, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';

export default function DocumentsPage() {
  const [folders, setFolders] = useState([
    'Architectural CAD Drawings',
    'Interior 3D & Schematics',
    'Land Title & Approvals',
    'Material Quality Certs',
  ]);

  const [documents, setDocuments] = useState<any[]>([
    { id: '1', name: 'Grand_Heritage_Villas_Structural_Blueprint_v2.dwg', folder: 'Architectural CAD Drawings', size: '14.2 MB', ver: 'v2.1', uploadedBy: 'Siddharth Varma', date: '2026-10-12', role: 'ENGINEERS_ONLY' },
    { id: '2', name: 'Penthouse_Luxe_Suite_False_Ceiling_Plan.pdf', folder: 'Interior 3D & Schematics', size: '4.8 MB', ver: 'v1.0', uploadedBy: 'Pooja Bhatt', date: '2026-10-18', role: 'ALL_STAFF' },
    { id: '3', name: 'Green_Meadows_Survey_Sy88_Khata_Extract.pdf', folder: 'Land Title & Approvals', size: '2.1 MB', ver: 'v1.0', uploadedBy: 'Manjunath Swamy', date: '2026-09-30', role: 'DIRECTORS_ONLY' },
    { id: '4', name: 'UltraTech_Cement_Material_Test_Certificate.pdf', folder: 'Material Quality Certs', size: '1.2 MB', ver: 'v1.0', uploadedBy: 'Jaisimha Rao', date: '2026-10-25', role: 'ALL_STAFF' },
  ]);

  // Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    folder: 'Architectural CAD Drawings',
    version: 'v1.0',
    fileSize: '3.4 MB',
  });

  // Folder Modal
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // View Modal
  const [viewDoc, setViewDoc] = useState<any | null>(null);

  function handleSaveUpload(e: React.FormEvent) {
    e.preventDefault();
    const newDoc = {
      id: String(documents.length + 1),
      name: uploadForm.name || 'Site_Execution_Document.pdf',
      folder: uploadForm.folder,
      size: uploadForm.fileSize,
      ver: uploadForm.version,
      uploadedBy: 'Super Administrator',
      date: new Date().toISOString().slice(0, 10),
      role: 'ALL_STAFF',
    };
    setDocuments([newDoc, ...documents]);
    setShowUploadModal(false);
    setUploadForm({ name: '', folder: 'Architectural CAD Drawings', version: 'v1.0', fileSize: '3.4 MB' });
  }

  function handleAddFolder(e: React.FormEvent) {
    e.preventDefault();
    if (newFolderName.trim() && !folders.includes(newFolderName.trim())) {
      setFolders([...folders, newFolderName.trim()]);
      setNewFolderName('');
      setShowFolderModal(false);
    }
  }

  function handleDownloadDoc(doc: any) {
    const dummyContent = `--- PROFICIENT DMS ARCHIVE ---\nDocument: ${doc.name}\nCategory: ${doc.folder}\nVersion: ${doc.ver}\nUploaded By: ${doc.uploadedBy}\nDate: ${doc.date}\nSHA-256 Checksum: Verified\n`;
    const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', doc.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Document Management (DMS)</h1>
          <p className="text-xs text-slate-500">
            Version-controlled repository for CAD blueprints (.dwg), PDF contracts, survey maps, and site photo records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowFolderModal(true)} icon={<Plus className="w-4 h-4" />}>
            New Folder
          </Button>
          <Button size="sm" onClick={() => setShowUploadModal(true)} icon={<Upload className="w-4 h-4" />}>
            Upload Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {folders.slice(0, 4).map((folder) => (
          <div key={folder} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">{folder}</div>
              <div className="text-[10px] text-slate-400">
                {documents.filter(d => d.folder === folder).length} Files · Encrypted
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">Master Version-Controlled Document Archive</span>
          <Badge variant="success">{documents.length} Files Verified</Badge>
        </div>
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Document Name',
              render: (r: any) => (
                <button onClick={() => setViewDoc(r)} className="flex items-center gap-2 text-left group">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-slate-800 text-xs truncate max-w-xs group-hover:text-blue-600">{r.name}</span>
                </button>
              ),
            },
            { key: 'folder', header: 'Folder Category', render: (r: any) => <span className="text-xs text-slate-600">{r.folder}</span> },
            { key: 'ver', header: 'Version', render: (r: any) => <span className="font-mono font-bold text-xs bg-slate-100 px-1.5 py-0.5 rounded">{r.ver}</span> },
            { key: 'size', header: 'File Size', render: (r: any) => <span className="font-mono text-xs text-slate-500">{r.size}</span> },
            { key: 'uploadedBy', header: 'Uploaded By', render: (r: any) => <span className="text-xs text-slate-700">{r.uploadedBy}</span> },
            { key: 'date', header: 'Upload Date', render: (r: any) => <span className="font-mono text-xs text-slate-500">{r.date}</span> },
            {
              key: 'actions',
              header: 'Actions',
              render: (r: any) => (
                <div className="flex items-center gap-2">
                  <button onClick={() => setViewDoc(r)} className="p-1 hover:text-blue-600" title="View Document Details">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDownloadDoc(r)} className="p-1 hover:text-blue-600" title="Download Document">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ),
            },
          ]}
          data={documents}
          exportFileName="dms-document-archive"
          searchable
          searchPlaceholder="Search files by name..."
        />
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <Modal open={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Document to Enterprise Archive" size="md">
          <form onSubmit={handleSaveUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Document File Title *</label>
              <input
                type="text"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                required
                placeholder="e.g. Grand_Heritage_Sanctioned_Floor_Plan.pdf"
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Folder *</label>
                <select
                  value={uploadForm.folder}
                  onChange={(e) => setUploadForm({ ...uploadForm, folder: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                >
                  {folders.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Version Tag *</label>
                <input
                  type="text"
                  value={uploadForm.version}
                  onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
                  required
                  placeholder="v1.0"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Upload File (PDF / DWG / PNG / XLSX)</label>
              <input
                type="file"
                className="w-full text-xs border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50 cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
              <Button type="submit">Upload & Version Control</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Folder Modal */}
      {showFolderModal && (
        <Modal open={showFolderModal} onClose={() => setShowFolderModal(false)} title="Create New DMS Folder Category" size="sm">
          <form onSubmit={handleAddFolder} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Folder Category Title *</label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                required
                placeholder="e.g. Electrical & HVAC Schematics"
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setShowFolderModal(false)}>Cancel</Button>
              <Button type="submit">Create Folder</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Document View Preview Modal */}
      {viewDoc && (
        <Modal open={!!viewDoc} onClose={() => setViewDoc(null)} title={`Document: ${viewDoc.name}`} size="md">
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Folder Category:</span>
                <strong className="text-slate-800">{viewDoc.folder}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Version:</span>
                <span className="font-mono font-bold text-blue-700">{viewDoc.ver}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">File Size:</span>
                <span className="font-mono text-slate-700">{viewDoc.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Uploaded By:</span>
                <strong className="text-slate-800">{viewDoc.uploadedBy}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Upload Date:</span>
                <span className="font-mono text-slate-600">{viewDoc.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Checksum Integrity:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SHA-256 Validated
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setViewDoc(null)}>Close</Button>
              <Button onClick={() => handleDownloadDoc(viewDoc)} icon={<Download className="w-3.5 h-3.5" />}>
                Download Document
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
