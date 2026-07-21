'use client';

import { useEffect, useState } from 'react';
import { KpiCard } from '@/components/KpiCard';
import { Filter, Megaphone, Download, Clock, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ClientDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/client/analytics')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      });
  }, []);

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
        <a
          href="/api/client/leads/export"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20"
        >
          <Download className="w-4 h-4" /> Download My Leads (CSV)
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <KpiCard title="Total Leads Captured" value={data?.totalLeads || 0} subtext="Ingested for your account" icon={Filter} color="emerald" trend="+18% growth" />
        <KpiCard title="Active Campaigns" value={data?.totalAssignedCampaigns || 0} subtext="Assigned Webhook Endpoints" icon={Megaphone} color="blue" />
        <KpiCard title="Webhook Status" value="100% Active" subtext="Real-time intake operational" icon={CheckCircle2} color="purple" />
      </div>

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

        {/* Status Pipeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Lead Status Pipeline</span>
            <span className="text-xs text-emerald-600 font-bold">Qualification Funnel</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {data?.leadsByStatus?.map((s: any) => (
              <div key={s.status} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-500">{s.status}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{s.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Client Leads */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Recent Ingested Leads</h2>
            <p className="text-xs text-slate-500 font-medium">Strictly tenant-scoped lead submissions</p>
          </div>
          <Link href="/client/leads" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All My Leads <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Lead Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Campaign</th>
                <th className="p-4">Status</th>
                <th className="p-4">Ingested Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {data?.recentLeads?.map((lead: any) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">
                    {lead.firstName} {lead.lastName}
                  </td>
                  <td className="p-4 font-mono text-blue-600 font-semibold">{lead.email}</td>
                  <td className="p-4 font-medium text-slate-800">{lead.campaign?.name}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
