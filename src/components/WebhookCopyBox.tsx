'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface WebhookCopyBoxProps {
  webhookUrl: string;
  campaignName?: string;
}

export function WebhookCopyBox({ webhookUrl, campaignName }: WebhookCopyBoxProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${webhookUrl}` : webhookUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
      {campaignName && (
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span>Webhook Endpoint ({campaignName})</span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px]">
            ACTIVE & VALIDATED
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={fullUrl}
          className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-blue-700 focus:outline-none select-all font-semibold"
        />
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            copied ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" /> Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy URL
            </>
          )}
        </button>
      </div>
    </div>
  );
}
