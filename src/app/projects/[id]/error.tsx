'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { IconAlertTriangle, IconRefresh, IconArrowLeft } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProjectError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Project page error:', error);
  }, [error]);

  return (
    <div className="flex-1 overflow-auto flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <IconAlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Project Error</CardTitle>
          <CardDescription>
            Something went wrong while loading this project. Please try again or go back to the dashboard.
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
              <IconArrowLeft className="h-4 w-4" />
              Dashboard
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
