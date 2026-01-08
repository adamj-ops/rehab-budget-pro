import React, { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User, Session } from '@supabase/supabase-js';

// ============================================================================
// Mock Supabase Client Factory
// ============================================================================

export interface MockSupabaseAuth {
  getSession: jest.Mock;
  getUser: jest.Mock;
  signInWithPassword: jest.Mock;
  signUp: jest.Mock;
  signOut: jest.Mock;
  onAuthStateChange: jest.Mock;
}

export interface MockSupabaseClient {
  auth: MockSupabaseAuth;
  from: jest.Mock;
  channel: jest.Mock;
  removeChannel: jest.Mock;
}

export function createMockSupabaseClient(
  overrides?: Partial<MockSupabaseClient>
): MockSupabaseClient {
  const defaultAuth: MockSupabaseAuth = {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
  };

  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
  };

  return {
    auth: { ...defaultAuth, ...overrides?.auth },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockReturnThis(),
    }),
    channel: jest.fn().mockReturnValue(mockChannel),
    removeChannel: jest.fn(),
    ...overrides,
  };
}

// ============================================================================
// Mock User Factory
// ============================================================================

export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'test@example.com',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockSession(user?: User, overrides?: Partial<Session>): Session {
  const mockUser = user || createMockUser();
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: mockUser,
    ...overrides,
  };
}

// ============================================================================
// Test Query Client
// ============================================================================

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================================================
// Custom Render Function with Providers
// ============================================================================

interface AllTheProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

function AllTheProviders({ children, queryClient }: AllTheProvidersProps) {
  const client = queryClient || createTestQueryClient();
  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Wait for a condition to be true, useful for async operations
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Create a deferred promise for controlling async flow in tests
 */
export function createDeferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Mock a successful API response
 */
export function mockSuccessResponse<T>(data: T) {
  return { data, error: null };
}

/**
 * Mock an error API response
 */
export function mockErrorResponse(message: string, code?: string) {
  return {
    data: null,
    error: { message, code: code || 'ERROR' },
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
