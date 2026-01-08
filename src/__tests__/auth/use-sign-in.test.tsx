import { renderHook, waitFor, act } from '@testing-library/react';
import { useSignIn } from '@/hooks/use-auth';
import { createMockSupabaseClient } from '../utils/test-utils';

// Mock the supabase client module
jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

import { getSupabaseClient } from '@/lib/supabase/client';

const mockGetSupabaseClient = getSupabaseClient as jest.MockedFunction<typeof getSupabaseClient>;

describe('useSignIn', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    mockGetSupabaseClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof getSupabaseClient>);
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useSignIn());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.signIn).toBe('function');
  });

  it('should successfully sign in with valid credentials', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: '123' }, session: { access_token: 'token' } },
      error: null,
    });

    const { result } = renderHook(() => useSignIn());

    await act(async () => {
      await result.current.signIn('test@example.com', 'password123');
    });

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set loading state while signing in', async () => {
    let resolveSignIn: (value: unknown) => void;
    const signInPromise = new Promise((resolve) => {
      resolveSignIn = resolve;
    });
    
    mockSupabase.auth.signInWithPassword.mockReturnValue(signInPromise);

    const { result } = renderHook(() => useSignIn());

    let signInPromiseFromHook: Promise<void>;
    act(() => {
      signInPromiseFromHook = result.current.signIn('test@example.com', 'password');
    });

    // Should be loading while promise is pending
    expect(result.current.isLoading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolveSignIn!({ data: { user: {}, session: {} }, error: null });
      await signInPromiseFromHook;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle invalid credentials error', async () => {
    // Supabase AuthError extends Error
    const authError = new Error('Invalid login credentials');
    
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: authError,
    });

    const { result } = renderHook(() => useSignIn());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.signIn('test@example.com', 'wrongpassword');
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toEqual(authError);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('Invalid login credentials');
  });

  it('should handle network errors', async () => {
    mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSignIn());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.signIn('test@example.com', 'password');
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toBe('Network error');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('Network error');
  });

  it('should clear previous error on new sign in attempt', async () => {
    // First attempt fails
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    });

    const { result } = renderHook(() => useSignIn());

    await act(async () => {
      try {
        await result.current.signIn('test@example.com', 'wrong');
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBeTruthy();

    // Second attempt succeeds
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: '123' }, session: {} },
      error: null,
    });

    await act(async () => {
      await result.current.signIn('test@example.com', 'correct');
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle rate limiting error', async () => {
    const rateLimitError = new Error('Too many requests. Please try again later.');
    
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: rateLimitError,
    });

    const { result } = renderHook(() => useSignIn());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.signIn('test@example.com', 'password');
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toEqual(rateLimitError);
    expect(result.current.error?.message).toBe('Too many requests. Please try again later.');
  });

  it('should handle non-Error thrown objects', async () => {
    mockSupabase.auth.signInWithPassword.mockRejectedValue('String error');

    const { result } = renderHook(() => useSignIn());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.signIn('test@example.com', 'password');
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toBe('String error');
    expect(result.current.error?.message).toBe('Sign in failed');
  });
});
