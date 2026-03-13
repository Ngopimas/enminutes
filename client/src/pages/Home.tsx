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

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <PurchasingPowerIndex />
        <BasketComposition />
        <ProductExplorer />
        <Insights />
        <History />
        <Sources />
      </main>
      <Footer />
    </div>
  );
}
