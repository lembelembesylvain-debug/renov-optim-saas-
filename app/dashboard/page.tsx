"use client";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { generateRenovationReportPdf } from "@/lib/dashboard/generate-renovation-report-pdf";
import { SignOutButton } from "./sign-out-button";

type MprProfile = "TM" | "MO" | "INT" | "SUP";
type Zone = "IDF" | "HORS_IDF";
type Dpe = "A" | "B" | "C" | "D" | "E" | "F" | "G";

type Step1Data = {
  housingType: "MAISON" | "APPARTEMENT" | "COPROPRIETE";
  surfaceM2: number;
  constructionPeriod: "AV1948" | "P1948_74" | "P1975_89" | "P1990_2000" | "P2001_2012" | "AP2012";
  zone: Zone;
  dpe: Dpe;
  income: number;
  persons: number;
};

type WorksData = {
  comblesPerdusM2: number;
  comblesAmenagesM2: number;
  plancherBasM2: number;
  toitureTerrasseM2: number;
  iteM2: number;
  itiM2: number;
  fenetresCount: number;
  portesEntreeCount: number;
  voletsCount: number;
  pacAirEauKw: number;
  pacAirAirKw: number;
  pacGeoKw: number;
  chauffeEauThermoL: number;
  cesiM2: number;
  chaudiereBiomasseKw: number;
  deposeCuveFioul: boolean;
  vmcSimpleM2: number;
  vmcDoubleM2: number;
  pvKwc: number;
  auditEnergetique: boolean;
  dpeGainTarget: "2_CLASSES" | "3_CLASSES_OU_PLUS";
};

const DEFAULT_STEP1: Step1Data = {
  housingType: "MAISON",
  surfaceM2: 100,
  constructionPeriod: "P1975_89",
  zone: "HORS_IDF",
  dpe: "E",
  income: 30000,
  persons: 2,
};

const DEFAULT_WORKS: WorksData = {
  comblesPerdusM2: 0,
  comblesAmenagesM2: 0,
  plancherBasM2: 0,
  toitureTerrasseM2: 0,
  iteM2: 0,
  itiM2: 0,
  fenetresCount: 0,
  portesEntreeCount: 0,
  voletsCount: 0,
  pacAirEauKw: 0,
  pacAirAirKw: 0,
  pacGeoKw: 0,
  chauffeEauThermoL: 0,
  cesiM2: 0,
  chaudiereBiomasseKw: 0,
  deposeCuveFioul: false,
  vmcSimpleM2: 0,
  vmcDoubleM2: 0,
  pvKwc: 0,
  auditEnergetique: false,
  dpeGainTarget: "2_CLASSES",
};

const MPR_LIMITS = {
  HORS_IDF: {
    TM: [17363, 25393, 30540, 35676, 40835],
    MO: [22259, 32553, 39148, 45735, 52348],
    INT: [31185, 45842, 55196, 64550, 73907],
    extra: { TM: 5151, MO: 6598, INT: 9357 },
  },
  IDF: {
    TM: [24031, 35270, 42357, 49455, 56580],
    MO: [29253, 42933, 51564, 60208, 68877],
    INT: [40851, 60051, 71846, 84562, 96817],
    extra: { TM: 7116, MO: 8663, INT: 12257 },
  },
} as const;

const PROFILE_LABELS: Record<MprProfile, string> = {
  TM: "Très modeste",
  MO: "Modeste",
  INT: "Intermédiaire",
  SUP: "Supérieur",
};

const PROFILE_BADGES: Record<MprProfile, string> = {
  TM: "bg-blue-100 text-blue-700 border-blue-200",
  MO: "bg-yellow-100 text-yellow-700 border-yellow-200",
  INT: "bg-purple-100 text-purple-700 border-purple-200",
  SUP: "bg-pink-100 text-pink-700 border-pink-200",
};

const GESTE_RATES = {
  comblesPerdusM2: { TM: 25, MO: 20, INT: 15, SUP: 0 },
  comblesAmenagesM2: { TM: 25, MO: 20, INT: 15, SUP: 0 },
  plancherBasM2: { TM: 50, MO: 40, INT: 25, SUP: 0 },
  toitureTerrasseM2: { TM: 75, MO: 60, INT: 40, SUP: 0 },
  fenetresCount: { TM: 100, MO: 80, INT: 40, SUP: 0 },
  portesEntreeCount: { TM: 150, MO: 120, INT: 80, SUP: 0 },
  pacAirEauKw: { TM: 5000, MO: 4000, INT: 3000, SUP: 0 },
  pacGeoKw: { TM: 11000, MO: 9000, INT: 6000, SUP: 0 },
  pacAirAirKw: { TM: 1200, MO: 900, INT: 600, SUP: 0 },
  cesiM2: { TM: 4000, MO: 3000, INT: 2000, SUP: 0 },
  chauffeEauThermoL: { TM: 1200, MO: 800, INT: 400, SUP: 0 },
  deposeCuveFioul: { TM: 1200, MO: 800, INT: 400, SUP: 0 },
  vmcDoubleM2: { TM: 4000, MO: 3000, INT: 2000, SUP: 0 },
  vmcSimpleM2: { TM: 800, MO: 600, INT: 400, SUP: 0 },
  auditEnergetique: { TM: 500, MO: 400, INT: 300, SUP: 0 },
} as const;

function safeNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getProfile(zone: Zone, persons: number, income: number): MprProfile {
  const table = MPR_LIMITS[zone];
  const index = Math.min(persons, 5) - 1;
  const extraPeople = Math.max(persons - 5, 0);
  const tmLimit = table.TM[index] + extraPeople * table.extra.TM;
  const moLimit = table.MO[index] + extraPeople * table.extra.MO;
  const intLimit = table.INT[index] + extraPeople * table.extra.INT;

  if (income <= tmLimit) return "TM";
  if (income <= moLimit) return "MO";
  if (income <= intLimit) return "INT";
  return "SUP";
}

function formatCurrency(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

type Step2EstimateRow = {
  key: string;
  label: string;
  quantity: string;
  lowCost: number;
  highCost: number;
  mpr: number;
  mprNote?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [, setLoadingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [step1, setStep1] = useState<Step1Data>(DEFAULT_STEP1);
  const [works, setWorks] = useState<WorksData>(DEFAULT_WORKS);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      setLoadingAuth(false);
      setSaveMessage("Variables Supabase absentes: authentification et sauvegarde désactivées.");
      return;
    }
    setSupabase(createSupabaseClient(url, anonKey));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const sb = supabase;
    let resolved = false;
    const sessionTimeout = window.setTimeout(() => {
      if (!resolved) {
        setLoadingAuth(false);
        router.replace("/login");
      }
    }, 3000);

    async function checkSession() {
      try {
        const { data } = await sb.auth.getUser();
        resolved = true;
        const user = data.user;
        if (!user) {
          router.replace("/login");
          return;
        }
        setUserId(user.id);
        setUserEmail(user.email ?? null);
        setLoadingAuth(false);
      } catch {
        resolved = true;
        setLoadingAuth(false);
      }
    }
    checkSession();

    return () => {
      window.clearTimeout(sessionTimeout);
    };
  }, [router, supabase]);

  const profile = useMemo(
    () => getProfile(step1.zone, step1.persons, step1.income),
    [step1.zone, step1.persons, step1.income]
  );

  const hasIsolationGesture =
    works.comblesPerdusM2 > 0 ||
    works.comblesAmenagesM2 > 0 ||
    works.plancherBasM2 > 0 ||
    works.toitureTerrasseM2 > 0 ||
    works.iteM2 > 0 ||
    works.itiM2 > 0;

  const isolationGesturesCount = [
    works.comblesPerdusM2 > 0,
    works.comblesAmenagesM2 > 0,
    works.plancherBasM2 > 0,
    works.toitureTerrasseM2 > 0,
    works.iteM2 > 0,
    works.itiM2 > 0,
  ].filter(Boolean).length;

  const parcoursEligible = ["E", "F", "G"].includes(step1.dpe) && isolationGesturesCount >= 2;

  const isParGesteOnly =
    ["A", "B", "C", "D"].includes(step1.dpe) || profile === "SUP" || isolationGesturesCount < 2;

  const vmcDisabled = !hasIsolationGesture;
  const supParGesteBlocked = profile === "SUP";

  const estimatedWorksCost = useMemo(() => {
    const prices = {
      comblesPerdusM2: 65,
      comblesAmenagesM2: 95,
      plancherBasM2: 80,
      toitureTerrasseM2: 180,
      iteM2: 190,
      itiM2: 120,
      fenetresCount: 650,
      portesEntreeCount: 1800,
      voletsCount: 300,
      pacAirEauKw: 12000,
      pacAirAirKw: 3500,
      pacGeoKw: 22000,
      chauffeEauThermoL: 3500,
      cesiM2: 7000,
      chaudiereBiomasseKw: 13000,
      vmcSimpleM2: 2800,
      vmcDoubleM2: 8000,
      pvKwc: 2500,
      auditEnergetique: 900,
    };

    return (
      works.comblesPerdusM2 * prices.comblesPerdusM2 +
      works.comblesAmenagesM2 * prices.comblesAmenagesM2 +
      works.plancherBasM2 * prices.plancherBasM2 +
      works.toitureTerrasseM2 * prices.toitureTerrasseM2 +
      works.iteM2 * prices.iteM2 +
      works.itiM2 * prices.itiM2 +
      works.fenetresCount * prices.fenetresCount +
      works.portesEntreeCount * prices.portesEntreeCount +
      works.voletsCount * prices.voletsCount +
      (works.pacAirEauKw > 0 ? prices.pacAirEauKw : 0) +
      (works.pacAirAirKw > 0 ? prices.pacAirAirKw : 0) +
      (works.pacGeoKw > 0 ? prices.pacGeoKw : 0) +
      (works.chauffeEauThermoL > 0 ? prices.chauffeEauThermoL : 0) +
      (works.cesiM2 > 0 ? prices.cesiM2 : 0) +
      (works.chaudiereBiomasseKw > 0 ? prices.chaudiereBiomasseKw : 0) +
      (works.vmcSimpleM2 > 0 ? prices.vmcSimpleM2 : 0) +
      (works.vmcDoubleM2 > 0 ? prices.vmcDoubleM2 : 0) +
      works.pvKwc * prices.pvKwc +
      (works.auditEnergetique ? prices.auditEnergetique : 0)
    );
  }, [works]);

  const mprParcours = useMemo(() => {
    if (!parcoursEligible) return 0;
    const plafond = works.dpeGainTarget === "2_CLASSES" ? 30000 : 40000;
    const rateMap = {
      TM: works.dpeGainTarget === "2_CLASSES" ? 0.9 : 1,
      MO: 0.8,
      INT: 0.5,
      SUP: 0.1,
    };
    return Math.min(estimatedWorksCost, plafond) * rateMap[profile];
  }, [estimatedWorksCost, parcoursEligible, profile, works.dpeGainTarget]);

  const mprParGeste = useMemo(() => {
    if (!isParGesteOnly || supParGesteBlocked) return 0;
    const capped = {
      comblesPerdusM2: Math.min(works.comblesPerdusM2, 100),
      comblesAmenagesM2: Math.min(works.comblesAmenagesM2, 100),
      plancherBasM2: Math.min(works.plancherBasM2, 100),
      toitureTerrasseM2: Math.min(works.toitureTerrasseM2, 100),
      fenetresCount: Math.min(works.fenetresCount, 10),
      portesEntreeCount: Math.min(works.portesEntreeCount, 10),
    };

    const vmcFactor = vmcDisabled ? 0 : 1;
    const wallIsolationAllowed = parcoursEligible ? 0 : 0;
    const biomasseAllowed = parcoursEligible ? 0 : 0;

    return (
      capped.comblesPerdusM2 * GESTE_RATES.comblesPerdusM2[profile] +
      capped.comblesAmenagesM2 * GESTE_RATES.comblesAmenagesM2[profile] +
      capped.plancherBasM2 * GESTE_RATES.plancherBasM2[profile] +
      capped.toitureTerrasseM2 * GESTE_RATES.toitureTerrasseM2[profile] +
      wallIsolationAllowed * (works.iteM2 + works.itiM2) +
      capped.fenetresCount * GESTE_RATES.fenetresCount[profile] +
      capped.portesEntreeCount * GESTE_RATES.portesEntreeCount[profile] +
      (works.pacAirEauKw > 0 ? GESTE_RATES.pacAirEauKw[profile] : 0) +
      (works.pacGeoKw > 0 ? GESTE_RATES.pacGeoKw[profile] : 0) +
      (works.pacAirAirKw > 0 ? GESTE_RATES.pacAirAirKw[profile] : 0) +
      (works.cesiM2 > 0 ? GESTE_RATES.cesiM2[profile] : 0) +
      (works.chauffeEauThermoL > 0 ? GESTE_RATES.chauffeEauThermoL[profile] : 0) +
      (works.deposeCuveFioul ? GESTE_RATES.deposeCuveFioul[profile] : 0) +
      vmcFactor * (works.vmcDoubleM2 > 0 ? GESTE_RATES.vmcDoubleM2[profile] : 0) +
      vmcFactor * (works.vmcSimpleM2 > 0 ? GESTE_RATES.vmcSimpleM2[profile] : 0) +
      biomasseAllowed * (works.chaudiereBiomasseKw > 0 ? 1 : 0) +
      (works.auditEnergetique ? GESTE_RATES.auditEnergetique[profile] : 0)
    );
  }, [isParGesteOnly, supParGesteBlocked, vmcDisabled, parcoursEligible, works, profile]);

  const mprTotal = parcoursEligible ? mprParcours : mprParGeste;

  const ceeEstimate = useMemo(() => {
    const avg = (min: number, max: number) => (min + max) / 2;
    return (
      works.comblesPerdusM2 * avg(10, 20) +
      works.comblesAmenagesM2 * avg(10, 20) +
      (works.iteM2 + works.itiM2) * avg(15, 25) +
      works.plancherBasM2 * avg(15, 20) +
      works.fenetresCount * avg(50, 80) +
      (works.pacAirEauKw > 0 ? avg(2500, 4000) : 0) +
      (works.pacAirAirKw > 0 ? avg(500, 800) : 0) +
      (works.chaudiereBiomasseKw > 0 ? avg(3000, 4500) : 0) +
      (works.vmcDoubleM2 > 0 ? avg(400, 600) : 0) +
      (works.chauffeEauThermoL > 0 ? avg(100, 150) : 0)
    );
  }, [works]);

  const actionCount = useMemo(
    () =>
      [
        hasIsolationGesture,
        works.fenetresCount > 0 || works.portesEntreeCount > 0 || works.voletsCount > 0,
        works.pacAirEauKw > 0 ||
          works.pacAirAirKw > 0 ||
          works.pacGeoKw > 0 ||
          works.chauffeEauThermoL > 0 ||
          works.cesiM2 > 0 ||
          works.chaudiereBiomasseKw > 0,
        works.vmcSimpleM2 > 0 || works.vmcDoubleM2 > 0,
        works.auditEnergetique,
      ].filter(Boolean).length,
    [hasIsolationGesture, works]
  );

  const ecoPtz = useMemo(() => {
    if (parcoursEligible) return 50000;
    if (actionCount >= 3) return 50000;
    if (actionCount === 2) return 25000;
    if (actionCount === 1) return 15000;
    return 0;
  }, [actionCount, parcoursEligible]);

  const step2Rows = useMemo<Step2EstimateRow[]>(() => {
    const rows: Step2EstimateRow[] = [];

    const add = (
      key: string,
      label: string,
      quantity: string,
      lowCost: number,
      highCost: number,
      mpr: number,
      mprNote?: string
    ) => {
      rows.push({ key, label, quantity, lowCost, highCost, mpr, mprNote });
    };

    const addM2Row = (
      key: keyof WorksData,
      label: string,
      unitLow: number,
      unitHigh: number,
      mprRate: number,
      cap = Number.POSITIVE_INFINITY,
      mprNote?: string
    ) => {
      const value = works[key] as number;
      if (value <= 0) return;
      const effectiveMprQty = Math.min(value, cap);
      add(
        key,
        label,
        `${value} m²`,
        value * unitLow,
        value * unitHigh,
        effectiveMprQty * mprRate,
        mprNote
      );
    };

    const addUnitRow = (
      key: keyof WorksData,
      label: string,
      unitLow: number,
      unitHigh: number,
      mprRate: number,
      cap = Number.POSITIVE_INFINITY,
      mprNote?: string
    ) => {
      const value = works[key] as number;
      if (value <= 0) return;
      const effectiveMprQty = Math.min(value, cap);
      add(
        key,
        label,
        `${value} u`,
        value * unitLow,
        value * unitHigh,
        effectiveMprQty * mprRate,
        mprNote
      );
    };

    const addFixedRow = (
      key: keyof WorksData,
      label: string,
      isSelected: boolean,
      lowCost: number,
      highCost: number,
      mpr: number,
      quantityLabel = "1 équipement",
      mprNote?: string
    ) => {
      if (!isSelected) return;
      add(key, label, quantityLabel, lowCost, highCost, mpr, mprNote);
    };

    addM2Row("comblesPerdusM2", "Isolation combles perdus", 40, 70, GESTE_RATES.comblesPerdusM2[profile], 100);
    addM2Row("comblesAmenagesM2", "Isolation combles aménagés", 60, 90, GESTE_RATES.comblesAmenagesM2[profile], 100);
    addM2Row("plancherBasM2", "Isolation plancher bas", 60, 100, GESTE_RATES.plancherBasM2[profile], 100);
    addM2Row("toitureTerrasseM2", "Isolation toiture terrasse", 120, 200, GESTE_RATES.toitureTerrasseM2[profile], 100);
    addM2Row("iteM2", "ITE", 140, 220, 0, Number.POSITIVE_INFINITY, "Parcours Accompagné uniquement");
    addM2Row("itiM2", "ITI", 90, 150, 0, Number.POSITIVE_INFINITY, "Parcours Accompagné uniquement");

    addUnitRow("fenetresCount", "Fenêtres / Portes-fenêtres", 450, 800, GESTE_RATES.fenetresCount[profile], 10);
    addUnitRow("portesEntreeCount", "Portes d'entrée isolantes", 1200, 2200, GESTE_RATES.portesEntreeCount[profile], 10);
    addUnitRow("voletsCount", "Volets isolants", 180, 350, 0, Number.POSITIVE_INFINITY, "Non éligible MPR");

    addFixedRow(
      "pacAirEauKw",
      "PAC Air/Eau",
      works.pacAirEauKw > 0,
      9000,
      15000,
      GESTE_RATES.pacAirEauKw[profile],
      `${works.pacAirEauKw} kW`
    );
    addFixedRow(
      "pacAirAirKw",
      "PAC Air/Air",
      works.pacAirAirKw > 0,
      2500,
      5000,
      GESTE_RATES.pacAirAirKw[profile],
      `${works.pacAirAirKw} kW`
    );
    addFixedRow(
      "pacGeoKw",
      "PAC Géothermique",
      works.pacGeoKw > 0,
      17000,
      30000,
      GESTE_RATES.pacGeoKw[profile],
      `${works.pacGeoKw} kW`
    );
    addFixedRow(
      "chauffeEauThermoL",
      "Chauffe-eau thermodynamique",
      works.chauffeEauThermoL > 0,
      2500,
      4500,
      GESTE_RATES.chauffeEauThermoL[profile],
      `${works.chauffeEauThermoL} L`
    );
    addFixedRow(
      "cesiM2",
      "Chauffe-eau solaire (CESI)",
      works.cesiM2 > 0,
      5500,
      9000,
      GESTE_RATES.cesiM2[profile],
      `${works.cesiM2} m² capteurs`
    );
    addFixedRow(
      "chaudiereBiomasseKw",
      "Chaudière biomasse",
      works.chaudiereBiomasseKw > 0,
      9000,
      16000,
      0,
      `${works.chaudiereBiomasseKw} kW`,
      "Parcours Accompagné uniquement"
    );
    addFixedRow(
      "deposeCuveFioul",
      "Dépose cuve fioul",
      works.deposeCuveFioul,
      800,
      1800,
      GESTE_RATES.deposeCuveFioul[profile],
      "Oui"
    );
    addFixedRow(
      "vmcSimpleM2",
      "VMC simple flux hygro",
      works.vmcSimpleM2 > 0,
      1800,
      3500,
      vmcDisabled ? 0 : GESTE_RATES.vmcSimpleM2[profile],
      `${works.vmcSimpleM2} m²`,
      vmcDisabled ? "MPR inactive sans geste isolation" : undefined
    );
    addFixedRow(
      "vmcDoubleM2",
      "VMC double flux",
      works.vmcDoubleM2 > 0,
      6000,
      10000,
      vmcDisabled ? 0 : GESTE_RATES.vmcDoubleM2[profile],
      `${works.vmcDoubleM2} m²`,
      vmcDisabled ? "MPR inactive sans geste isolation" : undefined
    );
    addFixedRow("pvKwc", "Panneaux photovoltaïques", works.pvKwc > 0, works.pvKwc * 1800, works.pvKwc * 2800, 0, `${works.pvKwc} kWc`, "Non éligible MPR");
    addFixedRow("auditEnergetique", "Audit énergétique DPE", works.auditEnergetique, 500, 1200, GESTE_RATES.auditEnergetique[profile], "Oui");

    return rows;
  }, [profile, vmcDisabled, works]);

  const step2RowByKey = useMemo(
    () =>
      step2Rows.reduce<Record<string, Step2EstimateRow>>((acc, row) => {
        acc[row.key] = row;
        return acc;
      }, {}),
    [step2Rows]
  );

  const estimateHint = (key: string) => {
    const row = step2RowByKey[key];
    if (!row) return null;
    return (
      <p className="mt-1 text-xs text-zinc-600">
        Coût estimé: {formatCurrency(row.lowCost)} - {formatCurrency(row.highCost)} | MPR estimée: {formatCurrency(row.mpr)}
        {row.mprNote ? ` (${row.mprNote})` : ""}
      </p>
    );
  };

  const tvaSavings = estimatedWorksCost * 0.145;
  const totalAides = mprTotal + ceeEstimate + tvaSavings;
  const resteCharge = Math.max(estimatedWorksCost - totalAides, 0);

  const annualSavings = useMemo(() => {
    const dpeFactor: Record<Dpe, number> = {
      A: 0.02,
      B: 0.03,
      C: 0.04,
      D: 0.05,
      E: 0.07,
      F: 0.09,
      G: 0.11,
    };
    return Math.max(estimatedWorksCost * dpeFactor[step1.dpe] * (1 + isolationGesturesCount * 0.08), 300);
  }, [estimatedWorksCost, step1.dpe, isolationGesturesCount]);

  const roiYears = annualSavings > 0 ? resteCharge / annualSavings : 0;

  async function saveCalculation() {
    if (!userId || !supabase) return;
    setSaving(true);
    setSaveMessage(null);
    const payload = {
      user_id: userId,
      surface_m2: step1.surfaceM2,
      zone: step1.zone,
      dpe_actuel: step1.dpe,
      profil_mpr: profile,
      travaux: works,
      total_mpr: Math.round(mprTotal),
      total_cee: Math.round(ceeEstimate),
      total_aides: Math.round(totalAides),
      reste_a_charge: Math.round(resteCharge),
    };
    const { error } = await supabase.from("calculations").insert(payload);
    if (error) {
      setSaveMessage(`Enregistrement impossible: ${error.message}`);
    } else {
      setSaveMessage("Calcul enregistré dans Supabase.");
    }
    setSaving(false);
  }

  function generatePdf() {
    generateRenovationReportPdf({
      step1: { ...step1 },
      works: { ...works },
      profile,
      profileLabel: PROFILE_LABELS[profile],
      userEmail,
      clientName: null,
      clientAddress: null,
      parcoursEligible,
      estimatedWorksCost,
      mprTotal,
      ceeEstimate,
      tvaSavings,
      totalAides,
      resteCharge,
      ecoPtz,
      annualSavings,
      roiYears,
      step2Rows: step2Rows.map((r) => ({ ...r })),
    });
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-900">
            Rénov&apos;Optim <span className="text-[#10b981]">IA</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/chat"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              💬 Expert MPR
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">MaPrimeRénov&apos; 2026 OFFICIEL</h1>
          <p className="mt-1 text-sm text-zinc-600">Barèmes ANAH Février 2026 - calcul estimatif non contractuel.</p>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-medium sm:text-sm">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`rounded-lg border px-3 py-2 text-center ${
                  currentStep >= step ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-zinc-200 text-zinc-500"
                }`}
              >
                Étape {step}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 1 && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Étape 1/3 - Logement</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-zinc-700">Type de logement</span>
                <div className="flex flex-wrap gap-3">
                  {[
                    ["MAISON", "Maison individuelle"],
                    ["APPARTEMENT", "Appartement"],
                    ["COPROPRIETE", "Copropriété"],
                  ].map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={step1.housingType === value}
                        onChange={() => setStep1((prev) => ({ ...prev, housingType: value as Step1Data["housingType"] }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-zinc-700">Surface habitable (m²)</span>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={step1.surfaceM2}
                  onChange={(e) =>
                    setStep1((prev) => ({
                      ...prev,
                      surfaceM2: Math.min(500, Math.max(10, safeNumber(e.target.value, 10))),
                    }))
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-zinc-700">Année de construction</span>
                <select
                  value={step1.constructionPeriod}
                  onChange={(e) =>
                    setStep1((prev) => ({ ...prev, constructionPeriod: e.target.value as Step1Data["constructionPeriod"] }))
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                >
                  <option value="AV1948">Avant 1948</option>
                  <option value="P1948_74">1948-1974</option>
                  <option value="P1975_89">1975-1989</option>
                  <option value="P1990_2000">1990-2000</option>
                  <option value="P2001_2012">2001-2012</option>
                  <option value="AP2012">Après 2012</option>
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-zinc-700">Zone géographique</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={step1.zone === "IDF"}
                      onChange={() => setStep1((prev) => ({ ...prev, zone: "IDF" }))}
                    />
                    Île-de-France
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={step1.zone === "HORS_IDF"}
                      onChange={() => setStep1((prev) => ({ ...prev, zone: "HORS_IDF" }))}
                    />
                    Hors Île-de-France
                  </label>
                </div>
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-zinc-700">DPE actuel</span>
                <div className="flex flex-wrap gap-2">
                  {["A", "B", "C", "D", "E", "F", "G"].map((dpe) => (
                    <label key={dpe} className="flex items-center gap-1">
                      <input
                        type="radio"
                        checked={step1.dpe === dpe}
                        onChange={() => setStep1((prev) => ({ ...prev, dpe: dpe as Dpe }))}
                      />
                      {dpe}
                    </label>
                  ))}
                </div>
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-zinc-700">Revenus foyer fiscal (€/an)</span>
                <input
                  type="number"
                  min={0}
                  value={step1.income}
                  onChange={(e) => setStep1((prev) => ({ ...prev, income: Math.max(0, safeNumber(e.target.value)) }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-zinc-700">Nombre de personnes</span>
                <select
                  value={step1.persons}
                  onChange={(e) => setStep1((prev) => ({ ...prev, persons: safeNumber(e.target.value, 1) }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                  <option value={6}>6+</option>
                </select>
              </label>
            </div>

            {["A", "B", "C", "D"].includes(step1.dpe) && (
              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Attention : Le Parcours Accompagné est réservé aux logements classés E, F ou G.
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-zinc-700">Profil détecté :</span>
              <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${PROFILE_BADGES[profile]}`}>
                {profile === "TM" ? "🔵" : profile === "MO" ? "🟡" : profile === "INT" ? "🟣" : "🌸"} {PROFILE_LABELS[profile]}
              </span>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Suivant
              </button>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Étape 2/3 - Travaux</h2>
            <p className="mt-1 text-sm text-zinc-600">Règles ANAH Février 2026 appliquées automatiquement.</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                ["comblesPerdusM2", "Isolation combles perdus (m²)"],
                ["comblesAmenagesM2", "Isolation combles aménagés (m²)"],
                ["plancherBasM2", "Isolation plancher bas (m²)"],
                ["toitureTerrasseM2", "Isolation toiture terrasse (m²)"],
              ].map(([key, label]) => (
                <label key={key} className="text-sm">
                  <span className="font-medium text-zinc-700">{label}</span>
                  <input
                    type="number"
                    min={0}
                    value={works[key as keyof WorksData] as number}
                    onChange={(e) =>
                      setWorks((prev) => ({ ...prev, [key]: Math.max(0, safeNumber(e.target.value)) }))
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                  />
                  {estimateHint(key)}
                </label>
              ))}

              <label className="text-sm">
                <span className="font-medium text-zinc-700">ITE (m²)</span>
                <div className="mb-1 mt-1 inline-flex rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-xs text-orange-700">
                  Éligible Parcours Accompagné uniquement
                </div>
                <input
                  type="number"
                  min={0}
                  value={works.iteM2}
                  onChange={(e) => setWorks((prev) => ({ ...prev, iteM2: Math.max(0, safeNumber(e.target.value)) }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
                {estimateHint("iteM2")}
              </label>

              <label className="text-sm">
                <span className="font-medium text-zinc-700">ITI (m²)</span>
                <div className="mb-1 mt-1 inline-flex rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-xs text-orange-700">
                  Éligible Parcours Accompagné uniquement
                </div>
                <input
                  type="number"
                  min={0}
                  value={works.itiM2}
                  onChange={(e) => setWorks((prev) => ({ ...prev, itiM2: Math.max(0, safeNumber(e.target.value)) }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
                {estimateHint("itiM2")}
              </label>

              <label className="text-sm">
                <span className="font-medium text-zinc-700">Fenêtres / Portes-fenêtres (unités)</span>
                <input
                  type="number"
                  min={0}
                  value={works.fenetresCount}
                  onChange={(e) =>
                    setWorks((prev) => ({ ...prev, fenetresCount: Math.max(0, safeNumber(e.target.value)) }))
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
                {estimateHint("fenetresCount")}
              </label>

              <label className="text-sm">
                <span className="font-medium text-zinc-700">Portes d&apos;entrée isolantes (unités)</span>
                <input
                  type="number"
                  min={0}
                  value={works.portesEntreeCount}
                  onChange={(e) =>
                    setWorks((prev) => ({ ...prev, portesEntreeCount: Math.max(0, safeNumber(e.target.value)) }))
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
                {estimateHint("portesEntreeCount")}
              </label>

              <label className="text-sm">
                <span className="font-medium text-zinc-700">Volets isolants (unités)</span>
                <input
                  type="number"
                  min={0}
                  value={works.voletsCount}
                  onChange={(e) => setWorks((prev) => ({ ...prev, voletsCount: Math.max(0, safeNumber(e.target.value)) }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
                {estimateHint("voletsCount")}
              </label>

              <label className="text-sm">
                <span className="font-medium text-zinc-700">PAC Air/Eau (kW)</span>
                <select
                  value={works.pacAirEauKw}
                  onChange={(e) => setWorks((prev) => ({ ...prev, pacAirEauKw: safeNumber(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                >
                  <option value={0}>Non</option>
                  {[6, 8, 10, 12, 14, 16].map((kw) => (
                    <option key={kw} value={kw}>
                      {kw} kW
                    </option>
                  ))}
                </select>
                {estimateHint("pacAirEauKw")}
              </label>

              <label className="text-sm">
                <span className="font-medium text-zinc-700">PAC Air/Air (kW)</span>
                <select
                  value={works.pacAirAirKw}
                  onChange={(e) => setWorks((prev) => ({ ...prev, pacAirAirKw: safeNumber(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                >
                  <option value={0}>Non</option>
                  {[6, 8, 10, 12, 14, 16].map((kw) => (
                    <option key={kw} value={kw}>
                      {kw} kW
                    </option>
                  ))}
                </select>
                {estimateHint("pacAirAirKw")}
              </label>

              <label className="text-sm">
                <span className="font-medium text-zinc-700">PAC Géothermique (kW)</span>
                <select
                  value={works.pacGeoKw}
                  onChange={(e) => setWorks((prev) => ({ ...prev, pacGeoKw: safeNumber(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                >
                  <option value={0}>Non</option>
                  {[6, 8, 10, 12, 14, 16].map((kw) => (
                    <option key={kw} value={kw}>
                      {kw} kW
                    </option>
                  ))}
                </select>
                {estimateHint("pacGeoKw")}
              </label>

              <label className="text-sm">
                <span className="font-medium text-zinc-700">Chauffe-eau thermodynamique (L)</span>
                <select
                  value={works.chauffeEauThermoL}
                  onChange={(e) => setWorks((prev) => ({ ...prev, chauffeEauThermoL: safeNumber(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                >
                  <option value={0}>Non</option>
                  {[200, 250, 300].map((liters) => (
                    <option key={liters} value={liters}>
                      {liters} L
                    </option>
                  ))}
                </select>
                {estimateHint("chauffeEauThermoL")}
              </label>

              <label className="text-sm">
                <span className="font-medium text-zinc-700">Chauffe-eau solaire (CESI) surface capteurs (m²)</span>
                <input
                  type="number"
                  min={0}
                  value={works.cesiM2}
                  onChange={(e) => setWorks((prev) => ({ ...prev, cesiM2: Math.max(0, safeNumber(e.target.value)) }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
                {estimateHint("cesiM2")}
              </label>

              <label className="text-sm">
                <span className="font-medium text-zinc-700">Chaudière biomasse (kW)</span>
                <div className="mb-1 mt-1 inline-flex rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-xs text-orange-700">
                  Éligible Parcours Accompagné uniquement
                </div>
                <input
                  type="number"
                  min={0}
                  value={works.chaudiereBiomasseKw}
                  onChange={(e) =>
                    setWorks((prev) => ({ ...prev, chaudiereBiomasseKw: Math.max(0, safeNumber(e.target.value)) }))
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
                {estimateHint("chaudiereBiomasseKw")}
              </label>

              <label className="text-sm">
                <span className="font-medium text-zinc-700">Dépose cuve fioul</span>
                <select
                  value={works.deposeCuveFioul ? "oui" : "non"}
                  onChange={(e) => setWorks((prev) => ({ ...prev, deposeCuveFioul: e.target.value === "oui" }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                >
                  <option value="non">Non</option>
                  <option value="oui">Oui</option>
                </select>
                {estimateHint("deposeCuveFioul")}
              </label>

              <label className="text-sm">
                <span className="font-medium text-zinc-700">VMC simple flux hygro (m²)</span>
                <input
                  type="number"
                  min={0}
                  disabled={vmcDisabled}
                  value={works.vmcSimpleM2}
                  onChange={(e) => setWorks((prev) => ({ ...prev, vmcSimpleM2: Math.max(0, safeNumber(e.target.value)) }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 disabled:bg-zinc-100"
                />
                {vmcDisabled && <p className="mt-1 text-xs text-amber-700">VMC éligible uniquement avec au moins un geste d&apos;isolation.</p>}
                {estimateHint("vmcSimpleM2")}
              </label>

              <label className="text-sm">
                <span className="font-medium text-zinc-700">VMC double flux (m²)</span>
                <input
                  type="number"
                  min={0}
                  disabled={vmcDisabled}
                  value={works.vmcDoubleM2}
                  onChange={(e) => setWorks((prev) => ({ ...prev, vmcDoubleM2: Math.max(0, safeNumber(e.target.value)) }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 disabled:bg-zinc-100"
                />
                {vmcDisabled && <p className="mt-1 text-xs text-amber-700">VMC éligible uniquement avec au moins un geste d&apos;isolation.</p>}
                {estimateHint("vmcDoubleM2")}
              </label>

              <label className="text-sm">
                <span className="font-medium text-zinc-700">Panneaux photovoltaïques (kWc)</span>
                <input
                  type="number"
                  min={0}
                  value={works.pvKwc}
                  onChange={(e) => setWorks((prev) => ({ ...prev, pvKwc: Math.max(0, safeNumber(e.target.value)) }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
                <p className="mt-1 text-xs text-blue-700">Non éligible MPR — Prime autoconso disponible.</p>
                {estimateHint("pvKwc")}
              </label>

              <label className="text-sm">
                <span className="font-medium text-zinc-700">Audit énergétique DPE</span>
                <select
                  value={works.auditEnergetique ? "oui" : "non"}
                  onChange={(e) => setWorks((prev) => ({ ...prev, auditEnergetique: e.target.value === "oui" }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                >
                  <option value="non">Non</option>
                  <option value="oui">Oui</option>
                </select>
                {estimateHint("auditEnergetique")}
              </label>

              <label className="text-sm md:col-span-2">
                <span className="font-medium text-zinc-700">Objectif gain DPE (pour Parcours Accompagné)</span>
                <select
                  value={works.dpeGainTarget}
                  onChange={(e) =>
                    setWorks((prev) => ({ ...prev, dpeGainTarget: e.target.value as WorksData["dpeGainTarget"] }))
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                >
                  <option value="2_CLASSES">Gain 2 classes</option>
                  <option value="3_CLASSES_OU_PLUS">Gain 3 classes ou plus</option>
                </select>
              </label>
            </div>

            {supParGesteBlocked && (
              <div className="mt-4 rounded-lg border border-orange-300 bg-orange-50 p-3 text-sm text-orange-800">
                Revenus SUP : éligible uniquement Parcours Accompagné (pas de calcul par geste).
              </div>
            )}

            {step2Rows.length > 0 && (
              <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-zinc-700">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Travaux</th>
                      <th className="px-3 py-2 font-semibold">Quantité</th>
                      <th className="px-3 py-2 font-semibold">Coût</th>
                      <th className="px-3 py-2 font-semibold">MPR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {step2Rows.map((row) => (
                      <tr key={row.key} className="border-t border-zinc-100">
                        <td className="px-3 py-2 text-zinc-800">{row.label}</td>
                        <td className="px-3 py-2 text-zinc-700">{row.quantity}</td>
                        <td className="px-3 py-2 text-zinc-700">
                          {formatCurrency(row.lowCost)} - {formatCurrency(row.highCost)}
                        </td>
                        <td className="px-3 py-2 text-zinc-700">
                          {formatCurrency(row.mpr)}
                          {row.mprNote ? ` (${row.mprNote})` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={async () => {
                  setCurrentStep(3);
                  await saveCalculation();
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Calculer mes aides
              </button>
            </div>
          </section>
        )}

        {currentStep === 3 && (
          <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Étape 3/3 - Résultats</h2>

            <div className="rounded-xl border border-zinc-200 p-4">
              <p className="text-sm font-semibold text-zinc-800">SECTION A — Type de rénovation recommandé</p>
              <p className="mt-2 text-sm text-zinc-700">
                {parcoursEligible ? "✅ Éligible Parcours Accompagné" : "🔧 Rénovation par geste uniquement"}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 p-4">
              <p className="text-sm font-semibold text-zinc-800">SECTION B/C — Calcul MPR</p>
              <p className="mt-2 text-sm text-zinc-700">Profil : {PROFILE_LABELS[profile]} ({profile})</p>
              <p className="text-sm text-zinc-700">MPR estimée : {formatCurrency(mprTotal)}</p>
              {parcoursEligible && (
                <p className="text-xs text-zinc-500">
                  Calcul Parcours = MIN(coût travaux, {works.dpeGainTarget === "2_CLASSES" ? "30 000 €" : "40 000 €"}) × taux profil.
                </p>
              )}
              {!parcoursEligible && <p className="text-xs text-zinc-500">Calcul par geste ANAH Février 2026 (avec plafonds par poste).</p>}
            </div>

            <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-800">SECTION D — CEE (cumulable MPR)</p>
              <p className="mt-1">CEE estimée : {formatCurrency(ceeEstimate)}</p>
              <p className="text-xs text-zinc-500">Montants variables selon fournisseur (+/-30%).</p>
            </div>

            <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-800">SECTION E/F — Éco-PTZ et TVA réduite</p>
              <p>Éco-PTZ disponible : {formatCurrency(ecoPtz)}</p>
              <p>TVA économisée (5,5%) : {formatCurrency(tvaSavings)}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">💰 MPR estimée : <strong>{formatCurrency(mprTotal)}</strong></div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">💰 CEE estimée : <strong>{formatCurrency(ceeEstimate)}</strong></div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">💰 Éco-PTZ disponible : <strong>{formatCurrency(ecoPtz)}</strong></div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">💰 TVA économisée : <strong>{formatCurrency(tvaSavings)}</strong></div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">✅ TOTAL AIDES : <strong>{formatCurrency(totalAides)}</strong></div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">🏠 Coût travaux : <strong>{formatCurrency(estimatedWorksCost)}</strong></div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">💳 Reste à charge : <strong>{formatCurrency(resteCharge)}</strong></div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">📈 Économies annuelles : <strong>{formatCurrency(annualSavings)}</strong></div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">⏱️ ROI estimé : <strong>{roiYears.toFixed(1)} années</strong></div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Retour aux travaux
              </button>
              <button
                type="button"
                onClick={generatePdf}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                📄 Générer le rapport complet (35 pages)
              </button>
              {saving && <span className="text-sm text-zinc-500">Enregistrement Supabase…</span>}
              {saveMessage && <span className="text-sm text-zinc-600">{saveMessage}</span>}
            </div>

            <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
              Calcul estimatif basé sur les barèmes ANAH Février 2026. Montants non contractuels. Sous réserve d&apos;éligibilité.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
