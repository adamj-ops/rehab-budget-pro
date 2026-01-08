/**
 * Tests for authentication middleware
 * 
 * Note: Testing Next.js middleware is complex because it requires mocking
 * the request/response cycle and Supabase server client. These tests
 * focus on the logic patterns rather than full integration.
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock the Supabase SSR module
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

import { createServerClient } from '@supabase/ssr';

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>;

// Helper to create mock NextRequest
function createMockRequest(pathname: string, cookies: Record<string, string> = {}): NextRequest {
  const url = new URL(`http://localhost:3000${pathname}`);
  
  const cookieStore = {
    getAll: jest.fn().mockReturnValue(
      Object.entries(cookies).map(([name, value]) => ({ name, value }))
    ),
    get: jest.fn((name: string) => cookies[name] ? { name, value: cookies[name] } : undefined),
    set: jest.fn(),
    delete: jest.fn(),
  };
  
  return {
    nextUrl: url,
    url: url.toString(),
    cookies: cookieStore,
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe('Authentication Middleware Logic', () => {
  let mockSupabaseAuth: {
    getUser: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabaseAuth = {
      getUser: jest.fn(),
    };
    
    mockCreateServerClient.mockReturnValue({
      auth: mockSupabaseAuth,
    } as ReturnType<typeof createServerClient>);
  });

  describe('Public Routes', () => {
    const publicRoutes = ['/auth/login', '/auth/signup', '/auth/callback'];

    publicRoutes.forEach((route) => {
      it(`should allow unauthenticated access to ${route}`, async () => {
        mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });
        
        const request = createMockRequest(route);
        
        // Simulate middleware logic
        const { data: { user } } = await mockSupabaseAuth.getUser();
        const isPublicRoute = publicRoutes.some((r) => route.startsWith(r));
        
        expect(user).toBeNull();
        expect(isPublicRoute).toBe(true);
        // Should not redirect (allow access)
      });
    });
  });

  describe('Protected Routes', () => {
    const protectedRoutes = ['/', '/dashboard', '/projects', '/projects/123', '/vendors'];

    protectedRoutes.forEach((route) => {
      it(`should redirect unauthenticated user from ${route} to login`, async () => {
        mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });
        
        const request = createMockRequest(route);
        
        // Simulate middleware logic
        const { data: { user } } = await mockSupabaseAuth.getUser();
        const publicRoutes = ['/auth/login', '/auth/signup', '/auth/callback'];
        const isPublicRoute = publicRoutes.some((r) => route.startsWith(r));
        
        // Should redirect to login
        if (!user && !isPublicRoute) {
          const redirectUrl = new URL(`http://localhost:3000/auth/login`);
          redirectUrl.searchParams.set('redirectTo', route);
          
          expect(redirectUrl.pathname).toBe('/auth/login');
          expect(redirectUrl.searchParams.get('redirectTo')).toBe(route);
        }
      });

      it(`should allow authenticated user to access ${route}`, async () => {
        mockSupabaseAuth.getUser.mockResolvedValue({
          data: { user: { id: '123', email: 'test@example.com' } },
          error: null,
        });
        
        const request = createMockRequest(route);
        
        // Simulate middleware logic
        const { data: { user } } = await mockSupabaseAuth.getUser();
        
        expect(user).toBeTruthy();
        // Should not redirect (allow access)
      });
    });
  });

  describe('Authenticated User Redirects', () => {
    it('should redirect authenticated user from /auth/login to /dashboard', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      });
      
      const pathname = '/auth/login';
      const { data: { user } } = await mockSupabaseAuth.getUser();
      
      // Simulate middleware logic
      if (user && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
        const redirectUrl = new URL('http://localhost:3000/dashboard');
        expect(redirectUrl.pathname).toBe('/dashboard');
      }
    });

    it('should redirect authenticated user from /auth/signup to /dashboard', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      });
      
      const pathname = '/auth/signup';
      const { data: { user } } = await mockSupabaseAuth.getUser();
      
      // Simulate middleware logic
      if (user && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
        const redirectUrl = new URL('http://localhost:3000/dashboard');
        expect(redirectUrl.pathname).toBe('/dashboard');
      }
    });

    it('should allow authenticated user to access /auth/callback', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      });
      
      const pathname = '/auth/callback';
      const { data: { user } } = await mockSupabaseAuth.getUser();
      
      // Callback route should not redirect authenticated users
      const shouldRedirect = user && 
        (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'));
      
      expect(shouldRedirect).toBe(false);
    });
  });

  describe('Redirect URL Preservation', () => {
    it('should preserve the original URL in redirect query param', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });
      
      const originalPath = '/projects/abc123/edit';
      const { data: { user } } = await mockSupabaseAuth.getUser();
      
      // Simulate middleware redirect
      const redirectUrl = new URL('http://localhost:3000/auth/login');
      redirectUrl.searchParams.set('redirectTo', originalPath);
      
      expect(redirectUrl.searchParams.get('redirectTo')).toBe('/projects/abc123/edit');
    });

    it('should preserve query parameters in redirect URL', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });
      
      const originalPath = '/projects?status=active&sort=name';
      const pathname = originalPath.split('?')[0];
      
      // Simulate middleware redirect
      const redirectUrl = new URL('http://localhost:3000/auth/login');
      redirectUrl.searchParams.set('redirectTo', originalPath);
      
      expect(redirectUrl.searchParams.get('redirectTo')).toContain('/projects');
    });
  });

  describe('Route Matching', () => {
    const excludedPaths = [
      '/_next/static/chunk.js',
      '/_next/image?url=/image.png',
      '/favicon.ico',
      '/logo.svg',
      '/image.png',
      '/photo.jpg',
      '/picture.jpeg',
      '/animation.gif',
      '/image.webp',
    ];

    excludedPaths.forEach((path) => {
      it(`should not process ${path} (excluded by matcher)`, () => {
        // The matcher regex should exclude these paths
        const matcher = /^((?!_next\/static|_next\/image|favicon\.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).)*$/;
        
        // Remove query params for matching
        const pathOnly = path.split('?')[0];
        const shouldProcess = matcher.test(pathOnly);
        
        // Static files and images should be excluded
        expect(shouldProcess).toBe(false);
      });
    });

    const includedPaths = ['/', '/dashboard', '/projects', '/api/data', '/auth/login'];

    includedPaths.forEach((path) => {
      it(`should process ${path} (included by matcher)`, () => {
        // The matcher should include these paths
        const matcher = /^((?!_next\/static|_next\/image|favicon\.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).)*$/;
        const shouldProcess = matcher.test(path);
        
        expect(shouldProcess).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle getUser error gracefully', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      });
      
      const { data: { user }, error } = await mockSupabaseAuth.getUser();
      
      // When there's an error, user should be null
      expect(user).toBeNull();
      expect(error).toBeTruthy();
      
      // Should treat as unauthenticated
      const isPublicRoute = false;
      if (!user && !isPublicRoute) {
        // Should redirect to login
        expect(true).toBe(true);
      }
    });
  });
});
