"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/hooks/i18n/useT";

interface TabItem {
  label: string;
  href: string;
  disabled: boolean;
}

interface TabNavProps {
  basePath: string;
  tabs: TabItem[];
}

export function TabNav({ basePath, tabs }: TabNavProps) {
  const t = useT();
  const pathname = usePathname();

  return (
    // Abas de página no desenho `line` do DS (§10.7): altura 40, texto sm/500,
    // a ativa em `foreground` com sublinhado de 2px `primary` recuado 12px.
    // São links (cada aba é uma rota), por isso não usam o `Tabs` do Radix.
    <nav className="flex overflow-x-auto border-b border-border [scrollbar-width:none]">
      {tabs.map((tab) => {
        const href = basePath + tab.href;
        // Overview matches exactly; others match as prefix
        const isActive = tab.href === ""
          ? pathname === basePath || pathname === basePath + "/"
          : pathname.startsWith(href);

        return (
          <Link
            key={tab.label}
            href={tab.disabled ? "#" : href}
            aria-disabled={tab.disabled}
            aria-current={isActive && !tab.disabled ? "page" : undefined}
            className={[
              "relative inline-flex h-10 shrink-0 items-center px-3 text-sm font-medium whitespace-nowrap transition-colors",
              tab.disabled
                ? "cursor-not-allowed text-muted-foreground"
                : isActive
                  ? "text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary"
                  : "text-muted-foreground hover:text-foreground",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {t(tab.label)}
            {tab.disabled && (
              <span className="ml-1.5 text-xs font-normal opacity-60">
                {t("em breve")}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
