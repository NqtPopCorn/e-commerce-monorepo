import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  variantId: number;
  productId: number;
  productName: string;
  size?: string;
  color?: string;
  price: number;
  quantity: number;
  stock: number;
  imageUrl?: string;
  // Compatibility aliases
  bookId?: number;
  title?: string;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  remove: (variantId: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  clear: () => void;
  total: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const addQty = item.quantity || 1;
          const existing = state.items.find(
            (x) => x.variantId === item.variantId,
          );
          const normalizedItem: CartItem = {
            ...item,
            productId: item.productId ?? item.bookId ?? 0,
            productName: item.productName ?? item.title ?? "",
            bookId: item.productId ?? item.bookId ?? 0,
            title: item.productName ?? item.title ?? "",
            quantity: addQty,
          };
          return {
            items: existing
              ? state.items.map((x) =>
                  x.variantId === item.variantId
                    ? { ...x, quantity: Math.min(x.quantity + addQty, x.stock) }
                    : x,
                )
              : [...state.items, normalizedItem],
          };
        }),
      remove: (variantId) =>
        set((state) => ({
          items: state.items.filter((x) => x.variantId !== variantId),
        })),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((x) =>
            x.variantId === variantId
              ? { ...x, quantity: Math.max(1, Math.min(quantity, x.stock)) }
              : x,
          ),
        })),
      clear: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    { name: "fashion-shop-cart" },
  ),
);
