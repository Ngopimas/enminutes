import { useLang } from "@/lib/i18n";

export function Attribution() {
  const { t } = useLang();

  return (
    <div className="w-full py-2 text-center text-xs text-muted-foreground space-y-1">
      <p>
        {t("footerCreatedBy")}{" "}
        <a
          href="https://www.romaincoupey.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors underline underline-offset-2"
        >
          Romain Coupey
        </a>
      </p>
      <p className="flex items-center justify-center gap-3">
        <a
          href="https://romaincoupey.com/posts/building-purchasing-power-visualizer-ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors underline underline-offset-2"
        >
          {t("footerReadArticle")}
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/Ngopimas/enminutes"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors underline underline-offset-2"
        >
          {t("footerViewSource")}
        </a>
      </p>
    </div>
  );
}
