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
      // Ensure poll request is lightweight (e.g. top 20 newest leads)
      const pollUrl = new URL(apiUrl, window.location.origin);
      if (!pollUrl.searchParams.has('limit')) {
        pollUrl.searchParams.set('limit', '20');
      }
      pollUrl.searchParams.set('page', '1');

      const res = await fetch(pollUrl.toString());
      if (!res.ok) return;
      const data = await res.json();
      const fetchedLeads: any[] = data.leads || [];

      if (fetchedLeads.length === 0) return;

      // On the very first poll after mount, just seed the known IDs
      if (isFirstPollRef.current) {
        isFirstPollRef.current = false;
        fetchedLeads.forEach((l) => knownIdsRef.current.add(l.id));
        return;
      }

      // Find leads that aren't in our known set
      const newLeads = fetchedLeads.filter((l) => !knownIdsRef.current.has(l.id));

      if (newLeads.length > 0) {
        // Update the known IDs set
        newLeads.forEach((l) => knownIdsRef.current.add(l.id));

        // Prepend new leads to current state list
        setLeads((prev) => {
          const existingIds = new Set(prev.map((l) => l.id));
          const uniqueNew = newLeads.filter((l) => !existingIds.has(l.id));
          return [...uniqueNew, ...prev];
        });

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
      }
    } catch {
      // Silently fail on poll errors
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
