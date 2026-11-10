"use client";

import Link from "next/link";
import { ReceiptText, ShoppingBag } from "lucide-react";
import { useShop } from "@/shared/useShop";
import { RoumBoutiqueLogo } from "./RoumBoutiqueLogo";

export function ShopHeader() {
  const { cartCount } = useShop();
  return (
    <header className="rb-header">
      <div className="rb-header-inner">
        <Link href="/boutique" className="rb-header-logo" title="Roum Boutique">
          <RoumBoutiqueLogo width={104} />
        </Link>
        <nav className="rb-header-nav">
          <Link href="/boutique/commandes" className="rb-header-link">
            <ReceiptText size={17} />
            <span>Mes commandes</span>
          </Link>
          <Link href="/boutique/panier" className="rb-cart-pill" aria-label={`Panier : ${cartCount} article(s)`}>
            <ShoppingBag size={17} />
            <span>Panier</span>
            {cartCount > 0 && <span className="rb-cart-count">{cartCount}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}
