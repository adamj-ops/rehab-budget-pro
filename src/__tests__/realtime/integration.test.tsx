/**
 * Integration tests for real-time subscriptions with React Query
 * 
 * These tests verify that real-time updates properly invalidate queries
 * and trigger data refetching in a more realistic scenario.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useRealtimeInvalidation } from '@/hooks/use-realtime';
import { createMockSupabaseClient } from '../utils/test-utils';

// Mock the supabase client module
jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

import { getSupabaseClient } from '@/lib/supabase/client';

const mockGetSupabaseClient = getSupabaseClient as jest.MockedFunction<typeof getSupabaseClient>;

describe('Realtime Integration Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let queryClient: QueryClient;
  let postgresChangesCallback: ((payload: unknown) => void) | null = null;

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    postgresChangesCallback = null;

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: 0 },
        mutations: { retry: false },
      },
    });

    const mockChannel = {
      on: jest.fn().mockImplementation((_event, _config, callback) => {
        postgresChangesCallback = callback;
        return mockChannel;
      }),
      subscribe: jest.fn().mockImplementation((callback) => {
        setTimeout(() => callback?.('SUBSCRIBED'), 0);
        return mockChannel;
      }),
    };

    mockSupabase = createMockSupabaseClient();
    mockSupabase.channel.mockReturnValue(mockChannel);
    mockGetSupabaseClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof getSupabaseClient>);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useRealtimeInvalidation', () => {
    it('should invalidate specified query keys on any change', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      renderHook(
        () =>
          useRealtimeInvalidation('projects', [['projects'], ['projects', 'list']]),
        { wrapper: createWrapper() }
      );

      const payload = {
        eventType: 'UPDATE' as const,
        new: { id: '123' },
        old: { id: '123' },
        table: 'projects',
        schema: 'public',
      };

      act(() => {
        postgresChangesCallback?.(payload);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['projects'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['projects', 'list'] });
    });

    it('should apply filter to subscription', () => {
      renderHook(
        () =>
          useRealtimeInvalidation('budget_items', [['budget']], {
            filter: 'project_id=eq.123',
          }),
        { wrapper: createWrapper() }
      );

      // The mock should have received the filter in the config
      // We can verify this by checking the channel.on call
      const mockChannel = mockSupabase.channel.mock.results[0].value;
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          filter: 'project_id=eq.123',
        }),
        expect.any(Function)
      );
    });

    it('should not invalidate when disabled', () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      renderHook(
        () =>
          useRealtimeInvalidation('projects', [['projects']], { enabled: false }),
        { wrapper: createWrapper() }
      );

      // No channel should be created when disabled
      expect(mockSupabase.channel).not.toHaveBeenCalled();
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe('Query refetch on realtime update', () => {
    it('should trigger query refetch after invalidation', async () => {
      const fetchFn = jest.fn().mockResolvedValue([{ id: '1', name: 'Project 1' }]);
      
      // Custom hook that uses both query and realtime
      const useProjectsWithRealtime = () => {
        const query = useQuery({
          queryKey: ['projects'],
          queryFn: fetchFn,
        });

        useRealtimeInvalidation('projects', [['projects']]);

        return query;
      };

      const { result } = renderHook(() => useProjectsWithRealtime(), {
        wrapper: createWrapper(),
      });

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Simulate a realtime update
      fetchFn.mockResolvedValue([
        { id: '1', name: 'Project 1' },
        { id: '2', name: 'Project 2' },
      ]);

      act(() => {
        postgresChangesCallback?.({
          eventType: 'INSERT',
          new: { id: '2', name: 'Project 2' },
          old: {},
          table: 'projects',
          schema: 'public',
        });
      });

      // Wait for refetch
      await waitFor(() => {
        expect(fetchFn).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Multiple table subscriptions', () => {
    it('should handle multiple subscriptions independently', () => {
      const callbacks: Record<string, ((payload: unknown) => void) | null> = {};
      
      let callIndex = 0;
      const createMockChannel = () => ({
        on: jest.fn().mockImplementation((_event, config, callback) => {
          callbacks[config.table] = callback;
          return createMockChannel();
        }),
        subscribe: jest.fn().mockImplementation((callback) => {
          setTimeout(() => callback?.('SUBSCRIBED'), 0);
          return createMockChannel();
        }),
      });

      mockSupabase.channel.mockImplementation(() => createMockChannel());

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      // Create two separate subscriptions
      renderHook(
        () => useRealtimeInvalidation('projects', [['projects']]),
        { wrapper: createWrapper() }
      );

      renderHook(
        () => useRealtimeInvalidation('vendors', [['vendors']]),
        { wrapper: createWrapper() }
      );

      // Trigger projects update
      act(() => {
        callbacks['projects']?.({
          eventType: 'UPDATE',
          new: {},
          old: {},
          table: 'projects',
          schema: 'public',
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['projects'] });
      expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['vendors'] });

      invalidateSpy.mockClear();

      // Trigger vendors update
      act(() => {
        callbacks['vendors']?.({
          eventType: 'INSERT',
          new: {},
          old: {},
          table: 'vendors',
          schema: 'public',
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['vendors'] });
    });
  });

  describe('Concurrent updates', () => {
    it('should handle rapid successive updates', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      renderHook(
        () => useRealtimeInvalidation('projects', [['projects']]),
        { wrapper: createWrapper() }
      );

      // Simulate rapid updates
      act(() => {
        for (let i = 0; i < 5; i++) {
          postgresChangesCallback?.({
            eventType: 'UPDATE',
            new: { id: `${i}` },
            old: { id: `${i}` },
            table: 'projects',
            schema: 'public',
          });
        }
      });

      // All updates should trigger invalidation
      expect(invalidateSpy).toHaveBeenCalledTimes(5);
    });
  });

  describe('Error resilience', () => {
    it('should continue working after callback throws', () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
      
      // First call throws, subsequent calls succeed
      invalidateSpy.mockImplementationOnce(() => {
        throw new Error('Temporary failure');
      });

      renderHook(
        () => useRealtimeInvalidation('projects', [['projects']]),
        { wrapper: createWrapper() }
      );

      // First update - should throw but not crash
      expect(() => {
        act(() => {
          postgresChangesCallback?.({
            eventType: 'UPDATE',
            new: {},
            old: {},
            table: 'projects',
            schema: 'public',
          });
        });
      }).toThrow('Temporary failure');

      // Reset mock
      invalidateSpy.mockRestore();
      jest.spyOn(queryClient, 'invalidateQueries');

      // Second update - should work normally
      act(() => {
        postgresChangesCallback?.({
          eventType: 'UPDATE',
          new: {},
          old: {},
          table: 'projects',
          schema: 'public',
        });
      });

      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });
  });
});
