'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Building2, Trash2, Edit, Ban, CheckCircle2, Copy, Check, Key } from 'lucide-react';

export default function ClientsManagementPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState<string>('');

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', companyCode: '', contactEmail: '', contactPhone: '', password: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    contactEmail: '',
    contactPhone: '',
    isActive: true,
    newPassword: '',
  });

  const fetchClients = () => {
    fetch('/api/admin/clients')
      .then((res) => res.json())
      .then((data) => {
        setClients(data.clients || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCopyWebhook = (token: string) => {
    const fullUrl = `${window.location.origin}/api/webhooks/ingest/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(''), 2000);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      setModalLoading(false);

      if (data.success) {
        setCreatedCredentials(data.generatedCredentials);
        fetchClients();
      } else {
        alert(data.error || 'Failed to create client');
      }
    } catch (err) {
      setModalLoading(false);
      alert('An error occurred');
    }
  };

  const handleEditClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          contactEmail: editForm.contactEmail,
          contactPhone: editForm.contactPhone,
          isActive: editForm.isActive,
          newPassword: editForm.newPassword,
        }),
      });
      const data = await res.json();
      setModalLoading(false);

      if (data.success) {
        setIsEditModalOpen(false);
        fetchClients();
        if (editForm.newPassword) {
          alert('🎉 Client updated successfully! Password has been reset.');
        }
      } else {
        alert(data.error || 'Failed to update client');
      }
    } catch (err) {
      setModalLoading(false);
      alert('An error occurred');
    }
  };

  const handleToggleSuspend = async (client: any) => {
    const newStatus = !client.isActive;
    const actionText = newStatus ? 'activate' : 'suspend';
    if (!confirm(`Are you sure you want to ${actionText} client "${client.name}"?`)) return;

    await fetch(`/api/admin/clients/${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: newStatus }),
    });
    fetchClients();
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete client "${name}"? All assigned campaigns and lead data will be permanently removed.`)) return;

    await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' });
    fetchClients();
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.companyCode.toLowerCase().includes(search.toLowerCase()) ||
      c.contactEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Client Tenant Management</h1>
          <p className="text-sm text-slate-500 font-medium">Onboard clients, update details, set passwords, suspend/activate tenants</p>
        </div>
        <button
          onClick={() => {
            setCreatedCredentials(null);
            setCreateForm({ name: '', companyCode: '', contactEmail: '', contactPhone: '', password: '' });
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> Add New Client
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search clients by name, code, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs font-medium"
        />
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Client Name & Code</th>
                <th className="p-4">Login Email</th>
                <th className="p-4">Assigned Campaigns & Webhook URLs</th>
                <th className="p-4">Total Leads</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">Loading client directory...</td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No client accounts found.</td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{client.name}</p>
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">
                            CODE: {client.companyCode}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-blue-600 font-semibold">{client.contactEmail}</td>
                    <td className="p-4">
                      <div className="space-y-1.5 max-w-xs">
                        {client.assignments?.map((a: any) => (
                          <div key={a.id} className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-800 truncate">
                              {a.campaign.name}
                            </span>
                            <button
                              onClick={() => handleCopyWebhook(a.webhookToken)}
                              className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-mono text-[10px] font-bold flex items-center gap-1 transition-all flex-shrink-0"
                              title="Copy Webhook Endpoint URL"
                            >
                              {copiedToken === a.webhookToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copiedToken === a.webhookToken ? 'Copied' : 'Copy Webhook'}
                            </button>
                          </div>
                        ))}
                        {(!client.assignments || client.assignments.length === 0) && (
                          <span className="text-slate-400 text-[11px]">No campaigns assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-emerald-700 text-sm">{client._count?.leads || 0}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        client.isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {client.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit Client */}
                        <button
                          onClick={() => {
                            setEditForm({
                              id: client.id,
                              name: client.name,
                              contactEmail: client.contactEmail,
                              contactPhone: client.contactPhone || '',
                              isActive: client.isActive,
                              newPassword: '',
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          title="Edit Client & Password"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Suspend / Activate Toggle */}
                        <button
                          onClick={() => handleToggleSuspend(client)}
                          className={`p-2 rounded-lg transition-all ${
                            client.isActive
                              ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={client.isActive ? 'Suspend Client' : 'Activate Client'}
                        >
                          {client.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>

                        {/* Delete Client */}
                        <button
                          onClick={() => handleDeleteClient(client.id, client.name)}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                          title="Delete Client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Client & Display Credentials */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                {createdCredentials ? 'Client Login Credentials' : 'Create Client Account'}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold text-base">
                ✕
              </button>
            </div>

            {createdCredentials ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                  <p className="font-bold text-sm">🎉 Client Account Created!</p>
                  <p>Client can now log in with their email and specified password.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold">Login Portal Email:</span>
                    <p className="text-blue-700 font-bold">{createdCredentials.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold">Client Password:</span>
                    <div className="flex items-center justify-between mt-1 bg-white p-2 rounded-lg border border-slate-300">
                      <span className="text-emerald-700 font-bold text-sm">{createdCredentials.temporaryPassword}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(createdCredentials.temporaryPassword);
                          setCopiedPass(true);
                          setTimeout(() => setCopiedPass(false), 2000);
                        }}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-sans flex items-center gap-1 font-bold"
                      >
                        {copiedPass ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedPass ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs border border-slate-300"
                >
                  Done / Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Company / Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Horizon Digital Agency"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Company Code (Unique Tenant Prefix) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HORIZON"
                    value={createForm.companyCode}
                    onChange={(e) => setCreateForm({ ...createForm, companyCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 uppercase font-mono focus:outline-none focus:border-blue-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Login Portal Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. client@horizon.com"
                    value={createForm.contactEmail}
                    onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-blue-600" /> Set Account Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter password for client account"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contact Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 555-0199"
                    value={createForm.contactPhone}
                    onChange={(e) => setCreateForm({ ...createForm, contactPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20"
                  >
                    {modalLoading ? 'Creating...' : 'Create Client Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Edit Client & Reset Password */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600" /> Edit Client Details & Reset Password
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>
            <form onSubmit={handleEditClientSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Login Email *</label>
                <input
                  type="email"
                  required
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-600" /> Reset Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (leave blank to keep current)"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono placeholder-slate-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">If provided, this password will update the client's login portal password.</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editForm.contactPhone}
                  onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tenant Status</label>
                <select
                  value={editForm.isActive ? 'active' : 'suspended'}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
                >
                  <option value="active">Active Tenant</option>
                  <option value="suspended">Suspended / Deactivated</option>
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
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20"
                >
                  {modalLoading ? 'Saving...' : 'Save Changes & Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
