'use client';

import { useEffect, useState } from 'react';
import { KpiCard } from '@/components/KpiCard';
import { Users, Megaphone, Filter, Webhook, Download, ArrowUpRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { useDashboardPoller } from '@/hooks/useDashboardPoller';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  // Real-time dashboard polling — auto-refreshes metrics and notifies on new leads
  useDashboardPoller({
    analyticsUrl: '/api/admin/analytics',
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Master Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium">Real-time multi-tenant acquisition & client metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/admin/leads/export"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            <Download className="w-4 h-4" /> Export All Leads (CSV)
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard title="Total Tenants / Clients" value={data?.totalClients || 0} subtext="Active Client Accounts" icon={Users} color="blue" trend="+100%" />
        <KpiCard title="Active Campaigns" value={data?.totalCampaigns || 0} subtext="Assigned Webhook Workflows" icon={Megaphone} color="purple" />
        <KpiCard title="Total Leads Captured" value={data?.totalLeads || 0} subtext="Across All Landing Pages" icon={Filter} color="emerald" trend="+24% this wk" />
        <KpiCard title="System Webhooks" value={data?.webhookSuccessRate || '100.0%'} subtext="Uptime & Delivery Success" icon={Webhook} color="amber" />
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads by Campaign */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Leads by Campaign</span>
            <span className="text-xs text-blue-600 font-bold">Volume</span>
          </h2>
          <div className="space-y-3">
            {data?.leadsByCampaign?.map((c: any) => (
              <div key={c.code} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">{c.name}</span>
                  <span className="text-blue-600 font-bold">{c.count} leads</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
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
            <span>Leads by Status</span>
            <span className="text-xs text-emerald-600 font-bold">Pipeline</span>
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

        {/* Client Tenant Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Client Tenant Distribution</span>
            <span className="text-xs text-amber-600 font-bold">Tenants</span>
          </h2>
          <div className="space-y-3">
            {data?.leadsByClient?.map((client: any) => (
              <div key={client.code} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{client.name}</span>
                    <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">
                      {client.code}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    {client.count} leads
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    style={{ width: `${Math.min(100, (client.count / (data?.totalLeads || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Lead Stream Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Live Ingested Leads Stream</h2>
            <p className="text-xs text-slate-500 font-medium">Most recent submissions across all client webhooks</p>
          </div>
          <Link href="/admin/leads" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All Directory <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Lead Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Tenant Client</th>
                <th className="p-4">Campaign</th>
                <th className="p-4">Status</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {data?.recentLeads?.map((lead: any) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">
                    {lead.firstName} {lead.lastName}
                  </td>
                  <td className="p-4 font-mono text-blue-600 font-semibold">{lead.email}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 font-bold text-blue-700">
                      {lead.client?.name}
                    </span>
                  </td>
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
                  <td className="p-4 text-slate-500 flex items-center gap-1.5 font-mono text-[11px]">
                    <Clock className="w-3 h-3" />
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
