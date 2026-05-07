"use client";

import { useEffect } from "react";

/** Sets a `tz` cookie from the browser's timezone so server components can use it. */
export function TzCookie() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && !document.cookie.includes(`tz=${tz}`)) {
      document.cookie = `tz=${tz}; path=/; max-age=${365 * 24 * 60 * 60}`;
    }
  }, []);
  return null;
}
