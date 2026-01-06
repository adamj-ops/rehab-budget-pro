import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Project, BudgetItem, Vendor, Draw, ProjectSummary } from '@/types';

// ============================================================================
// PROJECT STORE
// ============================================================================

interface ProjectState {
  // Data
  projects: Project[];
  currentProject: ProjectSummary | null;
  budgetItems: BudgetItem[];
  vendors: Vendor[];
  draws: Draw[];
  
  // UI State
  isLoading: boolean;
  activeTab: 'summary' | 'budget' | 'vendors' | 'draws' | 'costs';
  
  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: ProjectSummary | null) => void;
  setBudgetItems: (items: BudgetItem[]) => void;
  setVendors: (vendors: Vendor[]) => void;
  setDraws: (draws: Draw[]) => void;
  setIsLoading: (loading: boolean) => void;
  setActiveTab: (tab: ProjectState['activeTab']) => void;
  
  // Budget Item Actions
  addBudgetItem: (item: BudgetItem) => void;
  updateBudgetItem: (id: string, updates: Partial<BudgetItem>) => void;
  deleteBudgetItem: (id: string) => void;
  
  // Computed
  getBudgetByCategory: () => Map<string, { budget: number; actual: number; items: BudgetItem[] }>;
  getTotalBudget: () => number;
  getTotalActual: () => number;
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set, get) => ({
      // Initial State
      projects: [],
      currentProject: null,
      budgetItems: [],
      vendors: [],
      draws: [],
      isLoading: false,
      activeTab: 'summary',
      
      // Setters
      setProjects: (projects) => set({ projects }),
      setCurrentProject: (project) => set({ currentProject: project }),
      setBudgetItems: (items) => set({ budgetItems: items }),
      setVendors: (vendors) => set({ vendors }),
      setDraws: (draws) => set({ draws }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      // Budget Item Actions
      addBudgetItem: (item) => 
        set((state) => ({ budgetItems: [...state.budgetItems, item] })),
      
      updateBudgetItem: (id, updates) =>
        set((state) => ({
          budgetItems: state.budgetItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),
      
      deleteBudgetItem: (id) =>
        set((state) => ({
          budgetItems: state.budgetItems.filter((item) => item.id !== id),
        })),
      
      // Computed Values
      getBudgetByCategory: () => {
        const items = get().budgetItems;
        const categoryMap = new Map<string, { budget: number; actual: number; items: BudgetItem[] }>();
        
        items.forEach((item) => {
          const existing = categoryMap.get(item.category) || { budget: 0, actual: 0, items: [] };
          const budget = item.qty * item.rate;
          categoryMap.set(item.category, {
            budget: existing.budget + budget,
            actual: existing.actual + (item.actual || 0),
            items: [...existing.items, item],
          });
        });
        
        return categoryMap;
      },
      
      getTotalBudget: () => {
        return get().budgetItems.reduce((sum, item) => sum + item.qty * item.rate, 0);
      },
      
      getTotalActual: () => {
        return get().budgetItems.reduce((sum, item) => sum + (item.actual || 0), 0);
      },
    }),
    { name: 'project-store' }
  )
);

// ============================================================================
// UI STORE
// ============================================================================

interface UIState {
  sidebarOpen: boolean;
  modalOpen: string | null;
  
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      sidebarOpen: true,
      modalOpen: null,
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      openModal: (modalId) => set({ modalOpen: modalId }),
      closeModal: () => set({ modalOpen: null }),
    }),
    { name: 'ui-store' }
  )
);
