import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLang } from '@/lib/i18n';
import { products, type Product } from '@/lib/data';
import ProductModal from './ProductModal';

const insights = [
  { emoji: '🚬', titleKey: 'insightCigarettes', subKey: 'insightCigarettesSub', productId: 'cigarettes' },
  { emoji: '🥖', titleKey: 'insightBaguette', subKey: 'insightBaguetteSub', productId: 'baguette' },
  { emoji: '⛽', titleKey: 'insightEssence', subKey: 'insightEssenceSub', productId: 'essence' },
  { emoji: '🎬', titleKey: 'insightCinema', subKey: 'insightCinemaSub', productId: 'cinema' },
];

export default function Insights() {
  const { t } = useLang();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCardClick = (productId: string) => {
    const product = products[productId];
    if (product) {
      setSelectedProduct(product);
      setModalOpen(true);
    }
  };

  return (
    <section className="py-12 md:py-16" data-testid="insights">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl font-bold mb-6">{t('insightsTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map(item => (
            <Card
              key={item.titleKey}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleCardClick(item.productId)}
              data-testid={`insight-${item.titleKey}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <h3 className="text-sm font-semibold mb-1">{t(item.titleKey)}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t(item.subKey)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ProductModal product={selectedProduct} open={modalOpen} onOpenChange={setModalOpen} />
    </section>
  );
}
