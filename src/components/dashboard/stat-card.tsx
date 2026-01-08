'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedCurrency, AnimatedPercent, AnimatedNumber } from './animated-number';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
} from '@tabler/icons-react';

interface StatCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'percent' | 'number';
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
    isPositiveGood?: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
  size?: 'default' | 'large';
}

/**
 * Stat card component for hero metrics
 * Displays a metric with optional trend indicator and icon
 */
export function StatCard({
  title,
  value,
  format = 'number',
  subtitle,
  trend,
  icon,
  className,
  size = 'default',
}: StatCardProps) {
  // Determine trend color
  const getTrendColor = () => {
    if (!trend) return '';
    const isPositive = trend.value > 0;
    const isGood = trend.isPositiveGood !== false ? isPositive : !isPositive;
    if (trend.value === 0) return 'text-muted-foreground';
    return isGood ? 'text-green-500' : 'text-red-500';
  };

  const TrendIcon = trend
    ? trend.value > 0
      ? IconTrendingUp
      : trend.value < 0
      ? IconTrendingDown
      : IconMinus
    : null;

  // Format the value based on type
  const renderValue = () => {
    const valueClass = size === 'large' ? 'metric-value-lg' : 'metric-value';

    switch (format) {
      case 'currency':
        return <AnimatedCurrency value={value} className={valueClass} />;
      case 'percent':
        return <AnimatedPercent value={value} className={valueClass} />;
      default:
        return (
          <AnimatedNumber
            value={value}
            className={valueClass}
            format={(v) => v.toLocaleString()}
          />
        );
    }
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className={cn('p-5', size === 'large' && 'p-6')}>
        {/* Icon in top right corner */}
        {icon && (
          <div className="absolute top-4 right-4 text-muted-foreground/50">
            {icon}
          </div>
        )}

        {/* Title */}
        <p className={cn('label-text', size === 'large' && 'text-sm')}>
          {title}
        </p>

        {/* Value */}
        <div className="mt-2">{renderValue()}</div>

        {/* Subtitle and/or Trend */}
        <div className="mt-2 flex items-center gap-2 text-xs">
          {subtitle && (
            <span className="text-muted-foreground">{subtitle}</span>
          )}
          {trend && (
            <span className={cn('flex items-center gap-1', getTrendColor())}>
              {TrendIcon && <TrendIcon size={14} />}
              <span className="font-medium">
                {trend.value > 0 ? '+' : ''}
                {trend.value.toFixed(1)}%
              </span>
              {trend.label && (
                <span className="text-muted-foreground">{trend.label}</span>
              )}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for stat card
 */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-6">
        {/* Title skeleton */}
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />

        {/* Value skeleton */}
        <div className="mt-3 h-9 w-32 animate-pulse rounded bg-muted" />

        {/* Subtitle skeleton */}
        <div className="mt-3 h-4 w-20 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
