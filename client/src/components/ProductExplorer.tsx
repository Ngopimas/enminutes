import { useState, useMemo, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useSalaryRef } from "@/lib/salaryRef";
import { normalizeSearch, useIsMobile, formatMinutes } from "@/lib/utils";
import {
  products,
  categories,
  getMinutes,
  getYearsForRef,
  type Product,
} from "@/lib/data";
import ProductModal from "./ProductModal";

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const padding = 2;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (w - 2 * padding);
      const y = h - padding - ((v - min) / range) * (h - 2 * padding);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="inline-block" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary/60"
      />
    </svg>
  );
}

export default function ProductExplorer({
  initialProductId,
}: {
  initialProductId?: string;
}) {
  const { lang, t } = useLang();
  const { salaryRef } = useSalaryRef();
  const isMobile = useIsMobile();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [trend, setTrend] = useState<"all" | "up" | "down" | "stable">("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const productList = useMemo(() => Object.values(products), []);

  function getTrend(product: Product) {
    const mins = getMinutes(product, salaryRef);
    const years = getYearsForRef(product, salaryRef);
    if (years.length < 2) return "stable";
    const last = mins[years[years.length - 1]];
    const prev = mins[years[Math.max(0, years.length - 4)]];
    if (!prev) return "stable";
    const pctChange = ((last - prev) / prev) * 100;
    if (pctChange > 5) return "up";
    if (pctChange < -5) return "down";
    return "stable";
  }

  const filtered = useMemo(() => {
    let list = productList;
    if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }
    if (search.trim()) {
      const q = normalizeSearch(search.trim());
      list = list.filter(
        (p) =>
          normalizeSearch(p.nameFr).includes(q) ||
          normalizeSearch(p.nameEn).includes(q),
      );
    }
    if (trend !== "all") {
      list = list.filter((p) => getTrend(p) === trend);
    }
    // Filter out products with no data for this salary ref
    list = list.filter((p) => getYearsForRef(p, salaryRef).length > 0);
    return list;
  }, [category, search, trend, productList, salaryRef]);

  // Open modal when navigating directly to /#/product/:id
  useEffect(() => {
    if (initialProductId && products[initialProductId]) {
      setSelectedProduct(products[initialProductId]);
      setModalOpen(true);
    }
  }, [initialProductId]);

  const handleCardClick = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <section className="py-12 md:py-16" data-testid="product-explorer">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl font-bold mb-1">{t("productExplorer")}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {t("productExplorerSub")}
        </p>

        {/* Row 1: search + trend filter */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchProduct")}
              className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              data-testid="product-search"
            />
          </div>
          <div
            className="flex items-center gap-1 shrink-0"
            data-testid="trend-filter"
          >
            {(["all", "up", "down", "stable"] as const).map((t_) => (
              <button
                key={t_}
                onClick={() => setTrend(t_)}
                title={
                  t_ === "up"
                    ? t("trendUpTooltip")
                    : t_ === "down"
                      ? t("trendDownTooltip")
                      : t_ === "stable"
                        ? t("trendStableTooltip")
                        : t("trendAllTooltip")
                }
                className={`h-8 px-2.5 rounded-md border text-xs transition-colors ${
                  trend === t_
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {t_ === "all"
                  ? t("allCategories")
                  : t_ === "up"
                    ? "↗"
                    : t_ === "down"
                      ? "↘"
                      : "→"}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: category filter — Select on mobile, Tabs on larger screens */}
        <div className="mb-6">
          {isMobile ? (
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                className="h-8 text-xs w-48"
                data-testid="category-tabs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  {t("allCategories")}
                </SelectItem>
                {Object.entries(categories).map(([key, cat]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {cat.emoji} {lang === "fr" ? cat.nameFr : cat.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Tabs value={category} onValueChange={setCategory}>
              <TabsList
                className="flex flex-wrap h-auto gap-1"
                data-testid="category-tabs"
              >
                <TabsTrigger value="all" className="text-xs">
                  {t("allCategories")}
                </TabsTrigger>
                {Object.entries(categories).map(([key, cat]) => (
                  <TabsTrigger key={key} value={key} className="text-xs">
                    {cat.emoji} {lang === "fr" ? cat.nameFr : cat.nameEn}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>

        {filtered.length === 0 ? (
          <p
            className="text-sm text-muted-foreground text-center py-8"
            data-testid="no-product-found"
          >
            {t("noProductFound")}
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((product) => {
              const mins = getMinutes(product, salaryRef);
              const years = getYearsForRef(product, salaryRef);
              if (years.length === 0) return null;
              const lastYear = years[years.length - 1];
              const lastMin = mins[lastYear];
              const trendVal = getTrend(product);
              const trendLabel =
                trendVal === "up"
                  ? t("trendUp")
                  : trendVal === "down"
                    ? t("trendDown")
                    : t("trendStable");
              const sparkData = years.map((y) => mins[y]);

              return (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleCardClick(product)}
                  data-testid={`product-card-${product.id}`}
                  title={
                    trendVal === "up"
                      ? t("trendUpTooltip")
                      : trendVal === "down"
                        ? t("trendDownTooltip")
                        : t("trendStableTooltip")
                  }
                >
                  <CardContent className="pt-4 pb-4 px-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{product.emoji}</span>
                        <span className="text-xs font-medium leading-tight">
                          {lang === "fr" ? product.nameFr : product.nameEn}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-lg font-bold tabular-nums">
                          {formatMinutes(lastMin, lang)}
                          <span className="text-xs font-normal text-muted-foreground ml-0.5">
                            {t("minutesAbbr")}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {trendLabel}
                        </div>
                      </div>
                      <Sparkline data={sparkData} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ProductModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </section>
  );
}
