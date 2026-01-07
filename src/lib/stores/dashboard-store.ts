import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { DashboardFilters, DashboardView } from '@/types/dashboard';
import { DEFAULT_DASHBOARD_FILTERS } from '@/types/dashboard';

// ============================================================================
// DASHBOARD STORE
// Client-side state for dashboard UI
// ============================================================================

interface DashboardState {
  // View state
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;

  // Filters
  filters: DashboardFilters;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;

  // UI state
  expandedSections: Set<string>;
  toggleSection: (sectionId: string) => void;
  isSectionExpanded: (sectionId: string) => boolean;

  // Selected project (for details panel)
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;

  // Command palette
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  // Sidebar state (for mobile)
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

// Default expanded sections
const DEFAULT_EXPANDED_SECTIONS = new Set([
  'portfolio-health',
  'pipeline',
  'alerts',
]);

export const useDashboardStore = create<DashboardState>()(
  devtools(
    persist(
      (set, get) => ({
        // View state
        currentView: 'kanban',
        setCurrentView: (view) => set({ currentView: view }),

        // Filters
        filters: DEFAULT_DASHBOARD_FILTERS,
        setFilters: (newFilters) =>
          set((state) => ({
            filters: { ...state.filters, ...newFilters },
          })),
        resetFilters: () => set({ filters: DEFAULT_DASHBOARD_FILTERS }),

        // Expanded sections
        expandedSections: DEFAULT_EXPANDED_SECTIONS,
        toggleSection: (sectionId) =>
          set((state) => {
            const newSet = new Set(state.expandedSections);
            if (newSet.has(sectionId)) {
              newSet.delete(sectionId);
            } else {
              newSet.add(sectionId);
            }
            return { expandedSections: newSet };
          }),
        isSectionExpanded: (sectionId) => get().expandedSections.has(sectionId),

        // Selected project
        selectedProjectId: null,
        setSelectedProjectId: (id) => set({ selectedProjectId: id }),

        // Command palette
        isCommandPaletteOpen: false,
        openCommandPalette: () => set({ isCommandPaletteOpen: true }),
        closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
        toggleCommandPalette: () =>
          set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

        // Sidebar
        isSidebarOpen: false,
        toggleSidebar: () =>
          set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
        setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      }),
      {
        name: 'dashboard-storage',
        partialize: (state) => ({
          currentView: state.currentView,
          // Don't persist expandedSections as Set doesn't serialize well
        }),
      }
    ),
    { name: 'dashboard-store' }
  )
);
