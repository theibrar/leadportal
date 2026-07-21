'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Copy, Check, Code, Webhook } from 'lucide-react';
import { WebhookCopyBox } from '@/components/WebhookCopyBox';

export default function ClientCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'curl' | 'js'>('curl');

  useEffect(() => {
    fetch('/api/client/campaigns')
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(data.campaigns || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Campaigns & Webhook Integration Hub</h1>
        <p className="text-sm text-slate-500 font-medium">View your assigned webhook endpoints and integration code for your landing pages</p>
      </div>

      {/* Campaigns Grid */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs font-medium">
            Loading assigned campaign webhooks...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs font-medium">
            No campaigns currently assigned to your account. Contact your admin.
          </div>
        ) : (
          campaigns.map((c) => {
            const sampleUrl = typeof window !== 'undefined' ? `${window.location.origin}${c.webhookUrl}` : c.webhookUrl;

            const curlSnippet = `curl -X POST "${sampleUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1 555-0199",
    "source": "Landing Page Form"
  }'`;

            const jsSnippet = `await fetch("${sampleUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 555-0199",
    source: "Landing Page Form"
  })
});`;

            return (
              <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-blue-600" /> {c.name}
                    </h3>
                    <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                      CAMPAIGN CODE: {c.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-bold text-emerald-700">
                      {c.leadCount} Ingested Leads
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium">{c.description || 'No description provided.'}</p>

                {/* Webhook Copy Box */}
                <WebhookCopyBox webhookUrl={c.webhookUrl} campaignName={c.name} />

                {/* Code Integration Box */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-blue-600" /> Code Snippet Generator
                    </span>
                    <div className="flex bg-white p-1 rounded-lg border border-slate-200 text-xs">
                      <button
                        onClick={() => setActiveSnippetTab('curl')}
                        className={`px-3 py-1 rounded font-mono font-bold transition-all ${
                          activeSnippetTab === 'curl' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-600'
                        }`}
                      >
                        cURL
                      </button>
                      <button
                        onClick={() => setActiveSnippetTab('js')}
                        className={`px-3 py-1 rounded font-mono font-bold transition-all ${
                          activeSnippetTab === 'js' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-600'
                        }`}
                      >
                        JavaScript (fetch)
                      </button>
                    </div>
                  </div>

                  <pre className="bg-slate-900 p-4 rounded-xl text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800">
                    {activeSnippetTab === 'curl' ? curlSnippet : jsSnippet}
                  </pre>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
