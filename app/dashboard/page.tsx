"use client";

import { createClient as createSupabaseClient } from "@/lib/supabase";
import { type SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

  // Initialise le client Supabase (singleton)
  useEffect(() => {
    const supabaseClient = createSupabaseClient();
    setSupabase(supabaseClient);
  }, []);

  // Vérifie la session une fois le client prêt
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUserId(data.user.id);
      setUserEmail(data.user.email ?? null);
      setLoadingAuth(false);
    });
  }, [supabase, router]);

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
      add(key, label, `${value} m²`, value * unitLow, value * unitHigh, effectiveMprQty * mprRate, mprNote);
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
      add(key, label, `${value} u`, value * unitLow, value * unitHigh, effectiveMprQty * mprRate, mprNote);
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

    addFixedRow("pacAirEauKw", "PAC Air/Eau", works.pacAirEauKw > 0, 9000, 15000, GESTE_RATES.pacAirEauKw[profile], `${works.pacAirEauKw} kW`);
    addFixedRow("pacAirAirKw", "PAC Air/Air", works.pacAirAirKw > 0, 2500, 5000, GESTE_RATES.pacAirAirKw[profile], `${works.pacAirAirKw} kW`);
    addFixedRow("pacGeoKw", "PAC Géothermique", works.pacGeoKw > 0, 17000, 30000, GESTE_RATES.pacGeoKw[profile], `${works.pacGeoKw} kW`);
    addFixedRow("chauffeEauThermoL", "Chauffe-eau thermodynamique", works.chauffeEauThermoL > 0, 2500, 4500, GESTE_RATES.chauffeEauThermoL[profile], `${works.chauffeEauThermoL} L`);
    addFixedRow("cesiM2", "Chauffe-eau solaire (CESI)", works.cesiM2 > 0, 5500, 9000, GESTE_RATES.cesiM2[profile], `${works.cesiM2} m² capteurs`);
    addFixedRow("chaudiereBiomasseKw", "Chaudière biomasse", works.chaudiereBiomasseKw > 0, 9000, 16000, 0, `${works.chaudiereBiomasseKw} kW`, "Parcours Accompagné uniquement");
    addFixedRow("deposeCuveFioul", "Dépose cuve fioul", works.deposeCuveFioul, 800, 1800, GESTE_RATES.deposeCuveFioul[profile], "Oui");
    addFixedRow("vmcSimpleM2", "VMC simple flux hygro", works.vmcSimpleM2 > 0, 1800, 3500, vmcDisabled ? 0 : GESTE_RATES.vmcSimpleM2[profile], `${works.vmcSimpleM2} m²`, vmcDisabled ? "MPR inactive sans geste isolation" : undefined);
    addFixedRow("vmcDoubleM2", "VMC double flux", works.vmcDoubleM2 > 0, 6000, 10000, vmcDisabled ? 0 : GESTE_RATES.vmcDoubleM2[profile], `${works.vmcDoubleM2} m²`, vmcDisabled ? "MPR inactive sans geste isolation" : undefined);
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
      A: 0.02, B: 0.03, C: 0.04, D: 0.05, E: 0.07, F: 0.09, G: 0.11,
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
      setSaveMessage(`Enregistrement impossible: ${error}`);
    } else {
      setSaveMessage("Calcul enregistré dans Supabase.");
    }
    setSaving(false);
  }

  function generatePdf() {
    alert("PDF en cours de développement - disponible prochainement !");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[#047857]">Rénov&apos;Optim IA</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            {userEmail && <span className="text-sm text-zinc-500">{userEmail}</span>}
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Steps nav */}
        <nav className="mb-8 flex gap-2">
          {[
            { n: 1, label: "Logement & Profil" },
            { n: 2, label: "Travaux" },
            { n: 3, label: "Résultats" },
          ].map(({ n, label }) => (
            <button
              key={n}
              onClick={() => setCurrentStep(n)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                currentStep === n
                  ? "bg-[#047857] text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${currentStep === n ? "bg-white/20" : "bg-zinc-200"}`}>{n}</span>
              {label}
            </button>
          ))}
        </nav>

        {/* STEP 1 */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-zinc-800">Votre logement</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Type de logement</label>
                  <select
                    value={step1.housingType}
                    onChange={(e) => setStep1({ ...step1, housingType: e.target.value as Step1Data["housingType"] })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#047857] focus:outline-none"
                  >
                    <option value="MAISON">Maison individuelle</option>
                    <option value="APPARTEMENT">Appartement</option>
                    <option value="COPROPRIETE">Copropriété</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Surface (m²)</label>
                  <input
                    type="number"
                    value={step1.surfaceM2}
                    onChange={(e) => setStep1({ ...step1, surfaceM2: safeNumber(e.target.value, 100) })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#047857] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Période de construction</label>
                  <select
                    value={step1.constructionPeriod}
                    onChange={(e) => setStep1({ ...step1, constructionPeriod: e.target.value as Step1Data["constructionPeriod"] })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#047857] focus:outline-none"
                  >
                    <option value="AV1948">Avant 1948</option>
                    <option value="P1948_74">1948 – 1974</option>
                    <option value="P1975_89">1975 – 1989</option>
                    <option value="P1990_2000">1990 – 2000</option>
                    <option value="P2001_2012">2001 – 2012</option>
                    <option value="AP2012">Après 2012</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Zone géographique</label>
                  <select
                    value={step1.zone}
                    onChange={(e) => setStep1({ ...step1, zone: e.target.value as Zone })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#047857] focus:outline-none"
                  >
                    <option value="HORS_IDF">Hors Île-de-France</option>
                    <option value="IDF">Île-de-France</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">DPE actuel</label>
                  <select
                    value={step1.dpe}
                    onChange={(e) => setStep1({ ...step1, dpe: e.target.value as Dpe })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#047857] focus:outline-none"
                  >
                    {(["A","B","C","D","E","F","G"] as Dpe[]).map((d) => (
                      <option key={d} value={d}>Classe {d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-zinc-800">Votre profil MaPrimeRénov&apos;</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Revenus fiscaux du foyer (€/an)</label>
                  <input
                    type="number"
                    value={step1.income}
                    onChange={(e) => setStep1({ ...step1, income: safeNumber(e.target.value, 0) })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#047857] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Nombre de personnes dans le foyer</label>
                  <input
                    type="number"
                    min={1}
                    value={step1.persons}
                    onChange={(e) => setStep1({ ...step1, persons: safeNumber(e.target.value, 1) })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#047857] focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-zinc-600">Profil détecté :</span>
                <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${PROFILE_BADGES[profile]}`}>
                  {PROFILE_LABELS[profile]}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                className="rounded-lg bg-[#047857] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#065f46]"
              >
                Étape suivante →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-zinc-800">Isolation</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { key: "comblesPerdusM2", label: "Combles perdus (m²)" },
                  { key: "comblesAmenagesM2", label: "Combles aménagés (m²)" },
                  { key: "plancherBasM2", label: "Plancher bas (m²)" },
                  { key: "toitureTerrasseM2", label: "Toiture terrasse (m²)" },
                  { key: "iteM2", label: "ITE – Isolation par l'extérieur (m²)" },
                  { key: "itiM2", label: "ITI – Isolation par l'intérieur (m²)" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-zinc-700">{label}</label>
                    <input
                      type="number"
                      min={0}
                      value={works[key as keyof WorksData] as number}
                      onChange={(e) => setWorks({ ...works, [key]: safeNumber(e.target.value) })}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#047857] focus:outline-none"
                    />
                    {estimateHint(key)}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-zinc-800">Menuiseries</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { key: "fenetresCount", label: "Fenêtres / Portes-fenêtres" },
                  { key: "portesEntreeCount", label: "Portes d'entrée" },
                  { key: "voletsCount", label: "Volets isolants" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-zinc-700">{label}</label>
                    <input
                      type="number"
                      min={0}
                      value={works[key as keyof WorksData] as number}
                      onChange={(e) => setWorks({ ...works, [key]: safeNumber(e.target.value) })}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#047857] focus:outline-none"
                    />
                    {estimateHint(key)}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-zinc-800">Chauffage & Eau chaude</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { key: "pacAirEauKw", label: "PAC Air/Eau (kW)" },
                  { key: "pacAirAirKw", label: "PAC Air/Air (kW)" },
                  { key: "pacGeoKw", label: "PAC Géothermique (kW)" },
                  { key: "chauffeEauThermoL", label: "Chauffe-eau thermodynamique (L)" },
                  { key: "cesiM2", label: "CESI – Chauffe-eau solaire (m²)" },
                  { key: "chaudiereBiomasseKw", label: "Chaudière biomasse (kW)" },
                  { key: "pvKwc", label: "Panneaux photovoltaïques (kWc)" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-zinc-700">{label}</label>
                    <input
                      type="number"
                      min={0}
                      value={works[key as keyof WorksData] as number}
                      onChange={(e) => setWorks({ ...works, [key]: safeNumber(e.target.value) })}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#047857] focus:outline-none"
                    />
                    {estimateHint(key)}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="deposeCuveFioul"
                  checked={works.deposeCuveFioul}
                  onChange={(e) => setWorks({ ...works, deposeCuveFioul: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-[#047857]"
                />
                <label htmlFor="deposeCuveFioul" className="text-sm font-medium text-zinc-700">
                  Dépose cuve fioul
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-zinc-800">Ventilation & Audit</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">VMC simple flux hygro (m²)</label>
                  <input
                    type="number"
                    min={0}
                    value={works.vmcSimpleM2}
                    onChange={(e) => setWorks({ ...works, vmcSimpleM2: safeNumber(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#047857] focus:outline-none"
                  />
                  {estimateHint("vmcSimpleM2")}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">VMC double flux (m²)</label>
                  <input
                    type="number"
                    min={0}
                    value={works.vmcDoubleM2}
                    onChange={(e) => setWorks({ ...works, vmcDoubleM2: safeNumber(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#047857] focus:outline-none"
                  />
                  {estimateHint("vmcDoubleM2")}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="auditEnergetique"
                  checked={works.auditEnergetique}
                  onChange={(e) => setWorks({ ...works, auditEnergetique: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-[#047857]"
                />
                <label htmlFor="auditEnergetique" className="text-sm font-medium text-zinc-700">
                  Audit énergétique DPE
                </label>
              </div>
            </div>

            {parcoursEligible && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <h3 className="mb-2 font-semibold text-emerald-800">🎯 Parcours Accompagné éligible !</h3>
                <p className="mb-3 text-sm text-emerald-700">Votre projet est éligible au Parcours Accompagné MaPrimeRénov&apos;. Choisissez votre objectif de gain DPE :</p>
                <select
                  value={works.dpeGainTarget}
                  onChange={(e) => setWorks({ ...works, dpeGainTarget: e.target.value as WorksData["dpeGainTarget"] })}
                  className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="2_CLASSES">Gain de 2 classes DPE</option>
                  <option value="3_CLASSES_OU_PLUS">Gain de 3 classes ou plus</option>
                </select>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                ← Retour
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="rounded-lg bg-[#047857] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#065f46]"
              >
                Voir les résultats →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-zinc-800">Récapitulatif des aides estimées</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "MaPrimeRénov'", value: mprTotal, color: "text-emerald-600" },
                  { label: "CEE (estimation)", value: ceeEstimate, color: "text-blue-600" },
                  { label: "TVA 5,5%", value: tvaSavings, color: "text-purple-600" },
                  { label: "Total aides", value: totalAides, color: "text-orange-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-center">
                    <p className="text-sm text-zinc-500">{label}</p>
                    <p className={`mt-1 text-2xl font-bold ${color}`}>{formatCurrency(value)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-center">
                <p className="text-sm text-zinc-500">Coût total estimé</p>
                <p className="mt-1 text-2xl font-bold text-zinc-800">{formatCurrency(estimatedWorksCost)}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-center">
                <p className="text-sm text-zinc-500">Reste à charge</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(resteCharge)}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-center">
                <p className="text-sm text-zinc-500">Éco-PTZ estimé</p>
                <p className="mt-1 text-2xl font-bold text-indigo-600">{formatCurrency(ecoPtz)}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-center">
                <p className="text-sm text-zinc-500">Économies annuelles estimées</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(annualSavings)}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-center">
                <p className="text-sm text-zinc-500">Retour sur investissement</p>
                <p className="mt-1 text-2xl font-bold text-zinc-800">{roiYears.toFixed(1)} ans</p>
              </div>
            </div>

            {step2Rows.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-semibold text-zinc-800">Détail par poste</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-zinc-500">
                        <th className="pb-2 pr-4 font-medium">Travaux</th>
                        <th className="pb-2 pr-4 font-medium">Quantité</th>
                        <th className="pb-2 pr-4 font-medium">Coût estimé</th>
                        <th className="pb-2 font-medium">MPR estimée</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {step2Rows.map((row) => (
                        <tr key={row.key}>
                          <td className="py-2 pr-4 font-medium text-zinc-700">
                            {row.label}
                            {row.mprNote && <span className="ml-1 text-xs text-zinc-400">({row.mprNote})</span>}
                          </td>
                          <td className="py-2 pr-4 text-zinc-600">{row.quantity}</td>
                          <td className="py-2 pr-4 text-zinc-600">
                            {formatCurrency(row.lowCost)} – {formatCurrency(row.highCost)}
                          </td>
                          <td className="py-2 font-semibold text-emerald-600">{formatCurrency(row.mpr)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {saveMessage && (
              <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {saveMessage}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setCurrentStep(2)}
                className="rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                ← Modifier les travaux
              </button>
              <button
                onClick={saveCalculation}
                disabled={saving || !userId}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "💾 Sauvegarder"}
              </button>
              <button
                onClick={generatePdf}
                className="rounded-lg bg-[#047857] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#065f46]"
              >
                📄 Générer le PDF
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
