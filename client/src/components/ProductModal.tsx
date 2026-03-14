import { useState, useEffect } from "react";
import { chartColor, chartColorAlpha } from "@/lib/chartColors";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { Line } from "react-chartjs-2";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Equal, Share2, Check } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useIsMobile, formatMinutes } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useSalaryRef } from "@/lib/salaryRef";
import { useLocation } from "wouter";
import { getMinutes, getYearsForRef, getDynamicFunFact, type Product } from "@/lib/data";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin,
);

// Crosshair plugin - draws a vertical line at the hovered x position
const crosshairPlugin = {
  id: "crosshair",
  afterDraw(chart: any) {
    const tooltip = chart.tooltip;
    if (!tooltip || !tooltip.getActiveElements().length) return;
    const ctx = chart.ctx;
    const x = tooltip.caretX;
    const topY = chart.scales.y.top;
    const bottomY = chart.scales.y.bottom;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, bottomY);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(128,128,128,0.3)";
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  },
};

// Euro-to-franc conversion factor (1 euro = 6.55957 FRF)
const EURO_TO_FRANC = 6.55957;

// Convert euro price to old francs for pre-1960, new francs for 1960-2001, euros for 2002+
function formatPrice(
  euroPrice: number,
  year: number,
): { value: string; currency: string } {
  if (year >= 2002) {
    return { value: euroPrice.toFixed(2), currency: "€" };
  }
  const francPrice = euroPrice * EURO_TO_FRANC;
  if (year < 1960) {
    const oldFranc = francPrice * 100;
    if (oldFranc >= 10)
      return { value: Math.round(oldFranc).toString(), currency: "AF" };
    return { value: oldFranc.toFixed(1), currency: "AF" };
  }
  if (francPrice >= 10) return { value: francPrice.toFixed(1), currency: "F" };
  return { value: francPrice.toFixed(2), currency: "F" };
}

// Price line colors
const priceColors = {
  light: "hsl(160, 50%, 40%)",
  dark: "hsl(160, 50%, 60%)",
};

interface ProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductModal({
  product,
  open,
  onOpenChange,
}: ProductModalProps) {
  const { lang, t } = useLang();
  const isMobile = useIsMobile();
  const { isDark } = useTheme();
  const { salaryRef } = useSalaryRef();
  const [, navigate] = useLocation();
  const [showPrice, setShowPrice] = useState(false);
  const [copied, setCopied] = useState(false);
  const [yearA, setYearA] = useState<number>(0);
  const [yearB, setYearB] = useState<number>(0);

  // Reset selected years when product or salary ref changes
  useEffect(() => {
    if (product) {
      const yrs = getYearsForRef(product, salaryRef);
      if (yrs.length > 0) {
        setYearA(yrs[0]);
        setYearB(yrs[yrs.length - 1]);
      }
    }
  }, [product?.id, salaryRef]);

  if (!product) return null;

  const minutes = getMinutes(product, salaryRef);
  const years = getYearsForRef(product, salaryRef);

  if (years.length === 0) return null;

  const name = lang === "fr" ? product.nameFr : product.nameEn;
  const funFact = getDynamicFunFact(product, salaryRef, lang);

  // Chart Y label based on salary ref
  const yLabel = salaryRef === 'median'
    ? t("chartYLabelMedian")
    : salaryRef === 'mean'
      ? t("chartYLabelMean")
      : t("chartYLabel");

  // Comparison values
  const minA = minutes[yearA] ?? 0;
  const minB = minutes[yearB] ?? 0;
  const priceA = product.pricesInterp[yearA] ?? 0;
  const priceB = product.pricesInterp[yearB] ?? 0;
  const formattedA = formatPrice(priceA, yearA);
  const formattedB = formatPrice(priceB, yearB);

  // Same year or same value detection
  const isSameYear = yearA === yearB;
  const isSameValue = !isSameYear && Math.abs(minA - minB) < 0.05;

  // Ratio computation
  const diff = minA - minB;
  const gotCheaper = minB < minA;
  const ratioRaw = gotCheaper ? minA / minB : minB / minA;

  // Generate decade-based year options for the selects (every 5 years + first/last)
  const yearOptions = years.filter((y, i) => {
    if (i === 0 || i === years.length - 1) return true;
    return y % 5 === 0;
  });

  // Euro transition annotation (vertical line at 2002)
  const euroIdx = years.indexOf(2002);
  const annotations: Record<string, object> = {};
  if (showPrice && euroIdx >= 0) {
    annotations["euroLine"] = {
      type: "line" as const,
      xMin: euroIdx,
      xMax: euroIdx,
      yScaleID: "y1",
      borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
      borderWidth: 1,
      borderDash: [4, 4],
      label: {
        display: true,
        content: "€",
        position: "end" as const,
        backgroundColor: isDark
          ? "rgba(30,30,30,0.85)"
          : "rgba(255,255,255,0.85)",
        color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
        font: { size: 9, weight: "bold" as const },
        padding: { top: 2, bottom: 2, left: 4, right: 4 },
      },
    };
  }

  // Inflection point annotations
  if (product.inflections) {
    product.inflections.forEach((inf, i) => {
      const idx = years.indexOf(inf.year);
      if (idx < 0) return;
      annotations[`inf${i}`] = {
        type: "line" as const,
        xMin: idx,
        xMax: idx,
        borderColor: isDark ? "rgba(250,200,80,0.4)" : "rgba(180,120,0,0.35)",
        borderWidth: 1,
        borderDash: [3, 3],
        label: {
          display: true,
          content: lang === "fr" ? inf.labelFr : inf.labelEn,
          position: "start" as const,
          backgroundColor: isDark ? "rgba(40,35,10,0.85)" : "rgba(255,248,220,0.9)",
          color: isDark ? "rgba(250,200,80,0.9)" : "rgba(140,90,0,0.9)",
          font: { size: 8 },
          padding: { top: 2, bottom: 2, left: 3, right: 3 },
          rotation: -90,
          yAdjust: -10,
        },
      };
    });
  }

  // Confidence band datasets (±5% for ipc_estimate products), prepended so main line renders on top
  const confidenceBands: any[] = [];
  if (product.dataType === "ipc_estimate") {
    const bandAlpha = isDark ? "rgba(99,179,237,0.12)" : "rgba(66,153,225,0.1)";
    confidenceBands.push(
      {
        data: years.map((y) => +(minutes[y] * 1.05).toFixed(1)),
        borderWidth: 0,
        pointRadius: 0,
        fill: "+1",
        backgroundColor: bandAlpha,
        tension: 0.3,
        yAxisID: "y",
        label: "",
      },
      {
        data: years.map((y) => +(minutes[y] * 0.95).toFixed(1)),
        borderWidth: 0,
        pointRadius: 0,
        fill: false,
        backgroundColor: "transparent",
        tension: 0.3,
        yAxisID: "y",
        label: "",
      },
    );
  }

  const datasets: any[] = [
    ...confidenceBands,
    {
      label: `${name} (${t("minutesAbbr")})`,
      data: years.map((y) => minutes[y]),
      borderColor: chartColor(1),
      backgroundColor: chartColorAlpha(1, 0.08),
      fill: true,
      tension: 0.3,
      pointRadius: 2,
      pointHoverRadius: 5,
      borderWidth: 2,
      yAxisID: "y",
    },
  ];

  if (showPrice) {
    datasets.push({
      label: t("nominalPriceLabel"),
      data: years.map((y) => product.pricesInterp[y]),
      borderColor: isDark ? priceColors.dark : priceColors.light,
      backgroundColor: "transparent",
      borderDash: [5, 3],
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 1.5,
      yAxisID: "y1",
    });
  }

  const scales: any = {
    x: {
      ticks: {
        maxTicksLimit: isMobile ? 5 : 10,
        font: { size: 10 },
        color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
      },
      grid: { display: false },
    },
    y: {
      type: "linear" as const,
      display: true,
      position: "left" as const,
      title: {
        display: true,
        text: yLabel,
        font: { size: 10 },
        color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
      },
      ticks: {
        font: { size: 10 },
        color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
      },
      grid: {
        color: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      },
    },
  };

  if (showPrice) {
    scales.y1 = {
      type: "linear" as const,
      display: true,
      position: "right" as const,
      title: {
        display: true,
        text: t("nominalPriceLabel") + " (€)",
        font: { size: 10 },
        color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
      },
      ticks: {
        font: { size: 10 },
        color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
      },
      grid: { display: false },
    };
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales,
    plugins: {
      legend: {
        display: showPrice,
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "line",
          font: { size: 10 },
          color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: isDark
          ? "rgba(30,30,30,0.95)"
          : "rgba(255,255,255,0.95)",
        titleColor: isDark ? "#fff" : "#000",
        bodyColor: isDark ? "#ccc" : "#333",
        borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
        borderWidth: 2,
        padding: 10,
        titleFont: { size: 11, weight: "bold" as const },
        bodyFont: { size: 11 },
        boxWidth: 8,
        boxHeight: 8,
        filter: (item: any) => item.dataset.label !== "",
        callbacks: {
          labelColor: (ctx: any) => ({
            borderColor: ctx.dataset.borderColor,
            backgroundColor: ctx.dataset.borderColor,
            borderRadius: 0,
          }),
          label: (ctx: any) => {
            const value = ctx.parsed.y;
            if (value == null) return "";
            if (showPrice && ctx.dataset.yAxisID === "y1") {
              const year = years[ctx.dataIndex];
              const { value: formatted, currency } = formatPrice(value, year);
              return ` ${t("nominalPriceLabel")}: ${formatted} ${currency}`;
            }
            return ` ${ctx.dataset.label}: ${formatMinutes(value, lang, 1)}`;
          },
        },
      },
      annotation: {
        annotations,
      },
    },
  };

  // Build the verdict line - a clear natural sentence
  const getVerdict = () => {
    if (isSameYear) return t("identicalYears");
    if (isSameValue) return t("identicalValue");

    const absDiff = formatMinutes(Math.abs(diff), lang, 1);
    const ratioStr =
      ratioRaw >= 10 ? Math.round(ratioRaw).toString() : ratioRaw.toFixed(1);

    // Determine direction based on chronological order
    const chronoFirst = yearA < yearB ? yearA : yearB;
    const chronoLast = yearA < yearB ? yearB : yearA;
    const minFirst = minutes[chronoFirst] ?? 0;
    const minLast = minutes[chronoLast] ?? 0;
    const cheaper = minLast < minFirst;

    if (cheaper) {
      return `${ratioStr}× ${t("fasterToBuy")} · −${absDiff} min`;
    }
    return `${ratioStr}× ${t("slowerToBuy")} · +${absDiff} min`;
  };

  const getVerdictColor = () => {
    if (isSameYear || isSameValue) return "text-muted-foreground";
    const chronoFirst = yearA < yearB ? yearA : yearB;
    const chronoLast = yearA < yearB ? yearB : yearA;
    const minFirst = minutes[chronoFirst] ?? 0;
    const minLast = minutes[chronoLast] ?? 0;
    return minLast < minFirst
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";
  };

  function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}#/product/${product!.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    navigate(`/product/${product!.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenChange(v: boolean) {
    if (!v) navigate("/");
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg" data-testid="product-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="text-xl">{product.emoji}</span>
            {name}
            <button
              onClick={handleShare}
              title={t("shareProduct")}
              className="ml-auto p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>
          </DialogTitle>
          <DialogDescription>{product.unit}</DialogDescription>
        </DialogHeader>

        {/* Price toggle */}
        <div className="flex items-center gap-2 -mt-1">
          <Switch
            id="show-price"
            checked={showPrice}
            onCheckedChange={setShowPrice}
            data-testid="show-price-toggle"
          />
          <Label
            htmlFor="show-price"
            className="text-xs text-muted-foreground cursor-pointer"
          >
            {t("showNominalPrice")}
          </Label>
        </div>

        <div className="h-[250px] mt-1">
          <Line
            data={{ labels: years, datasets }}
            options={chartOptions as any}
            plugins={[crosshairPlugin]}
          />
        </div>

        <Card className="bg-muted/50 mt-3">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {t("didYouKnow")}
            </p>
            <p className="text-sm">{funFact}</p>
          </CardContent>
        </Card>

        <div className="mt-2 space-y-1">
          {salaryRef === 'median' && (
            <p className="text-[11px] text-muted-foreground/60 italic">
              ℹ {t('medianAvailableFrom')}
            </p>
          )}
          {salaryRef === 'mean' && (
            <p className="text-[11px] text-muted-foreground/60 italic">
              ℹ {t('meanStopsAt')}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground/60 text-right">
            {product.dataType === 'actual'
              ? t('dataTypeActual')
              : product.dataType === 'ipc_estimate'
              ? t('dataTypeIpcEstimate')
              : t('dataTypeManual')}
            {product.source && (
              <span className="ml-2 text-muted-foreground/40">· {product.source}</span>
            )}
          </p>
        </div>

        {/* Interactive year comparison */}
        <div className="mt-3" data-testid="year-comparison">
          {/* Unified grid: dropdown on top, value below */}
          <div
            className={`grid grid-cols-[1fr_auto_1fr] items-end gap-x-3 ${isSameYear ? "opacity-50" : ""}`}
          >
            {/* Left column: Year A */}
            <div className="flex flex-col items-center gap-1.5">
              <Select
                value={String(yearA)}
                onValueChange={(v) => setYearA(Number(v))}
              >
                <SelectTrigger
                  className="w-[90px] h-8 text-sm"
                  data-testid="year-select-a"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-lg font-bold tabular-nums">
                {formatMinutes(minA, lang, 1)}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  min
                </span>
              </div>
              {showPrice && (
                <div
                  className="text-xs tabular-nums -mt-1"
                  style={{
                    color: isDark ? priceColors.dark : priceColors.light,
                  }}
                >
                  {formattedA.value} {formattedA.currency}
                </div>
              )}
            </div>

            {/* Center: arrow */}
            <div className="flex justify-center pb-1">
              {isSameYear || isSameValue ? (
                <Equal className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {/* Right column: Year B */}
            <div className="flex flex-col items-center gap-1.5">
              <Select
                value={String(yearB)}
                onValueChange={(v) => setYearB(Number(v))}
              >
                <SelectTrigger
                  className="w-[90px] h-8 text-sm"
                  data-testid="year-select-b"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-lg font-bold tabular-nums">
                {formatMinutes(minB, lang, 1)}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  min
                </span>
              </div>
              {showPrice && (
                <div
                  className="text-xs tabular-nums -mt-1"
                  style={{
                    color: isDark ? priceColors.dark : priceColors.light,
                  }}
                >
                  {formattedB.value} {formattedB.currency}
                </div>
              )}
            </div>
          </div>

          {/* Verdict */}
          <p
            className={`text-xs font-medium text-center mt-3 ${getVerdictColor()}`}
            data-testid="comparison-verdict"
          >
            {getVerdict()}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
