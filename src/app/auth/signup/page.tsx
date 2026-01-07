'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconChartBar } from '@tabler/icons-react';

export default function SignUpPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/dashboard');
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

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
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Get started with Rehab Budget Pro</CardDescription>
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
              view="sign_up"
              showLinks={true}
              localization={{
                variables: {
                  sign_up: {
                    email_label: 'Email',
                    password_label: 'Password',
                    button_label: 'Sign Up',
                    loading_button_label: 'Creating account...',
                    social_provider_text: 'Continue with {{provider}}',
                    link_text: 'Already have an account? Sign in',
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
