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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md auth-form-animate">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
            <IconChartBar className="h-7 w-7 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Rehab Budget Pro</h1>
            <p className="text-sm text-muted-foreground">Fix & Flip Budget Tracking</p>
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
                      brand: 'hsl(130, 31%, 56%)',
                      brandAccent: 'hsl(130, 31%, 46%)',
                      inputBackground: 'transparent',
                      inputBorder: 'hsl(30, 4%, 82%)',
                      inputBorderFocus: 'hsl(130, 31%, 56%)',
                      inputBorderHover: 'hsl(30, 3%, 70%)',
                    },
                    borderWidths: {
                      buttonBorderWidth: '1px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '0.375rem',
                      buttonBorderRadius: '0.375rem',
                      inputBorderRadius: '0.375rem',
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

        <p className="text-center text-sm text-muted-foreground mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
