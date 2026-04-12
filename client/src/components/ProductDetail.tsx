import { useState, useEffect, useRef } from "react";
import { chartColor, chartColorAlpha } from "@/lib/chartColors";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { Line } from "react-chartjs-2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { YearRangeSlider } from "@/components/YearRangeSlider";
import { ArrowRight, Equal, Share2, Check, X, Camera } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useIsMobile, formatMinutes } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useSalaryRef } from "@/lib/salaryRef";
import {
  getMinutes,
  getYearsForRef,
  getDynamicFunFact,
  type Product,
} from "@/lib/data";
import { EURO_TO_FRANC } from "@/lib/constants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
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

interface ProductDetailProps {
  product: Product;
  initialYearA?: number;
  initialYearB?: number;
}

export default function ProductDetail({
  product,
  initialYearA,
  initialYearB,
}: ProductDetailProps) {
  const { lang, t } = useLang();
  const isMobile = useIsMobile();
  const { isDark } = useTheme();
  const { salaryRef } = useSalaryRef();
  const [showPrice, setShowPrice] = useState(() => {
    try {
      return localStorage.getItem("pref_showPrice") === "true";
    } catch {
      return false;
    }
  });
  const [showContext, setShowContext] = useState(() => {
    try {
      return localStorage.getItem("pref_showContext") === "true";
    } catch {
      return false;
    }
  });
  const [logScale, setLogScale] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [chartStart, setChartStart] = useState(0);
  const [chartEnd, setChartEnd] = useState(0);
  const chartRef = useRef<any>(null);

  // Persist toggle preferences globally
  useEffect(() => {
    try {
      localStorage.setItem("pref_showPrice", String(showPrice));
    } catch {}
  }, [showPrice]);
  useEffect(() => {
    try {
      localStorage.setItem("pref_showContext", String(showContext));
    } catch {}
  }, [showContext]);

  // Reset chart range when product or salary ref changes
  useEffect(() => {
    if (!product) return;
    const yrs = getYearsForRef(product, salaryRef);
    if (yrs.length === 0) return;
    const first = yrs[0];
    const last = yrs[yrs.length - 1];

    // URL params take highest priority
    if (initialYearA !== undefined || initialYearB !== undefined) {
      setChartStart(
        initialYearA !== undefined ? Math.max(initialYearA, first) : first,
      );
      setChartEnd(
        initialYearB !== undefined ? Math.min(initialYearB, last) : last,
      );
      return;
    }

    // Try to restore the global saved range and intersect with this product's span
    try {
      const saved = localStorage.getItem("pref_chart_range");
      if (saved) {
        const { start, end } = JSON.parse(saved) as {
          start: number;
          end: number;
        };
        const clampedStart = Math.max(start, first);
        const clampedEnd = Math.min(end, last);
        if (clampedStart <= clampedEnd) {
          setChartStart(clampedStart);
          setChartEnd(clampedEnd);
          return;
        }
      }
    } catch {}

    // Default: full range
    setChartStart(first);
    setChartEnd(last);
  }, [product?.id, salaryRef]);

  // Keyboard shortcuts: p = toggle price, c = toggle context
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector("[data-radix-popper-content-wrapper]")) return;
      if (e.key === "p") setShowPrice((v) => !v);
      if (e.key === "c" && (product.inflections?.length ?? 0) > 0)
        setShowContext((v) => !v);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [product.inflections?.length]);

  const minutes = getMinutes(product, salaryRef);
  const years = getYearsForRef(product, salaryRef);
  const name = lang === "fr" ? product.nameFr : product.nameEn;

  // Chart view: filtered to the selected range
  const visibleYears =
    chartStart === 0
      ? years
      : years.filter((y) => y >= chartStart && y <= chartEnd);

  // Comparison endpoints are the first and last visible year
  const yearA = visibleYears[0] ?? years[0];
  const yearB =
    visibleYears[visibleYears.length - 1] ?? years[years.length - 1];

  // Empty state when no data for current salary ref
  if (years.length === 0) {
    return (
      <>
        <div className="flex flex-col space-y-1.5 text-left">
          <h2 className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
            <span className="text-xl">{product.emoji}</span>
            {name}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground py-8 text-center">
          {t("noDataForRef")}
        </p>
      </>
    );
  }

  const funFact = getDynamicFunFact(
    product,
    salaryRef,
    lang,
    yearA || undefined,
    yearB || undefined,
  );

  // Recent trend: compare last year vs ~3 years prior
  const trendVal = (() => {
    if (years.length < 2) return "stable";
    const last = minutes[years[years.length - 1]];
    const prev = minutes[years[Math.max(0, years.length - 4)]];
    if (!prev) return "stable";
    const pct = ((last - prev) / prev) * 100;
    if (pct > 5) return "up";
    if (pct < -5) return "down";
    return "stable";
  })();
  const trendLabel =
    trendVal === "up"
      ? t("trendUp")
      : trendVal === "down"
        ? t("trendDown")
        : t("trendStable");
  const trendColor =
    trendVal === "up"
      ? "text-red-600 dark:text-red-400"
      : trendVal === "down"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-muted-foreground";

  // Chart Y label based on salary ref
  const yLabel =
    salaryRef === "median"
      ? t("chartYLabelMedian")
      : salaryRef === "mean"
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

  const axisColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";

  // Pre-1970 uncertainty shading (SMIG era, estimated rates ±10%)
  const pre1970EndIdx = visibleYears.findIndex((y) => y >= 1970);
  const annotations: Record<string, object> = {};
  if (pre1970EndIdx > 0) {
    annotations["pre1970"] = {
      type: "box" as const,
      xMin: 0,
      xMax: pre1970EndIdx - 1,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
      borderWidth: 0,
      label: {
        display: true,
        content:
          lang === "fr" ? "Données estimées (±10%)" : "Estimated data (±10%)",
        position: { x: "start" as const, y: "end" as const },
        color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)",
        font: { size: 8 },
        padding: { top: 2, bottom: 2, left: 3, right: 3 },
      },
    };
  }

  // Euro transition annotation (vertical line at 2002)
  const euroIdx = visibleYears.indexOf(2002);
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
  if (showContext && product.inflections) {
    product.inflections.forEach((inf, i) => {
      const idx = visibleYears.indexOf(inf.year);
      if (idx < 0) return;
      annotations[`inf${i}`] = {
        type: "line" as const,
        xMin: idx,
        xMax: idx,
        borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)",
        borderWidth: 1,
        borderDash: [4, 4],
        label: {
          display: true,
          content: lang === "fr" ? inf.labelFr : inf.labelEn,
          position: "start" as const,
          backgroundColor: isDark
            ? "rgba(30,30,30,0.85)"
            : "rgba(255,255,255,0.85)",
          color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
          font: { size: 8 },
          padding: { top: 2, bottom: 2, left: 4, right: 4 },
          rotation: -90,
          yAdjust: -10,
        },
      };
    });
  }

  // First/last visible point value labels
  if (visibleYears.length > 0) {
    const firstVal = minutes[visibleYears[0]];
    const lastVal = minutes[visibleYears[visibleYears.length - 1]];
    const labelBg = isDark ? "rgba(20,20,20,0.75)" : "rgba(255,255,255,0.75)";
    annotations["firstLabel"] = {
      type: "label" as const,
      xValue: 0,
      yValue: firstVal,
      yScaleID: "y",
      content: formatMinutes(firstVal, lang, 1),
      position: { x: "start" as const, y: "center" as const },
      xAdjust: 6,
      backgroundColor: labelBg,
      color: axisColor,
      font: { size: 9 },
      padding: { top: 2, bottom: 2, left: 4, right: 4 },
    };
    annotations["lastLabel"] = {
      type: "label" as const,
      xValue: visibleYears.length - 1,
      yValue: lastVal,
      yScaleID: "y",
      content: formatMinutes(lastVal, lang, 1),
      position: { x: "end" as const, y: "center" as const },
      xAdjust: -6,
      backgroundColor: labelBg,
      color: axisColor,
      font: { size: 9 },
      padding: { top: 2, bottom: 2, left: 4, right: 4 },
    };
  }

  // Confidence band datasets (±5% for ipc_estimate products), prepended so main line renders on top
  const confidenceBands: any[] = [];
  if (product.dataType === "ipc_estimate") {
    const bandAlpha = isDark ? "rgba(99,179,237,0.12)" : "rgba(66,153,225,0.1)";
    confidenceBands.push(
      {
        data: visibleYears.map((y) => +(minutes[y] * 1.05).toFixed(1)),
        borderWidth: 0,
        pointRadius: 0,
        fill: "+1",
        backgroundColor: bandAlpha,
        tension: 0.3,
        yAxisID: "y",
        label: "",
      },
      {
        data: visibleYears.map((y) => +(minutes[y] * 0.95).toFixed(1)),
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
      data: visibleYears.map((y) => minutes[y]),
      borderColor: chartColor(1),
      backgroundColor: chartColorAlpha(1, 0.08),
      fill: !logScale,
      tension: 0.3,
      pointRadius: 2,
      pointHoverRadius: 5,
      borderWidth: 2,
      yAxisID: "y",
    },
  ];

  // Always include price dataset (hidden when toggle off) so legend and y1 axis stay stable
  datasets.push({
    label: t("nominalPriceLabel"),
    data: visibleYears.map((y) => product.pricesInterp[y]),
    borderColor: isDark ? priceColors.dark : priceColors.light,
    backgroundColor: "transparent",
    borderDash: [5, 3],
    tension: 0.3,
    pointRadius: 0,
    pointHoverRadius: showPrice ? 4 : 0,
    borderWidth: showPrice ? 1.5 : 0,
    yAxisID: "y1",
    hidden: !showPrice,
  });

  const scales: any = {
    x: {
      ticks: {
        maxTicksLimit: isMobile ? 5 : 10,
        font: { size: 10 },
        color: axisColor,
      },
      grid: { display: false },
    },
    y: {
      type: (logScale ? "logarithmic" : "linear") as "logarithmic" | "linear",
      display: true,
      position: "left" as const,
      title: {
        display: true,
        text: yLabel,
        font: { size: 10 },
        color: axisColor,
      },
      ticks: { font: { size: 10 }, color: axisColor },
      grid: { color: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
    },
    // Always defined so the plot area width stays constant when toggling price
    y1: {
      type: "linear" as const,
      display: true,
      position: "right" as const,
      title: {
        display: true,
        text: t("nominalPriceLabel") + " (€)",
        font: { size: 10 },
        color: showPrice ? axisColor : "transparent",
      },
      ticks: {
        font: { size: 10 },
        color: showPrice ? axisColor : "transparent",
      },
      border: { display: false, color: "transparent" },
      grid: { display: false },
    },
  };

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
        display: true,
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "line",
          font: { size: 10 },
          color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
          padding: 12,
          filter: (item: any) =>
            item.text !== "" &&
            (showPrice || item.datasetIndex !== datasets.length - 1),
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
        footerColor: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
        footerFont: { size: 10, style: "italic" as const },
        footerMarginTop: 6,
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
              const year = visibleYears[ctx.dataIndex];
              const { value: formatted, currency } = formatPrice(value, year);
              return ` ${t("nominalPriceLabel")}: ${formatted} ${currency}`;
            }
            return ` ${ctx.dataset.label}: ${formatMinutes(value, lang, 1)}`;
          },
          footer: (items: any[]) => {
            if (!product.inflections?.length || !items.length) return [];
            const year = visibleYears[items[0].dataIndex];
            const inf = product.inflections.find((i) => i.year === year);
            if (!inf) return [];
            return [`→ ${lang === "fr" ? inf.labelFr : inf.labelEn}`];
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

  function buildShareUrl() {
    const from = Math.min(yearA, yearB);
    const to = Math.max(yearA, yearB);
    return `${window.location.origin}${window.location.pathname}#/product/${product!.id}?ref=${salaryRef}&from=${from}&to=${to}`;
  }

  function buildShareText() {
    const url = buildShareUrl();
    const suffix = lang === "fr" ? "(en France)" : "(in France)";
    return `${funFact} ${suffix}\n${url}`;
  }

  function handleShare() {
    const text = buildShareText();
    const from = Math.min(yearA, yearB);
    const to = Math.max(yearA, yearB);
    const hash = `#/product/${product!.id}?ref=${salaryRef}&from=${from}&to=${to}`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        window.history.replaceState(null, "", window.location.pathname + hash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setCopyFailed(true);
        setTimeout(() => setCopyFailed(false), 2000);
      });
  }

  function handleDownload() {
    if (!chartRef.current) return;
    const url = chartRef.current.toBase64Image("image/png", 1);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enminutes-${product!.id}-${salaryRef}.png`;
    a.click();
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col space-y-1.5 text-left">
        <h2 className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
          <span className="text-xl">{product.emoji}</span>
          {name}
        </h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{product.unit}</span>
          <span
            className={`text-[11px] font-medium ${trendColor}`}
            title={
              trendVal === "up"
                ? t("trendUpTooltip")
                : trendVal === "down"
                  ? t("trendDownTooltip")
                  : t("trendStableTooltip")
            }
          >
            {trendLabel}
          </span>
        </div>
      </div>

      {/* Price + context toggles + download */}
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-2">
          <Switch
            id="show-price"
            checked={showPrice}
            onCheckedChange={setShowPrice}
            data-testid="show-price-toggle"
          />
          <Label
            className="text-xs text-muted-foreground cursor-pointer"
            onClick={() => setShowPrice((v) => !v)}
          >
            {t("showNominalPrice")}
          </Label>
        </div>
        {product.inflections && product.inflections.length > 0 && (
          <div className="flex items-center gap-2">
            <Switch
              id="show-context"
              checked={showContext}
              onCheckedChange={setShowContext}
              data-testid="show-context-toggle"
            />
            <Label
              className="text-xs text-muted-foreground cursor-pointer"
              onClick={() => setShowContext((v) => !v)}
            >
              {t("ppShowContext")}
            </Label>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Switch
            id="log-scale"
            checked={logScale}
            onCheckedChange={setLogScale}
          />
          <Label
            className="text-xs text-muted-foreground cursor-pointer"
            onClick={() => setLogScale((v) => !v)}
          >
            {t("logScaleLabel")}
          </Label>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          title={t("downloadChart")}
          aria-label={t("downloadChart")}
          className="ml-auto h-6 w-6"
        >
          <Camera className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div
        className="h-[250px] mt-1"
        role="img"
        aria-label={`${name} - ${yLabel}`}
      >
        <Line
          key={logScale ? "log" : "linear"}
          ref={chartRef}
          data={{ labels: visibleYears, datasets }}
          options={chartOptions as any}
          plugins={[crosshairPlugin]}
        />
      </div>

      {/* Year range slider */}
      {years.length > 1 && (
        <div className="mt-2">
          <YearRangeSlider
            min={years[0]}
            max={years[years.length - 1]}
            value={[
              chartStart || years[0],
              chartEnd || years[years.length - 1],
            ]}
            onValueChange={([s, e]) => {
              setChartStart(s);
              setChartEnd(e);
              try {
                localStorage.setItem(
                  "pref_chart_range",
                  JSON.stringify({ start: s, end: e }),
                );
                window.dispatchEvent(
                  new CustomEvent("chartRangeChanged", {
                    detail: { start: s, end: e },
                  }),
                );
              } catch {}
            }}
          />
        </div>
      )}

      {/* Comparison: endpoints of the visible range */}
      <div className="mt-3" data-testid="year-comparison">
        <div
          className={`grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-1 ${isSameYear ? "opacity-50" : ""}`}
        >
          {/* Row 1: Year labels */}
          <div className="flex justify-center">
            <span className="text-xs text-muted-foreground tabular-nums">
              {yearA}
            </span>
          </div>
          <div />
          <div className="flex justify-center">
            <span className="text-xs text-muted-foreground tabular-nums">
              {yearB}
            </span>
          </div>

          {/* Row 2: Minutes values + arrow */}
          <div className="flex justify-center items-center">
            <div className="text-lg font-bold tabular-nums">
              {formatMinutes(minA, lang, 1)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                min
              </span>
            </div>
          </div>
          <div className="flex justify-center items-center">
            {isSameYear || isSameValue ? (
              <Equal className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex justify-center items-center">
            <div className="text-lg font-bold tabular-nums">
              {formatMinutes(minB, lang, 1)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                min
              </span>
            </div>
          </div>

          {/* Row 3: Prices */}
          <div
            className="flex justify-center text-xs tabular-nums"
            style={{
              color: showPrice
                ? isDark
                  ? priceColors.dark
                  : priceColors.light
                : "transparent",
            }}
          >
            {formattedA.value} {formattedA.currency}
          </div>
          <div />
          <div
            className="flex justify-center text-xs tabular-nums"
            style={{
              color: showPrice
                ? isDark
                  ? priceColors.dark
                  : priceColors.light
                : "transparent",
            }}
          >
            {formattedB.value} {formattedB.currency}
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

      <Card className="bg-muted/50 mt-3">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t("didYouKnow")}
              </p>
              <p className="text-sm">{funFact}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              title={t("shareProduct")}
              aria-label={
                copied
                  ? t("copied")
                  : copyFailed
                    ? t("copyFailed")
                    : t("shareProduct")
              }
              className="shrink-0 -mt-3 -mr-5"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : copyFailed ? (
                <X className="w-4 h-4 text-red-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-2 space-y-1">
        {(product.disclaimerFr || product.disclaimerEn) && (
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70 italic">
            ⚠ {lang === "fr" ? product.disclaimerFr : product.disclaimerEn}
          </p>
        )}
        {salaryRef === "median" && (
          <p className="text-[11px] text-muted-foreground/60 italic">
            ℹ {t("medianAvailableFrom")}
          </p>
        )}
        {salaryRef === "mean" && (
          <p className="text-[11px] text-muted-foreground/60 italic">
            ℹ {t("meanStopsAt")}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground/60 text-right">
          {product.dataType === "actual"
            ? t("dataTypeActual")
            : product.dataType === "ipc_estimate"
              ? t("dataTypeIpcEstimate")
              : t("dataTypeManual")}
          {product.source && (
            <span className="ml-2 text-muted-foreground/40">
              · {product.source}
            </span>
          )}
        </p>
      </div>
    </>
  );
}
