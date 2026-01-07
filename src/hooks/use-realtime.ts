'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';

type TableName = 'projects' | 'budget_items' | 'vendors' | 'draws';
type PostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

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
}

/**
 * Hook to subscribe to real-time changes on a Supabase table.
 * Automatically cleans up subscription on unmount.
 */
export function useRealtimeSubscription(
  config: SubscriptionConfig,
  options: UseRealtimeOptions = {}
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { table, event = '*', filter, schema = 'public' } = config;
  const { onAnyChange, onInsert, onUpdate, onDelete, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const supabase = getSupabaseClient();
    const channelName = `realtime-${table}-${filter || 'all'}-${Date.now()}`;

    // Create channel and subscribe to postgres changes
    const channelConfig = {
      event,
      schema,
      table,
      filter,
    };

    const handlePayload = (payload: RealtimePayload) => {
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
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.debug(`Realtime subscribed to ${table}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Realtime subscription error for ${table}`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, event, filter, schema, enabled, onAnyChange, onInsert, onUpdate, onDelete]);

  return channelRef.current;
}

/**
 * Hook that subscribes to a table and automatically invalidates React Query cache on changes.
 * This is the simplest way to get real-time updates working with React Query.
 */
export function useRealtimeInvalidation(
  table: TableName,
  queryKeys: readonly unknown[][],
  options?: { filter?: string; enabled?: boolean }
) {
  const queryClient = useQueryClient();
  const { filter, enabled = true } = options || {};

  const handleChange = useCallback(() => {
    // Invalidate all provided query keys
    for (const queryKey of queryKeys) {
      queryClient.invalidateQueries({ queryKey });
    }
  }, [queryClient, queryKeys]);

  useRealtimeSubscription(
    { table, filter },
    {
      onAnyChange: handleChange,
      enabled,
    }
  );
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
