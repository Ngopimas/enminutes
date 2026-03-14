import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/lib/i18n";
import { useSalaryRef } from "@/lib/salaryRef";
import { products, getMinutes, getYearsForRef, type Product } from "@/lib/data";
import ProductModal from "./ProductModal";

/** Each insight defines WHAT to compute and HOW to narrate it. */
interface InsightDef {
  emoji: string;
  productId: string;
  /** Return { title, subtitle } computed from live data. */
  render: (
    p: Product,
    mins: Record<number, number>,
    years: number[],
    lang: "fr" | "en",
  ) => { title: string; sub: string } | null;
}

const insightDefs: InsightDef[] = [
  {
    emoji: "🚬",
    productId: "cigarettes",
    render: (p, mins, years, lang) => {
      const first = years[0];
      const last = years[years.length - 1];
      const minFirst = Math.round(mins[first]);
      const minLast = Math.round(mins[last]);
      const ratio = (minLast / minFirst).toFixed(1);
      return lang === "fr"
        ? {
            title: `Cigarettes\u202F: le produit qui a le plus augmenté en temps de travail`,
            sub: `De ${minFirst} minutes en ${first} à ${minLast} minutes en ${last}. Les taxes anti-tabac ont multiplié le coût par ${ratio} en temps de travail.`,
          }
        : {
            title: `Cigarettes: the biggest increase in work-time cost`,
            sub: `From ${minFirst} minutes in ${first} to ${minLast} minutes in ${last}. Anti-tobacco taxes multiplied the work-time cost by ${ratio}×.`,
          };
    },
  },
  {
    emoji: "🥖",
    productId: "baguette",
    render: (p, mins, years, lang) => {
      const first = years[0];
      const last = years[years.length - 1];
      const minFirst = Math.round(mins[first]);
      const minLast = Math.round(mins[last]);
      const ratio = (minFirst / minLast).toFixed(1);
      return lang === "fr"
        ? {
            title: `Baguette\u202F: ${ratio}× plus accessible qu'en ${first}`,
            sub: `De ${minFirst} minutes de travail en ${first} à environ ${minLast} minutes aujourd'hui. Le pain reste le symbole de l'accessibilité alimentaire.`,
          }
        : {
            title: `Baguette: ${ratio}× more affordable than in ${first}`,
            sub: `From ${minFirst} work-minutes in ${first} to about ${minLast} minutes today. Bread remains the symbol of food affordability.`,
          };
    },
  },
  {
    emoji: "⛽",
    productId: "essence",
    render: (p, mins, years, lang) => {
      // Compute range over last ~30 years
      const recentYears = years.filter((y) => y >= 1990);
      if (recentYears.length < 2) return null;
      const recentMins = recentYears.map((y) => mins[y]).filter(Boolean);
      const lo = Math.round(Math.min(...recentMins));
      const hi = Math.round(Math.max(...recentMins));
      return lang === "fr"
        ? {
            title: `Essence\u202F: remarquablement stable depuis 30 ans`,
            sub: `Malgré les fluctuations de prix, un litre d'essence coûte entre ${lo} et ${hi} minutes de travail depuis les années 1990.`,
          }
        : {
            title: `Petrol: remarkably stable for 30 years`,
            sub: `Despite price swings, a litre of petrol costs ${lo}-${hi} work-minutes since the 1990s.`,
          };
    },
  },
  {
    emoji: "🎬",
    productId: "cinema",
    render: (p, mins, years, lang) => {
      const first = years[0];
      const last = years[years.length - 1];
      const minFirst = Math.round(mins[first]);
      const minLast = Math.round(mins[last]);
      // Check stagnation over last 20 years
      const recent = years.filter((y) => y >= last - 20);
      const recentMins = recent.map((y) => mins[y]).filter(Boolean);
      const recentAvg = Math.round(
        recentMins.reduce((a, b) => a + b, 0) / recentMins.length,
      );
      return lang === "fr"
        ? {
            title: `Cinéma\u202F: un luxe relatif croissant`,
            sub: `Malgré la baisse depuis ${first} (${minFirst}→${minLast} min), le cinéma stagne autour de ${recentAvg} minutes de travail depuis 20 ans.`,
          }
        : {
            title: `Cinema: a growing relative luxury`,
            sub: `Despite the drop since ${first} (${minFirst}→${minLast} min), cinema has stagnated around ${recentAvg} work-minutes for 20 years.`,
          };
    },
  },
];

export default function Insights() {
  const { lang } = useLang();
  const { salaryRef } = useSalaryRef();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const cards = useMemo(() => {
    return insightDefs
      .map((def) => {
        const product = products[def.productId];
        if (!product) return null;
        const mins = getMinutes(product, salaryRef);
        const years = getYearsForRef(product, salaryRef);
        if (years.length < 2) return null;
        const result = def.render(product, mins, years, lang);
        if (!result) return null;
        return { ...def, ...result, product };
      })
      .filter(Boolean) as Array<{
      emoji: string;
      productId: string;
      title: string;
      sub: string;
      product: Product;
    }>;
  }, [lang, salaryRef]);

  const handleCardClick = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <section className="py-12 md:py-16" data-testid="insights">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl font-bold mb-6">
          {lang === "fr" ? "Faits marquants" : "Key Insights"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((item) => (
            <Card
              key={item.productId}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleCardClick(item.product)}
              data-testid={`insight-${item.productId}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.sub}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ProductModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </section>
  );
}
