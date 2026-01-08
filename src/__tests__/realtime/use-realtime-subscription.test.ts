import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealtimeSubscription } from '@/hooks/use-realtime';
import { createMockSupabaseClient } from '../utils/test-utils';

// Mock the supabase client module
jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

import { getSupabaseClient } from '@/lib/supabase/client';

const mockGetSupabaseClient = getSupabaseClient as jest.MockedFunction<typeof getSupabaseClient>;

describe('useRealtimeSubscription', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let mockChannel: {
    on: jest.Mock;
    subscribe: jest.Mock;
  };
  let subscribeCallback: ((status: string) => void) | null = null;
  let postgresChangesCallback: ((payload: unknown) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    subscribeCallback = null;
    postgresChangesCallback = null;

    mockChannel = {
      on: jest.fn().mockImplementation((_event, _config, callback) => {
        postgresChangesCallback = callback;
        return mockChannel;
      }),
      subscribe: jest.fn().mockImplementation((callback) => {
        subscribeCallback = callback;
        // Simulate successful subscription
        setTimeout(() => callback?.('SUBSCRIBED'), 0);
        return mockChannel;
      }),
    };

    mockSupabase = createMockSupabaseClient();
    mockSupabase.channel.mockReturnValue(mockChannel);
    mockGetSupabaseClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof getSupabaseClient>);
  });

  it('should create a subscription when enabled', async () => {
    renderHook(() =>
      useRealtimeSubscription({ table: 'projects' })
    );

    expect(mockSupabase.channel).toHaveBeenCalled();
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'projects',
      }),
      expect.any(Function)
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('should not create a subscription when disabled', () => {
    renderHook(() =>
      useRealtimeSubscription({ table: 'projects' }, { enabled: false })
    );

    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });

  it('should apply filter to subscription config', () => {
    renderHook(() =>
      useRealtimeSubscription({
        table: 'budget_items',
        filter: 'project_id=eq.123',
      })
    );

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        table: 'budget_items',
        filter: 'project_id=eq.123',
      }),
      expect.any(Function)
    );
  });

  it('should apply custom event type to subscription config', () => {
    renderHook(() =>
      useRealtimeSubscription({
        table: 'projects',
        event: 'UPDATE',
      })
    );

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'UPDATE',
      }),
      expect.any(Function)
    );
  });

  it('should call onAnyChange callback on any event', () => {
    const onAnyChange = jest.fn();
    
    renderHook(() =>
      useRealtimeSubscription({ table: 'projects' }, { onAnyChange })
    );

    const payload = {
      eventType: 'INSERT' as const,
      new: { id: '123', name: 'Test Project' },
      old: {},
      table: 'projects',
      schema: 'public',
    };

    act(() => {
      postgresChangesCallback?.(payload);
    });

    expect(onAnyChange).toHaveBeenCalledWith(payload);
  });

  it('should call onInsert callback on INSERT event', () => {
    const onInsert = jest.fn();
    const onUpdate = jest.fn();
    const onDelete = jest.fn();
    
    renderHook(() =>
      useRealtimeSubscription(
        { table: 'projects' },
        { onInsert, onUpdate, onDelete }
      )
    );

    const payload = {
      eventType: 'INSERT' as const,
      new: { id: '123' },
      old: {},
      table: 'projects',
      schema: 'public',
    };

    act(() => {
      postgresChangesCallback?.(payload);
    });

    expect(onInsert).toHaveBeenCalledWith(payload);
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('should call onUpdate callback on UPDATE event', () => {
    const onInsert = jest.fn();
    const onUpdate = jest.fn();
    const onDelete = jest.fn();
    
    renderHook(() =>
      useRealtimeSubscription(
        { table: 'projects' },
        { onInsert, onUpdate, onDelete }
      )
    );

    const payload = {
      eventType: 'UPDATE' as const,
      new: { id: '123', name: 'Updated' },
      old: { id: '123', name: 'Original' },
      table: 'projects',
      schema: 'public',
    };

    act(() => {
      postgresChangesCallback?.(payload);
    });

    expect(onUpdate).toHaveBeenCalledWith(payload);
    expect(onInsert).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('should call onDelete callback on DELETE event', () => {
    const onInsert = jest.fn();
    const onUpdate = jest.fn();
    const onDelete = jest.fn();
    
    renderHook(() =>
      useRealtimeSubscription(
        { table: 'projects' },
        { onInsert, onUpdate, onDelete }
      )
    );

    const payload = {
      eventType: 'DELETE' as const,
      new: {},
      old: { id: '123' },
      table: 'projects',
      schema: 'public',
    };

    act(() => {
      postgresChangesCallback?.(payload);
    });

    expect(onDelete).toHaveBeenCalledWith(payload);
    expect(onInsert).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should cleanup subscription on unmount', () => {
    const { unmount } = renderHook(() =>
      useRealtimeSubscription({ table: 'projects' })
    );

    unmount();

    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });

  it('should log subscription status on SUBSCRIBED when debug enabled', async () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

    renderHook(() =>
      useRealtimeSubscription({ table: 'projects' }, { debug: true })
    );

    // Wait for the subscribe callback to be called
    await waitFor(() => {
      expect(subscribeCallback).not.toBeNull();
    });

    act(() => {
      subscribeCallback?.('SUBSCRIBED');
    });

    // Check that console.info was called with a message containing the expected text
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[Realtime/),
      expect.stringContaining('Subscribed to projects'),
      expect.anything()
    );
    consoleSpy.mockRestore();
  });

  it('should log error on CHANNEL_ERROR', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() =>
      useRealtimeSubscription({ table: 'projects' })
    );

    await waitFor(() => {
      expect(subscribeCallback).not.toBeNull();
    });

    act(() => {
      subscribeCallback?.('CHANNEL_ERROR');
    });

    // Errors are always logged regardless of debug setting
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[Realtime/),
      expect.stringContaining('Subscription error for projects'),
      expect.anything()
    );
    consoleSpy.mockRestore();
  });

  it('should use custom schema when provided', () => {
    renderHook(() =>
      useRealtimeSubscription({
        table: 'projects',
        schema: 'custom_schema',
      })
    );

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        schema: 'custom_schema',
      }),
      expect.any(Function)
    );
  });

  it('should recreate subscription when config changes', () => {
    const { rerender } = renderHook(
      ({ table }) => useRealtimeSubscription({ table }),
      { initialProps: { table: 'projects' as const } }
    );

    expect(mockSupabase.channel).toHaveBeenCalledTimes(1);

    // Change the table
    rerender({ table: 'budget_items' as const });

    // Should have removed the old channel and created a new one
    expect(mockSupabase.removeChannel).toHaveBeenCalled();
    expect(mockSupabase.channel).toHaveBeenCalledTimes(2);
  });

  it('should handle enabled toggle correctly', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useRealtimeSubscription({ table: 'projects' }, { enabled }),
      { initialProps: { enabled: false } }
    );

    // Should not have created a channel when disabled
    expect(mockSupabase.channel).not.toHaveBeenCalled();

    // Enable the subscription
    rerender({ enabled: true });

    // Should now have created a channel
    expect(mockSupabase.channel).toHaveBeenCalledTimes(1);

    // Disable again
    rerender({ enabled: false });

    // Should have cleaned up
    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });
});
