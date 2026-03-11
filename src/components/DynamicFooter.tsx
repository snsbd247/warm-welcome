import { useFooterSettings, renderFooterText } from "@/hooks/useFooterSettings";

export default function DynamicFooter() {
  const { data: settings } = useFooterSettings();

  if (!settings) return null;

  const text = renderFooterText(settings);

  return (
    <footer className="w-full border-t border-border bg-muted/30 py-3 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-muted-foreground">
        <span>
          {settings.footer_link ? (
            <a href={settings.footer_link} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              {text}
            </a>
          ) : (
            text
          )}
        </span>
        {settings.system_version && (
          <span className="opacity-60">v{settings.system_version}</span>
        )}
      </div>
    </footer>
  );
}
