'use client';

import { useEffect, useState } from 'react';
import { Webhook, Eye, CheckCircle2, XCircle, Clock, Filter, Calendar } from 'lucide-react';
import { PayloadInspectorModal } from '@/components/PayloadInspectorModal';

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayload, setSelectedPayload] = useState<any>(null);

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);

    fetch(`/api/admin/webhook-logs?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Webhook className="w-6 h-6 text-blue-600" /> System Webhook Execution Logs
        </h1>
        <p className="text-sm text-slate-500 font-medium">Real-time HTTP payload intake logs, status codes, and execution latencies across all webhooks</p>
      </div>

      {/* Date Filter Bar */}
      <form onSubmit={handleFilterSubmit} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-700">Filter by Ingestion Date:</span>
        </div>

        <div>
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
          <Filter className="w-4 h-4" /> Filter Logs
        </button>

        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => {
              setStartDate('');
              setEndDate('');
              fetch('/api/admin/webhook-logs')
                .then((res) => res.json())
                .then((data) => setLogs(data.logs || []));
            }}
            className="text-slate-500 hover:text-slate-800 underline font-semibold text-xs ml-auto"
          >
            Clear Date Filters
          </button>
        )}
      </form>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Status & Code</th>
                <th className="p-4">Tenant Client</th>
                <th className="p-4">Campaign Name</th>
                <th className="p-4">Latency</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Received Time</th>
                <th className="p-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">Loading webhook execution logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No webhook execution logs found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {log.status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                            log.httpStatusCode >= 200 && log.httpStatusCode < 300
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          HTTP {log.httpStatusCode}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-900">{log.client?.name}</td>
                    <td className="p-4 font-bold text-purple-700">
                      {log.clientCampaign?.campaign?.name || 'N/A'}
                    </td>
                    <td className="p-4 font-mono text-slate-600">{log.executionTimeMs} ms</td>
                    <td className="p-4 font-mono text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
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
          title="Webhook Payload Inspector"
          onClose={() => setSelectedPayload(null)}
        />
      )}
    </div>
  );
}
