'use client';

import { useState } from 'react';
import {
  X,
  Code,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Sparkles,
  Smartphone,
  Monitor,
  Eye,
  Sliders,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

interface FormWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  webhookToken: string;
}

export function FormWidgetModal({
  isOpen,
  onClose,
  campaignName,
  webhookToken,
}: FormWidgetModalProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'script' | 'link' | 'iframe'>('script');
  const [mode, setMode] = useState<'multistep' | 'simple' | 'popup'>('multistep');
  const [formTitle, setFormTitle] = useState(`${campaignName} Inquiry`);
  const [buttonText, setButtonText] = useState('Submit Request');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [popupLabel, setPopupLabel] = useState('Get a Free Quote');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  // Origin resolution
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://leadportal.ibrasoft.com';
  const hostedUrl = `${origin}/embed/${webhookToken}?mode=${mode}&title=${encodeURIComponent(formTitle)}`;

  const scriptSnippet = `<script
  src="${origin}/embed/leadform.js"
  data-token="${webhookToken}"
  data-mode="${mode}"
  data-title="${formTitle}"
  data-button="${buttonText}"
  data-color="${primaryColor}"${mode === 'popup' ? `\n  data-popup-label="${popupLabel}"` : ''}
  defer
></script>`;

  const iframeSnippet = `<iframe
  src="${hostedUrl}"
  width="100%"
  height="540"
  frameborder="0"
  style="border:none; border-radius:16px; max-width:480px; box-shadow:0 10px 25px rgba(0,0,0,0.06);"
  allow="clipboard-write"
></iframe>`;

  const currentSnippet =
    activeTab === 'script' ? scriptSnippet : activeTab === 'iframe' ? iframeSnippet : hostedUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopiedSnippet(true);
    toast.success('Embed code copied to clipboard!');
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const colors = [
    { name: 'IbraSoft Blue', hex: '#2563eb' },
    { name: 'Emerald', hex: '#059669' },
    { name: 'Indigo', hex: '#4f46e5' },
    { name: 'Purple', hex: '#7c3aed' },
    { name: 'Amber', hex: '#d97706' },
    { name: 'Rose', hex: '#e11d48' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">Embeddable Lead Form & Popup Generator</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Zero-Code Ingestion
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Campaign: <span className="font-bold text-slate-700">{campaignName}</span> • Auto Honeypot & UTM Capture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 p-6 space-y-5 bg-slate-50/40">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Sliders className="w-4 h-4 text-blue-600" /> Form Customization
            </div>

            {/* Widget Mode Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Widget Display Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'multistep', label: 'Multi-Step', sub: 'Highest conversion' },
                  { id: 'simple', label: 'Classic', sub: 'Single card' },
                  { id: 'popup', label: 'Floating', sub: 'Bottom button' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      mode === item.id
                        ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Title */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Header Title</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                placeholder="e.g. Request a Free Estimate"
              />
            </div>

            {/* Primary Button Text */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Submit Button Text</label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                placeholder="e.g. Submit Request"
              />
            </div>

            {/* Popup Label if popup mode */}
            {mode === 'popup' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Floating Button Label</label>
                <input
                  type="text"
                  value={popupLabel}
                  onChange={(e) => setPopupLabel(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  placeholder="e.g. Get a Quote"
                />
              </div>
            )}

            {/* Accent Color */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Brand Color Accent</label>
              <div className="flex items-center gap-2 flex-wrap">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setPrimaryColor(c.hex)}
                    title={c.name}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      primaryColor === c.hex ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 text-[11px] text-blue-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Automated Features Included:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-800 text-[10px]">
                <li>Auto-extracts UTM tags (source, campaign, medium, gclid)</li>
                <li>Built-in invisible honeypot anti-bot shield</li>
                <li>Instant mobile-responsive layout & touch-optimized buttons</li>
              </ul>
            </div>
          </div>

          {/* Code & Preview Column (7 cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col space-y-5">
            {/* Embed Tab Selector */}
            <div className="flex items-center justify-between">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('script')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'script' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1-Line Script (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('link')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'link' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Direct Hosted Link
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('iframe')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'iframe' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  iFrame Embed
                </button>
              </div>

              {/* External preview link */}
              <a
                href={hostedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Open Full Test Page <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Code Box */}
            <div className="relative">
              <pre className="bg-slate-900 p-4 rounded-2xl text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800 max-h-40">
                {currentSnippet}
              </pre>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-3 right-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Snippet
                  </>
                )}
              </button>
            </div>

            {/* Live Interactive Preview */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden flex flex-col bg-slate-100/60">
              <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-600" /> Interactive Preview
                </span>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-400'}`}
                    title="Desktop Preview"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-400'}`}
                    title="Mobile Preview"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-4 flex items-center justify-center min-h-[260px] overflow-hidden">
                <div
                  className={`bg-white rounded-2xl border border-slate-200 shadow-md p-5 transition-all ${
                    previewDevice === 'mobile' ? 'w-[290px]' : 'w-full max-w-[380px]'
                  }`}
                >
                  <div className="mb-3">
                    <h4 className="font-extrabold text-sm text-slate-900">{formTitle}</h4>
                    <p className="text-[11px] text-slate-500">Fill in the details below to connect with us.</p>
                  </div>

                  {mode === 'multistep' && (
                    <div className="flex gap-1 mb-3">
                      <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: primaryColor }} />
                      <div className="h-1 flex-1 bg-slate-200 rounded-full" />
                      <div className="h-1 flex-1 bg-slate-200 rounded-full" />
                    </div>
                  )}

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">What service do you need?</label>
                      <select className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-slate-50 font-medium">
                        <option>General Information & Pricing</option>
                        <option>Schedule a Direct Consultation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Your Name & Email</label>
                      <input
                        type="text"
                        disabled
                        placeholder="John Doe (john@example.com)"
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full mt-3 py-2 text-white font-bold text-xs rounded-xl shadow-xs transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {mode === 'multistep' ? 'Next Step →' : buttonText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
