"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine, Product } from "@/lib/types";

const STORAGE_KEY = "lulu-cart";

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  addProduct: (product: Product, quantity?: number) => void;
  setLineQuantity: (productId: string, quantity: number) => void;
  removeLine: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadFromStorage(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l) =>
          l &&
          typeof l.productId === "string" &&
          typeof l.name === "string" &&
          typeof l.unitPrice === "number" &&
          typeof l.maxQty === "number" &&
          typeof l.quantity === "number",
      )
      .map((l) => ({
        ...l,
        saleLimited: l.saleLimited === true,
      }));
  } catch {
    return [];
  }
}

function saveToStorage(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* ignore */
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLines(loadFromStorage());
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(lines);
  }, [lines, hydrated]);

  const addProduct = useCallback((product: Product, quantity = 1) => {
    const q = Math.max(1, Math.floor(quantity));
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === product.id);
      if (idx === -1) {
        const nextQty = Math.min(q, product.maxQty);
        if (nextQty < 1) return prev;
        const img = (product.imageUrl ?? "").trim();
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            unitPrice: product.price,
            maxQty: product.maxQty,
            quantity: nextQty,
            saleLimited: product.saleLimited === true,
            ...(img ? { imageUrl: img } : {}),
          },
        ];
      }
      const line = prev[idx];
      const nextQty = Math.min(line.quantity + q, line.maxQty);
      const img = (product.imageUrl ?? "").trim();
      const next = [...prev];
      next[idx] = {
        ...line,
        quantity: nextQty,
        saleLimited: product.saleLimited === true,
        ...(img ? { imageUrl: img } : {}),
      };
      return next;
    });
  }, []);

  const setLineQuantity = useCallback((productId: string, quantity: number) => {
    const q = Math.floor(quantity);
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === productId);
      if (idx === -1) return prev;
      const line = prev[idx];
      if (q < 1) return prev.filter((l) => l.productId !== productId);
      const nextQty = Math.min(q, line.maxQty);
      const next = [...prev];
      next[idx] = { ...line, quantity: nextQty };
      return next;
    });
  }, []);

  const removeLine = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const itemCount = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines],
  );

  const subtotal = useMemo(
    () =>
      Math.round(
        lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0) * 100,
      ) / 100,
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      itemCount,
      subtotal,
      addProduct,
      setLineQuantity,
      removeLine,
      clear,
    }),
    [
      lines,
      itemCount,
      subtotal,
      addProduct,
      setLineQuantity,
      removeLine,
      clear,
    ],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
