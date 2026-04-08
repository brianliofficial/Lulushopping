"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n-context";

export function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 shadow-lg">
      <div className="relative aspect-[21/9] min-h-[140px] w-full max-h-[220px] sm:max-h-[280px]">
        <Image
          src="/hero-banner.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-lulu-bg/90 via-lulu-bg/40 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
          <p className="font-display text-2xl font-bold tracking-wide text-white drop-shadow sm:text-3xl">
            {t("hero.tagline")}
          </p>
          <p className="mt-2 max-w-md text-sm text-white/90 drop-shadow sm:text-base">
            {t("hero.subtitle")}
          </p>
        </div>
      </div>
    </section>
  );
}
