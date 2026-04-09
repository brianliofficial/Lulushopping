"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import type { SaleWindowIso } from "@/lib/site-settings-supabase";
import { isShoppingAllowed } from "@/lib/sale-window";
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
};

export function HomeShell({
  products,
  errorCode,
  configErrorCode,
  saleWindow,
}: Props) {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartStep, setCartStep] = useState<CartStep>("cart");
  const { t } = useI18n();
  const { countdownStartsAt: sAt, countdownEndsAt: eAt } = saleWindow;

  const [shoppingAllowed, setShoppingAllowed] = useState(() =>
    isShoppingAllowed(sAt, eAt),
  );

  useEffect(() => {
    const tick = () =>
      setShoppingAllowed(isShoppingAllowed(sAt, eAt, Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [sAt, eAt]);

  useEffect(() => {
    if (!shoppingAllowed && cartStep === "checkout") {
      setCartStep("cart");
    }
  }, [shoppingAllowed, cartStep]);

  function openCart() {
    setCartStep("cart");
    setCartOpen(true);
  }

  function closeCart() {
    setCartOpen(false);
    setCartStep("cart");
  }

  const showBanner =
    Boolean(sAt?.trim() && eAt?.trim()) &&
    !Number.isNaN(new Date(eAt!).getTime()) &&
    Date.now() < new Date(eAt!).getTime();

  return (
    <div className="flex flex-1 flex-col">
      <Header onOpenCart={openCart} />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8"
      >
        <Hero />
        {showBanner && sAt && eAt ? (
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
          shoppingAllowed={shoppingAllowed}
        />
      </main>
      <CartDrawer
        open={cartOpen}
        step={cartStep}
        onStepChange={setCartStep}
        onClose={closeCart}
        shoppingAllowed={shoppingAllowed}
      />
    </div>
  );
}
