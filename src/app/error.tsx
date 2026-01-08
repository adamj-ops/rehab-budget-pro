'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { IconAlertTriangle, IconRefresh, IconHome } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <IconAlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Something Went Wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again or return to the home page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground overflow-auto max-h-32">
              <p className="font-semibold text-destructive">{error.name}: {error.message}</p>
              {error.digest && (
                <p className="mt-1 text-muted-foreground">Digest: {error.digest}</p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/">
              <IconHome className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button onClick={reset}>
            <IconRefresh className="h-4 w-4" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
