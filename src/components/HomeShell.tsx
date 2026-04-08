"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import {
  CartDrawer,
  type CartStep,
} from "@/components/CartDrawer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProductList } from "@/components/ProductList";
import { useI18n } from "@/lib/i18n-context";

export type HomeErrorCode = "FETCH_FAILED" | null;
export type HomeConfigErrorCode = "MISSING_SUPABASE" | null;

type Props = {
  products: Product[];
  errorCode: HomeErrorCode;
  configErrorCode: HomeConfigErrorCode;
};

export function HomeShell({
  products,
  errorCode,
  configErrorCode,
}: Props) {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartStep, setCartStep] = useState<CartStep>("cart");
  const { t } = useI18n();

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
      <Header onOpenCart={openCart} />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8"
      >
        <Hero />
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
        />
      </main>
      <CartDrawer
        open={cartOpen}
        step={cartStep}
        onStepChange={setCartStep}
        onClose={closeCart}
      />
    </div>
  );
}
