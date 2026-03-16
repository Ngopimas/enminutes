import { Github, BookOpen } from "lucide-react";
import { useLang } from "@/lib/i18n";

export function Attribution() {
  const { t } = useLang();

  return (
    <div className="w-full py-2 text-center text-xs text-muted-foreground space-y-2">
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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <a
          href="https://romaincoupey.com/posts/building-purchasing-power-visualizer-ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-foreground transition-colors underline underline-offset-2"
        >
          <BookOpen className="h-3.5 w-3.5 shrink-0" />
          {t("footerReadArticle")}
        </a>
        <span className="hidden sm:inline" aria-hidden="true">·</span>
        <a
          href="https://github.com/Ngopimas/enminutes"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-foreground transition-colors underline underline-offset-2"
        >
          <Github className="h-3.5 w-3.5 shrink-0" />
          {t("footerViewSource")}
        </a>
      </div>
    </div>
  );
}
