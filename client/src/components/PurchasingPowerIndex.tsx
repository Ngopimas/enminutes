import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { purchasingPower, ppAnnotations } from "@/lib/data";
import { chartColor, chartColorAlpha } from "@/lib/chartColors";

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
  const [reverseMinutes, setReverseMinutes] = useState(true);
  const [showPresidents, setShowPresidents] = useState(true);
  const [showContext, setShowContext] = useState(true);
  const [showInflation, setShowInflation] = useState(false);

  const {
    indexYears,
    purchasingPowerIndex: ppIndex,
    basketMinutesByYear,
    multiplier,
    inflationRates,
  } = purchasingPower;

  const labels = indexYears.filter((y) => ppIndex[y] !== undefined);
  const indexData = labels.map((y) => ppIndex[y]);
  const minutesData = labels.map((y) => basketMinutesByYear[y]);
  const inflationData = labels.map((y) => inflationRates[y] ?? null);

  const basket1960 = basketMinutesByYear[1960];
  const basketNow = basketMinutesByYear[labels[labels.length - 1]];

  // Build annotations
  const annotations: Record<string, object> = {};

  // President bands
  if (showPresidents) {
    frenchPresidents.forEach((pres, i) => {
      const start = Math.max(pres.start, labels[0]);
      const end = Math.min(pres.end, labels[labels.length - 1]);
      if (start >= end) return;

      const startIdx = labels.indexOf(start) >= 0 ? labels.indexOf(start) : 0;
      const endIdx =
        labels.indexOf(end) >= 0 ? labels.indexOf(end) : labels.length - 1;

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
      const idx = labels.indexOf(ann.year);
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
      borderColor: chartColor(1),
      backgroundColor: chartColorAlpha(1, 0.08),
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 4,
      yAxisID: "y",
      borderWidth: 2.5,
    },
    {
      label: t("ppLegendMinutes"),
      data: minutesData,
      borderColor: chartColor(2),
      backgroundColor: "transparent",
      borderDash: [6, 3],
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 4,
      yAxisID: "y1",
      borderWidth: 2,
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

  const chartData = { labels, datasets };

  const scales: any = {
    x: {
      ticks: {
        maxTicksLimit: 12,
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
        text: t("ppChartYLabel"),
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
        text: t("ppChartYLabel2"),
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
            // Add % suffix for inflation dataset
            if (ctx.datasetIndex === 2 && showInflation) {
              return ` ${label}: ${value.toFixed(1)}%`;
            }
            return ` ${label}: ${value.toFixed(1)}`;
          },
        },
      },
      annotation: {
        annotations,
      },
    },
  };

  return (
    <section className="py-12 md:py-16" data-testid="pp-index">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl font-bold mb-1">{t("ppIndexTitle")}</h2>
        <p className="text-sm text-muted-foreground mb-8">{t("ppIndexSub")}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card data-testid="kpi-multiplier">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold tabular-nums bg-gradient-to-br from-yellow-300 to-amber-600 bg-clip-text text-transparent">
                {multiplier}&times;
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("ppKpiMultiplier")}
              </p>
            </CardContent>
          </Card>
          <Card data-testid="kpi-basket-1960">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold tabular-nums">
                {basket1960 ? Math.round(basket1960) : "–"} min
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("ppKpiBasket1960")}
              </p>
            </CardContent>
          </Card>
          <Card data-testid="kpi-basket-now">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold tabular-nums">
                {basketNow ? Math.round(basketNow) : "–"} min
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("ppKpiBasketNow")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart controls */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
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
        </div>

        <div className="h-[300px] md:h-[400px] pl-2 pr-2">
          <Line data={chartData} options={chartOptions as any} />
        </div>
      </div>
    </section>
  );
}
