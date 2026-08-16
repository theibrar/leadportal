'use client';

import { useEffect, useState } from 'react';
import { Search, Download, Filter, Eye, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { PayloadInspectorModal } from '@/components/PayloadInspectorModal';
import { useLeadPoller } from '@/hooks/useLeadPoller';

export default function MasterLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected lead for customData modal
  const [selectedPayload, setSelectedPayload] = useState<any>(null);

  const fetchLeads = (targetPage = page, targetLimit = limit) => {
    setLoading(true);
    const query = new URLSearchParams();
    query.append('page', String(targetPage));
    query.append('limit', String(targetLimit));
    if (search) query.append('search', search);
    if (statusFilter) query.append('status', statusFilter);
    if (clientFilter) query.append('clientId', clientFilter);
    if (campaignFilter) query.append('campaignId', campaignFilter);
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);

    fetch(`/api/admin/leads?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setLeads(data.leads || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads(page, limit);
  }, [page, limit]);

  useEffect(() => {
    fetch('/api/admin/clients')
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []));
    fetch('/api/admin/campaigns')
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns || []));
  }, []);

  // Real-time lead polling — lightweight check
  const buildPollUrl = () => {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (statusFilter) query.append('status', statusFilter);
    if (clientFilter) query.append('clientId', clientFilter);
    if (campaignFilter) query.append('campaignId', campaignFilter);
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    return `/api/admin/leads?${query.toString()}`;
  };

  useLeadPoller({
    apiUrl: buildPollUrl(),
    setLeads,
    leads,
    isInitialLoad: loading,
  });

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads(1, limit);
  };

  const exportUrl = `/api/admin/leads/export?clientId=${clientFilter}&campaignId=${campaignFilter}&startDate=${startDate}&endDate=${endDate}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Master System Lead Directory</h1>
            <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
              Instant 1-Click ({totalCount.toLocaleString()} leads)
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">View, search, filter by date, and inspect lead tests across all tenant clients</p>
        </div>
        <a
          href={exportUrl}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20"
        >
          <Download className="w-4 h-4" /> Download Filtered CSV
        </a>
      </div>

      {/* Filter Bar with Date Pickers */}
      <form onSubmit={handleFilterSubmit} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 text-xs">
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
          value={clientFilter}
          onChange={(e) => {
            setClientFilter(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
        >
          <option value="">All Tenant Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.companyCode})
            </option>
          ))}
        </select>

        <select
          value={campaignFilter}
          onChange={(e) => {
            setCampaignFilter(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
        >
          <option value="">All Campaigns</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
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
                <th className="p-4">Lead Information</th>
                <th className="p-4">Tenant Client</th>
                <th className="p-4">Campaign</th>
                <th className="p-4">Source</th>
                <th className="p-4">Status</th>
                <th className="p-4">Ingested Date</th>
                <th className="p-4 text-right">Lead Test</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">Loading leads instantly...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No lead records found.</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="font-mono text-blue-600 text-[11px] font-semibold">{lead.email}</p>
                        {lead.phone && <p className="text-slate-500 text-[10px]">{lead.phone}</p>}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-900">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 font-bold text-blue-700 whitespace-nowrap">
                        {lead.client?.name}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-purple-700">{lead.campaign?.name}</td>
                    <td className="p-4 text-slate-600">{lead.source}</td>
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

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span>Showing page {page} of {totalPages} ({totalCount.toLocaleString()} total leads)</span>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  const newLimit = parseInt(e.target.value, 10);
                  setLimit(newLimit);
                  setPage(1);
                }}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-bold focus:outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold flex items-center gap-1 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-lg">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold flex items-center gap-1 transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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
