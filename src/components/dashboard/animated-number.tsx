'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  className?: string;
}

/**
 * Animated number component that smoothly transitions between values
 * Uses framer-motion springs for natural-feeling animations
 */
export function AnimatedNumber({
  value,
  format = (v) => v.toLocaleString(),
  duration = 0.8,
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  // Spring animation for smooth transitions
  const spring = useSpring(prevValue.current, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });

  // Transform spring value to display
  const display = useTransform(spring, (current) => format(Math.round(current)));

  useEffect(() => {
    spring.set(value);
    prevValue.current = value;
  }, [spring, value]);

  // Subscribe to display changes
  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      setDisplayValue(v as unknown as number);
    });
    return () => unsubscribe();
  }, [display]);

  return (
    <motion.span className={className}>
      {typeof displayValue === 'string' ? displayValue : format(displayValue)}
    </motion.span>
  );
}

/**
 * Currency-specific animated number
 */
export function AnimatedCurrency({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <AnimatedNumber
      value={value}
      format={(v) =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(v)
      }
      className={className}
    />
  );
}

/**
 * Percentage-specific animated number
 */
export function AnimatedPercent({
  value,
  decimals = 1,
  className,
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  return (
    <AnimatedNumber
      value={value}
      format={(v) => `${v.toFixed(decimals)}%`}
      className={className}
    />
  );
}
