"use client";

import { useState, useCallback, useEffect } from "react";

const COOKIE_PREFIX = "carte_wishlist_";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function readCookie(slug: string): string[] {
  if (typeof document === "undefined") return [];
  const name = COOKIE_PREFIX + slug;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(name + "="));
  if (!match) return [];
  try {
    return JSON.parse(decodeURIComponent(match.split("=")[1]));
  } catch {
    return [];
  }
}

function writeCookie(slug: string, ids: string[]) {
  const name = COOKIE_PREFIX + slug;
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(ids))}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

export function useWishlist(slug: string) {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setSavedIds(readCookie(slug));
  }, [slug]);

  const isSaved = useCallback(
    (dishId: string) => savedIds.includes(dishId),
    [savedIds],
  );

  const toggle = useCallback(
    (dishIds: string[]) => {
      setSavedIds((prev) => {
        const allSaved = dishIds.every((id) => prev.includes(id));
        let next: string[];
        if (allSaved) {
          next = prev.filter((id) => !dishIds.includes(id));
        } else {
          const toAdd = dishIds.filter((id) => !prev.includes(id));
          next = [...prev, ...toAdd];
        }
        writeCookie(slug, next);
        return next;
      });
    },
    [],
  );

  const clear = useCallback(() => {
    setSavedIds([]);
    writeCookie(slug, []);
  }, []);

  return { savedIds, isSaved, toggle, clear, count: savedIds.length };
}
