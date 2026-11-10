'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import type { CartLine } from '@/lib/types';

/**
 * Carrito en localStorage, por tienda.
 *
 * Es deliberadamente "tonto": guarda intención, no verdad. Los precios y el
 * stock se revalidan SIEMPRE en el servidor antes de cobrar, porque cualquiera
 * puede editar su propio localStorage.
 */

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  isOpen: boolean;
  isHydrated: boolean;
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  storeId,
  children,
}: {
  storeId: string;
  children: React.ReactNode;
}) {
  const storageKey = `candela:cart:${storeId}`;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hidratación en efecto, no en useState: el HTML del servidor no conoce
  // localStorage y un mismatch rompería el render.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed);
      }
    } catch {
      // Carrito corrupto o storage bloqueado: arrancamos vacío y seguimos.
    }
    setIsHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      // Modo privado con cuota llena: no es motivo para tumbar la tienda.
    }
  }, [lines, storageKey, isHydrated]);

  const add = useCallback((line: Omit<CartLine, 'quantity'>, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === line.variantId);
      if (existing) {
        return prev.map((l) =>
          l.variantId === line.variantId
            ? { ...l, quantity: Math.min(l.quantity + quantity, l.maxStock || 99) }
            : l,
        );
      }
      return [...prev, { ...line, quantity: Math.min(quantity, line.maxStock || 99) }];
    });
    setIsOpen(true);
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.variantId !== variantId)
        : prev.map((l) =>
            l.variantId === variantId
              ? { ...l, quantity: Math.min(quantity, l.maxStock || 99) }
              : l,
          ),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => ({
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalCents: lines.reduce((n, l) => n + l.priceCents * l.quantity, 0),
    isOpen,
    isHydrated,
    add,
    setQuantity,
    remove,
    clear,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }), [lines, isOpen, isHydrated, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
