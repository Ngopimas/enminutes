import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import { useSalaryRef } from '@/lib/salaryRef';
import { products, featuredProducts, getMinutes, getYearsForRef } from '@/lib/data';

export default function Hero() {
  const { lang, t } = useLang();
  const { salaryRef } = useSalaryRef();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % featuredProducts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const productId = featuredProducts[index];
  const product = products[productId];
  const minutes = getMinutes(product, salaryRef);
  const years = getYearsForRef(product, salaryRef);

  if (years.length === 0) return null;

  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const firstMin = Math.round(minutes[firstYear]);
  const lastMin = Math.round(minutes[lastYear]);
  const nameDisplay = lang === 'fr'
    ? product.nameFr.toLowerCase()
    : product.nameEn.toLowerCase();
  const wentDown = lastMin < firstMin;

  const refLabel = salaryRef === 'smic'
    ? (lang === 'fr' ? 'SMIC' : 'min. wage')
    : salaryRef === 'median'
      ? (lang === 'fr' ? 'salaire médian' : 'median salary')
      : (lang === 'fr' ? 'salaire moyen' : 'mean salary');

  return (
    <section className="py-12 md:py-16" data-testid="hero">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
          {t('heroHeadline')}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto mb-8">
          {salaryRef === 'smic'
            ? t('heroSubtitle')
            : salaryRef === 'median'
              ? t('heroSubtitleMedian')
              : t('heroSubtitleMean')
          }
        </p>
        <div className="h-[64px] flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${productId}-${salaryRef}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-muted-foreground tabular-nums"
            >
              <span>{product.emoji} </span>
              {lang === 'fr' ? (
                <>
                  En {firstYear}, il fallait{' '}
                  <span className="font-semibold text-foreground">{firstMin}</span>{' '}
                  min de {refLabel} pour acheter 1 {nameDisplay}.{' '}
                  {wentDown
                    ? <>Aujourd&apos;hui, <span className="font-semibold text-foreground">{lastMin}</span> min suffisent.</>
                    : <>Aujourd&apos;hui, il en faut <span className="font-semibold text-foreground">{lastMin}</span>.</>
                  }
                </>
              ) : (
                <>
                  In {firstYear}, it took{' '}
                  <span className="font-semibold text-foreground">{firstMin}</span>{' '}
                  min of {refLabel} for 1 {nameDisplay}.{' '}
                  {wentDown
                    ? <>Today, <span className="font-semibold text-foreground">{lastMin}</span> min is enough.</>
                    : <>Today, it takes <span className="font-semibold text-foreground">{lastMin}</span>.</>
                  }
                </>
              )}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
