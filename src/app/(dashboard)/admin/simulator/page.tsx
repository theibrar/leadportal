'use client';

import { useEffect, useState } from 'react';
import { Send, CheckCircle2, AlertCircle, RefreshCw, Webhook } from 'lucide-react';

export default function WebhookSimulatorPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');

  // Sample lead form state
  const [payload, setPayload] = useState({
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'marcus.vance@enterprisesolutions.com',
    phone: '+1 (555) 912-3456',
    source: 'Google Search PPC',
    company: 'Enterprise Solutions Inc',
    budget: '$50,000+',
    utm_source: 'google',
    utm_campaign: 'q3_enterprise_saas',
  });

  const [responseLog, setResponseLog] = useState<any>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch('/api/admin/campaigns')
      .then((res) => res.json())
      .then((data) => {
        const cList = data.campaigns || [];
        setCampaigns(cList);
        // Find first assignment
        for (const c of cList) {
          if (c.assignments && c.assignments.length > 0) {
            setSelectedAssignment(c.assignments[0].webhookToken);
            break;
          }
        }
      });
  }, []);

  const currentAssignmentInfo = campaigns
    .flatMap((c) => c.assignments || [])
    .find((a: any) => a.webhookToken === selectedAssignment);

  const handleSendWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) {
      alert('Please select a target webhook campaign assignment.');
      return;
    }

    setSending(true);
    setResponseLog(null);
    const targetUrl = `/api/webhooks/ingest/${selectedAssignment}`;

    const startTime = Date.now();
    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      const elapsed = Date.now() - startTime;

      setResponseLog({
        status: res.status,
        statusText: res.statusText,
        elapsed,
        data: resData,
      });
    } catch (err: any) {
      setResponseLog({
        status: 500,
        data: { error: err.message },
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Send className="w-6 h-6 text-blue-600" /> Interactive Webhook Simulator
        </h1>
        <p className="text-sm text-slate-500 font-medium">Test real-time lead ingestion into any client's assigned webhook URL</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Controls */}
        <form onSubmit={handleSendWebhook} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Select Target Client Campaign Webhook *</label>
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
            >
              {campaigns.flatMap((c) =>
                (c.assignments || []).map((a: any) => (
                  <option key={a.webhookToken} value={a.webhookToken}>
                    Client: {a.client?.name} → Campaign: {c.name} ({a.webhookToken})
                  </option>
                ))
              )}
            </select>
          </div>

          {currentAssignmentInfo && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-1 font-mono text-[11px]">
              <p className="text-slate-600">Client Tenant: <span className="text-slate-900 font-bold">{currentAssignmentInfo.client?.name}</span></p>
              <p className="text-slate-600">Endpoint: <span className="text-blue-700 font-bold">/api/webhooks/ingest/{currentAssignmentInfo.webhookToken}</span></p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">First Name</label>
              <input
                type="text"
                value={payload.firstName}
                onChange={(e) => setPayload({ ...payload, firstName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Last Name</label>
              <input
                type="text"
                value={payload.lastName}
                onChange={(e) => setPayload({ ...payload, lastName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={payload.email}
              onChange={(e) => setPayload({ ...payload, email: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Phone</label>
              <input
                type="text"
                value={payload.phone}
                onChange={(e) => setPayload({ ...payload, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Company</label>
              <input
                type="text"
                value={payload.company}
                onChange={(e) => setPayload({ ...payload, company: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all text-xs"
          >
            {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Processing Webhook Request...' : 'Trigger Live Webhook POST'}
          </button>
        </form>

        {/* Live Response Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Ingestion Response Monitor</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">HTTP Status and returned JSON payload response from API</p>

            {responseLog ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-sans font-bold">HTTP Status:</span>
                  <span className={`font-bold px-2.5 py-0.5 rounded ${
                    responseLog.status === 201 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {responseLog.status} ({responseLog.elapsed} ms)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-sans font-bold">Response Body:</span>
                  <pre className="mt-1 bg-slate-900 p-4 rounded-xl border border-slate-800 text-emerald-400 overflow-x-auto text-[11px]">
                    {JSON.stringify(responseLog.data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs font-medium">
                No webhook sent yet. Fill out the form and click "Trigger Live Webhook POST" to test ingestion.
              </div>
            )}
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
            ✅ Ingested leads automatically route to the selected tenant client database records and update analytics charts in real time.
          </div>
        </div>
      </div>
    </div>
  );
}
