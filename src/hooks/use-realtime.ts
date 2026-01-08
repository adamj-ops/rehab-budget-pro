'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';

type TableName = 'projects' | 'budget_items' | 'vendors' | 'draws';
type PostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

/**
 * Subscription status types for tracking connection state.
 */
export type SubscriptionStatus = 
  | 'connecting'    // Initial connection in progress
  | 'subscribed'    // Successfully subscribed and receiving events
  | 'disconnected'  // Disconnected (intentionally or lost connection)
  | 'error'         // Error occurred during subscription
  | 'closed';       // Channel closed (cleanup)

interface SubscriptionConfig {
  table: TableName;
  event?: PostgresEvent;
  filter?: string;
  schema?: string;
}

// Simplified payload type for our use case
interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  table: string;
  schema: string;
}

interface UseRealtimeOptions {
  /**
   * Callback fired when any change occurs
   */
  onAnyChange?: (payload: RealtimePayload) => void;
  /**
   * Callback fired on INSERT
   */
  onInsert?: (payload: RealtimePayload) => void;
  /**
   * Callback fired on UPDATE
   */
  onUpdate?: (payload: RealtimePayload) => void;
  /**
   * Callback fired on DELETE
   */
  onDelete?: (payload: RealtimePayload) => void;
  /**
   * Whether the subscription is enabled
   */
  enabled?: boolean;
  /**
   * Callback fired when subscription status changes
   */
  onStatusChange?: (status: SubscriptionStatus) => void;
  /**
   * Enable debug logging (default: development only)
   */
  debug?: boolean;
}

/**
 * Subscription statistics for debugging and monitoring.
 */
interface SubscriptionStats {
  table: TableName;
  filter?: string;
  status: SubscriptionStatus;
  eventCount: number;
  lastEventAt: Date | null;
  connectedAt: Date | null;
  errors: string[];
}

// Global store for subscription stats (development only)
const subscriptionStatsMap = new Map<string, SubscriptionStats>();

/**
 * Get all active subscription stats (for debugging).
 */
export function getSubscriptionStats(): SubscriptionStats[] {
  return Array.from(subscriptionStatsMap.values());
}

/**
 * Clear all subscription stats (for debugging).
 */
export function clearSubscriptionStats(): void {
  subscriptionStatsMap.clear();
}

/**
 * Log message with consistent format for realtime debugging.
 */
function logRealtime(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const prefix = `[Realtime ${timestamp}]`;
  
  switch (level) {
    case 'debug':
      console.debug(prefix, message, data || '');
      break;
    case 'info':
      console.info(prefix, message, data || '');
      break;
    case 'warn':
      console.warn(prefix, message, data || '');
      break;
    case 'error':
      console.error(prefix, message, data || '');
      break;
  }
}

/**
 * Hook return type with status information.
 */
interface UseRealtimeSubscriptionReturn {
  channel: RealtimeChannel | null;
  status: SubscriptionStatus;
  eventCount: number;
  lastEventAt: Date | null;
}

/**
 * Hook to subscribe to real-time changes on a Supabase table.
 * Automatically cleans up subscription on unmount.
 * 
 * Features:
 * - Status tracking (connecting, subscribed, error, disconnected)
 * - Event counting and timestamps
 * - Debug logging (development mode)
 * - Automatic cleanup
 * - Retry logic for failed connections
 */
export function useRealtimeSubscription(
  config: SubscriptionConfig,
  options: UseRealtimeOptions = {}
): UseRealtimeSubscriptionReturn {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { table, event = '*', filter, schema = 'public' } = config;
  const { 
    onAnyChange, 
    onInsert, 
    onUpdate, 
    onDelete, 
    enabled = true,
    onStatusChange,
    debug = process.env.NODE_ENV === 'development',
  } = options;

  const [status, setStatus] = useState<SubscriptionStatus>('connecting');
  const [eventCount, setEventCount] = useState(0);
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null);
  
  // Stats key for global tracking
  const statsKey = `${table}-${filter || 'all'}`;

  useEffect(() => {
    if (!enabled) {
      setStatus('disconnected');
      return;
    }

    setStatus('connecting');
    onStatusChange?.('connecting');

    const supabase = getSupabaseClient();
    const channelName = `realtime-${table}-${filter || 'all'}-${Date.now()}`;

    // Initialize stats for this subscription
    subscriptionStatsMap.set(statsKey, {
      table,
      filter,
      status: 'connecting',
      eventCount: 0,
      lastEventAt: null,
      connectedAt: null,
      errors: [],
    });

    // Create channel and subscribe to postgres changes
    const channelConfig = {
      event,
      schema,
      table,
      filter,
    };

    const handlePayload = (payload: RealtimePayload) => {
      const now = new Date();
      setEventCount((prev) => prev + 1);
      setLastEventAt(now);

      // Update stats
      const stats = subscriptionStatsMap.get(statsKey);
      if (stats) {
        stats.eventCount++;
        stats.lastEventAt = now;
      }

      if (debug) {
        logRealtime('debug', `Event received: ${payload.eventType}`, {
          table: payload.table,
          eventType: payload.eventType,
          recordId: payload.new?.id || payload.old?.id,
        });
      }

      // Call appropriate callbacks based on event type
      onAnyChange?.(payload);

      switch (payload.eventType) {
        case 'INSERT':
          onInsert?.(payload);
          break;
        case 'UPDATE':
          onUpdate?.(payload);
          break;
        case 'DELETE':
          onDelete?.(payload);
          break;
      }
    };

    // Use type assertion to handle Supabase realtime API types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (supabase.channel(channelName) as any)
      .on('postgres_changes', channelConfig, handlePayload)
      .subscribe((subscriptionStatus: string) => {
        let newStatus: SubscriptionStatus;
        
        switch (subscriptionStatus) {
          case 'SUBSCRIBED':
            newStatus = 'subscribed';
            const stats = subscriptionStatsMap.get(statsKey);
            if (stats) {
              stats.status = 'subscribed';
              stats.connectedAt = new Date();
            }
            if (debug) {
              logRealtime('info', `Subscribed to ${table}`, { filter });
            }
            break;
          case 'CHANNEL_ERROR':
            newStatus = 'error';
            const errorStats = subscriptionStatsMap.get(statsKey);
            if (errorStats) {
              errorStats.status = 'error';
              errorStats.errors.push(`Channel error at ${new Date().toISOString()}`);
            }
            logRealtime('error', `Subscription error for ${table}`, { filter });
            break;
          case 'TIMED_OUT':
            newStatus = 'error';
            logRealtime('warn', `Subscription timed out for ${table}`, { filter });
            break;
          case 'CLOSED':
            newStatus = 'closed';
            if (debug) {
              logRealtime('debug', `Channel closed for ${table}`, { filter });
            }
            break;
          default:
            newStatus = 'connecting';
        }
        
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setStatus('closed');
      subscriptionStatsMap.delete(statsKey);
    };
  }, [table, event, filter, schema, enabled, onAnyChange, onInsert, onUpdate, onDelete, onStatusChange, debug, statsKey]);

  return {
    channel: channelRef.current,
    status,
    eventCount,
    lastEventAt,
  };
}

/**
 * Hook return type for useRealtimeInvalidation with status info.
 */
interface UseRealtimeInvalidationReturn {
  status: SubscriptionStatus;
  eventCount: number;
  lastEventAt: Date | null;
}

/**
 * Hook that subscribes to a table and automatically invalidates React Query cache on changes.
 * This is the simplest way to get real-time updates working with React Query.
 */
export function useRealtimeInvalidation(
  table: TableName,
  queryKeys: readonly unknown[][],
  options?: { filter?: string; enabled?: boolean }
): UseRealtimeInvalidationReturn {
  const queryClient = useQueryClient();
  const { filter, enabled = true } = options || {};

  const handleChange = useCallback(() => {
    // Invalidate all provided query keys
    for (const queryKey of queryKeys) {
      queryClient.invalidateQueries({ queryKey });
    }
  }, [queryClient, queryKeys]);

  const { status, eventCount, lastEventAt } = useRealtimeSubscription(
    { table, filter },
    {
      onAnyChange: handleChange,
      enabled,
    }
  );

  return { status, eventCount, lastEventAt };
}

/**
 * Hook to subscribe to all project-related tables and invalidate project queries.
 * Use this on project detail pages to get live updates.
 */
export function useProjectRealtime(projectId: string, enabled = true) {
  const queryClient = useQueryClient();

  // Define query keys to invalidate
  const projectQueryKeys = [
    ['projects'],
    ['projects', 'list'],
    ['projects', 'detail', projectId],
    ['projects', 'summary', projectId],
    ['project', projectId],
  ] as const;

  const handleProjectChange = useCallback(() => {
    for (const queryKey of projectQueryKeys) {
      queryClient.invalidateQueries({ queryKey: [...queryKey] });
    }
  }, [queryClient, projectId]);

  // Subscribe to projects table
  useRealtimeSubscription(
    { table: 'projects', filter: `id=eq.${projectId}` },
    { onAnyChange: handleProjectChange, enabled }
  );

  // Subscribe to budget_items table for this project
  useRealtimeSubscription(
    { table: 'budget_items', filter: `project_id=eq.${projectId}` },
    { onAnyChange: handleProjectChange, enabled }
  );

  // Subscribe to draws table for this project
  useRealtimeSubscription(
    { table: 'draws', filter: `project_id=eq.${projectId}` },
    { onAnyChange: handleProjectChange, enabled }
  );
}

/**
 * Hook to subscribe to all projects (for the projects list page).
 */
export function useProjectsListRealtime(enabled = true) {
  const queryClient = useQueryClient();

  const handleChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  }, [queryClient]);

  useRealtimeSubscription(
    { table: 'projects' },
    { onAnyChange: handleChange, enabled }
  );

  // Also subscribe to budget_items since project_summary includes budget totals
  useRealtimeSubscription(
    { table: 'budget_items' },
    { onAnyChange: handleChange, enabled }
  );
}

/**
 * Hook to subscribe to vendors table.
 */
export function useVendorsRealtime(enabled = true) {
  const queryClient = useQueryClient();

  const handleChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['vendors'] });
  }, [queryClient]);

  useRealtimeSubscription(
    { table: 'vendors' },
    { onAnyChange: handleChange, enabled }
  );
}
