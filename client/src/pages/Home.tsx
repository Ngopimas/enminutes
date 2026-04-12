import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PurchasingPowerIndex from "@/components/PurchasingPowerIndex";
import BasketComposition from "@/components/BasketComposition";
import ProductExplorer from "@/components/ProductExplorer";
import TimelineComparison from "@/components/TimelineComparison";
import Insights from "@/components/Insights";
import History from "@/components/History";
import Sources from "@/components/Sources";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { isEmbedMode } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { basketWeights } from "@/lib/data";

export const MAX_BASKET_WEIGHT = 5;

function isCustomBasket(weights: Record<string, number>): boolean {
  return Object.entries(basketWeights).some(
    ([pid, defaultW]) => (weights[pid] ?? 0) !== defaultW,
  );
}

function initCustomWeights(): Record<string, number> {
  // Try URL param: format is "pid:weight,pid:weight,..."
  try {
    const params = new URLSearchParams(window.location.search);
    const basketParam = params.get("basket");
    if (basketParam) {
      const parsed: Record<string, number> = {};
      for (const part of basketParam.split(",")) {
        const [pid, rawW] = part.split(":");
        if (pid && pid in basketWeights) {
          parsed[pid] = rawW
            ? Math.max(0, Math.min(MAX_BASKET_WEIGHT, parseInt(rawW, 10) || 0))
            : 1;
        }
      }
      // Any key not mentioned in the URL gets weight 0
      return Object.fromEntries(
        Object.keys(basketWeights).map((pid) => [pid, parsed[pid] ?? 0]),
      );
    }
  } catch {}

  // Try localStorage: full weights object
  try {
    const saved = localStorage.getItem("custom_basket");
    if (saved) {
      const stored = JSON.parse(saved);
      if (stored && typeof stored === "object") {
        return Object.fromEntries(
          Object.keys(basketWeights).map((pid) => [
            pid,
            typeof stored[pid] === "number"
              ? Math.max(0, Math.min(MAX_BASKET_WEIGHT, stored[pid]))
              : 0,
          ]),
        );
      }
    }
  } catch {}

  return { ...basketWeights };
}

export default function Home({
  initialProductId,
}: {
  initialProductId?: string;
}) {
  const embed = isEmbedMode();
  const { t } = useLang();
  const [customWeights, setCustomWeights] = useState<Record<string, number>>(
    initCustomWeights,
  );
  const [explorerProductId, setExplorerProductId] = useState<
    string | undefined
  >(undefined);

  // Sync basket state to URL + localStorage
  useEffect(() => {
    const custom = isCustomBasket(customWeights);
    const params = new URLSearchParams(window.location.search);
    if (custom) {
      const encoded = Object.entries(customWeights)
        .filter(([, w]) => w > 0)
        .map(([pid, w]) => `${pid}:${w}`)
        .join(",");
      params.set("basket", encoded);
    } else {
      params.delete("basket");
    }
    const search = params.toString();
    const hash = window.location.hash;
    const newUrl = search
      ? `${window.location.pathname}?${search}${hash}`
      : `${window.location.pathname}${hash}`;
    window.history.replaceState({}, "", newUrl);
    try {
      if (custom) {
        localStorage.setItem("custom_basket", JSON.stringify(customWeights));
      } else {
        localStorage.removeItem("custom_basket");
      }
    } catch {}
  }, [customWeights]);

  const handleIncrement = (pid: string) => {
    setCustomWeights((prev) => ({
      ...prev,
      [pid]: Math.min((prev[pid] ?? 0) + 1, MAX_BASKET_WEIGHT),
    }));
  };

  const handleDecrement = (pid: string) => {
    setCustomWeights((prev) => {
      const current = prev[pid] ?? 0;
      if (current <= 0) return prev;
      // Prevent emptying the basket entirely
      const totalWeight = Object.values(prev).reduce((s, w) => s + w, 0);
      if (totalWeight <= 1) return prev;
      return { ...prev, [pid]: current - 1 };
    });
  };

  const handleReset = () => {
    setCustomWeights({ ...basketWeights });
  };

  const handleExplore = (pid: string) => {
    setExplorerProductId(pid);
    // Clear after render so the same product can be triggered again
    setTimeout(() => setExplorerProductId(undefined), 300);
  };

  const chartFallback = (
    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      {t("chartUnavailable")}
    </div>
  );

  useEffect(() => {
    const savedY = sessionStorage.getItem("homeScrollY");
    if (savedY !== null) {
      sessionStorage.removeItem("homeScrollY");
      requestAnimationFrame(() => window.scrollTo(0, parseInt(savedY, 10)));
    }
  }, []);

  if (embed) {
    return (
      <div
        className="min-h-screen bg-background text-foreground"
        data-embed="true"
      >
        <main>
          <ErrorBoundary fallback={chartFallback}>
            <ProductExplorer initialProductId={initialProductId} />
          </ErrorBoundary>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <ErrorBoundary fallback={chartFallback}>
          <PurchasingPowerIndex
            customWeights={customWeights}
            isCustomBasket={isCustomBasket(customWeights)}
          />
        </ErrorBoundary>
        <BasketComposition
          customWeights={customWeights}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onReset={handleReset}
          onExplore={handleExplore}
        />
        <ErrorBoundary fallback={chartFallback}>
          <ProductExplorer
            initialProductId={initialProductId}
            openProductId={explorerProductId}
          />
        </ErrorBoundary>
        <Insights />
        <History />
        <Sources />
      </main>
      <Footer />
    </div>
  );
}
