import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from '@/hooks/use-auth';
import {
  createMockSupabaseClient,
  createMockUser,
  createMockSession,
} from '../utils/test-utils';

// Mock the supabase client module
jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

import { getSupabaseClient } from '@/lib/supabase/client';

const mockGetSupabaseClient = getSupabaseClient as jest.MockedFunction<typeof getSupabaseClient>;

describe('useAuth', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let authStateCallback: ((event: string, session: ReturnType<typeof createMockSession> | null) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    authStateCallback = null;
    
    mockSupabase = createMockSupabaseClient();
    
    // Setup onAuthStateChange to capture the callback
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: { subscription: { unsubscribe: jest.fn() } },
      };
    });
    
    mockGetSupabaseClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof getSupabaseClient>);
  });

  it('should return loading state initially', () => {
    mockSupabase.auth.getSession.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should return null user when not authenticated', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should return user when authenticated', async () => {
    const mockUser = createMockUser({ email: 'test@example.com' });
    const mockSession = createMockSession(mockUser);
    
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should update state when auth state changes', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);

    // Simulate sign in
    const mockUser = createMockUser();
    const mockSession = createMockSession(mockUser);

    act(() => {
      authStateCallback?.('SIGNED_IN', mockSession);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle sign out via auth state change', async () => {
    const mockUser = createMockUser();
    const mockSession = createMockSession(mockUser);
    
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Simulate sign out
    act(() => {
      authStateCallback?.('SIGNED_OUT', null);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle errors when getting initial session', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockSupabase.auth.getSession.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Error getting initial session:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('should unsubscribe from auth changes on unmount', async () => {
    const unsubscribeMock = jest.fn();
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    });
    
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { unmount } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
    });

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
