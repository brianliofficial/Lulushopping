import { HomeShell } from "@/components/HomeShell";
import { fetchStorefrontProducts } from "@/lib/foodlist-supabase";
import { getSalePhase } from "@/lib/sale-window";
import { getSaleWindow } from "@/lib/site-settings-supabase";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let errorCode: "FETCH_FAILED" | null = null;
  let configErrorCode: "MISSING_SUPABASE" | null = null;
  let products: Awaited<ReturnType<typeof fetchStorefrontProducts>> = [];
  const saleWindow = await getSaleWindow();
  const requestTime = Date.now();
  const initialSalePhase = getSalePhase(
    saleWindow.countdownStartsAt,
    saleWindow.countdownEndsAt,
    requestTime,
  );
  const sAt = saleWindow.countdownStartsAt;
  const eAt = saleWindow.countdownEndsAt;
  const showCountdownBanner =
    Boolean(sAt?.trim() && eAt?.trim()) &&
    !Number.isNaN(new Date(eAt!).getTime()) &&
    requestTime < new Date(eAt!).getTime();

  try {
    products = await fetchStorefrontProducts();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "MISSING_SUPABASE") {
      configErrorCode = "MISSING_SUPABASE";
    } else {
      errorCode = "FETCH_FAILED";
    }
  }

  return (
    <HomeShell
      products={products}
      errorCode={errorCode}
      configErrorCode={configErrorCode}
      saleWindow={saleWindow}
      initialSalePhase={initialSalePhase}
      showCountdownBanner={showCountdownBanner}
    />
  );
}
