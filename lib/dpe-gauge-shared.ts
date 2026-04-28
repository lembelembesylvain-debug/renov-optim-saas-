/** Couleurs officielles jauge DPE (A→G) — dashboard + PDF. */
export const DPE_GAUGE_ORDER = ["A", "B", "C", "D", "E", "F", "G"] as const;
export type DpeGaugeLetter = (typeof DPE_GAUGE_ORDER)[number];

export const DPE_GAUGE_COLORS: Record<DpeGaugeLetter, string> = {
  A: "#2d9c2d",
  B: "#51b84b",
  C: "#a0c832",
  D: "#f0d000",
  E: "#f0a000",
  F: "#e05a00",
  G: "#c81e00",
};

/** Libellés kWh/m²/an indicatifs (affichage sous chaque case). */
export const DPE_KWH_LABELS: Record<DpeGaugeLetter, string> = {
  A: "≤70",
  B: "71-110",
  C: "111-180",
  D: "181-250",
  E: "251-330",
  F: "331-420",
  G: ">420",
};

export function normalizeDpeLetter(v: string | null | undefined, fallback: DpeGaugeLetter): DpeGaugeLetter {
  const u = (v || fallback).toUpperCase();
  return (DPE_GAUGE_ORDER.includes(u as DpeGaugeLetter) ? u : fallback) as DpeGaugeLetter;
}

/** Contraste lisible sur la pastille colorée. */
export function dpeGaugeTextColor(letter: DpeGaugeLetter): string {
  return letter === "A" || letter === "F" || letter === "G" ? "#ffffff" : "#111827";
}
