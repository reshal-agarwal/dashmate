import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ModalState {
  isOpen: boolean;
  component?: React.ReactNode;
  props?: Record<string, any>;
}

interface BottomSheetState {
  isOpen: boolean;
  component?: React.ReactNode;
  props?: Record<string, any>;
  snapPoints?: number[];
}

interface UIState {
  toasts: Toast[];
  modals: Record<string, ModalState>;
  bottomSheet: BottomSheetState;
  sidebarOpen: boolean;
  loadingStates: Record<string, boolean>;
  
  // Toasts
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Modals
  openModal: (key: string, component: React.ReactNode, props?: Record<string, any>) => void;
  closeModal: (key: string) => void;
  closeAllModals: () => void;
  
  // Bottom Sheet
  openBottomSheet: (component: React.ReactNode, props?: Record<string, any>, snapPoints?: number[]) => void;
  closeBottomSheet: () => void;
  
  // Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Loading
  setLoading: (key: string, loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  modals: {},
  bottomSheet: { isOpen: false },
  sidebarOpen: false,
  loadingStates: {},
  
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newToast = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    
    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
      }, toast.duration || 4000);
    }
    
    return id;
  },
  
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
  
  openModal: (key, component, props) => set((state) => ({
    modals: { ...state.modals, [key]: { isOpen: true, component, props } },
  })),
  
  closeModal: (key) => set((state) => {
    const newModals = { ...state.modals };
    delete newModals[key];
    return { modals: newModals };
  }),
  
  closeAllModals: () => set({ modals: {} }),
  
  openBottomSheet: (component, props, snapPoints) => set({
    bottomSheet: { isOpen: true, component, props, snapPoints: snapPoints || [0.3, 0.6, 1] },
  }),
  
  closeBottomSheet: () => set({ bottomSheet: { isOpen: false } }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  setLoading: (key, loading) => set((state) => ({
    loadingStates: { ...state.loadingStates, [key]: loading },
  })),
}));