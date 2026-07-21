'use client';

import { useEffect, useState } from 'react';
import { Activity, Building2, Eye, Filter, Calendar } from 'lucide-react';
import { PayloadInspectorModal } from '@/components/PayloadInspectorModal';

export default function ClientActivityPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedPayload, setSelectedPayload] = useState<any>(null);

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchActivity = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (selectedClient) query.append('clientId', selectedClient);
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);

    fetch(`/api/admin/activity?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data.clientsSummary || []);
        setLogs(data.recentLogs || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchActivity();
  }, [selectedClient]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchActivity();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" /> Client Activity Stream & Webhook Feed
        </h1>
        <p className="text-sm text-slate-500 font-medium">Monitor real-time client submission rates, active campaigns, and live ingestion events</p>
      </div>

      {/* Date Filter & Client Select */}
      <form onSubmit={handleFilterSubmit} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-700">Filter Tenant Stream:</span>
        </div>

        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
        >
          <option value="">All Active Clients</option>
          {stats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.companyCode})
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            title="From Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
          />
        </div>

        <span className="text-slate-400 font-bold">to</span>

        <div>
          <input
            type="date"
            title="To Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 py-2 flex items-center gap-1.5 transition-all shadow-xs"
        >
          <Filter className="w-4 h-4" /> Filter Activity
        </button>
      </form>

      {/* Client Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((client) => (
          <div
            key={client.id}
            onClick={() => setSelectedClient(selectedClient === client.id ? '' : client.id)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedClient === client.id
                ? 'bg-blue-50/70 border-blue-600 shadow-sm'
                : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{client.name}</h3>
                <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">
                  {client.companyCode}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                client.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {client.isActive ? 'ACTIVE' : 'SUSPENDED'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block font-bold">Ingested Leads</span>
                <span className="text-lg font-black text-slate-900">{client.totalLeads}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block font-bold">Assigned Webhooks</span>
                <span className="text-lg font-black text-blue-600">{client.activeCampaigns}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Stream Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">Real-Time Ingestion Event Log Feed</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">HTTP Status</th>
                <th className="p-4">Tenant Client</th>
                <th className="p-4">Campaign</th>
                <th className="p-4">Processing Time</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">Loading live feed...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No live ingestion events captured for this selection.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        log.httpStatusCode === 201 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        HTTP {log.httpStatusCode}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">{log.client?.name}</td>
                    <td className="p-4 font-bold text-purple-700">{log.clientCampaign?.campaign?.name}</td>
                    <td className="p-4 font-mono text-slate-600">{log.executionTimeMs} ms</td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {new Date(log.receivedAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedPayload(log.payload)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white transition-all"
                        title="View Formatted Box Payload"
                      >
                        <Eye className="w-4 h-4" />
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
          title="Activity Stream Payload Inspector"
          onClose={() => setSelectedPayload(null)}
        />
      )}
    </div>
  );
}
