'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/components/Toast';
import { playLeadSound } from '@/lib/notificationSound';

const POLL_INTERVAL_MS = 10_000; // Poll every 10 seconds for dashboards

interface UseDashboardPollerOptions {
  /** The analytics API endpoint */
  analyticsUrl: string;
  /** The data state setter */
  setData: React.Dispatch<React.SetStateAction<any>>;
  /** Whether the component is still doing initial load */
  isInitialLoad: boolean;
}

/**
 * useDashboardPoller — Polls the analytics API to auto-refresh dashboard
 * metrics. When the total lead count increases, it plays a sound and
 * shows a toast notification.
 */
export function useDashboardPoller({
  analyticsUrl,
  setData,
  isInitialLoad,
}: UseDashboardPollerOptions) {
  const toast = useToast();
  const lastLeadCountRef = useRef<number | null>(null);
  const isFirstPollRef = useRef(true);

  const pollAnalytics = useCallback(async () => {
    try {
      const res = await fetch(analyticsUrl);
      if (!res.ok) return;
      const resData = await res.json();

      const currentCount = resData.totalLeads ?? 0;

      if (isFirstPollRef.current) {
        isFirstPollRef.current = false;
        lastLeadCountRef.current = currentCount;
        setData(resData);
        return;
      }

      const previousCount = lastLeadCountRef.current ?? 0;
      const newCount = currentCount - previousCount;

      if (newCount > 0) {
        lastLeadCountRef.current = currentCount;
        setData(resData);

        // Play notification sound
        playLeadSound();

        // Show toast
        if (newCount === 1) {
          // Try to get the name from the most recent lead
          const latestLead = resData.recentLeads?.[0];
          const name = latestLead
            ? [latestLead.firstName, latestLead.lastName].filter(Boolean).join(' ')
            : 'New Lead';
          toast.success(`🎯 New lead captured: ${name}`);
        } else {
          toast.success(`🎯 ${newCount} new leads just arrived!`);
        }
      } else {
        // Still refresh data for other metrics changes
        lastLeadCountRef.current = currentCount;
        setData(resData);
      }
    } catch {
      // Silent failure
    }
  }, [analyticsUrl, setData, toast]);

  useEffect(() => {
    if (isInitialLoad) return;

    isFirstPollRef.current = true;

    const interval = setInterval(pollAnalytics, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isInitialLoad, pollAnalytics]);
}
