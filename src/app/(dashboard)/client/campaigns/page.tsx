'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Copy, Check, Code, Webhook, Trash2, Globe, ShieldCheck, Play, Pause } from 'lucide-react';
import { WebhookCopyBox } from '@/components/WebhookCopyBox';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';

export default function ClientCampaignsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'curl' | 'js'>('curl');

  // Edit Assignment modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    allowedDomains: '',
    isActive: true,
  });

  const fetchCampaigns = () => {
    setLoading(true);
    fetch('/api/client/campaigns')
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(data.campaigns || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/client/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: editForm.id,
          allowedDomains: editForm.allowedDomains,
          isActive: editForm.isActive,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setIsEditModalOpen(false);
        toast.success('Campaign webhook settings updated successfully!');
        fetchCampaigns();
      } else {
        toast.error(data.error || 'Failed to update campaign settings');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    }
  };

  const handleDeleteWebhook = async (assignmentId: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Webhook Integration',
      message: `Are you sure you want to delete the webhook for campaign "${name}"? Incoming traffic will immediately be rejected, and all associated leads and logs will be permanently deleted.`,
      confirmText: 'Delete Permanently',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/client/campaigns?assignmentId=${assignmentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Webhook campaign assignment deleted successfully.');
        fetchCampaigns();
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
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Campaigns & Webhook Integration Hub</h1>
        <p className="text-sm text-slate-500 font-medium">Manage your active webhook endpoints, customize allowed domain access, and retrieve page snippets</p>
      </div>

      {/* Campaigns Grid */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs font-medium">
            Loading assigned campaign webhooks...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs font-medium">
            No campaigns currently assigned to your account. Contact your administrator.
          </div>
        ) : (
          campaigns.map((c) => {
            const sampleUrl = typeof window !== 'undefined' ? `${window.location.origin}${c.webhookUrl}` : c.webhookUrl;

            const curlSnippet = `curl -X POST "${sampleUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1 555-0199",
    "source": "Landing Page Form"
  }'`;

            const jsSnippet = `await fetch("${sampleUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 555-0199",
    source: "Landing Page Form"
  })
});`;

            return (
              <div key={c.id} className={`bg-white p-6 rounded-2xl border transition-all space-y-4 ${
                c.isActive ? 'border-slate-200 shadow-xs' : 'border-red-200 bg-red-50/10 opacity-90'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-blue-600" /> {c.name}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        c.isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {c.isActive ? 'Active' : 'Paused'}
                      </span>
                    </h3>
                    <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold inline-block">
                      CAMPAIGN CODE: {c.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-bold text-emerald-700">
                      {c.leadCount} Ingested Leads
                    </span>

                    {/* Manage Button */}
                    <button
                      onClick={() => {
                        setEditForm({
                          id: c.id,
                          name: c.name,
                          allowedDomains: c.allowedDomains || '',
                          isActive: c.isActive,
                        });
                        setIsEditModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-xs"
                    >
                      <Globe className="w-3.5 h-3.5 text-indigo-600" /> Settings
                    </button>

                    {/* Delete Webhook Button */}
                    <button
                      onClick={() => handleDeleteWebhook(c.id, c.name)}
                      className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all"
                      title="Delete Webhook"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium">{c.description || 'No description provided.'}</p>

                {/* Domain Whitelist Badge Display */}
                <div>
                  {c.allowedDomains && c.allowedDomains.trim() ? (
                    <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      Domain Whitelist: {c.allowedDomains.split(/[\n,\s]+/).filter(Boolean).join(', ')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-slate-500 text-xs">
                      <Globe className="w-3.5 h-3.5 text-slate-400" /> Any Request Origin Allowed
                    </span>
                  )}
                </div>

                {/* Webhook Copy Box */}
                <WebhookCopyBox webhookUrl={c.webhookUrl} campaignName={c.name} />

                {/* Code Integration Box */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-blue-600" /> Code Snippet Generator
                    </span>
                    <div className="flex bg-white p-1 rounded-lg border border-slate-200 text-xs">
                      <button
                        onClick={() => setActiveSnippetTab('curl')}
                        className={`px-3 py-1 rounded font-mono font-bold transition-all ${
                          activeSnippetTab === 'curl' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-600'
                        }`}
                      >
                        cURL
                      </button>
                      <button
                        onClick={() => setActiveSnippetTab('js')}
                        className={`px-3 py-1 rounded font-mono font-bold transition-all ${
                          activeSnippetTab === 'js' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-600'
                        }`}
                      >
                        JavaScript (fetch)
                      </button>
                    </div>
                  </div>

                  <pre className="bg-slate-900 p-4 rounded-xl text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800">
                    {activeSnippetTab === 'curl' ? curlSnippet : jsSnippet}
                  </pre>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Edit Webhook Settings (Client Side) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" /> Webhook Settings & Security
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-slate-900 font-bold">Campaign: {editForm.name}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" /> Whitelisted Ingestion Domains
                  </span>
                </label>
                <textarea
                  placeholder="e.g. landingpage.com, myagency.com&#10;(Separate multiple domains with commas or newlines. Leave blank to allow any origin)"
                  value={editForm.allowedDomains}
                  onChange={(e) => setEditForm({ ...editForm, allowedDomains: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono text-[11px]"
                  rows={3}
                ></textarea>
                <p className="text-[10px] text-slate-500 mt-1">
                  Requests originating from domains not listed here will be rejected with HTTP 403.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Webhook Intake Status</label>
                <select
                  value={editForm.isActive ? 'active' : 'paused'}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-bold text-xs"
                >
                  <option value="active">Active (Accept incoming leads)</option>
                  <option value="paused">Paused (Temporarily reject incoming leads)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20">
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
