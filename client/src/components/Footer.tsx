import { Attribution } from "@/components/Attribution";
import { useLang } from "@/lib/i18n";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="py-8 border-t" data-testid="footer">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-xs text-muted-foreground mb-4">{t("footerText")}</p>
        <Attribution />
      </div>
    </footer>
  );
}
