'use client';

import { useState } from 'react';
import {
  X,
  Mail,
  Send,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Clock,
  Sparkles,
  Building,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

interface ExecutiveDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  clientName?: string;
  totalLeads?: number;
  totalCampaigns?: number;
}

export function ExecutiveDigestModal({
  isOpen,
  onClose,
  defaultEmail = '',
  clientName = 'Tenant Account',
  totalLeads = 0,
  totalCampaigns = 0,
}: ExecutiveDigestModalProps) {
  const toast = useToast();
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendDigest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Please provide a valid recipient email address');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/reports/send-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Executive Digest sent to ${recipientEmail}`);
        setLastSentTime(new Date().toLocaleTimeString());
      } else {
        toast.error(data.error || 'Failed to dispatch email');
      }
    } catch {
      toast.error('Network error during email dispatch');
    } finally {
      setSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
              <Mail className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Executive Monday Digest & Report</h3>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  SMTP Ready
                </span>
              </div>
              <p className="text-xs text-blue-200/80 font-medium">
                Official Acquisition, Conversion & Speed-to-Lead Audit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Executive KPI Preview Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" /> Account: {clientName}
              </span>
              <span className="text-[11px] font-mono font-bold text-blue-600">
                Period: Weekly Audit
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Leads</span>
                <p className="text-lg font-black text-slate-900 mt-0.5">{totalLeads}</p>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400">Campaigns</span>
                <p className="text-lg font-black text-blue-600 mt-0.5">{totalCampaigns}</p>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400">Speed-to-Lead</span>
                <p className="text-lg font-black text-emerald-600 mt-0.5">4.5 min</p>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 font-medium bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>
                Report includes <strong>pipeline win rates</strong>, <strong>lead quality breakdown (Grades A-D)</strong>, and <strong>top-performing marketing sources</strong>.
              </span>
            </div>
          </div>

          {/* Form to Send Now */}
          <form onSubmit={handleSendDigest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Deliver Digest To Email Address:</span>
                <span className="text-[10px] text-slate-400 font-normal">Default: Your account email</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="executive@company.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {lastSentTime && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Last executive digest was sent successfully at {lastSentTime}!</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all border border-slate-200"
              >
                <Printer className="w-4 h-4 text-slate-600" /> Print / Save 1-Page Summary
              </button>

              <button
                type="submit"
                disabled={sending}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Dispatching Digest...' : 'Send Executive Digest Now'}
              </button>
            </div>
          </form>

          {/* Automated Schedule Notice */}
          <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-blue-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" /> Automated Monday Delivery Active:
            </p>
            <p className="text-slate-500">
              This report also runs automatically every Monday at 8:00 AM via <code className="font-mono text-[10px] text-blue-700 bg-blue-100/70 px-1 py-0.5 rounded">/api/cron/executive-digest</code> and delivers directly to the client's registered contact email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
