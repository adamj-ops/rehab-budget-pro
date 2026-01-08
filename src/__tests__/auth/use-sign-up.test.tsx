import { renderHook, act } from '@testing-library/react';
import { useSignUp } from '@/hooks/use-auth';
import { createMockSupabaseClient } from '../utils/test-utils';

// Mock the supabase client module
jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

import { getSupabaseClient } from '@/lib/supabase/client';

const mockGetSupabaseClient = getSupabaseClient as jest.MockedFunction<typeof getSupabaseClient>;

describe('useSignUp', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    mockGetSupabaseClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof getSupabaseClient>);
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useSignUp());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.signUp).toBe('function');
  });

  it('should successfully sign up with valid credentials', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { 
        user: { id: '123', email: 'test@example.com' }, 
        session: { access_token: 'token' } 
      },
      error: null,
    });

    const { result } = renderHook(() => useSignUp());

    await act(async () => {
      await result.current.signUp('test@example.com', 'Password123!');
    });

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password123!',
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set loading state while signing up', async () => {
    let resolveSignUp: (value: unknown) => void;
    const signUpPromise = new Promise((resolve) => {
      resolveSignUp = resolve;
    });
    
    mockSupabase.auth.signUp.mockReturnValue(signUpPromise);

    const { result } = renderHook(() => useSignUp());

    let signUpPromiseFromHook: Promise<void>;
    act(() => {
      signUpPromiseFromHook = result.current.signUp('test@example.com', 'Password123!');
    });

    // Should be loading while promise is pending
    expect(result.current.isLoading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolveSignUp!({ data: { user: {}, session: {} }, error: null });
      await signUpPromiseFromHook;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle email already registered error', async () => {
    const authError = new Error('User already registered');
    
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: authError,
    });

    const { result } = renderHook(() => useSignUp());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.signUp('existing@example.com', 'Password123!');
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toEqual(authError);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('User already registered');
  });

  it('should handle weak password error', async () => {
    const authError = new Error('Password should be at least 6 characters');
    
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: authError,
    });

    const { result } = renderHook(() => useSignUp());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.signUp('test@example.com', '123');
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toEqual(authError);
    expect(result.current.error?.message).toBe('Password should be at least 6 characters');
  });

  it('should handle invalid email format error', async () => {
    const authError = new Error('Invalid email format');
    
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: authError,
    });

    const { result } = renderHook(() => useSignUp());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.signUp('not-an-email', 'Password123!');
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toEqual(authError);
    expect(result.current.error?.message).toBe('Invalid email format');
  });

  it('should handle network errors', async () => {
    mockSupabase.auth.signUp.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSignUp());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.signUp('test@example.com', 'Password123!');
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

  it('should clear previous error on new sign up attempt', async () => {
    // First attempt fails
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    });

    const { result } = renderHook(() => useSignUp());

    await act(async () => {
      try {
        await result.current.signUp('existing@example.com', 'Password123!');
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBeTruthy();

    // Second attempt succeeds
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: '123' }, session: {} },
      error: null,
    });

    await act(async () => {
      await result.current.signUp('new@example.com', 'Password123!');
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle email confirmation required response', async () => {
    // When email confirmation is required, Supabase returns user but no session
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { 
        user: { id: '123', email: 'test@example.com', email_confirmed_at: null }, 
        session: null 
      },
      error: null,
    });

    const { result } = renderHook(() => useSignUp());

    await act(async () => {
      await result.current.signUp('test@example.com', 'Password123!');
    });

    // Should not throw error even without session (email confirmation required)
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle rate limiting error', async () => {
    const rateLimitError = new Error('Too many requests. Please try again later.');
    
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: rateLimitError,
    });

    const { result } = renderHook(() => useSignUp());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.signUp('test@example.com', 'Password123!');
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toEqual(rateLimitError);
    expect(result.current.error?.message).toBe('Too many requests. Please try again later.');
  });

  it('should handle non-Error thrown objects', async () => {
    mockSupabase.auth.signUp.mockRejectedValue('String error');

    const { result } = renderHook(() => useSignUp());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.signUp('test@example.com', 'Password123!');
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toBe('String error');
    expect(result.current.error?.message).toBe('Sign up failed');
  });
});
