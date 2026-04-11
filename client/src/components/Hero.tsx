import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { useSalaryRef } from "@/lib/salaryRef";
import {
  products,
  featuredProducts,
  getMinutes,
  getYearsForRef,
} from "@/lib/data";

export default function Hero() {
  const { lang, t } = useLang();
  const { salaryRef } = useSalaryRef();
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const touchStartX = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % featuredProducts.length);
    }, 6000);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      setIndex((i) =>
        delta < 0
          ? (i + 1) % featuredProducts.length
          : (i - 1 + featuredProducts.length) % featuredProducts.length,
      );
      resetTimer();
    }
    touchStartX.current = null;
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const productId = featuredProducts[index];
  const product = products[productId];
  const minutes = getMinutes(product, salaryRef);
  const years = getYearsForRef(product, salaryRef);

  if (years.length === 0) return null;

  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const firstMin = Math.round(minutes[firstYear]);
  const lastMin = Math.round(minutes[lastYear]);
  const nameDisplay =
    lang === "fr" ? product.nameFr.toLowerCase() : product.nameEn.toLowerCase();
  const wentDown = lastMin < firstMin;
  const pctChange = Math.abs(
    Math.round(((lastMin - firstMin) / firstMin) * 100),
  );

  const refLabel =
    salaryRef === "smic"
      ? lang === "fr"
        ? "SMIC"
        : "min. wage"
      : salaryRef === "median"
        ? lang === "fr"
          ? "salaire médian"
          : "median salary"
        : lang === "fr"
          ? "salaire moyen"
          : "mean salary";

  return (
    <section className="py-16 md:py-28" data-testid="hero">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
          {t("heroHeadline")}
        </h1>
        <p className="text-muted-foreground text-base mx-auto mb-10">
          {salaryRef === "smic"
            ? t("heroSubtitle")
            : salaryRef === "median"
              ? t("heroSubtitleMedian")
              : t("heroSubtitleMean")}
        </p>
        <div
          className="h-[80px] flex items-center justify-center overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={`${productId}-${salaryRef}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-base md:text-lg text-foreground/80 tabular-nums"
            >
              <span>{product.emoji} </span>
              {lang === "fr" ? (
                <>
                  En {firstYear}, il fallait{" "}
                  <span className="font-semibold text-foreground">
                    {firstMin}
                  </span>{" "}
                  min de {refLabel} pour acheter 1 {nameDisplay}.{" "}
                  {wentDown ? (
                    <>
                      Aujourd&apos;hui,{" "}
                      <span className="font-semibold text-foreground">
                        {lastMin}
                      </span>{" "}
                      min suffisent.
                    </>
                  ) : (
                    <>
                      Aujourd&apos;hui, il en faut{" "}
                      <span className="font-semibold text-foreground">
                        {lastMin}
                      </span>
                      .
                    </>
                  )}{" "}
                  <span
                    className={
                      wentDown
                        ? "font-semibold text-emerald-600 dark:text-emerald-400"
                        : "font-semibold text-red-500 dark:text-red-400"
                    }
                  >
                    {wentDown ? "↓" : "↑"}
                    {pctChange}%
                  </span>
                </>
              ) : (
                <>
                  In {firstYear}, it took{" "}
                  <span className="font-semibold text-foreground">
                    {firstMin}
                  </span>{" "}
                  min of {refLabel} for 1 {nameDisplay}.{" "}
                  {wentDown ? (
                    <>
                      Today,{" "}
                      <span className="font-semibold text-foreground">
                        {lastMin}
                      </span>{" "}
                      min is enough.
                    </>
                  ) : (
                    <>
                      Today, it takes{" "}
                      <span className="font-semibold text-foreground">
                        {lastMin}
                      </span>
                      .
                    </>
                  )}{" "}
                  <span
                    className={
                      wentDown
                        ? "font-semibold text-emerald-600 dark:text-emerald-400"
                        : "font-semibold text-red-500 dark:text-red-400"
                    }
                  >
                    {wentDown ? "↓" : "↑"}
                    {pctChange}%
                  </span>
                </>
              )}
            </motion.p>
          </AnimatePresence>
        </div>
        {/* Carousel progress dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {featuredProducts.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIndex(i);
                resetTimer();
              }}
              aria-label={`Produit ${i + 1}`}
              className="p-2 cursor-pointer"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  i === index
                    ? "bg-foreground/60 w-4"
                    : "bg-foreground/15 hover:bg-foreground/30 w-1.5"
                }`}
              />
            </button>
          ))}
        </div>
        <button
          onClick={() =>
            document
              .getElementById("explorer")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {t("heroExplore")} ↓
        </button>
      </div>
    </section>
  );
}
