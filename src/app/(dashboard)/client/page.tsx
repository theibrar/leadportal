'use client';

import { useEffect, useState } from 'react';
import { KpiCard } from '@/components/KpiCard';
import { Filter, Megaphone, Download, Clock, ArrowUpRight, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';
import Link from 'next/link';
import { useDashboardPoller } from '@/hooks/useDashboardPoller';
import { TimestampCopyBadge } from '@/components/TimestampCopyBadge';
import { TodaysAgendaWidget } from '@/components/TodaysAgendaWidget';
import { ExecutiveDigestModal } from '@/components/ExecutiveDigestModal';
import { LeadDetailDrawer } from '@/components/LeadDetailDrawer';

export default function ClientDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDigestOpen, setIsDigestOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  useEffect(() => {
    fetch('/api/client/analytics')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      });
  }, []);

  // Real-time dashboard polling — auto-refreshes metrics and notifies on new leads
  useDashboardPoller({
    analyticsUrl: '/api/client/analytics',
    setData,
    isInitialLoad: loading,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tenant Client Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium">Isolated lead metrics, assigned campaign workflows, and export engine</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDigestOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            <Mail className="w-4 h-4 text-blue-600" /> Executive Digest
          </button>
          <a
            href="/api/client/leads/export"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            <Download className="w-4 h-4" /> Download My Leads (CSV)
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <KpiCard title="Total Leads Captured" value={data?.totalLeads || 0} subtext="Ingested for your account" icon={Filter} color="emerald" trend="+18% growth" />
        <KpiCard title="Active Campaigns" value={data?.totalAssignedCampaigns || 0} subtext="Assigned Webhook Endpoints" icon={Megaphone} color="blue" />
        <KpiCard title="Webhook Status" value="100% Active" subtext="Real-time intake operational" icon={CheckCircle2} color="purple" />
      </div>

      {/* Feature 1: Today's Action Agenda & Scheduled Tasks */}
      <TodaysAgendaWidget
        role="CLIENT"
        onOpenLead={(lead) => setSelectedLead(lead)}
      />

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Campaign */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Leads by Assigned Campaign</span>
            <span className="text-xs text-blue-600 font-bold">Performance</span>
          </h2>
          <div className="space-y-3">
            {data?.leadsByCampaign?.map((c: any) => (
              <div key={c.code} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-900 font-bold">{c.name}</span>
                  <span className="text-emerald-700 font-bold">{c.count} leads</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full"
                    style={{ width: `${Math.min(100, (c.count / (data?.totalLeads || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads by Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Pipeline Progression</span>
            <span className="text-xs text-emerald-600 font-bold">Status</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {data?.leadsByStatus?.map((s: any) => (
              <div key={s.status} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-500">{s.status}</p>
                <p className="text-xl font-black text-slate-900 mt-1">{s.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Ingested Leads</h2>
            <p className="text-xs text-slate-500 font-medium">Latest customer inquiries delivered to your portal</p>
          </div>
          <Link href="/client/leads" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All Leads <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4">Customer Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Campaign</th>
                <th className="p-4">Lead Quality</th>
                <th className="p-4">Current Status</th>
                <th className="p-4">Timestamp & Timezone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recentLeads?.map((lead: any) => {
                const score = lead.score ?? 100;
                const grade = lead.qualityGrade ?? 'A';

                const getGradeBadge = () => {
                  if (grade === 'SPAM' || lead.isSpam) return 'bg-rose-100 text-rose-800 border-rose-200';
                  if (score >= 85) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  if (score >= 70) return 'bg-blue-100 text-blue-800 border-blue-200';
                  return 'bg-amber-100 text-amber-800 border-amber-200';
                };

                return (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="font-bold text-slate-900">
                        {lead.firstName} {lead.lastName}
                      </div>
                      {lead.isDuplicate && (
                        <span className="inline-flex items-center gap-0.5 mt-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200 text-[9px] font-extrabold">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Duplicate
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-blue-600 font-semibold">{lead.email}</td>
                    <td className="p-4 font-medium text-slate-800">{lead.campaign?.name}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider whitespace-nowrap inline-flex items-center justify-center shrink-0 leading-normal ${getGradeBadge()}`}>
                        Grade {grade} ({score}%)
                      </span>
                    </td>
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
                    <td className="p-4">
                      <TimestampCopyBadge
                        date={lead.createdAt}
                        timezone={lead.timezone}
                        leadName={`${lead.firstName} ${lead.lastName || ''}`}
                        leadEmail={lead.email}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Executive Digest Modal */}
      <ExecutiveDigestModal
        isOpen={isDigestOpen}
        onClose={() => setIsDigestOpen(false)}
        clientName={data?.clientName || 'Your Account'}
        totalLeads={data?.totalLeads || 0}
        totalCampaigns={data?.totalAssignedCampaigns || 0}
      />

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        role="CLIENT"
      />
    </div>
  );
}
