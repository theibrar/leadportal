'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Send,
  Calendar,
  Layers,
  AlertTriangle,
  User,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { TimestampCopyBadge } from '@/components/TimestampCopyBadge';

interface LeadDetailDrawerProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated?: (updatedLead: any) => void;
  role?: 'ADMIN' | 'CLIENT';
}

const PIPELINE_STATUSES = [
  { value: 'NEW', label: 'New Ingested', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  { value: 'CONTACTED', label: 'Contacted / Outreach', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  { value: 'QUALIFIED', label: 'Qualified Prospect', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  { value: 'PROPOSAL', label: 'Proposal / Quote Sent', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  { value: 'CONVERTED', label: 'Won / Converted', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { value: 'UNQUALIFIED', label: 'Unqualified / Spam', color: 'bg-rose-100 text-rose-900 border-rose-300' },
];

export function LeadDetailDrawer({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
  role = 'CLIENT',
}: LeadDetailDrawerProps) {
  const [currentLead, setCurrentLead] = useState<any>(lead);
  const [status, setStatus] = useState(lead?.status || 'NEW');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'raw'>('overview');

  useEffect(() => {
    if (lead) {
      setCurrentLead(lead);
      setStatus(lead.status || 'NEW');
      fetchNotes(lead.id);
    }
  }, [lead]);

  const apiBasePath = role === 'ADMIN' ? '/api/admin/leads' : '/api/client/leads';

  const fetchNotes = async (leadId: string) => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`${apiBasePath}/${leadId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    setUpdatingStatus(true);
    const prevStatus = status;
    setStatus(newStatus);

    try {
      const res = await fetch(`${apiBasePath}/${currentLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentLead(data.lead);
        if (onLeadUpdated) onLeadUpdated(data.lead);
        fetchNotes(currentLead.id); // Refresh notes to show status change note
      } else {
        setStatus(prevStatus);
      }
    } catch {
      setStatus(prevStatus);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || addingNote) return;

    setAddingNote(true);
    try {
      const res = await fetch(`${apiBasePath}/${currentLead.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        setNewNote('');
        if (onLeadUpdated) {
          onLeadUpdated({
            ...currentLead,
            _count: { notes: (notes.length + 1) },
          });
        }
      }
    } catch {
      // ignore
    } finally {
      setAddingNote(false);
    }
  };

  if (!isOpen || !currentLead) return null;

  // Phone clean for WhatsApp
  const cleanPhone = (currentLead.phone || '').replace(/\D/g, '');
  const whatsAppUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hi ${currentLead.firstName}, reaching out regarding your inquiry!`
      )}`
    : null;

  // Custom Payload parsing
  let customJson: any = null;
  if (currentLead.customData) {
    try {
      customJson =
        typeof currentLead.customData === 'string'
          ? JSON.parse(currentLead.customData)
          : currentLead.customData;
    } catch {
      customJson = { raw: currentLead.customData };
    }
  }

  // Quality score color
  const score = currentLead.score ?? 100;
  const grade = currentLead.qualityGrade ?? 'A';
  const getScoreColor = () => {
    if (grade === 'SPAM' || score < 30) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-blue-700 bg-blue-50 border-blue-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end transition-all">
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {currentLead.firstName} {currentLead.lastName || ''}
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black border ${getScoreColor()}`}>
                Grade {grade} ({score}%)
              </span>
              {currentLead.isDuplicate && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Duplicate ({currentLead.duplicateCount || 1}x)
                </span>
              )}
              {currentLead.isSpam && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                  ?? SPAM
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Campaign: <span className="text-slate-900 font-bold">{currentLead.campaign?.name || 'Standard'}</span>
              {currentLead.client?.name && (
                <span className="ml-1 text-slate-400">({currentLead.client.name})</span>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar (Call / WhatsApp / Email) */}
        <div className="px-6 py-3 bg-blue-50/70 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {whatsAppUrl ? (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Lead
              </a>
            ) : null}

            {currentLead.phone && (
              <a
                href={`tel:${currentLead.phone}`}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" /> Call {currentLead.phone}
              </a>
            )}

            {currentLead.email && currentLead.email !== 'N/A' && (
              <a
                href={`mailto:${currentLead.email}`}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Mail className="w-3.5 h-3.5 text-purple-600" /> Email
              </a>
            )}
          </div>

          {/* Timestamp & Timezone with 1-Click Copy */}
          <TimestampCopyBadge
            date={currentLead.createdAt}
            timezone={currentLead.timezone}
            leadName={`${currentLead.firstName} ${currentLead.lastName || ''}`}
            leadEmail={currentLead.email}
          />
        </div>

        {/* Status Pipeline Bar */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Pipeline Stage:</span>
            <select
              value={status}
              disabled={updatingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
            >
              {PIPELINE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-medium">Source:</span>
            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
              {currentLead.source || 'WEBHOOK'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 bg-white font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Overview & Details
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-blue-600 text-blue-600 bg-white font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            CRM Notes & History ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'raw'
                ? 'border-blue-600 text-blue-600 bg-white font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Raw Ingest Payload
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quality & Security Card */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Quality & Fraud Analysis
                  </span>
                  <span className="text-xs font-bold text-slate-700">Quality Score: {score} / 100</span>
                </div>

                {/* Score Progress Bar */}
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      score >= 80
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                        : score >= 50
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        : 'bg-gradient-to-r from-rose-500 to-rose-600'
                    }`}
                    style={{ width: `${Math.max(10, score)}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Deduplication Status</span>
                    <p className="font-bold text-slate-900">
                      {currentLead.isDuplicate ? `Duplicate (${currentLead.duplicateCount || 1} prior)` : 'Unique Verified Lead'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Bot & Spam Check</span>
                    <p className={`font-bold ${currentLead.isSpam ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {currentLead.isSpam ? currentLead.spamReason || 'Flagged Bot' : 'Passed Bot Filter'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lead Contact Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Full Name</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{currentLead.firstName} {currentLead.lastName || ''}</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Email Address</span>
                    <p className="font-mono font-bold text-blue-600 mt-0.5 select-all">{currentLead.email}</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Phone Number</span>
                    <p className="font-mono font-bold text-slate-800 mt-0.5 select-all">{currentLead.phone || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Captured Time & Timezone</span>
                    <p className="font-mono font-bold text-slate-800 mt-0.5">
                      {new Date(currentLead.createdAt).toLocaleString()} [{currentLead.timezone || 'UTC'}]
                    </p>
                  </div>
                </div>
              </div>

              {/* Extracted Marketing Parameters */}
              {customJson && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Form & Attribution Fields</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(customJson).map(([k, v]) => {
                      if (typeof v === 'object') return null;
                      return (
                        <div key={k} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{k}</span>
                          <span className="font-medium text-slate-800 truncate" title={String(v)}>
                            {String(v)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Add Note Input Form */}
              <form onSubmit={handleAddNote} className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-700 block">
                  Add Follow-Up / Sales Note
                </label>
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. Called lead at 2:00 PM, requested callback tomorrow morning. Interested in premium tier..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addingNote || !newNote.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" /> {addingNote ? 'Saving Note...' : 'Save Note'}
                  </button>
                </div>
              </form>

              {/* Notes Timeline List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Lead Activity History & Notes
                </h4>

                {loadingNotes ? (
                  <p className="text-xs text-slate-400 italic">Loading notes history...</p>
                ) : notes.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No notes recorded yet. Add the first sales follow-up note above!
                  </div>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-blue-600" />
                          <span className="font-bold text-slate-900">{n.authorName}</span>
                          <span className="px-1.5 py-0.2 bg-slate-100 border text-slate-600 rounded text-[9px] font-bold">
                            {n.authorRole}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap font-medium pt-1">
                        {n.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Full Ingestion Payload JSON
                </h4>
                <button
                  onClick={() => {
                    navigator?.clipboard?.writeText(
                      typeof currentLead.customData === 'string'
                        ? currentLead.customData
                        : JSON.stringify(currentLead.customData, null, 2)
                    );
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy JSON
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-[450px]">
                {typeof currentLead.customData === 'string'
                  ? JSON.stringify(JSON.parse(currentLead.customData || '{}'), null, 2)
                  : JSON.stringify(currentLead.customData || {}, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
