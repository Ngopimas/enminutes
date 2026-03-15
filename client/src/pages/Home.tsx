import { useEffect } from "react";
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

export default function Home({ initialProductId }: { initialProductId?: string }) {
  const embed = isEmbedMode();

  useEffect(() => {
    const savedY = sessionStorage.getItem("homeScrollY");
    if (savedY !== null) {
      sessionStorage.removeItem("homeScrollY");
      // rAF ensures the DOM has fully painted before scrolling
      requestAnimationFrame(() => window.scrollTo(0, parseInt(savedY, 10)));
    }
  }, []);

  if (embed) {
    return (
      <div className="min-h-screen bg-background text-foreground" data-embed="true">
        <main>
          <ErrorBoundary>
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
        <ErrorBoundary>
          <PurchasingPowerIndex />
        </ErrorBoundary>
        <BasketComposition />
        <ErrorBoundary>
          <ProductExplorer initialProductId={initialProductId} />
        </ErrorBoundary>
        <Insights />
        <History />
        <Sources />
      </main>
      <Footer />
    </div>
  );
}
