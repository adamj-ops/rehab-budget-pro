import { render, screen, waitFor } from '@testing-library/react';
import { createMockSupabaseClient } from '../utils/test-utils';

// Mock the router
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the supabase client
jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

// Mock the Auth UI component
jest.mock('@supabase/auth-ui-react', () => ({
  Auth: jest.fn(({ view }) => (
    <div data-testid="auth-ui">
      <div data-testid="auth-view">{view}</div>
      <form data-testid="auth-form">
        <input data-testid="email-input" placeholder="Email" />
        <input data-testid="password-input" placeholder="Password" type="password" />
        <button data-testid="submit-button" type="submit">Sign Up</button>
      </form>
    </div>
  )),
}));

jest.mock('@supabase/auth-ui-shared', () => ({
  ThemeSupa: {},
}));

import { getSupabaseClient } from '@/lib/supabase/client';
import SignUpPage from '@/app/auth/signup/page';

const mockGetSupabaseClient = getSupabaseClient as jest.MockedFunction<typeof getSupabaseClient>;

describe('SignUpPage', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let authStateCallback: ((event: string) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    authStateCallback = null;
    
    mockSupabase = createMockSupabaseClient();
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: { subscription: { unsubscribe: jest.fn() } },
      };
    });
    
    mockGetSupabaseClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof getSupabaseClient>);
  });

  it('should render the signup page', () => {
    render(<SignUpPage />);
    
    expect(screen.getByText('Create an account')).toBeInTheDocument();
    expect(screen.getByText('Get started with Rehab Budget Pro')).toBeInTheDocument();
    expect(screen.getByText('Rehab Budget Pro')).toBeInTheDocument();
  });

  it('should render the Auth UI component with sign_up view', () => {
    render(<SignUpPage />);
    
    expect(screen.getByTestId('auth-ui')).toBeInTheDocument();
    expect(screen.getByTestId('auth-view')).toHaveTextContent('sign_up');
  });

  it('should redirect to dashboard on successful sign up', async () => {
    render(<SignUpPage />);
    
    // Simulate successful sign up (triggers SIGNED_IN event)
    authStateCallback?.('SIGNED_IN');
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should not redirect on other auth events', async () => {
    render(<SignUpPage />);
    
    // Simulate other events
    authStateCallback?.('SIGNED_OUT');
    authStateCallback?.('USER_UPDATED');
    authStateCallback?.('PASSWORD_RECOVERY');
    
    // Should not have called push
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should unsubscribe from auth changes on unmount', () => {
    const unsubscribeMock = jest.fn();
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    });

    const { unmount } = render(<SignUpPage />);
    
    unmount();
    
    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it('should render terms and privacy notice', () => {
    render(<SignUpPage />);
    
    expect(screen.getByText(/By signing up, you agree to our Terms of Service/)).toBeInTheDocument();
  });

  it('should render the logo and tagline', () => {
    render(<SignUpPage />);
    
    expect(screen.getByText('Rehab Budget Pro')).toBeInTheDocument();
    expect(screen.getByText('Fix & Flip Budget Tracking')).toBeInTheDocument();
  });

  it('should display the sign up form elements', () => {
    render(<SignUpPage />);
    
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });
});
