"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest } from "./api";
import { usePublicCatalog } from "./usePublicCatalog";
import {
  MAX_QUANTITY_PER_LINE,
  readCart,
  writeCart,
  type CartLine,
  type ShopCatalog,
  type ShopProduct,
  type ShopVariant,
} from "./shop";

interface ResolvedLine extends CartLine {
  product: ShopProduct;
  variant: ShopVariant;
}

interface ShopContextValue {
  catalog: ShopCatalog | null;
  loadError: string | null;
  cart: CartLine[];
  cartLines: ResolvedLine[];
  cartCount: number;
  findVariant: (variantId: string) => { product: ShopProduct; variant: ShopVariant } | null;
  addToCart: (variantId: string, quantity: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

/**
 * Catalogue de Roum Boutique et panier du client.
 * Le catalogue se recharge à chaque changement fait par la gérante (stock, prix, promotion, photos).
 */
export function ShopProvider({ children }: { children: ReactNode }) {
  const { shopVersion } = usePublicCatalog();
  const [catalog, setCatalog] = useState<ShopCatalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    setCart(readCart());
    // Un autre onglet modifie le panier : celui-ci suit.
    const onStorage = (e: StorageEvent) => {
      if (e.key === "roum_shop_cart") setCart(readCart());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    let alive = true;
    apiRequest<ShopCatalog>("/api/v1/public/shop/catalog")
      .then((data) => {
        if (!alive) return;
        setCatalog(data);
        setLoadError(null);
      })
      .catch((err) => alive && setLoadError(err?.message || "La boutique n'a pas pu être chargée."));
    return () => {
      alive = false;
    };
  }, [shopVersion]);

  const variantIndex = useMemo(() => {
    const index = new Map<string, { product: ShopProduct; variant: ShopVariant }>();
    for (const product of catalog?.products || []) {
      for (const variant of product.variants) index.set(variant.id, { product, variant });
    }
    return index;
  }, [catalog]);

  const findVariant = useCallback((variantId: string) => variantIndex.get(variantId) || null, [variantIndex]);

  const update = useCallback((next: CartLine[]) => {
    setCart(next);
    writeCart(next);
  }, []);

  const setQuantity = useCallback(
    (variantId: string, quantity: number) => {
      const stock = variantIndex.get(variantId)?.variant.stock ?? MAX_QUANTITY_PER_LINE;
      const capped = Math.max(0, Math.min(quantity, stock, MAX_QUANTITY_PER_LINE));
      const others = readCart().filter((l) => l.variantId !== variantId);
      update(capped > 0 ? [...others, { variantId, quantity: capped }] : others);
    },
    [update, variantIndex]
  );

  const addToCart = useCallback(
    (variantId: string, quantity: number) => {
      const current = readCart().find((l) => l.variantId === variantId)?.quantity || 0;
      const stock = variantIndex.get(variantId)?.variant.stock ?? MAX_QUANTITY_PER_LINE;
      const capped = Math.max(0, Math.min(current + quantity, stock, MAX_QUANTITY_PER_LINE));
      const lines = readCart();
      const exists = lines.some((l) => l.variantId === variantId);
      update(
        exists
          ? lines.map((l) => (l.variantId === variantId ? { ...l, quantity: capped } : l))
          : [...lines, { variantId, quantity: capped }]
      );
    },
    [update, variantIndex]
  );

  const removeFromCart = useCallback(
    (variantId: string) => update(readCart().filter((l) => l.variantId !== variantId)),
    [update]
  );
  const clearCart = useCallback(() => update([]), [update]);

  const cartLines = useMemo(
    () =>
      cart
        .map((line) => {
          const found = variantIndex.get(line.variantId);
          return found ? { ...line, ...found } : null;
        })
        .filter((line): line is ResolvedLine => line !== null),
    [cart, variantIndex]
  );

  const value = useMemo(
    () => ({
      catalog,
      loadError,
      cart,
      cartLines,
      cartCount: cart.reduce((sum, l) => sum + l.quantity, 0),
      findVariant,
      addToCart,
      setQuantity,
      removeFromCart,
      clearCart,
    }),
    [catalog, loadError, cart, cartLines, findVariant, addToCart, setQuantity, removeFromCart, clearCart]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const shop = useContext(ShopContext);
  if (!shop) throw new Error("useShop doit être utilisé dans ShopProvider.");
  return shop;
}
