"use client";

import { useState, useCallback, useEffect } from "react";

const COOKIE_NAME = "carte_wishlist";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function readCookie(): string[] {
  if (typeof document === "undefined") return [];
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(COOKIE_NAME + "="));
  if (!match) return [];
  try {
    return JSON.parse(decodeURIComponent(match.split("=")[1]));
  } catch {
    return [];
  }
}

function writeCookie(ids: string[]) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(ids))}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

export function useWishlist() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setSavedIds(readCookie());
  }, []);

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
        writeCookie(next);
        return next;
      });
    },
    [],
  );

  const clear = useCallback(() => {
    setSavedIds([]);
    writeCookie([]);
  }, []);

  return { savedIds, isSaved, toggle, clear, count: savedIds.length };
}
