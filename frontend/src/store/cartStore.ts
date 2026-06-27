import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
  getItemQuantity: (productId: string) => number;
  isFromSameRestaurant: (restaurantId: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      
      addItem: (product, quantity = 1) => {
        const { items, restaurantId } = get();
        
        if (restaurantId && restaurantId !== product.restaurant) {
          throw new Error('Cannot add items from different restaurants. Please clear your cart first.');
        }
        
        const existingItem = items.find(item => item.product.id === product.id);
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            items: [...items, { product, quantity }],
            restaurantId: product.restaurant,
          });
        }
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },
      
      removeItem: (productId) => {
        const items = get().items.filter(item => item.product.id !== productId);
        set({
          items,
          restaurantId: items.length > 0 ? get().restaurantId : null,
        });
      },
      
      clearCart: () => set({ items: [], restaurantId: null }),
      
      getSubtotal: () => get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      
      getItemQuantity: (productId) => {
        const item = get().items.find(item => item.product.id === productId);
        return item?.quantity || 0;
      },
      
      isFromSameRestaurant: (restaurantId) => {
        return get().restaurantId === null || get().restaurantId === restaurantId;
      },
    }),
    {
      name: 'dashmate-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, restaurantId: state.restaurantId }),
    }
  )
);