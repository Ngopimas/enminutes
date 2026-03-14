import { Sun, Moon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export default function Header() {
  const { lang, setLang, t } = useLang();
  const { isDark, toggle } = useTheme();

  return (
    <header
      className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b"
      data-testid="header"
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 40 40"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            aria-label="Pouvoir d'Achat logo"
            className="w-8 h-8"
          >
            <defs>
              <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            {/* € C-curve as clock body */}
            <path d="M28 8a16 16 0 1 0 0 24" stroke="url(#logoGold)" />
            {/* Two € bars angled as clock hands from center (10:10 position) */}
            <line x1="16" y1="20" x2="10" y2="13" stroke="url(#logoGold)" />
            <line x1="16" y1="20" x2="25" y2="15" stroke="url(#logoGold)" />
          </svg>
          <span className="font-semibold text-sm tracking-tight">
            {t("siteTitle")}
          </span>
          <span className="hidden sm:inline text-muted-foreground/50 text-sm select-none">
            ·
          </span>
          <span className="hidden sm:inline font-serif italic text-sm text-muted-foreground">
            En Minutes
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            data-testid="lang-toggle"
            className="text-xs gap-1"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("language")}</span>
            <span className="sm:hidden uppercase">{lang}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            data-testid="theme-toggle"
            aria-label={isDark ? t("lightMode") : t("darkMode")}
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
