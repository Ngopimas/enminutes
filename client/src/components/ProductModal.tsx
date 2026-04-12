import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { type Product } from "@/lib/data";
import ProductDetail from "./ProductDetail";

interface ProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialYearA?: number;
  initialYearB?: number;
  selectedIndex?: number;
  filteredCount?: number;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
}

export default function ProductModal({
  product,
  open,
  onOpenChange,
  initialYearA,
  initialYearB,
  selectedIndex,
  filteredCount,
  onNavigatePrev,
  onNavigateNext,
}: ProductModalProps) {
  const { lang } = useLang();

  function handleOpenChange(v: boolean) {
    if (!v)
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search + "#/",
      );
    onOpenChange(v);
  }

  if (!product) return null;

  const name = lang === "fr" ? product.nameFr : product.nameEn;
  const showNav = filteredCount !== undefined && filteredCount > 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-xl h-[85vh] flex flex-col p-0 gap-0"
        data-testid="product-modal"
      >
        <DialogTitle className="sr-only">{name}</DialogTitle>

        {/* Navigation bar — pr-12 clears the built-in close button (absolute right-4 top-4) */}
        {showNav && (
          <div className="flex items-center gap-1 px-4 pt-3.5 pb-3 border-b shrink-0 pr-12">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onNavigatePrev}
              disabled={(selectedIndex ?? 0) <= 0}
              aria-label="Produit précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onNavigateNext}
              disabled={(selectedIndex ?? 0) >= (filteredCount ?? 1) - 1}
              aria-label="Produit suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums ml-1">
              {(selectedIndex ?? 0) + 1} / {filteredCount}
            </span>
          </div>
        )}

        {/* Scrollable content — pt-12 when no nav bar to clear the close button */}
        <div
          className={`overflow-y-auto flex-1 px-6 pb-6 ${showNav ? "pt-5" : "pt-12"}`}
        >
          <ProductDetail
            product={product}
            initialYearA={initialYearA}
            initialYearB={initialYearB}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
