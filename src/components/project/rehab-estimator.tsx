'use client';

import * as React from 'react';
import {
  IconCalculator,
  IconInfoCircle,
  IconSparkles,
  IconChevronRight,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type RehabScope = 'cosmetic' | 'moderate' | 'full_gut';

interface RehabEstimatorProps {
  sqft: number | null;
  yearBuilt: number | null;
  onEstimateSelect?: (estimate: number) => void;
  className?: string;
}

// Cost per sqft ranges based on Minneapolis metro area data
// These are derived from aggregating the cost_reference table data
const REHAB_COSTS_PER_SQFT: Record<RehabScope, { low: number; mid: number; high: number; description: string }> = {
  cosmetic: {
    low: 15,
    mid: 25,
    high: 40,
    description: 'Paint, flooring, fixtures, minor repairs. No structural or mechanical work.',
  },
  moderate: {
    low: 35,
    mid: 55,
    high: 80,
    description: 'Kitchen/bath updates, some plumbing/electrical, flooring throughout, paint.',
  },
  full_gut: {
    low: 70,
    mid: 100,
    high: 150,
    description: 'Down to studs. New mechanicals, kitchen, baths, windows, everything.',
  },
};

// Age adjustments (older homes typically need more work)
function getAgeMultiplier(yearBuilt: number | null): number {
  if (!yearBuilt) return 1.0;
  const age = new Date().getFullYear() - yearBuilt;

  if (age < 20) return 0.9;      // Newer home, less likely to need major systems
  if (age < 40) return 1.0;      // Standard
  if (age < 60) return 1.1;      // May need some system updates
  if (age < 80) return 1.2;      // Likely needs electrical, plumbing attention
  return 1.3;                     // Very old, expect surprises
}

function getAgeDescription(yearBuilt: number | null): string {
  if (!yearBuilt) return '';
  const age = new Date().getFullYear() - yearBuilt;

  if (age < 20) return 'Newer construction typically has lower rehab costs.';
  if (age < 40) return 'Standard age range with predictable costs.';
  if (age < 60) return 'May need plumbing, electrical, or HVAC updates.';
  if (age < 80) return 'Older home - budget extra for system replacements.';
  return 'Very old home - expect hidden issues and higher contingency.';
}

export function RehabEstimator({
  sqft,
  yearBuilt,
  onEstimateSelect,
  className,
}: RehabEstimatorProps) {
  const [scope, setScope] = React.useState<RehabScope>('moderate');
  const [selectedEstimate, setSelectedEstimate] = React.useState<'low' | 'mid' | 'high'>('mid');

  const estimates = React.useMemo(() => {
    if (!sqft || sqft <= 0) return null;

    const ageMultiplier = getAgeMultiplier(yearBuilt);
    const costs = REHAB_COSTS_PER_SQFT[scope];

    return {
      low: Math.round(sqft * costs.low * ageMultiplier),
      mid: Math.round(sqft * costs.mid * ageMultiplier),
      high: Math.round(sqft * costs.high * ageMultiplier),
      perSqft: {
        low: Math.round(costs.low * ageMultiplier),
        mid: Math.round(costs.mid * ageMultiplier),
        high: Math.round(costs.high * ageMultiplier),
      },
    };
  }, [sqft, yearBuilt, scope]);

  const handleUseEstimate = () => {
    if (estimates && onEstimateSelect) {
      onEstimateSelect(estimates[selectedEstimate]);
    }
  };

  if (!sqft || sqft <= 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed p-4 text-center text-muted-foreground',
          className
        )}
      >
        <IconCalculator className="h-6 w-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">Rehab Estimator</p>
        <p className="text-xs mt-1">
          Enter square footage to get a rehab cost estimate based on Minneapolis metro pricing.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <IconSparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Rehab Cost Estimator</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Explanation */}
        <p className="text-xs text-muted-foreground">
          Get a quick rehab estimate based on property size, age, and scope of work.
          These figures use Minneapolis metro area pricing data as a starting point.
        </p>

        {/* Scope Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium">Scope of Work</label>
          <Select value={scope} onValueChange={(v) => setScope(v as RehabScope)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cosmetic">
                <div className="flex flex-col items-start">
                  <span>Cosmetic Refresh</span>
                  <span className="text-xs text-muted-foreground">$15-40/sqft</span>
                </div>
              </SelectItem>
              <SelectItem value="moderate">
                <div className="flex flex-col items-start">
                  <span>Moderate Rehab</span>
                  <span className="text-xs text-muted-foreground">$35-80/sqft</span>
                </div>
              </SelectItem>
              <SelectItem value="full_gut">
                <div className="flex flex-col items-start">
                  <span>Full Gut Renovation</span>
                  <span className="text-xs text-muted-foreground">$70-150/sqft</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {REHAB_COSTS_PER_SQFT[scope].description}
          </p>
        </div>

        {/* Age Note */}
        {yearBuilt && (
          <div className="flex items-start gap-2 p-2 rounded bg-muted/50 text-xs">
            <IconInfoCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">
              <strong>Built {yearBuilt}</strong> ({new Date().getFullYear() - yearBuilt} years old): {getAgeDescription(yearBuilt)}
            </span>
          </div>
        )}

        {/* Estimates */}
        {estimates && (
          <div className="space-y-2">
            <label className="text-xs font-medium">Estimated Range ({sqft.toLocaleString()} sqft)</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedEstimate('low')}
                className={cn(
                  'p-3 rounded-lg border text-center transition-colors',
                  selectedEstimate === 'low'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'hover:bg-muted/50'
                )}
              >
                <div className="text-xs text-muted-foreground mb-1">Low</div>
                <div className="font-semibold tabular-nums">{formatCurrency(estimates.low)}</div>
                <div className="text-xs text-muted-foreground">${estimates.perSqft.low}/sqft</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedEstimate('mid')}
                className={cn(
                  'p-3 rounded-lg border text-center transition-colors',
                  selectedEstimate === 'mid'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'hover:bg-muted/50'
                )}
              >
                <div className="text-xs text-muted-foreground mb-1">Mid</div>
                <div className="font-semibold tabular-nums">{formatCurrency(estimates.mid)}</div>
                <div className="text-xs text-muted-foreground">${estimates.perSqft.mid}/sqft</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedEstimate('high')}
                className={cn(
                  'p-3 rounded-lg border text-center transition-colors',
                  selectedEstimate === 'high'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'hover:bg-muted/50'
                )}
              >
                <div className="text-xs text-muted-foreground mb-1">High</div>
                <div className="font-semibold tabular-nums">{formatCurrency(estimates.high)}</div>
                <div className="text-xs text-muted-foreground">${estimates.perSqft.high}/sqft</div>
              </button>
            </div>
          </div>
        )}

        {/* Use Estimate Button */}
        {onEstimateSelect && estimates && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleUseEstimate}
          >
            Use {formatCurrency(estimates[selectedEstimate])} estimate
            <IconChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground border-t pt-3">
          <strong>How this works:</strong> Estimates are calculated using $/sqft benchmarks
          from Minneapolis metro area contractors, adjusted for property age. Always get
          actual bids before making offers. Your contingency buffer will add additional
          padding to these numbers.
        </p>
      </div>
    </div>
  );
}
