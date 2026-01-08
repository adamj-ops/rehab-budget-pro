'use client';

import * as React from 'react';
import { IconArrowsHorizontal, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface ScrollableTableProps {
  children: React.ReactNode;
  className?: string;
  showScrollHint?: boolean;
  scrollHintText?: string;
  showScrollButtons?: boolean;
}

/**
 * A wrapper component for tables that provides:
 * - Horizontal scrolling on mobile with momentum scrolling
 * - Scroll indicators (fade effects) on edges
 * - Optional scroll hint for mobile users
 * - Touch-optimized scrolling with scroll snap
 * - Optional scroll buttons for navigation
 */
export function ScrollableTable({
  children,
  className,
  showScrollHint = true,
  scrollHintText = 'Swipe to see more',
  showScrollButtons = false,
}: ScrollableTableProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [showHint, setShowHint] = React.useState(true);
  const [scrollProgress, setScrollProgress] = React.useState(0);

  // Debounce scroll updates for performance
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Check scroll position and update indicators
  const updateScrollIndicators = React.useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;
    
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < maxScroll - 5);
    
    // Calculate scroll progress (0-100)
    if (maxScroll > 0) {
      setScrollProgress((scrollLeft / maxScroll) * 100);
    }
  }, []);

  // Debounced scroll handler
  const handleScroll = React.useCallback(() => {
    if (showHint) {
      setShowHint(false);
    }
    
    // Debounce scroll indicator updates
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(updateScrollIndicators, 16); // ~60fps
  }, [showHint, updateScrollIndicators]);

  // Initialize and add scroll listener
  React.useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    updateScrollIndicators();
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also update on resize
    const resizeObserver = new ResizeObserver(updateScrollIndicators);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll, updateScrollIndicators]);

  // Programmatic scroll functions
  const scrollTo = React.useCallback((direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.75;
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  }, []);

  return (
    <div className={cn('mobile-table-wrapper', className)}>
      {/* Scroll hint for mobile */}
      {showScrollHint && showHint && canScrollRight && (
        <div className="scroll-hint mb-2 md:hidden animate-in fade-in slide-in-from-bottom-1 duration-300">
          <IconArrowsHorizontal className="h-3.5 w-3.5" />
          <span>{scrollHintText}</span>
        </div>
      )}
      
      {/* Scroll indicator wrapper */}
      <div
        className={cn(
          'scroll-indicator-wrapper rounded-lg border',
          canScrollLeft && 'can-scroll-left',
          canScrollRight && 'can-scroll-right'
        )}
      >
        {/* Left scroll button (desktop only) */}
        {showScrollButtons && canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollTo('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background transition-all"
            aria-label="Scroll left"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Right scroll button (desktop only) */}
        {showScrollButtons && canScrollRight && (
          <button
            type="button"
            onClick={() => scrollTo('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background transition-all"
            aria-label="Scroll right"
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="mobile-scroll-container overflow-x-auto overscroll-x-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>

        {/* Scroll progress indicator for mobile */}
        {(canScrollLeft || canScrollRight) && (
          <div className="md:hidden h-1 bg-muted mt-1 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary/50 rounded-full transition-all duration-150"
              style={{ width: `${Math.max(20, 100 - scrollProgress)}%`, marginLeft: `${scrollProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to detect if the user is on a mobile device.
 * Uses matchMedia for better performance and SSR support.
 */
export function useIsMobile(breakpoint: number = 640) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    // Use matchMedia for better performance
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };
    
    // Set initial value
    handleChange(mediaQuery);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook to debounce a callback function.
 * Useful for scroll handlers and other high-frequency events.
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const callbackRef = React.useRef(callback);

  // Update callback ref on every render
  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return React.useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

/**
 * Hook to throttle a callback function.
 * Better for scroll handlers where you want consistent updates.
 */
export function useThrottledCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const lastRunRef = React.useRef(0);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const callbackRef = React.useRef(callback);

  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return React.useCallback(
    ((...args) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        lastRunRef.current = now;
        callbackRef.current(...args);
      } else {
        // Schedule the callback to run after the remaining delay
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callbackRef.current(...args);
        }, delay - timeSinceLastRun);
      }
    }) as T,
    [delay]
  );
}

/**
 * Hook to detect if an element is scrollable horizontally
 */
export function useIsScrollable(ref: React.RefObject<HTMLElement>) {
  const [isScrollable, setIsScrollable] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const checkScrollable = () => {
      setIsScrollable(element.scrollWidth > element.clientWidth);
    };

    checkScrollable();
    
    const resizeObserver = new ResizeObserver(checkScrollable);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [ref]);

  return isScrollable;
}
