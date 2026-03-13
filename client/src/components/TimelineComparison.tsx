import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/i18n';
import { products } from '@/lib/data';

// Strip diacritics for accent-insensitive search (e.g. "metro" matches "métro")
function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function TimelineComparison() {
  const { lang, t } = useLang();
  const [year1, setYear1] = useState('1960');
  const [year2, setYear2] = useState('2024');
  const [productId, setProductId] = useState('baguette');
  const [productOpen, setProductOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = 1960; y <= 2024; y += 5) years.push(y);
    if (!years.includes(2024)) years.push(2024);
    return years;
  }, []);

  const productList = useMemo(() => Object.values(products), []);

  const selectedProduct = products[productId];
  const selectedProductName = selectedProduct
    ? `${selectedProduct.emoji} ${lang === 'fr' ? selectedProduct.nameFr : selectedProduct.nameEn}`
    : '';

  const handleCompare = () => {
    const y1 = Number(year1);
    const y2 = Number(year2);
    const prod = products[productId];
    if (!prod) return;

    const min1 = prod.minutes[y1];
    const min2 = prod.minutes[y2];
    if (min1 === undefined || min2 === undefined) {
      setResult(null);
      return;
    }

    const diff = min2 - min1;
    const pctAbs = Math.abs((diff / min1) * 100).toFixed(0);
    const accessible = diff < 0 ? t('moreAccessible') : t('lessAccessible');

    const resultText = t('timelineResult')
      .replace('{year1}', String(y1))
      .replace('{year2}', String(y2))
      .replace('{min1}', min1.toFixed(1))
      .replace('{min2}', min2.toFixed(1));

    const diffText = t('timelineDiff')
      .replace('{diff}', Math.abs(diff).toFixed(1))
      .replace('{pct}', `${pctAbs}% ${accessible}`);

    setResult(`${resultText}\n${diffText}`);
  };

  return (
    <section className="py-12 md:py-16" data-testid="timeline-comparison">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl font-bold mb-1">{t('timelineTitle')}</h2>
        <p className="text-sm text-muted-foreground mb-6">{t('timelineSub')}</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Select value={year1} onValueChange={setYear1}>
            <SelectTrigger className="w-full sm:w-[140px]" data-testid="year1-select">
              <SelectValue placeholder={t('year1')} />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(y => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year2} onValueChange={setYear2}>
            <SelectTrigger className="w-full sm:w-[140px]" data-testid="year2-select">
              <SelectValue placeholder={t('year2')} />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(y => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Searchable product combobox */}
          <Popover open={productOpen} onOpenChange={setProductOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={productOpen}
                className="w-full sm:w-[240px] justify-between font-normal"
                data-testid="product-combobox"
              >
                <span className="truncate">
                  {selectedProductName || t('selectProduct')}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0" align="start">
              <Command filter={(value, search) => {
                if (normalize(value).includes(normalize(search))) return 1;
                return 0;
              }}>
                <CommandInput placeholder={t('searchProduct')} />
                <CommandList>
                  <CommandEmpty>{t('noProductFound')}</CommandEmpty>
                  <CommandGroup>
                    {productList.map(p => {
                      const pName = lang === 'fr' ? p.nameFr : p.nameEn;
                      return (
                        <CommandItem
                          key={p.id}
                          value={`${p.emoji} ${pName}`}
                          onSelect={() => {
                            setProductId(p.id);
                            setProductOpen(false);
                          }}
                          data-testid={`product-option-${p.id}`}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              productId === p.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {p.emoji} {pName}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Button onClick={handleCompare} data-testid="compare-button">
            {t('compare')}
          </Button>
        </div>

        {result && (
          <Card data-testid="comparison-result">
            <CardContent className="pt-6">
              {result.split('\n').map((line, i) => (
                <p key={i} className={`text-sm tabular-nums ${i === 0 ? '' : 'text-muted-foreground mt-1'}`}>
                  {line}
                </p>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
