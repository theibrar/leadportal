'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Plus, Link2, Copy, Check, Users, Webhook, Sparkles, Edit, Trash2, Globe, ShieldCheck } from 'lucide-react';
import { WebhookCopyBox } from '@/components/WebhookCopyBox';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';

const PRESET_CAMPAIGNS = [
  { name: 'Affordable Care Act (ACA)', code: 'ACA', description: 'Health insurance open enrollment & ACA lead intake.' },
  { name: 'Auto Insurance (AUTO)', code: 'AUTO', description: 'Automobile insurance policy comparison leads.' },
  { name: 'Diabetes (DB)', code: 'DB', description: 'Specialized healthcare & diabetes management support leads.' },
  { name: 'Final Expense (FE)', code: 'FE', description: 'Senior life insurance & final expense planning leads.' },
  { name: 'Home Improvements (HOME)', code: 'HOME', description: 'Residential roofing, solar, and remodeling leads.' },
  { name: 'MVA - Apply (APPLY)', code: 'APPLY', description: 'Motor Vehicle Accident application qualification leads.' },
  { name: 'MVA - Claimz (CLAIMZ)', code: 'CLAIMZ', description: 'Motor Vehicle Accident legal claims intake.' },
  { name: 'MVA - First (FIRST)', code: 'FIRST', description: 'Motor Vehicle Accident first response leads.' },
  { name: 'MVA - Select (SELECT)', code: 'SELECT', description: 'Motor Vehicle Accident selected legal partner leads.' },
  { name: 'Medicare (MED)', code: 'MED', description: 'Medicare Advantage & Supplement insurance leads.' },
  { name: 'Motor Vehicle Accident (MVA)', code: 'MVA', description: 'General Motor Vehicle Accident injury lead intake.' },
];

export default function CampaignsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isEditCampaignModalOpen, setIsEditCampaignModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditAssignmentModalOpen, setIsEditAssignmentModalOpen] = useState(false);

  // Form states
  const [campaignForm, setCampaignForm] = useState({ name: '', code: '', description: '' });
  const [editCampaignForm, setEditCampaignForm] = useState({ id: '', name: '', code: '', description: '' });
  const [assignForm, setAssignForm] = useState({ clientId: '', campaignId: '', allowedDomains: '' });
  const [editAssignmentForm, setEditAssignmentForm] = useState({ assignmentId: '', clientName: '', campaignName: '', allowedDomains: '', isActive: true });

  const fetchData = async () => {
    const [cRes, clRes] = await Promise.all([fetch('/api/admin/campaigns'), fetch('/api/admin/clients')]);
    const cData = await cRes.json();
    const clData = await clRes.json();

    setCampaigns(cData.campaigns || []);
    setClients(clData.clients || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectPreset = (presetCode: string) => {
    const preset = PRESET_CAMPAIGNS.find((p) => p.code === presetCode);
    if (preset) {
      setCampaignForm({
        name: preset.name,
        code: preset.code,
        description: preset.description,
      });
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignForm),
    });
    const data = await res.json();

    if (data.success) {
      setIsCampaignModalOpen(false);
      setCampaignForm({ name: '', code: '', description: '' });
      toast.success('Campaign template created successfully!');
      fetchData();
    } else {
      toast.error(data.error || 'Failed to create campaign');
    }
  };

  const handleEditCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/admin/campaigns/${editCampaignForm.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editCampaignForm.name,
        code: editCampaignForm.code,
        description: editCampaignForm.description,
      }),
    });
    const data = await res.json();

    if (data.success) {
      setIsEditCampaignModalOpen(false);
      toast.success('Campaign details updated successfully!');
      fetchData();
    } else {
      toast.error(data.error || 'Failed to update campaign');
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Campaign',
      message: `Are you sure you want to delete campaign "${name}"? Any assigned client webhooks and leads for this campaign will be removed.`,
      confirmText: 'Delete Campaign',
      variant: 'danger',
    });
    if (!confirmed) return;

    const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (data.success) {
      toast.success(`Campaign "${name}" was deleted successfully.`);
      fetchData();
    } else {
      toast.error(data.error || 'Failed to delete campaign');
    }
  };

  const handleAssignCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/assign-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignForm),
    });
    const data = await res.json();

    if (data.success) {
      setIsAssignModalOpen(false);
      setAssignForm({ clientId: '', campaignId: '', allowedDomains: '' });
      fetchData();
      toast.success(`Webhook generated successfully! Token: ${data.assignment.webhookToken}`);
    } else {
      toast.error(data.error || 'Failed to assign campaign');
    }
  };

  const handleEditAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/assign-campaign', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignmentId: editAssignmentForm.assignmentId,
        allowedDomains: editAssignmentForm.allowedDomains,
        isActive: editAssignmentForm.isActive,
      }),
    });
    const data = await res.json();

    if (data.success) {
      setIsEditAssignmentModalOpen(false);
      toast.success('Webhook assignment updated successfully!');
      fetchData();
    } else {
      toast.error(data.error || 'Failed to update assignment settings');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string, clientName: string, campaignName: string) => {
    const confirmed = await confirm({
      title: 'Delete Webhook Assignment',
      message: `Are you sure you want to delete the webhook assignment for "${clientName}" on campaign "${campaignName}"? This will permanently delete the webhook URL and all its associated leads and logs.`,
      confirmText: 'Delete Permanently',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/assign-campaign?assignmentId=${assignmentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Webhook assignment deleted successfully.');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to delete assignment');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Campaigns & Webhook Assignment Engine</h1>
          <p className="text-sm text-slate-500 font-medium">Manage campaign templates, edit/delete campaigns, assign to tenants, and generate webhooks</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCampaignModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Create Campaign
          </button>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            <Link2 className="w-4 h-4" /> Assign Campaign & Gen Webhook
          </button>
        </div>
      </div>

      {/* Preset Badges Quick Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" /> Industry Standard Campaign Presets ({PRESET_CAMPAIGNS.length})
          </span>
          <span className="text-[10px] text-slate-500">Click any preset to create instantly</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_CAMPAIGNS.map((p) => (
            <button
              key={p.code}
              onClick={() => {
                setCampaignForm({ name: p.name, code: p.code, description: p.description });
                setIsCampaignModalOpen(true);
              }}
              className="px-2.5 py-1 bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-200 rounded-lg text-xs font-semibold text-blue-700 transition-all flex items-center gap-1.5"
            >
              <span>{p.name}</span>
              <span className="font-mono text-[10px] opacity-75 font-bold">[{p.code}]</span>
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-500 font-medium">Loading campaign architecture...</div>
        ) : (
          campaigns.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                    <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                      CODE: {c.code}
                    </span>
                  </div>

                  {/* Action Buttons: Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-bold text-emerald-700 mr-1">
                      {c._count?.leads || 0} Leads
                    </span>

                    <button
                      onClick={() => {
                        setEditCampaignForm({
                          id: c.id,
                          name: c.name,
                          code: c.code,
                          description: c.description || '',
                        });
                        setIsEditCampaignModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white transition-all"
                      title="Edit Campaign"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteCampaign(c.id, c.name)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-600 text-slate-600 hover:text-white transition-all"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium">{c.description || 'No description provided.'}</p>
              </div>

              {/* Assigned Tenants */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Client Webhooks ({c.assignments?.length || 0})</p>
                {c.assignments?.map((a: any) => (
                  <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5 truncate mr-2">
                        <Users className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" /> <span className="truncate">{a.client?.name}</span>
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase flex-shrink-0 ${
                          a.isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {a.isActive ? 'ACTIVE' : 'PAUSED'}
                        </span>
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditAssignmentForm({
                              assignmentId: a.id,
                              clientName: a.client?.name || '',
                              campaignName: c.name,
                              allowedDomains: a.allowedDomains || '',
                              isActive: a.isActive,
                            });
                            setIsEditAssignmentModalOpen(true);
                          }}
                          className="p-1 rounded bg-slate-200/60 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1 px-2 text-slate-700"
                          title="Edit Webhook Settings & Whitelisted Domains"
                        >
                          <Globe className="w-3 h-3 text-indigo-600" /> Edit Settings
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(a.id, a.client?.name || '', c.name)}
                          className="p-1 rounded bg-slate-200/60 hover:bg-red-600 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1 px-1.5 text-slate-700"
                          title="Delete Webhook Assignment"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Allowed Domains Badge */}
                    <div className="text-[10px]">
                      {a.allowedDomains && a.allowedDomains.trim() ? (
                        <span
                          className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full cursor-help"
                          title={`Whitelisted Ingestion Domains:\n${a.allowedDomains}`}
                        >
                          <ShieldCheck className="w-3 h-3 text-indigo-600" />
                          Domain Whitelist: {a.allowedDomains.split(/[\n,\s]+/).filter(Boolean).join(', ')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                          <Globe className="w-3 h-3 text-slate-400" /> Any Domain Allowed
                        </span>
                      )}
                    </div>

                    <WebhookCopyBox webhookUrl={`/api/webhooks/ingest/${a.webhookToken}`} />
                  </div>
                ))}
                {(!c.assignments || c.assignments.length === 0) && (
                  <p className="text-xs text-slate-400 italic">Not assigned to any client yet.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Campaign */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Campaign Template</h3>
              <button onClick={() => setIsCampaignModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block text-blue-700 font-bold mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Quick Select Industry Preset
                </label>
                <select
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="w-full bg-slate-50 border border-blue-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-bold text-xs"
                >
                  <option value="">-- Choose Preset to Auto-Fill --</option>
                  {PRESET_CAMPAIGNS.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Affordable Care Act (ACA)"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Campaign Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ACA"
                  value={campaignForm.code}
                  onChange={(e) => setCampaignForm({ ...campaignForm, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 uppercase font-mono focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  placeholder="Campaign objective and notes..."
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  rows={3}
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20">
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Campaign */}
      {isEditCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600" /> Edit Campaign Details
              </h3>
              <button onClick={() => setIsEditCampaignModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <form onSubmit={handleEditCampaignSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={editCampaignForm.name}
                  onChange={(e) => setEditCampaignForm({ ...editCampaignForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Campaign Code *</label>
                <input
                  type="text"
                  required
                  value={editCampaignForm.code}
                  onChange={(e) => setEditCampaignForm({ ...editCampaignForm, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 uppercase font-mono focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  value={editCampaignForm.description}
                  onChange={(e) => setEditCampaignForm({ ...editCampaignForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  rows={3}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditCampaignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Campaign to Client */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Webhook className="w-5 h-5 text-blue-600" /> Assign Campaign & Auto-Gen Webhook
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <form onSubmit={handleAssignCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Client Tenant *</label>
                <select
                  required
                  value={assignForm.clientId}
                  onChange={(e) => setAssignForm({ ...assignForm, clientId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.companyCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Campaign *</label>
                <select
                  required
                  value={assignForm.campaignId}
                  onChange={(e) => setAssignForm({ ...assignForm, campaignId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                >
                  <option value="">-- Choose Campaign --</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" /> Whitelisted Ingestion Domains (Security)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <textarea
                  placeholder="e.g. landingpage.com, myagency.com&#10;(Separate multiple domains with commas or newlines. Leave blank to allow any origin)"
                  value={assignForm.allowedDomains}
                  onChange={(e) => setAssignForm({ ...assignForm, allowedDomains: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono text-[11px]"
                  rows={2}
                ></textarea>
                <p className="text-[10px] text-slate-500 mt-1">If specified, webhook ingestion requests from unlisted domains will be rejected with HTTP 403.</p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-700 font-medium">
                ⚡ Assigning will instantly generate a unique endpoint (`/api/webhooks/ingest/whk_...`) with isolated client-bound database routing.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20">
                  Assign & Generate Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Webhook Security & Whitelisted Domains */}
      {isEditAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" /> Webhook Ingestion Domain Security
              </h3>
              <button onClick={() => setIsEditAssignmentModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleEditAssignmentSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-slate-900 font-bold">{editAssignmentForm.clientName}</p>
                <p className="text-slate-500 font-medium">Campaign: {editAssignmentForm.campaignName}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" /> Whitelisted Ingestion Domains
                  </span>
                </label>
                <textarea
                  placeholder="e.g. landingpage.com, myagency.com&#10;(Separate multiple domains with commas or newlines. Leave blank to allow any origin)"
                  value={editAssignmentForm.allowedDomains}
                  onChange={(e) => setEditAssignmentForm({ ...editAssignmentForm, allowedDomains: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono text-[11px]"
                  rows={3}
                ></textarea>
                <p className="text-[10px] text-slate-500 mt-1">
                  Requests coming from domains not listed here will be blocked before entering your database and logged as REJECTED.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Webhook Status</label>
                <select
                  value={editAssignmentForm.isActive ? 'active' : 'paused'}
                  onChange={(e) => setEditAssignmentForm({ ...editAssignmentForm, isActive: e.target.value === 'active' })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-bold text-xs"
                >
                  <option value="active">Active (Accept leads)</option>
                  <option value="paused">Paused (Reject incoming leads)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditAssignmentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20">
                  Save Security Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
