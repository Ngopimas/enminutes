import { useLang } from '@/lib/i18n';
import { ExternalLink } from 'lucide-react';

const sources = [
  {
    labelKey: 'sourcesSmicLabel',
    descKey: 'sourcesSmicDesc',
    url: 'https://www.insee.fr/fr/statistiques/1375188',
  },
  {
    labelKey: 'sourcesPricesLabel',
    descKey: 'sourcesPricesDesc',
    url: 'https://www.insee.fr/fr/statistiques/series/102342213',
  },
  {
    labelKey: 'sourcesInflationLabel',
    descKey: 'sourcesInflationDesc',
    url: 'https://www.insee.fr/fr/statistiques/serie/001759970',
  },
  {
    labelKey: 'sourcesProductivityLabel',
    descKey: 'sourcesProductivityDesc',
    url: 'https://data-explorer.oecd.org/vis?lc=en&df[id]=DSD_PDB%40DF_PDB_LV&dq=FRA.A.GDPHRS..XDC_H.Q',
  },
  {
    labelKey: 'sourcesPikettyLabel',
    descKey: 'sourcesPikettyDesc',
    url: 'https://wid.world/fr/donnees/',
  },
  {
    labelKey: 'sourcesIPPLabel',
    descKey: 'sourcesIPPDesc',
    url: 'https://www.ipp.eu/donnees/',
  },
  {
    labelKey: 'sourcesFichePaieLabel',
    descKey: 'sourcesFichePaieDesc',
    url: 'https://www.fiche-paie.fr/outils/historique-smic',
  },
  {
    labelKey: 'sourcesHistLabel',
    descKey: 'sourcesHistDesc',
    url: 'https://www.guichetdusavoir.org/',
  },
  {
    labelKey: 'sourcesOlapLabel',
    descKey: 'sourcesOlapDesc',
    url: 'https://www.clameur.fr/',
  },
  {
    labelKey: 'sourcesCreLabel',
    descKey: 'sourcesCreDesc',
    url: 'https://www.cre.fr/Documents/Deliberations/Decision/tarifs-reglementes-de-vente-du-gaz-naturel',
  },
  {
    labelKey: 'sourcesArcepLabel',
    descKey: 'sourcesArcepDesc',
    url: 'https://www.arcep.fr/cartes-et-donnees/nos-publications-chiffrees/marche-des-services-de-communications-electroniques.html',
  },
  {
    labelKey: 'sourcesCncLabel',
    descKey: 'sourcesCncDesc',
    url: 'https://www.cnc.fr/professionnels/etudes-et-rapports/bilan/bilan-annuel-du-cnc',
  },
  {
    labelKey: 'sourcesRatpLabel',
    descKey: 'sourcesRatpDesc',
    url: 'https://www.iledefrance-mobilites.fr/',
  },
  {
    labelKey: 'sourcesAmeliLabel',
    descKey: 'sourcesAmeliDesc',
    url: 'https://www.ameli.fr/medecin/exercice-liberal/remuneration/honoraires-conventionnels',
  },
  {
    labelKey: 'sourcesManualLabel',
    descKey: 'sourcesManualDesc',
    url: 'https://www.lesnumeriques.com/',
  },
];

export default function Sources() {
  const { t } = useLang();

  return (
    <section className="py-12 md:py-16" data-testid="sources">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl font-bold mb-6">{t('sourcesTitle')}</h2>

        {/* Methodology */}
        <div className="mb-3 p-4 rounded-lg bg-muted/50">
          <p className="text-xs font-medium text-muted-foreground mb-1">{t('sourcesMethodLabel')}</p>
          <p className="text-sm font-mono tabular-nums">{t('sourcesFormula')}</p>
          <p className="text-xs text-muted-foreground mt-2">{t('sourcesInterpolation')}</p>
          <p className="text-xs text-muted-foreground/70 italic mt-2">ℹ {t('sourcesSmicNote')}</p>
        </div>

        {/* IPC calibration */}
        <div className="mb-6 p-4 rounded-lg bg-muted/50">
          <p className="text-xs font-medium text-muted-foreground mb-1">{t('sourcesIpcCalibLabel')}</p>
          <p className="text-xs text-muted-foreground/70">{t('sourcesIpcCalibDesc')}</p>
        </div>

        {/* Source links grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sources.map((src) => (
            <a
              key={src.labelKey}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted/30 transition-colors"
              data-testid={`source-${src.labelKey}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium group-hover:underline">
                  {t(src.labelKey)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t(src.descKey)}
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0 mt-0.5" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
