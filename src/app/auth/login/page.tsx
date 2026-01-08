'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconChartBar } from '@tabler/icons-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const supabase = getSupabaseClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push(redirectTo);
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, redirectTo, supabase.auth]);

  return (
    <div className="light min-h-screen bg-white flex items-center justify-center p-4" data-theme="light">
      <div className="w-full max-w-md auth-form-animate">
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-xl bg-[#008000] flex items-center justify-center">
            <IconChartBar className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rehab Budget Pro</h1>
            <p className="text-sm text-gray-500">Fix & Flip Budget Tracking</p>
          </div>
        </div>

        <Card className="auth-card">
          <CardHeader className="text-center">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#008000',
                      brandAccent: '#006600',
                      inputBackground: 'white',
                      inputBorder: '#e5e7eb',
                      inputBorderFocus: '#008000',
                      inputBorderHover: '#d1d5db',
                      inputText: '#111827',
                      inputPlaceholder: '#9ca3af',
                    },
                    borderWidths: {
                      buttonBorderWidth: '1px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '0.5rem',
                      buttonBorderRadius: '0.5rem',
                      inputBorderRadius: '0.5rem',
                    },
                  },
                },
                className: {
                  container: 'auth-container',
                  button: 'auth-btn-primary',
                  input: 'auth-input-focus',
                },
              }}
              providers={['google']}
              redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
              view="sign_in"
              showLinks={true}
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Email',
                    password_label: 'Password',
                    button_label: 'Sign In',
                    loading_button_label: 'Signing in...',
                    social_provider_text: 'Continue with {{provider}}',
                    link_text: "Don't have an account? Sign up",
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
