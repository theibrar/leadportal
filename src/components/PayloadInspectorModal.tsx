'use client';

import { useState } from 'react';
import { FileJson, Copy, Check, LayoutGrid, Code2 } from 'lucide-react';

interface PayloadInspectorModalProps {
  payload: string | object | null;
  title?: string;
  onClose: () => void;
}

export function PayloadInspectorModal({ payload, title = 'Lead Test Data Inspector', onClose }: PayloadInspectorModalProps) {
  const [activeTab, setActiveTab] = useState<'grid' | 'json'>('grid');
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!payload) return null;

  let parsed: Record<string, any> = {};
  let rawJsonString = '';

  try {
    if (typeof payload === 'string') {
      parsed = JSON.parse(payload);
      rawJsonString = JSON.stringify(parsed, null, 2);
    } else {
      parsed = payload;
      rawJsonString = JSON.stringify(payload, null, 2);
    }
  } catch (e) {
    parsed = { rawContent: String(payload) };
    rawJsonString = String(payload);
  }

  const handleCopyAll = () => {
    navigator.clipboard.writeText(rawJsonString);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyField = (key: string, value: any) => {
    const valString = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    navigator.clipboard.writeText(valString);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const entries = Object.entries(parsed);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">{title}</h3>
              <span className="text-[11px] text-slate-500 font-medium">{entries.length} lead fields captured</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1">
            ✕
          </button>
        </div>

        {/* View Toggle Tabs & Copy All Button */}
        <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Formatted Grid View
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'json'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> Raw Pretty JSON
            </button>
          </div>

          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-all shadow-xs"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
            {copiedAll ? 'Copied Full JSON!' : 'Copy Full JSON'}
          </button>
        </div>

        {/* Content Body */}
        {activeTab === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {entries.map(([key, val]) => (
              <div key={key} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                    {key}
                  </span>
                  <button
                    onClick={() => handleCopyField(key, val)}
                    className="p-1 rounded bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200 transition-all flex items-center gap-1 text-[10px] font-mono font-bold"
                    title={`Copy ${key} value`}
                  >
                    {copiedKey === key ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === key ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs font-bold text-slate-900 font-mono break-all leading-snug">
                  {typeof val === 'object' ? JSON.stringify(val) : String(val ?? 'N/A')}
                </p>
              </div>
            ))}
            {entries.length === 0 && (
              <div className="col-span-full p-8 text-center text-slate-400 text-xs italic">
                No fields present in this lead test record.
              </div>
            )}
          </div>
        ) : (
          <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 max-h-96 leading-relaxed">
            {rawJsonString}
          </pre>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
