import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLang } from "@/lib/i18n";
import { type Product } from "@/lib/data";
import ProductDetail from "./ProductDetail";

interface ProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialYearA?: number;
  initialYearB?: number;
}

export default function ProductModal({
  product,
  open,
  onOpenChange,
  initialYearA,
  initialYearB,
}: ProductModalProps) {
  const { lang } = useLang();

  function handleOpenChange(v: boolean) {
    if (!v)
      window.history.replaceState(null, "", window.location.pathname + "#/");
    onOpenChange(v);
  }

  if (!product) return null;

  const name = lang === "fr" ? product.nameFr : product.nameEn;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        data-testid="product-modal"
      >
        {/* Accessible title for screen readers */}
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <ProductDetail
          product={product}
          initialYearA={initialYearA}
          initialYearB={initialYearB}
        />
      </DialogContent>
    </Dialog>
  );
}
