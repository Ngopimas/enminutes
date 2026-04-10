import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { products, basketWeights } from "@/lib/data";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BasketComposition() {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(true);

  // Sort basket items: active (weight > 0) first, then by weight desc, then alphabetical
  const basketItems = Object.entries(basketWeights)
    .map(([id, weight]) => {
      const prod = products[id];
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

  const totalWeight = basketItems.reduce((sum, item) => sum + item.weight, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 -mt-4 mb-8">
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

      {open && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
            {t("basketExplain")}
          </p>

          {/* Product grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
            {basketItems.map((item) => {
              const excludedTooltip =
                item.weight === 0
                  ? item.id === "cigarettes"
                    ? t("basketExcludedCigarettes")
                    : item.id === "loyer"
                      ? t("basketExcludedLoyer")
                      : item.id === "loyer_paris" ||
                          item.id === "loyer_national"
                        ? t("basketExcludedLoyerParis")
                        : item.id === "smartphone"
                          ? t("basketExcludedSmartphone")
                          : item.id === "voiture_milieu_gamme"
                            ? t("basketExcludedVoiture")
                            : item.id === "internet"
                              ? t("basketExcludedInternet")
                              : item.id === "forfait_mobile"
                                ? t("basketExcludedMobile")
                                : item.id === "streaming"
                                  ? t("basketExcludedStreaming")
                                  : item.id === "gaz"
                                    ? t("basketExcludedGaz")
                                    : item.id === "consultation_specialiste"
                                      ? t("basketExcludedOphtalmologiste")
                                      : null
                  : null;

              const card = (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border ${
                    item.weight === 0
                      ? "opacity-40 border-dashed cursor-help"
                      : "border-border/50"
                  }`}
                  data-testid={`basket-item-${item.id}`}
                >
                  <span className="text-base shrink-0">{item.emoji}</span>
                  <span className="truncate flex-1">{item.name}</span>
                  <span className="text-xs font-mono text-muted-foreground shrink-0 tabular-nums">
                    ×{item.weight}
                  </span>
                </div>
              );

              if (excludedTooltip) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{card}</TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      {excludedTooltip}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return card;
            })}
          </div>

          {/* Weight explanation + general exclusion note */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground mb-3">
            <span className="font-mono shrink-0">Σ = {totalWeight}</span>
            <span>-</span>
            <span>{t("basketNote")}</span>
          </div>

          {/* Notable exclusions */}
          <div className="space-y-1 mb-3">
            <p className="text-xs text-muted-foreground/70 italic max-w-3xl">
              ℹ {t("basketModernNote")}
            </p>
            <p className="text-xs text-muted-foreground/70 italic max-w-3xl">
              ℹ {t("basketHousingNote")}
            </p>
          </div>

          {/* Honest disclaimer */}
          <p className="text-xs text-muted-foreground/70 italic max-w-3xl">
            {t("basketDisclaimer")}
          </p>
        </div>
      )}
    </div>
  );
}
