'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Download,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Zap,
  LayoutGrid,
  List,
  Phone,
  MessageSquare,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { PayloadInspectorModal } from '@/components/PayloadInspectorModal';
import { LeadDetailDrawer } from '@/components/LeadDetailDrawer';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TimestampCopyBadge } from '@/components/TimestampCopyBadge';
import { useLeadPoller } from '@/hooks/useLeadPoller';

const PIPELINE_STATUSES = [
  { value: 'NEW', label: 'New', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  { value: 'CONTACTED', label: 'Contacted', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  { value: 'QUALIFIED', label: 'Qualified', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  { value: 'PROPOSAL', label: 'Proposal', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  { value: 'CONVERTED', label: 'Converted', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { value: 'UNQUALIFIED', label: 'Unqualified', color: 'bg-rose-100 text-rose-900 border-rose-300' },
];

export default function ClientLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: table or kanban
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals & Drawers
  const [selectedPayload, setSelectedPayload] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const fetchLeads = (targetPage = page, targetLimit = limit) => {
    setLoading(true);
    const query = new URLSearchParams();
    query.append('page', String(targetPage));
    query.append('limit', String(targetLimit));
    if (search) query.append('search', search);
    if (statusFilter) query.append('status', statusFilter);
    if (campaignFilter) query.append('campaignId', campaignFilter);
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);

    fetch(`/api/client/leads?${query.toString()}`)
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
    fetch('/api/client/campaigns')
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns || []));
  }, []);

  // Real-time lead polling
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
    setPage(1);
    fetchLeads(1, limit);
  };

  // Status Change Handler (used by table inline & kanban)
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    if (selectedLead?.id === leadId) {
      setSelectedLead((prev: any) => ({ ...prev, status: newStatus }));
    }

    try {
      await fetch(`/api/client/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Revert if error
      fetchLeads(page, limit);
    }
  };

  const handleLeadUpdated = (updatedLead: any) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? { ...l, ...updatedLead } : l))
    );
    setSelectedLead(updatedLead);
  };

  const exportUrl = `/api/client/leads/export?campaignId=${campaignFilter}&startDate=${startDate}&endDate=${endDate}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Client Leads CRM & Pipeline</h1>
            <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
              Live Sync ({totalCount.toLocaleString()} leads)
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Track lead status, pipeline stages, fraud detection scores, and copy timestamps with 1 click
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Table View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban Board
            </button>
          </div>

          <a
            href={exportUrl}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            <Download className="w-4 h-4" /> CSV Export
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleFilterSubmit}
        className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs"
      >
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
          onChange={(e) => {
            setCampaignFilter(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
        >
          <option value="">All Assigned Campaigns</option>
          {campaigns.map((c) => (
            <option key={c.campaignId} value={c.campaignId}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
        >
          <option value="">All Pipeline Stages</option>
          {PIPELINE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
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

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-2.5 flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <Filter className="w-4 h-4" /> Filter Leads
        </button>
      </form>

      {/* Main Content: Table or Kanban */}
      {viewMode === 'kanban' ? (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <KanbanBoard
            leads={leads}
            onStatusChange={handleStatusChange}
            onLeadClick={(lead) => setSelectedLead(lead)}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Lead Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Campaign</th>
                  <th className="p-4">Quality & Fraud</th>
                  <th className="p-4">Pipeline Status</th>
                  <th className="p-4">Timestamp & Timezone</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                      Loading leads instantly...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                      No lead records found for this view.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                    const cleanPhone = (lead.phone || '').replace(/\D/g, '');
                    const score = lead.score ?? 100;
                    const grade = lead.qualityGrade ?? 'A';

                    const getGradeBadge = () => {
                      if (grade === 'SPAM' || lead.isSpam)
                        return 'bg-rose-100 text-rose-800 border-rose-300';
                      if (score >= 85) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
                      if (score >= 70) return 'bg-blue-100 text-blue-800 border-blue-300';
                      return 'bg-amber-100 text-amber-800 border-amber-300';
                    };

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                      >
                        {/* Lead Name & Indicators */}
                        <td className="p-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {lead.firstName} {lead.lastName || ''}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {lead.isDuplicate && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 border border-amber-200 text-amber-900 text-[9px] font-extrabold flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                Dup ({lead.duplicateCount || 1}x)
                              </span>
                            )}
                            {lead._count?.notes > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-extrabold flex items-center gap-0.5">
                                <FileText className="w-2.5 h-2.5" />
                                {lead._count.notes} note{lead._count.notes > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Contact Info + Direct WhatsApp/Call */}
                        <td className="p-4">
                          <div className="font-mono text-blue-600 font-semibold select-all">
                            {lead.email}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-slate-500 text-[11px]">
                              {lead.phone || 'N/A'}
                            </span>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition-all shadow-2xs"
                                title="WhatsApp Lead"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </a>
                            )}
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white transition-all shadow-2xs"
                                title="Call Lead"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Campaign */}
                        <td className="p-4">
                          <span className="font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200">
                            {lead.campaign?.name || 'Standard'}
                          </span>
                        </td>

                        {/* Quality Grade & Fraud Score */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getGradeBadge()}`}
                            >
                              Grade {grade}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-slate-500">
                              {score}%
                            </span>
                          </div>
                          {lead.isSpam && (
                            <span className="text-[9px] text-rose-600 font-bold block mt-0.5">
                              ?? {lead.spamReason || 'Spam'}
                            </span>
                          )}
                        </td>

                        {/* In-line Interactive Pipeline Status Dropdown */}
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.status || 'NEW'}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            className="bg-white border border-slate-300 hover:border-blue-500 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:border-blue-600"
                          >
                            {PIPELINE_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Timestamp & Timezone with 1-Click Copy */}
                        <td className="p-4">
                          <TimestampCopyBadge
                            date={lead.createdAt}
                            timezone={lead.timezone}
                            leadName={`${lead.firstName} ${lead.lastName || ''}`}
                            leadEmail={lead.email}
                          />
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white transition-all font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                              title="View CRM Details & Notes"
                            >
                              <FileText className="w-3.5 h-3.5" /> Details
                            </button>
                            <button
                              onClick={() =>
                                setSelectedPayload(
                                  lead.customData || {
                                    firstName: lead.firstName,
                                    lastName: lead.lastName,
                                    email: lead.email,
                                  }
                                )
                              }
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all text-[11px]"
                              title="View Raw JSON"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Showing page {page} of {totalPages} ({totalCount.toLocaleString()} total leads)
              </span>
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
      )}

      {/* Lead Detail & CRM Notes Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onLeadUpdated={handleLeadUpdated}
        role="CLIENT"
      />

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
