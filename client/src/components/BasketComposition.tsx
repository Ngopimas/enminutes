import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { products, basketWeights } from "@/lib/data";
import { MAX_BASKET_WEIGHT } from "@/pages/Home";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BasketCompositionProps {
  customWeights: Record<string, number>;
  onIncrement: (pid: string) => void;
  onDecrement: (pid: string) => void;
  onReset: () => void;
  onExplore: (pid: string) => void;
}

export default function BasketComposition({
  customWeights,
  onIncrement,
  onDecrement,
  onReset,
  onExplore,
}: BasketCompositionProps) {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(true);

  const isCustom = Object.entries(basketWeights).some(
    ([pid, defaultW]) => (customWeights[pid] ?? 0) !== defaultW,
  );

  const totalWeight = Object.values(customWeights).reduce((s, w) => s + w, 0);

  const basketItems = Object.entries(basketWeights)
    .map(([id]) => {
      const prod = products[id];
      const weight = customWeights[id] ?? 0;
      return {
        id,
        weight,
        emoji: prod?.emoji ?? "?",
        name: prod ? (lang === "fr" ? prod.nameFr : prod.nameEn) : id,
      };
    })
    .sort((a, b) => {
      if (a.weight === 0 && b.weight > 0) return 1;
      if (a.weight > 0 && b.weight === 0) return -1;
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.name.localeCompare(b.name);
    });

  const excludedReasonTooltip = (id: string): string | null => {
    switch (id) {
      case "cigarettes":               return t("basketExcludedCigarettes");
      case "loyer":                    return t("basketExcludedLoyer");
      case "loyer_paris":
      case "loyer_national":           return t("basketExcludedLoyerParis");
      case "smartphone":               return t("basketExcludedSmartphone");
      case "voiture_milieu_gamme":     return t("basketExcludedVoiture");
      case "internet":                 return t("basketExcludedInternet");
      case "forfait_mobile":           return t("basketExcludedMobile");
      case "streaming":                return t("basketExcludedStreaming");
      case "gaz":                      return t("basketExcludedGaz");
      case "consultation_specialiste": return t("basketExcludedOphtalmologiste");
      default:                         return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 mb-8" id="basket-composition">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
          data-testid="basket-toggle"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
          <span className="underline decoration-dotted underline-offset-4 group-hover:decoration-solid">
            {t("basketTitle")}
          </span>
        </button>

        {/* Dismissible chip — click to reset */}
        {isCustom && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border border-amber-400/60 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors"
            title={t("basketReset")}
          >
            {t("basketCustomBadge")}
            <X className="h-3 w-3 opacity-60" />
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
            {t("basketExplain").replace(
              "{count}",
              String(basketItems.filter((i) => i.weight > 0).length),
            )}
          </p>

          {/* Product grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
            {basketItems.map((item) => {
              const isActive = item.weight > 0;
              const canDecrement = isActive && totalWeight > 1;
              const canIncrement = item.weight < MAX_BASKET_WEIGHT;
              const exclusionReason =
                !isActive ? excludedReasonTooltip(item.id) : null;

              const card = (
                <div
                  className={`flex items-center rounded-md border text-sm transition-all duration-150 ${
                    isActive
                      ? "border-border/80 bg-background ring-1 ring-primary/20"
                      : "opacity-40 border-dashed"
                  }`}
                  data-testid={`basket-item-${item.id}`}
                >
                  {/* Left: tappable explore area */}
                  <button
                    onClick={() => onExplore(item.id)}
                    className="flex items-center gap-2 flex-1 min-w-0 px-2 py-2 text-left hover:text-primary transition-colors"
                    title={t("basketExplore")}
                  >
                    <span className="text-base shrink-0">{item.emoji}</span>
                    <span className="truncate text-xs">{item.name}</span>
                  </button>

                  {/* Right: weight controls */}
                  <div className="flex items-center gap-0.5 pr-1.5 shrink-0">
                    <button
                      onClick={() => onDecrement(item.id)}
                      disabled={!canDecrement}
                      className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-sm leading-none"
                      aria-label={`-1 ${item.name}`}
                    >
                      −
                    </button>
                    <span
                      className={`text-xs font-mono tabular-nums w-4 text-center ${
                        isActive ? "text-muted-foreground" : "text-muted-foreground/40"
                      }`}
                    >
                      {item.weight}
                    </span>
                    <button
                      onClick={() => onIncrement(item.id)}
                      disabled={!canIncrement}
                      className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-sm leading-none"
                      aria-label={`+1 ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );

              if (exclusionReason) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <div>{card}</div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      {exclusionReason}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.id}>{card}</div>;
            })}
          </div>

          {/* Weight sum */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span className="font-mono">Σ = {totalWeight}</span>
            <span>–</span>
            <span>{t("basketNote")}</span>
          </div>

          {/* Notes */}
          <div className="space-y-1 mb-3">
            <p className="text-xs text-muted-foreground/70 italic max-w-3xl">
              ℹ {t("basketModernNote")}
            </p>
            <p className="text-xs text-muted-foreground/70 italic max-w-3xl">
              ℹ {t("basketHousingNote")}
            </p>
            {isCustom && (
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 italic max-w-3xl">
                ℹ {t("basketCustomInfo")}
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground/70 italic max-w-3xl">
            {t("basketDisclaimer")}
          </p>
        </div>
      )}
    </div>
  );
}
