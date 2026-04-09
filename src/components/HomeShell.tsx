"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import type { SaleWindowIso } from "@/lib/site-settings-supabase";
import { useCart } from "@/lib/cart-context";
import {
  getSalePhase,
  type SalePhase,
} from "@/lib/sale-window";
import {
  CartDrawer,
  type CartStep,
} from "@/components/CartDrawer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CountdownBanner } from "@/components/CountdownBanner";
import { ProductList } from "@/components/ProductList";
import { useI18n } from "@/lib/i18n-context";

export type HomeErrorCode = "FETCH_FAILED" | null;
export type HomeConfigErrorCode = "MISSING_SUPABASE" | null;

type Props = {
  products: Product[];
  errorCode: HomeErrorCode;
  configErrorCode: HomeConfigErrorCode;
  saleWindow: SaleWindowIso;
  /** Computed on the server so first client paint matches SSR (avoids hydration mismatch). */
  initialSalePhase: SalePhase;
  showCountdownBanner: boolean;
};

export function HomeShell({
  products,
  errorCode,
  configErrorCode,
  saleWindow,
  initialSalePhase,
  showCountdownBanner,
}: Props) {
  const { lines } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartStep, setCartStep] = useState<CartStep>("cart");
  const { t } = useI18n();
  const { countdownStartsAt: sAt, countdownEndsAt: eAt } = saleWindow;

  const [salePhase, setSalePhase] = useState<SalePhase>(initialSalePhase);
  const [bannerVisible, setBannerVisible] = useState(showCountdownBanner);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setSalePhase(getSalePhase(sAt, eAt, now));
      const show =
        Boolean(sAt?.trim() && eAt?.trim()) &&
        !Number.isNaN(new Date(eAt!).getTime()) &&
        now < new Date(eAt!).getTime();
      setBannerVisible(show);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [sAt, eAt]);

  const checkoutAllowed = useMemo(() => {
    const hasLimited = lines.some((l) => l.saleLimited === true);
    if (!hasLimited) return true;
    return salePhase === "during";
  }, [lines, salePhase]);

  useEffect(() => {
    if (!checkoutAllowed && cartStep === "checkout") {
      setCartStep("cart");
    }
  }, [checkoutAllowed, cartStep]);

  function openCart() {
    setCartStep("cart");
    setCartOpen(true);
  }

  function closeCart() {
    setCartOpen(false);
    setCartStep("cart");
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header onOpenCart={openCart} cartOpenAllowed={true} />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8"
      >
        <Hero />
        {bannerVisible && sAt && eAt ? (
          <CountdownBanner startsAtIso={sAt} endsAtIso={eAt} />
        ) : null}
        <div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            {t("home.listTitle")}
          </h1>
          <p
            className="mt-2 text-sm text-white/85"
            dangerouslySetInnerHTML={{ __html: t("home.listBlurb") }}
          />
        </div>
        <ProductList
          products={products}
          loading={false}
          errorCode={errorCode}
          configErrorCode={configErrorCode}
          salePhase={salePhase}
        />
      </main>
      <CartDrawer
        open={cartOpen}
        step={cartStep}
        onStepChange={setCartStep}
        onClose={closeCart}
        shoppingAllowed={checkoutAllowed}
      />
    </div>
  );
}
