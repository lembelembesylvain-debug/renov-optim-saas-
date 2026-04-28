"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DPE_GAUGE_COLORS,
  DPE_GAUGE_ORDER,
  DPE_KWH_LABELS,
  dpeGaugeTextColor,
  type DpeGaugeLetter,
} from "@/lib/dpe-gauge-shared";

export type DpeLetter = DpeGaugeLetter;

type DpeGaugeProps = {
  current: DpeGaugeLetter;
  target: DpeGaugeLetter;
  onPickTarget?: (d: DpeGaugeLetter) => void;
};

/** Jauge DPE A→G (couleurs officielles, bordures actuel / cible, kWh/m²/an sous chaque case). */
export function DpeGauge({ current, target, onPickTarget }: DpeGaugeProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-800">Jauge DPE (A → G)</p>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {DPE_GAUGE_ORDER.map((L) => {
          const isCurrent = L === current;
          const isTarget = L === target;
          const bg = DPE_GAUGE_COLORS[L];
          const kwh = DPE_KWH_LABELS[L];
          const textCol = dpeGaugeTextColor(L);
          const Inner = (
            <>
              <div
                className="relative flex h-11 min-w-[2.5rem] items-center justify-center rounded-md text-sm font-bold shadow-sm sm:h-12 sm:min-w-[2.75rem]"
                style={{ backgroundColor: bg, color: textCol }}
              >
                {L}
                {isCurrent && (
                  <span
                    className="pointer-events-none absolute inset-0 rounded-md ring-[3px] ring-black ring-offset-0"
                    aria-hidden
                  />
                )}
                {isTarget && (
                  <span
                    className="pointer-events-none absolute inset-0 rounded-md ring-[3px] ring-emerald-700 ring-offset-0"
                    aria-hidden
                  />
                )}
              </div>
              <p className="mt-1 max-w-[3.25rem] text-center text-[10px] leading-tight text-zinc-600 sm:text-[11px]">
                {kwh}
                <span className="block text-[9px] font-normal text-zinc-500">kWh/m²/an</span>
              </p>
            </>
          );
          if (onPickTarget) {
            return (
              <button
                key={L}
                type="button"
                onClick={() => onPickTarget(L)}
                className="flex flex-col items-center rounded-md p-0.5 transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                title={`Définir la cible sur ${L}`}
              >
                {Inner}
              </button>
            );
          }
          return (
            <div key={L} className="flex flex-col items-center">
              {Inner}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-zinc-600">
        Actuel <span className="font-semibold text-zinc-900">{current}</span> — Cible{" "}
        <span className="font-semibold text-emerald-800">{target}</span>
        {onPickTarget ? " (cliquez sur une lettre pour ajuster la cible)" : ""}
      </p>
    </div>
  );
}

export const InteractiveDpeGauge = DpeGauge;

export type RoiChartProps = {
  years: number;
  annualBillWithoutWorks: number;
  annualBillWithWorks: number;
  resteACharge: number;
};

function formatEur(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}

export function DashboardRoiChart({
  years,
  annualBillWithoutWorks,
  annualBillWithWorks,
  resteACharge,
}: RoiChartProps) {
  const data = useMemo(() => {
    const rows: { year: number; sans: number; avec: number }[] = [];
    let cumSans = 0;
    let cumAvec = resteACharge;
    for (let y = 1; y <= years; y++) {
      cumSans += annualBillWithoutWorks;
      cumAvec += annualBillWithWorks;
      rows.push({ year: y, sans: Math.round(cumSans), avec: Math.round(cumAvec) });
    }
    return rows;
  }, [annualBillWithoutWorks, annualBillWithWorks, resteACharge, years]);

  const roiYear = useMemo(() => {
    const delta = annualBillWithoutWorks - annualBillWithWorks;
    if (delta <= 0 || resteACharge <= 0) return null;
    return Math.ceil(resteACharge / delta);
  }, [annualBillWithoutWorks, annualBillWithWorks, resteACharge]);

  const roiPoint = useMemo(() => {
    if (roiYear == null || roiYear < 1 || roiYear > years) return null;
    const row = data[roiYear - 1];
    if (!row) return null;
    return { year: roiYear, y: row.avec };
  }, [data, roiYear, years]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-800">ROI sur {years} ans</p>
      <p className="text-xs text-zinc-600">
        Ligne rouge : coût cumulé sans travaux (facture énergétique). Ligne verte : investissement (reste à charge) +
        factures réduites après travaux.
      </p>
      {roiYear != null && roiYear <= years ? (
        <p className="text-sm font-semibold text-emerald-800">Rentabilisé en {roiYear} année{roiYear > 1 ? "s" : ""}</p>
      ) : roiYear != null ? (
        <p className="text-xs text-amber-700">ROI estimé au-delà de {years} ans (affichage tronqué).</p>
      ) : null}
      <div className="h-64 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 24, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11 }}
              label={{ value: "Année", position: "insideBottom", offset: -2, fontSize: 11 }}
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip formatter={(v: number) => formatEur(v)} />
            <Legend />
            <Line type="monotone" dataKey="sans" name="Sans travaux" stroke="#dc2626" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="avec" name="Avec travaux" stroke="#16a34a" strokeWidth={2} dot={false} />
            {roiPoint ? (
              <ReferenceDot
                x={roiPoint.year}
                y={roiPoint.y}
                r={7}
                fill="#16a34a"
                stroke="#fff"
                strokeWidth={2}
                ifOverflow="extendDomain"
                label={{
                  value: "ROI atteint",
                  position: "top",
                  fill: "#166534",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export type AidesPieProps = {
  mpr: number;
  cee: number;
  tva: number;
  aidesLocales: number;
  reste: number;
};

const PIE_COLORS = {
  MPR: "#2d9c2d",
  CEE: "#2563eb",
  TVA: "#f0a000",
  LOCAL: "#7c3aed",
  RESTE: "#c81e00",
} as const;

export function DashboardAidesPie({ mpr, cee, tva, aidesLocales, reste }: AidesPieProps) {
  const slices = useMemo(
    () => [
      { name: "MPR", value: Math.max(0, Math.round(mpr)), color: PIE_COLORS.MPR },
      { name: "CEE", value: Math.max(0, Math.round(cee)), color: PIE_COLORS.CEE },
      { name: "TVA", value: Math.max(0, Math.round(tva)), color: PIE_COLORS.TVA },
      { name: "Aides locales", value: Math.max(0, Math.round(aidesLocales)), color: PIE_COLORS.LOCAL },
      { name: "Reste à charge", value: Math.max(0, Math.round(reste)), color: PIE_COLORS.RESTE },
    ],
    [mpr, cee, tva, aidesLocales, reste],
  );

  const totalAidesOnly = slices.slice(0, 4).reduce((s, d) => s + d.value, 0);
  const totalChart = slices.reduce((s, d) => s + d.value, 0);
  if (totalChart === 0) {
    return <p className="text-sm text-zinc-500">Aucune donnée pour le camembert.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-800">Camembert aides</p>
      <div className="relative h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={92}
              paddingAngle={1}
              labelLine={false}
            >
              {slices.map((e) => (
                <Cell key={e.name} fill={e.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => formatEur(v)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-2">
          <div className="text-center">
            <p className="text-[11px] font-medium text-zinc-500">Total aides</p>
            <p className="text-sm font-bold text-zinc-900">{formatEur(totalAidesOnly)}</p>
          </div>
        </div>
      </div>
      <ul className="space-y-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs">
        {slices.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-medium text-zinc-800">
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.name}
            </span>
            <span className="tabular-nums text-zinc-700">{formatEur(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
