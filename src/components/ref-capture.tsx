"use client";

import { useEffect } from "react";

/** Captures ?ref=CODE from the landing page into a 30-day cookie. */
export function RefCapture() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && /^CREW-[A-Z0-9]{4,16}$/i.test(ref.trim())) {
      document.cookie = `crewos_ref=${encodeURIComponent(ref.trim().toUpperCase())};max-age=${60 * 60 * 24 * 30};path=/;samesite=lax`;
    }
  }, []);
  return null;
}
