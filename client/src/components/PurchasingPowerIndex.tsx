import { useState, useMemo, useEffect, useRef } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Camera } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useSalaryRef } from "@/lib/salaryRef";
import {
  purchasingPower,
  ppAnnotations,
  computePurchasingPowerForRef,
  productivityIndex,
  DATA_END_YEAR,
} from "@/lib/data";
import { useIsMobile } from "@/lib/utils";
import { chartColor, chartColorAlpha } from "@/lib/chartColors";
import { YearRangeSlider } from "@/components/YearRangeSlider";

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

// French presidents since 1958 (Fifth Republic) - covers the chart range 1960–2026
const frenchPresidents = [
  { name: "de Gaulle", start: 1959, end: 1969 },
  { name: "Pompidou", start: 1969, end: 1974 },
  { name: "Giscard", start: 1974, end: 1981 },
  { name: "Mitterrand", start: 1981, end: 1995 },
  { name: "Chirac", start: 1995, end: 2007 },
  { name: "Sarkozy", start: 2007, end: 2012 },
  { name: "Hollande", start: 2012, end: 2017 },
  { name: "Macron", start: 2017, end: 2027 },
];

// Alternating subtle background colors for president bands
const presidentColors = {
  light: ["rgba(30,58,95,0.04)", "rgba(30,58,95,0.08)"],
  dark: ["rgba(120,160,220,0.04)", "rgba(120,160,220,0.08)"],
};

export default function PurchasingPowerIndex() {
  const { lang, t } = useLang();
  const { isDark } = useTheme();
  const { salaryRef } = useSalaryRef();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [reverseMinutes, setReverseMinutes] = useState(true);
  const [showPresidents, setShowPresidents] = useState(true);
  const [showContext, setShowContext] = useState(false);
  const [showInflation, setShowInflation] = useState(false);
  const [showProductivity, setShowProductivity] = useState(false);
  const [yearStart, setYearStart] = useState(1960);
  const [yearEnd, setYearEnd] = useState(DATA_END_YEAR);
  const chartRef = useRef<any>(null);

  function handleDownload() {
    if (!chartRef.current) return;
    const url = chartRef.current.toBase64Image("image/png", 1);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enminutes-pouvoir-achat-${salaryRef}.png`;
    a.click();
  }

  // Compute PP data based on salary ref
  const ppData = useMemo(() => {
    if (salaryRef === "smic") {
      return {
        indexYears: purchasingPower.indexYears,
        indexBaseYear: purchasingPower.indexBaseYear,
        purchasingPowerIndex: purchasingPower.purchasingPowerIndex,
        basketMinutesByYear: purchasingPower.basketMinutesByYear,
        multiplier: purchasingPower.multiplier,
        inflationRates: purchasingPower.inflationRates,
      };
    }
    const computed = computePurchasingPowerForRef(salaryRef);
    return {
      ...computed,
      inflationRates: purchasingPower.inflationRates,
    };
  }, [salaryRef]);

  const {
    indexYears,
    indexBaseYear: ppBaseYear,
    purchasingPowerIndex: ppIndex,
    basketMinutesByYear,
    multiplier,
    inflationRates,
  } = ppData;

  // Rebase productivity index to match PPI base year
  const productivityData = useMemo(() => {
    const baseVal = productivityIndex[ppBaseYear];
    if (!baseVal) return {};
    const rebased: Record<number, number> = {};
    for (const [y, v] of Object.entries(productivityIndex)) {
      rebased[Number(y)] = +((v / baseVal) * 100).toFixed(1);
    }
    return rebased;
  }, [ppBaseYear]);

  const labels = indexYears.filter((y) => ppIndex[y] !== undefined);

  // Clamp the user's stored filter to the data available for the current ref,
  // without mutating state. This way switching refs never loses the user's intent.
  const effectiveStart = Math.max(yearStart, labels[0] ?? yearStart);
  const effectiveEnd = Math.min(yearEnd, labels[labels.length - 1] ?? yearEnd);

  // Filtered labels drive both the chart and the KPI cards
  const filteredLabels = labels.filter(
    (y) => y >= effectiveStart && y <= effectiveEnd,
  );

  // KPI values derived from the visible range
  const kpiStartYear = filteredLabels[0] ?? ppBaseYear;
  const kpiEndYear =
    filteredLabels[filteredLabels.length - 1] ?? labels[labels.length - 1];
  const basket1960 = basketMinutesByYear[kpiStartYear];
  const basketNow = basketMinutesByYear[kpiEndYear];
  const kpiMult =
    ppIndex[kpiStartYear] && ppIndex[kpiEndYear]
      ? (ppIndex[kpiEndYear] / ppIndex[kpiStartYear]).toFixed(1)
      : "?";
  const ppRebaseVal = ppIndex[kpiStartYear];
  const indexData = filteredLabels.map((y) =>
    ppRebaseVal ? +((ppIndex[y] / ppRebaseVal) * 100).toFixed(1) : ppIndex[y],
  );
  const minutesData = filteredLabels.map((y) => basketMinutesByYear[y]);
  const inflationData = filteredLabels.map((y) => inflationRates[y] ?? null);
  const prodRebaseVal = productivityData[kpiStartYear];
  const prodData = filteredLabels.map((y) => {
    const v = productivityData[y] ?? null;
    return v !== null && prodRebaseVal
      ? +((v / prodRebaseVal) * 100).toFixed(1)
      : null;
  });

  // Title and subtitle based on salary ref
  const title =
    salaryRef === "median"
      ? t("ppIndexTitleMedian")
      : salaryRef === "mean"
        ? t("ppIndexTitleMean")
        : t("ppIndexTitle");

  const subtitle = (
    salaryRef === "median"
      ? t("ppIndexSubMedian")
      : salaryRef === "mean"
        ? t("ppIndexSubMean")
        : t("ppIndexSub")
  ).replace(/= \d{4}/, `= ${kpiStartYear}`);

  // Chart Y labels
  const yLabel2 =
    salaryRef === "median"
      ? t("chartYLabelMedian").replace("Minutes", "Min.") +
        " (" +
        t("ppLegendMinutes").split("(")[1]
      : salaryRef === "mean"
        ? t("chartYLabelMean").replace("Minutes", "Min.") +
          " (" +
          t("ppLegendMinutes").split("(")[1]
        : t("ppChartYLabel2");

  // Build annotations
  const annotations: Record<string, object> = {};

  // President bands
  if (showPresidents) {
    frenchPresidents.forEach((pres, i) => {
      const start = Math.max(pres.start, filteredLabels[0]);
      const end = Math.min(pres.end, filteredLabels[filteredLabels.length - 1]);
      if (start >= end) return;

      const startIdx =
        filteredLabels.indexOf(start) >= 0 ? filteredLabels.indexOf(start) : 0;
      const endIdx =
        filteredLabels.indexOf(end) >= 0
          ? filteredLabels.indexOf(end)
          : filteredLabels.length - 1;

      const colors = isDark ? presidentColors.dark : presidentColors.light;
      annotations[`pres${i}`] = {
        type: "box" as const,
        xMin: startIdx,
        xMax: endIdx,
        backgroundColor: colors[i % 2],
        borderWidth: 0,
        label: {
          display: true,
          content: pres.name,
          position: { x: "center", y: "start" } as const,
          font: { size: 9, weight: "normal" as const },
          color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)",
          padding: 4,
        },
      };
    });
  }

  // Context vertical lines (Grenelle, Mitterrand, euro, 35h, post-COVID)
  if (showContext)
    ppAnnotations.forEach((ann, i) => {
      const idx = filteredLabels.indexOf(ann.year);
      if (idx < 0) return;
      const label = lang === "fr" ? ann.labelFr : ann.labelEn;
      annotations[`ctx${i}`] = {
        type: "line" as const,
        xMin: idx,
        xMax: idx,
        borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)",
        borderWidth: 1,
        borderDash: [4, 4],
        label: {
          display: true,
          content: label,
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

  const datasets: any[] = [
    {
      label: t("ppLegendIndex"),
      data: indexData,
      borderColor: chartColor(2),
      backgroundColor: "transparent",
      borderDash: [6, 3],
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 4,
      yAxisID: "y",
      borderWidth: 2,
    },
    {
      label: t("ppLegendMinutes"),
      data: minutesData,
      borderColor: chartColor(1),
      backgroundColor: chartColorAlpha(2, 0.08),
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 4,
      yAxisID: "y1",
      borderWidth: 2.5,
    },
  ];

  // Conditionally add inflation dataset
  if (showInflation) {
    datasets.push({
      label: t("ppLegendInflation"),
      data: inflationData,
      borderColor: chartColor(5),
      backgroundColor: chartColorAlpha(5, 0.06),
      fill: true,
      borderDash: [2, 2],
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 3,
      yAxisID: "y2",
      borderWidth: 1.5,
    });
  }

  // Conditionally add productivity dataset
  if (showProductivity) {
    datasets.push({
      label: t("ppLegendProductivity"),
      data: prodData,
      borderColor: chartColor(4),
      backgroundColor: "transparent",
      borderDash: [8, 4],
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 3,
      yAxisID: "y", // shares left axis with PP index (same base 100 scale)
      borderWidth: 1.8,
    });
  }

  const chartData = { labels: filteredLabels, datasets };

  const scales: any = {
    x: {
      ticks: {
        maxTicksLimit: isMobile ? 5 : 12,
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
        text: t("ppChartYLabel").replace("1960", String(kpiStartYear)),
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
    y1: {
      type: "linear" as const,
      display: true,
      position: "right" as const,
      title: {
        display: true,
        text: yLabel2,
        font: { size: 10 },
        color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
      },
      ticks: {
        font: { size: 10 },
        color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
      },
      grid: { display: false },
      reverse: reverseMinutes,
    },
  };

  // Add inflation Y axis only when visible
  if (showInflation) {
    scales.y2 = {
      type: "linear" as const,
      display: false, // hidden axis - inflation uses its own scale but no visible axis
      position: "right" as const,
      min: -2,
      max: 18,
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
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "line",
          font: { size: 11 },
          color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
          padding: 16,
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
        callbacks: {
          labelColor: (ctx: any) => ({
            borderColor: ctx.dataset.borderColor,
            backgroundColor: ctx.dataset.borderColor,
            borderRadius: 0, // square symbols (brutalist style)
          }),
          label: (ctx: any) => {
            const label = ctx.dataset.label || "";
            const value = ctx.parsed.y;
            if (value == null) return "";
            // Identify dataset by yAxisID for correct formatting
            if (ctx.dataset.yAxisID === "y2") {
              return ` ${label}: ${value.toFixed(1)}%`;
            }
            return ` ${label}: ${value.toFixed(1)}`;
          },
          footer: (items: any[]) => {
            if (!items.length) return [];
            const year = filteredLabels[items[0].dataIndex];
            const ann = ppAnnotations.find((a) => a.year === year);
            if (!ann) return [];
            return [`→ ${lang === "fr" ? ann.labelFr : ann.labelEn}`];
          },
        },
      },
      annotation: {
        annotations,
      },
    },
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-20" data-testid="pp-index">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl font-bold mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground mb-8">{subtitle}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card data-testid="kpi-multiplier">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold tabular-nums bg-gradient-to-br from-yellow-300 to-amber-600 bg-clip-text text-transparent">
                {kpiMult}&times;
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("ppKpiRangeLabel")
                  .replace("{start}", String(kpiStartYear))
                  .replace("{end}", String(kpiEndYear))}
              </p>
            </CardContent>
          </Card>
          <Card data-testid="kpi-basket-1960">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold tabular-nums">
                {basket1960 ? Math.round(basket1960) : "–"} min
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("ppKpiBasket")} {kpiStartYear}
              </p>
            </CardContent>
          </Card>
          <Card data-testid="kpi-basket-now">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold tabular-nums">
                {basketNow ? Math.round(basketNow) : "–"} min
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("ppKpiBasket")} {kpiEndYear}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart controls */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
          <div className="flex items-center gap-2">
            <Switch
              id="reverse-minutes"
              checked={reverseMinutes}
              onCheckedChange={setReverseMinutes}
              data-testid="reverse-minutes-toggle"
            />
            <Label
              htmlFor="reverse-minutes"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              {t("ppReverseMinutes")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-presidents"
              checked={showPresidents}
              onCheckedChange={setShowPresidents}
              data-testid="show-presidents-toggle"
            />
            <Label
              htmlFor="show-presidents"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              {t("ppShowPresidents")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-context"
              checked={showContext}
              onCheckedChange={setShowContext}
              data-testid="show-context-toggle"
            />
            <Label
              htmlFor="show-context"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              {t("ppShowContext")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-inflation"
              checked={showInflation}
              onCheckedChange={setShowInflation}
              data-testid="show-inflation-toggle"
            />
            <Label
              htmlFor="show-inflation"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              {t("ppShowInflation")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-productivity"
              checked={showProductivity}
              onCheckedChange={setShowProductivity}
              data-testid="show-productivity-toggle"
            />
            <Label
              htmlFor="show-productivity"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              {t("ppShowProductivity")}
            </Label>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            title={t("downloadChart")}
            aria-label={t("downloadChart")}
            className="col-span-2 justify-self-end sm:ml-auto h-7 w-7 text-muted-foreground/40 hover:text-muted-foreground"
          >
            <Camera className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div
          className="h-[300px] md:h-[400px] pl-2 pr-2"
          role="img"
          aria-label={t("ppChartAriaLabel")}
        >
          <Line ref={chartRef} data={chartData} options={chartOptions as any} />
        </div>

        {/* Year range filter */}
        <div className="mt-4">
          <YearRangeSlider
            min={labels[0] ?? 1960}
            max={DATA_END_YEAR}
            value={[effectiveStart, effectiveEnd]}
            onValueChange={([s, e]) => {
              setYearStart(s);
              setYearEnd(e);
            }}
          />
        </div>

        {/* Data transparency footnotes */}
        <div className="mt-3 space-y-1">
          {salaryRef === "median" && (
            <p className="text-[11px] text-muted-foreground/70 italic">
              ℹ {t("medianAvailableFrom")}
            </p>
          )}
          {salaryRef === "mean" && (
            <p className="text-[11px] text-muted-foreground/70 italic">
              ℹ {t("meanStopsAt")}
            </p>
          )}
          <p
            className={`text-[11px] text-muted-foreground/70 italic transition-opacity duration-200 ${showProductivity ? "opacity-100" : "opacity-0 select-none"}`}
          >
            ℹ {t("productivityBackProjection")}
          </p>
        </div>
      </div>
    </section>
  );
}
