'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { IconAlertTriangle, IconRefresh, IconArrowLeft } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: unknown[];
  fallbackTitle?: string;
  fallbackDescription?: string;
  showBackButton?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Reusable Error Boundary component that catches JavaScript errors
 * in child components and displays a fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error to console
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state when resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = (): void => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoBack = (): void => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { 
      children, 
      fallback, 
      fallbackTitle = 'Something went wrong',
      fallbackDescription = 'An unexpected error occurred. Please try again.',
      showBackButton = true,
    } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <Card className="w-full max-w-md mx-auto my-8 border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <IconAlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">{fallbackTitle}</CardTitle>
            <CardDescription>{fallbackDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && process.env.NODE_ENV === 'development' && (
              <div className="rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground overflow-auto max-h-32">
                <p className="font-semibold text-destructive">{error.name}: {error.message}</p>
                {error.stack && (
                  <pre className="mt-2 whitespace-pre-wrap">{error.stack.split('\n').slice(1, 4).join('\n')}</pre>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center gap-2">
            {showBackButton && (
              <Button variant="outline" onClick={this.handleGoBack}>
                <IconArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            )}
            <Button onClick={this.resetErrorBoundary}>
              <IconRefresh className="h-4 w-4" />
              Try Again
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return children;
  }
}

/**
 * Compact error fallback for use in smaller areas like tabs or cards
 */
interface CompactErrorFallbackProps {
  error?: Error | null;
  onRetry?: () => void;
  message?: string;
}

export function CompactErrorFallback({ 
  error, 
  onRetry, 
  message = 'Failed to load content' 
}: CompactErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
        <IconAlertTriangle className="h-5 w-5 text-destructive" />
      </div>
      <p className="text-sm font-medium text-destructive mb-1">{message}</p>
      {error && process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-muted-foreground mb-3 max-w-xs truncate">
          {error.message}
        </p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <IconRefresh className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * Hook-based error boundary wrapper for functional components
 * Usage: <ErrorBoundaryWrapper><YourComponent /></ErrorBoundaryWrapper>
 */
export function ErrorBoundaryWrapper({
  children,
  ...props
}: ErrorBoundaryProps) {
  return <ErrorBoundary {...props}>{children}</ErrorBoundary>;
}

export default ErrorBoundary;
