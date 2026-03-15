import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { useSalaryRef } from "@/lib/salaryRef";
import { products } from "@/lib/data";
import ProductDetail from "@/components/ProductDetail";
import NotFound from "@/pages/not-found";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t } = useLang();
  const { setSalaryRef } = useSalaryRef();

  // wouter doesn't strip query strings from hash URLs, so id may include them
  const rawId = params.id ?? "";
  const qIdx = rawId.indexOf("?");
  const productId = qIdx >= 0 ? rawId.slice(0, qIdx) : rawId;

  const [initialYearA, setInitialYearA] = useState<number | undefined>();
  const [initialYearB, setInitialYearB] = useState<number | undefined>();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current || qIdx < 0) return;
    applied.current = true;
    const searchParams = new URLSearchParams(rawId.slice(qIdx + 1));
    const ref = searchParams.get("ref");
    if (ref === "smic" || ref === "median" || ref === "mean") setSalaryRef(ref);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from) setInitialYearA(Number(from));
    if (to) setInitialYearB(Number(to));
  }, []);

  const product = products[productId];
  if (!product) return <NotFound />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-lg mx-auto px-4 py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("back")}
        </Button>
        <div className="flex flex-col gap-4">
          <ProductDetail
            product={product}
            initialYearA={initialYearA}
            initialYearB={initialYearB}
          />
        </div>
      </div>
    </div>
  );
}
