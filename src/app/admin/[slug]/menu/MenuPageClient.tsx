"use client";

import { useState } from "react";
import type { RestaurantMenu } from "@/types/menu";
import type { AdminLocale } from "@/lib/admin-i18n";
import { getAdminDict } from "@/lib/admin-i18n";
import { MenuEditor } from "@/components/admin/MenuEditor";
import { MenuImporter } from "@/components/admin/MenuImporter";
import { VersionHistory } from "@/components/admin/VersionHistory";

interface MenuPageProps {
  menu: RestaurantMenu | null;
  slug: string;
  version: number;
  cuisine?: string;
  restaurantName?: string;
  locale?: AdminLocale;
}

export function MenuPage({ menu: initialMenu, slug, version, cuisine, restaurantName, locale = "en" }: MenuPageProps) {
  const t = getAdminDict(locale);
  const [menu, setMenu] = useState<RestaurantMenu | null>(initialMenu);
  const [showImporter, setShowImporter] = useState(!initialMenu);
  const [isNewImport, setIsNewImport] = useState(false);

  function handleImported(draft: RestaurantMenu) {
    setMenu(draft);
    setIsNewImport(true);
    setShowImporter(false);
  }

  // No menu and showing importer
  if (showImporter) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t.menuManagement}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t.importMenuDesc}</p>
          </div>
          {menu && (
            <button
              type="button"
              onClick={() => setShowImporter(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              &larr; {t.menuManagement}
            </button>
          )}
        </div>
        <div className="mt-8">
          <MenuImporter slug={slug} restaurantName={restaurantName} locale={locale} onImported={handleImported} />
        </div>
      </div>
    );
  }

  // Has menu — show editor with version history + re-import
  if (menu) {
    return (
      <div>
        <div className="mb-4 flex justify-end">
          <VersionHistory
            slug={slug}
            currentVersion={version}
            labels={{
              versionHistory: t.versionHistory,
              versionLabel: t.versionLabel,
              currentVersion: t.currentVersion,
              rollbackTo: t.rollbackTo,
              rollbackConfirm: t.rollbackConfirm,
              rollbackSuccess: t.rollbackSuccess,
              rollbackMaxNotice: t.rollbackMaxNotice,
              noVersions: t.noVersions,
            }}
            onRollback={() => window.location.reload()}
          />
        </div>
        <MenuEditor
          menu={menu}
          slug={slug}
          version={version}
          cuisine={cuisine}
          locale={locale}
          isNewImport={isNewImport}
          onReImport={() => setShowImporter(true)}
        />
      </div>
    );
  }

  // Fallback (shouldn't reach here)
  return null;
}
