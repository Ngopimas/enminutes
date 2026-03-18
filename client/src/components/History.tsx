import { useLang } from "@/lib/i18n";
import { historicalEvents } from "@/lib/data";

export default function History() {
  const { lang, t } = useLang();

  return (
    <section className="py-12 md:py-20" data-testid="history">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl font-bold mb-1">{t("historyTitle")}</h2>
        <p className="text-sm text-muted-foreground mb-8">{t("historySub")}</p>

        <div className="relative ml-4 border-l border-border pl-6 space-y-6">
          {historicalEvents.map((event) => (
            <div
              key={event.year}
              className="relative"
              data-testid={`history-event-${event.year}`}
            >
              <div className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
              <div className="flex items-baseline gap-3">
                <span className="text-xs font-bold tabular-nums bg-gradient-to-br from-yellow-300 to-amber-600 bg-clip-text text-transparent shrink-0">
                  {event.year}
                </span>
                <span className="text-sm">
                  {lang === "fr" ? event.fr : event.en}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
