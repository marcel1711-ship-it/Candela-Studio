'use client';

import { useEffect } from 'react';
import { useCart } from './cart-provider';

/**
 * Vacía el carrito al aterrizar en la página de gracias.
 *
 * Va aquí y no en el webhook porque el carrito vive en el navegador del
 * comprador; el servidor no puede tocarlo.
 */
export function ClearCart({ storeId }: { storeId: string }) {
  const { clear, isHydrated } = useCart();

  useEffect(() => {
    if (isHydrated) clear();
  }, [isHydrated, clear, storeId]);

  return null;
}
