'use client';

import { useState } from 'react';
import { Copy, Check, Clock, Globe } from 'lucide-react';

interface TimestampCopyBadgeProps {
  date: string | Date;
  timezone?: string | null;
  leadName?: string;
  leadEmail?: string;
  showIcon?: boolean;
  className?: string;
  compact?: boolean;
}

export function TimestampCopyBadge({
  date,
  timezone = 'UTC',
  leadName,
  leadEmail,
  showIcon = true,
  className = '',
  compact = false,
}: TimestampCopyBadgeProps) {
  const [copied, setCopied] = useState(false);

  const d = new Date(date);
  const isValid = !isNaN(d.getTime());

  // Determine timezone to display
  const tz = timezone && timezone.trim() !== '' ? timezone.trim() : 'UTC';

  // Format date with options
  let formattedTime = 'Invalid Date';
  let formattedDate = '';
  let fullFormattedString = '';

  if (isValid) {
    try {
      // Localized with specified timezone if valid IANA timezone
      formattedDate = d.toLocaleDateString(undefined, {
        timeZone: tz === 'UTC' ? 'UTC' : undefined,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      formattedTime = d.toLocaleTimeString(undefined, {
        timeZone: tz === 'UTC' ? 'UTC' : undefined,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      fullFormattedString = `${formattedDate} ${formattedTime} [${tz}]`;
    } catch {
      // Fallback if tz is custom offset or non-standard
      fullFormattedString = `${d.toISOString().replace('T', ' ').slice(0, 19)} [${tz}]`;
      formattedDate = d.toISOString().slice(0, 10);
      formattedTime = d.toISOString().slice(11, 19);
    }
  }

  // Combined string to copy into clipboard
  const copyValue = fullFormattedString + (leadName ? ` | ${leadName}` : '') + (leadEmail ? ` <${leadEmail}>` : '');

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(copyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={handleCopy}
      title="Click to copy Timestamp & Timezone"
      className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-left cursor-pointer transition-all select-none ${
        copied
          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
          : 'bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700'
      } ${className}`}
    >
      {showIcon && (
        <Clock className={`w-3.5 h-3.5 shrink-0 ${copied ? 'text-emerald-600' : 'text-slate-400 group-hover:text-blue-600'}`} />
      )}

      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1">
          <span className="font-mono text-[11px] font-bold tracking-tight">
            {compact ? `${formattedDate} ${formattedTime}` : formattedDate}
          </span>
          {!compact && (
            <span className="font-mono text-[10px] text-slate-500 font-medium">
              {formattedTime}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 group-hover:text-blue-600">
          <Globe className="w-2.5 h-2.5" />
          <span className="truncate max-w-[120px]">{tz}</span>
        </div>
      </div>

      <button
        type="button"
        className={`ml-1 p-1 rounded transition-colors ${
          copied
            ? 'bg-emerald-200 text-emerald-900'
            : 'bg-white group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-700 shadow-2xs'
        }`}
        title={copied ? 'Copied to clipboard!' : 'Copy Timestamp & Timezone'}
      >
        {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}
