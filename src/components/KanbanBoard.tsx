'use client';

import { useState } from 'react';
import {
  Layers,
  MessageSquare,
  Phone,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  FileText,
  Clock,
} from 'lucide-react';
import { TimestampCopyBadge } from '@/components/TimestampCopyBadge';

interface KanbanBoardProps {
  leads: any[];
  onStatusChange: (leadId: string, newStatus: string) => void;
  onLeadClick: (lead: any) => void;
}

const STAGES = [
  { id: 'NEW', name: 'New Ingested', headerBg: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-400' },
  { id: 'CONTACTED', name: 'Attempted / Contacted', headerBg: 'bg-amber-50 text-amber-900 border-amber-300', dot: 'bg-amber-500' },
  { id: 'QUALIFIED', name: 'Qualified Prospect', headerBg: 'bg-blue-50 text-blue-900 border-blue-300', dot: 'bg-blue-600' },
  { id: 'PROPOSAL', name: 'Proposal / Quote', headerBg: 'bg-purple-50 text-purple-900 border-purple-300', dot: 'bg-purple-600' },
  { id: 'CONVERTED', name: 'Won / Converted', headerBg: 'bg-emerald-50 text-emerald-900 border-emerald-300', dot: 'bg-emerald-600' },
  { id: 'UNQUALIFIED', name: 'Lost / Spam', headerBg: 'bg-rose-50 text-rose-900 border-rose-300', dot: 'bg-rose-500' },
];

export function KanbanBoard({ leads, onStatusChange, onLeadClick }: KanbanBoardProps) {
  const [movingId, setMovingId] = useState<string | null>(null);

  const getStageIndex = (status: string) => {
    const idx = STAGES.findIndex((s) => s.id === status);
    return idx === -1 ? 0 : idx;
  };

  const handleAdvance = (e: React.MouseEvent, lead: any, direction: number) => {
    e.stopPropagation();
    const currentIdx = getStageIndex(lead.status);
    const targetIdx = currentIdx + direction;
    if (targetIdx >= 0 && targetIdx < STAGES.length) {
      setMovingId(lead.id);
      onStatusChange(lead.id, STAGES[targetIdx].id);
      setTimeout(() => setMovingId(null), 500);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-thin">
      {STAGES.map((stage, sIdx) => {
        const stageLeads = leads.filter((l) => (l.status || 'NEW') === stage.id);

        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80 bg-slate-100/70 border border-slate-200/90 rounded-2xl flex flex-col max-h-[calc(100vh-230px)] shadow-xs"
          >
            {/* Column Header */}
            <div className={`p-3.5 border-b rounded-t-2xl flex items-center justify-between font-bold text-xs ${stage.headerBg}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`}></span>
                <span>{stage.name}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/80 border border-slate-200/70 text-[11px] font-black shadow-2xs">
                {stageLeads.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {stageLeads.length === 0 ? (
                <div className="p-6 text-center text-[11px] font-medium text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No leads in this stage
                </div>
              ) : (
                stageLeads.map((lead) => {
                  const cleanPhone = (lead.phone || '').replace(/\D/g, '');
                  const score = lead.score ?? 100;
                  const grade = lead.qualityGrade ?? 'A';

                  const getGradeBadge = () => {
                    if (grade === 'SPAM' || lead.isSpam)
                      return 'bg-rose-100 text-rose-800 border-rose-200';
                    if (score >= 85) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    if (score >= 70) return 'bg-blue-100 text-blue-800 border-blue-200';
                    return 'bg-amber-100 text-amber-800 border-amber-200';
                  };

                  return (
                    <div
                      key={lead.id}
                      onClick={() => onLeadClick(lead)}
                      className={`group bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-2.5 relative ${
                        movingId === lead.id ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      {/* Card Header: Name & Quality Grade */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                            {lead.firstName} {lead.lastName || ''}
                          </h4>
                          <p className="font-mono text-[11px] text-blue-600 font-semibold truncate max-w-[170px]">
                            {lead.email}
                          </p>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase shrink-0 ${getGradeBadge()}`}>
                          {grade}
                        </span>
                      </div>

                      {/* Phone & Campaign */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span className="font-mono">{lead.phone || 'No phone'}</span>
                        <span className="truncate max-w-[110px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[10px]">
                          {lead.campaign?.name || 'Standard'}
                        </span>
                      </div>

                      {/* Duplicate warning & Notes count */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {lead.isDuplicate && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 border border-amber-200 text-amber-900 text-[9px] font-extrabold flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                            Dup ({lead.duplicateCount || 1}x)
                          </span>
                        )}

                        {lead._count?.notes > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-extrabold flex items-center gap-0.5">
                            <FileText className="w-2.5 h-2.5" />
                            {lead._count.notes} note{lead._count.notes > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Timestamp & Timezone with 1-Click Copy */}
                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                        <TimestampCopyBadge
                          date={lead.createdAt}
                          timezone={lead.timezone}
                          leadName={`${lead.firstName} ${lead.lastName || ''}`}
                          compact={true}
                        />

                        {/* Quick outreach buttons */}
                        <div className="flex items-center gap-1">
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition-all shadow-2xs"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </a>
                          )}
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white transition-all shadow-2xs"
                              title="Call"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Stage Progression Controls */}
                      <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-100">
                        <button
                          disabled={sIdx === 0}
                          onClick={(e) => handleAdvance(e, lead, -1)}
                          className="px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 flex items-center gap-1 rounded hover:bg-slate-100 transition-all"
                        >
                          <ArrowLeft className="w-2.5 h-2.5" /> Prev
                        </button>

                        <span className="text-[9px] font-mono text-slate-400">Move Stage</span>

                        <button
                          disabled={sIdx === STAGES.length - 1}
                          onClick={(e) => handleAdvance(e, lead, 1)}
                          className="px-2 py-0.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 disabled:opacity-30 disabled:hover:text-blue-600 flex items-center gap-1 rounded hover:bg-blue-50 transition-all"
                        >
                          Next <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
