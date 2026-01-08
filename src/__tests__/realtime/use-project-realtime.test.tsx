import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjectRealtime, useProjectsListRealtime, useVendorsRealtime } from '@/hooks/use-realtime';
import { createMockSupabaseClient } from '../utils/test-utils';

// Mock the supabase client module
jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

import { getSupabaseClient } from '@/lib/supabase/client';

const mockGetSupabaseClient = getSupabaseClient as jest.MockedFunction<typeof getSupabaseClient>;

describe('Project Realtime Hooks', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let queryClient: QueryClient;
  const channelCallbacks: Map<string, (payload: unknown) => void> = new Map();

  // Wrapper component with QueryClient
  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    channelCallbacks.clear();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Spy on invalidateQueries
    jest.spyOn(queryClient, 'invalidateQueries');

    const createMockChannel = (channelName: string) => ({
      on: jest.fn().mockImplementation((_event, config, callback) => {
        // Store callback by table name for later triggering
        channelCallbacks.set(`${config.table}-${config.filter || 'all'}`, callback);
        return createMockChannel(channelName);
      }),
      subscribe: jest.fn().mockImplementation((callback) => {
        setTimeout(() => callback?.('SUBSCRIBED'), 0);
        return createMockChannel(channelName);
      }),
    });

    mockSupabase = createMockSupabaseClient();
    mockSupabase.channel.mockImplementation((name) => createMockChannel(name));
    mockGetSupabaseClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof getSupabaseClient>);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useProjectRealtime', () => {
    const projectId = 'test-project-123';

    it('should subscribe to projects, budget_items, and draws tables', () => {
      renderHook(() => useProjectRealtime(projectId), {
        wrapper: createWrapper(),
      });

      // Should have created 3 channels (projects, budget_items, draws)
      expect(mockSupabase.channel).toHaveBeenCalledTimes(3);
    });

    it('should apply project filter to all subscriptions', () => {
      renderHook(() => useProjectRealtime(projectId), {
        wrapper: createWrapper(),
      });

      // Check that filters include the project ID
      expect(channelCallbacks.has(`projects-id=eq.${projectId}`)).toBe(true);
      expect(channelCallbacks.has(`budget_items-project_id=eq.${projectId}`)).toBe(true);
      expect(channelCallbacks.has(`draws-project_id=eq.${projectId}`)).toBe(true);
    });

    it('should invalidate project queries on project change', () => {
      renderHook(() => useProjectRealtime(projectId), {
        wrapper: createWrapper(),
      });

      const payload = {
        eventType: 'UPDATE' as const,
        new: { id: projectId },
        old: { id: projectId },
        table: 'projects',
        schema: 'public',
      };

      act(() => {
        channelCallbacks.get(`projects-id=eq.${projectId}`)?.(payload);
      });

      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });

    it('should invalidate project queries on budget_items change', () => {
      renderHook(() => useProjectRealtime(projectId), {
        wrapper: createWrapper(),
      });

      const payload = {
        eventType: 'INSERT' as const,
        new: { id: 'item-1', project_id: projectId },
        old: {},
        table: 'budget_items',
        schema: 'public',
      };

      act(() => {
        channelCallbacks.get(`budget_items-project_id=eq.${projectId}`)?.(payload);
      });

      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });

    it('should invalidate project queries on draws change', () => {
      renderHook(() => useProjectRealtime(projectId), {
        wrapper: createWrapper(),
      });

      const payload = {
        eventType: 'UPDATE' as const,
        new: { id: 'draw-1', project_id: projectId },
        old: { id: 'draw-1', project_id: projectId },
        table: 'draws',
        schema: 'public',
      };

      act(() => {
        channelCallbacks.get(`draws-project_id=eq.${projectId}`)?.(payload);
      });

      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });

    it('should not subscribe when disabled', () => {
      renderHook(() => useProjectRealtime(projectId, false), {
        wrapper: createWrapper(),
      });

      expect(mockSupabase.channel).not.toHaveBeenCalled();
    });

    it('should cleanup subscriptions on unmount', () => {
      const { unmount } = renderHook(() => useProjectRealtime(projectId), {
        wrapper: createWrapper(),
      });

      unmount();

      // Should remove all 3 channels
      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(3);
    });
  });

  describe('useProjectsListRealtime', () => {
    it('should subscribe to projects and budget_items tables', () => {
      renderHook(() => useProjectsListRealtime(), {
        wrapper: createWrapper(),
      });

      // Should have created 2 channels
      expect(mockSupabase.channel).toHaveBeenCalledTimes(2);
      expect(channelCallbacks.has('projects-all')).toBe(true);
      expect(channelCallbacks.has('budget_items-all')).toBe(true);
    });

    it('should invalidate projects queries on project change', () => {
      renderHook(() => useProjectsListRealtime(), {
        wrapper: createWrapper(),
      });

      const payload = {
        eventType: 'INSERT' as const,
        new: { id: 'new-project' },
        old: {},
        table: 'projects',
        schema: 'public',
      };

      act(() => {
        channelCallbacks.get('projects-all')?.(payload);
      });

      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['projects'],
      });
    });

    it('should invalidate projects queries on budget_items change', () => {
      renderHook(() => useProjectsListRealtime(), {
        wrapper: createWrapper(),
      });

      const payload = {
        eventType: 'UPDATE' as const,
        new: { id: 'item-1', actual_amount: 1000 },
        old: { id: 'item-1', actual_amount: 0 },
        table: 'budget_items',
        schema: 'public',
      };

      act(() => {
        channelCallbacks.get('budget_items-all')?.(payload);
      });

      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });

    it('should not subscribe when disabled', () => {
      renderHook(() => useProjectsListRealtime(false), {
        wrapper: createWrapper(),
      });

      expect(mockSupabase.channel).not.toHaveBeenCalled();
    });
  });

  describe('useVendorsRealtime', () => {
    it('should subscribe to vendors table', () => {
      renderHook(() => useVendorsRealtime(), {
        wrapper: createWrapper(),
      });

      expect(mockSupabase.channel).toHaveBeenCalledTimes(1);
      expect(channelCallbacks.has('vendors-all')).toBe(true);
    });

    it('should invalidate vendors queries on vendor change', () => {
      renderHook(() => useVendorsRealtime(), {
        wrapper: createWrapper(),
      });

      const payload = {
        eventType: 'INSERT' as const,
        new: { id: 'vendor-1', name: 'New Vendor' },
        old: {},
        table: 'vendors',
        schema: 'public',
      };

      act(() => {
        channelCallbacks.get('vendors-all')?.(payload);
      });

      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['vendors'],
      });
    });

    it('should not subscribe when disabled', () => {
      renderHook(() => useVendorsRealtime(false), {
        wrapper: createWrapper(),
      });

      expect(mockSupabase.channel).not.toHaveBeenCalled();
    });
  });
});
