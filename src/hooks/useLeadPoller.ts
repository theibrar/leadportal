'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/components/Toast';
import { playLeadSound } from '@/lib/notificationSound';

const POLL_INTERVAL_MS = 2_000; // Poll every 2 seconds

interface UseLeadPollerOptions {
  /** The API endpoint to fetch leads from */
  apiUrl: string;
  /** Current leads state setter */
  setLeads: React.Dispatch<React.SetStateAction<any[]>>;
  /** Current leads array (used to detect new leads) */
  leads: any[];
  /** Whether the component is still loading initial data */
  isInitialLoad: boolean;
  /** Optional: a friendly label for the campaign/context (used in toast) */
  contextLabel?: string;
}

/**
 * useLeadPoller — Polls the leads API at regular intervals.
 * When new leads are detected (compared to the current list), it:
 * 1. Plays a notification sound
 * 2. Shows a beautiful toast notification
 * 3. Merges new leads into the existing list (newest first)
 *
 * It does NOT re-fetch on initial load (the page handles that).
 * Polling only begins once the initial load completes.
 */
export function useLeadPoller({
  apiUrl,
  setLeads,
  leads,
  isInitialLoad,
  contextLabel,
}: UseLeadPollerOptions) {
  const toast = useToast();
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isFirstPollRef = useRef(true);

  // Keep known IDs in sync whenever leads state changes
  useEffect(() => {
    const ids = new Set<string>(leads.map((l: any) => l.id));
    knownIdsRef.current = ids;
  }, [leads]);

  const pollForNewLeads = useCallback(async () => {
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) return;
      const data = await res.json();
      const fetchedLeads: any[] = data.leads || [];

      if (fetchedLeads.length === 0) return;

      // On the very first poll after mount, just seed the known IDs
      // (don't show notifications for existing data)
      if (isFirstPollRef.current) {
        isFirstPollRef.current = false;
        knownIdsRef.current = new Set(fetchedLeads.map((l) => l.id));
        setLeads(fetchedLeads);
        return;
      }

      // Find leads that aren't in our known set
      const newLeads = fetchedLeads.filter((l) => !knownIdsRef.current.has(l.id));

      if (newLeads.length > 0) {
        // Update the known IDs set
        const updatedIds = new Set(fetchedLeads.map((l) => l.id));
        knownIdsRef.current = updatedIds;

        // Update leads state with the full fresh list (already sorted by API)
        setLeads(fetchedLeads);

        // Play notification sound
        playLeadSound();

        // Show toast notification
        if (newLeads.length === 1) {
          const lead = newLeads[0];
          const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'New Lead';
          const campaign = lead.campaign?.name || contextLabel || '';
          toast.success(
            `🎯 New lead captured: ${name}${campaign ? ` → ${campaign}` : ''}`
          );
        } else {
          toast.success(
            `🎯 ${newLeads.length} new leads just arrived!${contextLabel ? ` (${contextLabel})` : ''}`
          );
        }
      } else {
        // Even if no new leads, update the full list to catch any status changes, etc.
        setLeads(fetchedLeads);
      }
    } catch {
      // Silently fail on poll errors — don't disrupt the user experience
    }
  }, [apiUrl, setLeads, toast, contextLabel]);

  // Start polling once initial load is complete
  useEffect(() => {
    if (isInitialLoad) return;

    // Seed initial known IDs from current leads
    isFirstPollRef.current = true;

    const interval = setInterval(pollForNewLeads, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isInitialLoad, pollForNewLeads]);
}
