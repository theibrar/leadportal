'use client';

import { useEffect, useState } from 'react';
import { Search, Download, Filter, Eye } from 'lucide-react';
import { PayloadInspectorModal } from '@/components/PayloadInspectorModal';
import { useLeadPoller } from '@/hooks/useLeadPoller';

export default function ClientLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Payload Modal
  const [selectedPayload, setSelectedPayload] = useState<any>(null);

  const fetchLeads = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (statusFilter) query.append('status', statusFilter);
    if (campaignFilter) query.append('campaignId', campaignFilter);
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);

    fetch(`/api/client/leads?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setLeads(data.leads || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeads();
    fetch('/api/client/campaigns')
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns || []));
  }, []);

  // Real-time lead polling — auto-detects and notifies on new leads
  const buildPollUrl = () => {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (statusFilter) query.append('status', statusFilter);
    if (campaignFilter) query.append('campaignId', campaignFilter);
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    return `/api/client/leads?${query.toString()}`;
  };

  useLeadPoller({
    apiUrl: buildPollUrl(),
    setLeads,
    leads,
    isInitialLoad: loading,
  });

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const exportUrl = `/api/client/leads/export?campaignId=${campaignFilter}&startDate=${startDate}&endDate=${endDate}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Client Lead Records</h1>
          <p className="text-sm text-slate-500 font-medium">View, filter by date, and export lead submissions captured across your assigned campaigns</p>
        </div>
        <a
          href={exportUrl}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20"
        >
          <Download className="w-4 h-4" /> Download CSV Export
        </a>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleFilterSubmit} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
          />
        </div>

        <select
          value={campaignFilter}
          onChange={(e) => setCampaignFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
        >
          <option value="">All Assigned Campaigns</option>
          {campaigns.map((c) => (
            <option key={c.campaignId} value={c.campaignId}>
              {c.name}
            </option>
          ))}
        </select>

        {/* From Date */}
        <div>
          <input
            type="date"
            title="From Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
          />
        </div>

        {/* To Date */}
        <div>
          <input
            type="date"
            title="To Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-2.5 flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <Filter className="w-4 h-4" /> Filter Leads
        </button>
      </form>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Lead Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Campaign</th>
                <th className="p-4">Status</th>
                <th className="p-4">Captured Date</th>
                <th className="p-4 text-right">Lead Test</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">Loading your leads...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No lead records found for this view.</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      {lead.firstName} {lead.lastName}
                    </td>
                    <td className="p-4 font-mono text-blue-600 font-semibold">{lead.email}</td>
                    <td className="p-4 text-slate-500 font-mono">{lead.phone || 'N/A'}</td>
                    <td className="p-4 font-bold text-purple-700">{lead.campaign?.name}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        lead.status === 'CONVERTED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : lead.status === 'QUALIFIED'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {new Date(lead.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedPayload(lead.customData || { firstName: lead.firstName, lastName: lead.lastName, email: lead.email })}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white transition-all font-bold flex items-center gap-1.5 ml-auto text-[11px]"
                        title="Inspect Lead Test Fields"
                      >
                        <Eye className="w-4 h-4" /> Lead Test
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payload Modal */}
      {selectedPayload && (
        <PayloadInspectorModal
          payload={selectedPayload}
          title="Lead Test Data Inspector"
          onClose={() => setSelectedPayload(null)}
        />
      )}
    </div>
  );
}
