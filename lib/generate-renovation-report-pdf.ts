import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import type {
  CalepinagePvComputed,
  CalepinagePvForm,
  DimensionnementPacComputed,
  DimensionnementPacForm,
  MetragesFenetresComputed,
  MetragesFenetresForm,
} from "./renovation-report-compute";

const TOTAL_PAGES = 35;
const GREEN: [number, number, number] = [16, 185, 129];
const DARK: [number, number, number] = [31, 41, 55];
const LIGHT: [number, number, number] = [249, 250, 251];
const RED: [number, number, number] = [239, 68, 68];
const ORANGE: [number, number, number] = [249, 115, 22];
const BLUE: [number, number, number] = [59, 130, 246];

export type ReportDpe = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type ReportProfile = "TM" | "MO" | "INT" | "SUP";
export type ReportZone = "IDF" | "HORS_IDF";

export type ReportStep1 = {
  housingType: string;
  surfaceM2: number;
  constructionPeriod: string;
  zone: ReportZone;
  dpe: ReportDpe;
  income: number;
  persons: number;
};

export type ReportWorks = {
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

export type ReportStep2Row = {
  key: string;
  label: string;
  quantity: string;
  lowCost: number;
  highCost: number;
  mpr: number;
  mprNote?: string;
};

export type RenovationReportInput = {
  step1: ReportStep1;
  works: ReportWorks;
  profile: ReportProfile;
  profileLabel: string;
  userEmail: string | null;
  clientName?: string | null;
  clientAddress?: string | null;
  parcoursEligible: boolean;
  gainClasses: number;
  actionCount: number;
  estimatedWorksCost: number;
  mprTotal: number;
  ceeEstimate: number;
  tvaSavings: number;
  totalAides: number;
  resteCharge: number;
  ecoPtz: number;
  annualSavings: number;
  roiYears: number;
  step2Rows: ReportStep2Row[];
  calepinagePv?: { form: CalepinagePvForm; computed: CalepinagePvComputed } | null;
  dimensionnementPAC?: { form: DimensionnementPacForm; computed: DimensionnementPacComputed } | null;
  metragesFenetres?: {
    count: number;
    form: MetragesFenetresForm;
    computed: MetragesFenetresComputed;
  } | null;
};

const DPE_ORDER: ReportDpe[] = ["G", "F", "E", "D", "C", "B", "A"];
/** kWh/m²/an — barème affichage rapport */
const KWH_M2_SPEC: Record<ReportDpe, number> = {
  A: 50,
  B: 90,
  C: 150,
  D: 230,
  E: 330,
  F: 420,
  G: 500,
};

const MAR_RATE_PCT: Record<ReportProfile, number> = {
  TM: 100,
  MO: 80,
  INT: 60,
  SUP: 40,
};

const GESTE_RATES: Record<
  ReportProfile,
  { combles: number; plancher: number; fenetres: number; portes: number; pacAe: number }
> = {
  TM: { combles: 25, plancher: 50, fenetres: 100, portes: 150, pacAe: 5000 },
  MO: { combles: 20, plancher: 40, fenetres: 80, portes: 120, pacAe: 4000 },
  INT: { combles: 15, plancher: 25, fenetres: 40, portes: 80, pacAe: 3000 },
  SUP: { combles: 0, plancher: 0, fenetres: 0, portes: 0, pacAe: 0 },
};

function eur(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}

function def(v: string | null | undefined, fallback = "À définir") {
  if (v === null || v === undefined || v.trim() === "") return fallback;
  return v;
}

function targetDpe(current: ReportDpe, gain: "2_CLASSES" | "3_CLASSES_OU_PLUS"): ReportDpe {
  const idx = DPE_ORDER.indexOf(current);
  if (idx < 0) return "D";
  const steps = gain === "2_CLASSES" ? 2 : 3;
  return DPE_ORDER[Math.min(idx + steps, DPE_ORDER.length - 1)];
}

function dpeClassGain(from: ReportDpe, to: ReportDpe): number {
  return Math.max(0, DPE_ORDER.indexOf(to) - DPE_ORDER.indexOf(from));
}

function lastTableY(doc: jsPDF) {
  const j = doc as unknown as { lastAutoTable?: { finalY: number } };
  return j.lastAutoTable?.finalY ?? 22;
}

function annuityMonthly(principal: number, annualRate: number, years: number): number {
  if (principal <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  if (r <= 0) return Math.round(principal / n);
  return Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}

function drawPageChrome(doc: jsPDF, pageNum: number, dateStr: string) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setPage(pageNum);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text("RenovOptim IA", 14, 12);
  doc.text("Rapport Aides 2026", w - 14, 12, { align: "right" });
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.35);
  doc.line(14, 15, w - 14, 15);
  doc.text(`${dateStr} — Non contractuel`, 14, h - 10);
  doc.text(`Page ${pageNum} / ${TOTAL_PAGES}`, w - 14, h - 10, { align: "right" });
  doc.setTextColor(0, 0, 0);
}

function addPageWithChrome(doc: jsPDF, pageNum: number, dateStr: string) {
  doc.addPage();
  drawPageChrome(doc, pageNum, dateStr);
}

function scenarioBundle(
  input: RenovationReportInput,
  gainSteps: number,
  costFactor: number,
  aidFactor: number,
  plafondMpr: number
) {
  const cost = Math.round(input.estimatedWorksCost * costFactor);
  const rateMap = { TM: 0.9, MO: 0.8, INT: 0.5, SUP: 0.1 } as const;
  const taux = input.parcoursEligible ? rateMap[input.profile] : 0;
  const mprMax = input.parcoursEligible
    ? Math.round(Math.min(cost, plafondMpr) * taux)
    : Math.round(input.mprTotal * aidFactor);
  const aids = input.parcoursEligible ? mprMax + input.ceeEstimate * 0.3 : Math.round(input.totalAides * aidFactor);
  const rac = Math.max(cost - aids, 0);
  const sav = Math.round(input.annualSavings * (0.85 + gainSteps * 0.05));
  const roi = sav > 0 ? rac / sav : 0;
  return { cost, aids, rac, sav, roi, mprMax };
}

function drawCover(doc: jsPDF, input: RenovationReportInput) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 0; i < 90; i++) {
    const t = i / 90;
    const g = Math.round(185 - t * 40);
    doc.setFillColor(16, g, 129);
    doc.rect(0, (i * h) / 90, w, h / 90 + 0.5, "F");
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("RenovOptim IA", w / 2, 48, { align: "center" });
  doc.setFontSize(14);
  doc.text("✦", w / 2, 58, { align: "center" });
  doc.setFontSize(13);
  doc.text("RAPPORT D'AIDES À LA RÉNOVATION ÉNERGÉTIQUE", w / 2, 72, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Barèmes officiels ANAH Février 2026", w / 2, 84, { align: "center" });
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.line(28, 92, w - 28, 92);

  const dpeVisé = targetDpe(input.step1.dpe, input.works.dpeGainTarget);
  const dateStr = new Date().toLocaleDateString("fr-FR");

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(26, 98, w - 52, 38, 2, 2, "F");
  doc.setTextColor(...DARK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let yb = 106;
  doc.text(`Date : ${dateStr}`, 32, yb);
  yb += 6;
  doc.text(`Profil MPR : ${input.profileLabel} (${input.profile})`, 32, yb);
  yb += 6;
  doc.text(`DPE actuel : ${input.step1.dpe}  →  DPE visé : ${dpeVisé}`, 32, yb);
  yb += 6;
  doc.text(`Zone : ${input.step1.zone === "IDF" ? "Île-de-France" : "Hors Île-de-France"}`, 32, yb);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(26, 142, w - 52, 28, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(`Total aides : ${eur(input.totalAides)}`, 32, 152);
  doc.text(`Coût travaux : ${eur(input.estimatedWorksCost)}`, 32, 160);
  doc.text(`Reste à charge : ${eur(input.resteCharge)}`, 32, 168);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("Généré par RenovOptim IA — renovoptim-ia.com", w / 2, h - 22, { align: "center" });
  doc.text("Calcul estimatif — Barèmes ANAH Février 2026", w / 2, h - 16, { align: "center" });
  doc.setTextColor(0, 0, 0);
}

function sectionTitle(doc: jsPDF, y: number, text: string, color: [number, number, number] = GREEN) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...color);
  doc.text(text, 14, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
}

function boxAlert(
  doc: jsPDF,
  y: number,
  h: number,
  lines: string[],
  border: [number, number, number],
  fill?: [number, number, number]
) {
  if (fill) {
    doc.setFillColor(...fill);
    doc.rect(14, y, 182, h, "F");
  }
  doc.setDrawColor(...border);
  doc.setLineWidth(0.3);
  doc.rect(14, y, 182, h, "S");
  doc.setFontSize(8);
  doc.setTextColor(...border);
  let yy = y + 5;
  lines.forEach((ln) => {
    doc.text(ln, 16, yy, { maxWidth: 176 });
    yy += 5;
  });
  doc.setTextColor(0, 0, 0);
}

export function generateRenovationReportPdf(input: RenovationReportInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const dateStr = new Date().toLocaleDateString("fr-FR");
  const w = doc.internal.pageSize.getWidth();
  const dpeVisé = targetDpe(input.step1.dpe, input.works.dpeGainTarget);
  const kA = KWH_M2_SPEC[input.step1.dpe];
  const kB = KWH_M2_SPEC[dpeVisé];
  const consoAvant = Math.round(kA * input.step1.surfaceM2);
  const consoApres = Math.round(kB * input.step1.surfaceM2);
  const factAvant = Math.round(consoAvant * 0.14);
  const factApres = Math.round(consoApres * 0.14);
  const gainPct = kA > 0 ? Math.round(((kA - kB) / kA) * 100) : 0;
  const co2A = Math.round(consoAvant * 0.048);
  const co2B = Math.round(consoApres * 0.048);
  const surf = input.step1.surfaceM2;
  const prixM2Ref = input.step1.zone === "IDF" ? 4500 : 2800;
  const gainPat = Math.round(surf * prixM2Ref * 0.06);

  const ess = scenarioBundle(input, 2, 0.88, 0.9, 30000);
  const opt = scenarioBundle(input, 3, 1, 1, 40000);
  const exc = scenarioBundle(input, 4, 1.12, 1.05, 40000);

  const marCost = 2500;
  const marPct = MAR_RATE_PCT[input.profile];
  const marReste = Math.round(marCost * (1 - marPct / 100));

  const ttc = Math.round(input.estimatedWorksCost * 1.055);
  const apport = Math.max(ttc - input.totalAides - input.ecoPtz, 0);
  const mens15 = annuityMonthly(input.ecoPtz, 0.015, 15);
  const mens20 = annuityMonthly(input.ecoPtz, 0.015, 20);

  const wIso = input.works;

  const headGreen = { fillColor: GREEN, textColor: 255, fontStyle: "bold" as const };
  const alt = { fillColor: LIGHT };

  drawCover(doc, input);

  const mprParcoursRatePct = input.parcoursEligible
    ? `${input.profile === "TM" ? 90 : input.profile === "MO" ? 80 : input.profile === "INT" ? 50 : 10} % (ordre de grandeur)`
    : "Forfait / poste";

  for (let p = 2; p <= TOTAL_PAGES; p++) {
    addPageWithChrome(doc, p, dateStr);
    let y = 22;

    if (p === 2) {
      sectionTitle(doc, y, "SYNTHÈSE EXÉCUTIVE");
      y += 10;
      doc.setFontSize(8);
      const cardW = (w - 28) / 4;
      const cards: [string, string][] = [
        ["💰 MPR", eur(input.mprTotal)],
        ["💰 CEE", eur(input.ceeEstimate)],
        ["💳 Reste à charge", eur(input.resteCharge)],
        ["📈 ROI", `${input.roiYears.toFixed(1)} ans`],
      ];
      cards.forEach((c, i) => {
        doc.setFillColor(236, 253, 245);
        doc.rect(14 + i * cardW, y, cardW - 1.5, 18, "F");
        doc.setTextColor(...DARK);
        doc.text(c[0], 16 + i * cardW, y + 7);
        doc.setFont("helvetica", "bold");
        doc.text(c[1], 16 + i * cardW, y + 14);
        doc.setFont("helvetica", "normal");
      });
      y += 24;
      const body = input.step2Rows.map((r) => [
        r.label,
        r.quantity,
        eur((r.lowCost + r.highCost) / 2),
        eur(r.mpr),
        eur(input.parcoursEligible ? 0 : input.ceeEstimate / Math.max(input.step2Rows.length, 1)),
      ]);
      if (body.length === 0) body.push(["—", "—", "À définir", "À définir", "À définir"]);
      autoTable(doc, {
        startY: y,
        head: [["Travaux", "Quantité", "Coût HT", "Aide MPR", "Aide CEE (est.)"]],
        body,
        theme: "grid",
        headStyles: headGreen,
        alternateRowStyles: alt,
        styles: { font: "helvetica", fontSize: 7 },
      });
      y = lastTableY(doc) + 8;
      boxAlert(doc, y, 22, [
        `✅ Type rénovation : ${input.parcoursEligible ? "Parcours Accompagné" : "Monogeste (par geste)"}`,
        `Gain DPE visé : ${input.gainClasses} classe(s)`,
      ], GREEN, [236, 253, 245]);
      y += 26;
      if (input.parcoursEligible) {
        boxAlert(
          doc,
          y,
          20,
          [
            "⚠️ Parcours Accompagné obligatoire : MAR requis — CEE non cumulable avec Parcours.",
          ],
          ORANGE,
          [255, 247, 237]
        );
      }
    }

    if (p === 3) {
      sectionTitle(doc, y, "DIAGNOSTIC THERMIQUE");
      y += 10;
      const prevu = (iso: boolean) => (iso ? "Oui" : "Non");
      autoTable(doc, {
        startY: y,
        head: [["Poste", "% déperditions", "Priorité", "Travaux prévus"]],
        body: [
          ["Combles", "30%", "⭐⭐⭐⭐⭐", prevu(wIso.comblesPerdusM2 + wIso.comblesAmenagesM2 > 0)],
          ["Murs", "25%", "⭐⭐⭐⭐", prevu(wIso.iteM2 + wIso.itiM2 > 0)],
          ["Fenêtres", "15%", "⭐⭐⭐", prevu(wIso.fenetresCount + wIso.portesEntreeCount > 0)],
          ["Planchers", "10%", "⭐⭐⭐", prevu(wIso.plancherBasM2 > 0)],
          ["Ponts thermiques", "10%", "⭐⭐", prevu(wIso.toitureTerrasseM2 > 0)],
          ["Ventilation", "10%", "⭐⭐", prevu(wIso.vmcDoubleM2 + wIso.vmcSimpleM2 > 0)],
        ],
        theme: "grid",
        headStyles: headGreen,
        alternateRowStyles: alt,
        styles: { fontSize: 8 },
      });
      y = lastTableY(doc) + 10;
      autoTable(doc, {
        startY: y,
        head: [["", "Avant travaux", "Après travaux", "Gain"]],
        body: [
          ["kWh/m²/an", String(kA), String(kB), `-${gainPct} %`],
          ["Facture/an", eur(factAvant), eur(factApres), eur(factAvant - factApres)],
          ["CO₂/an (kg)", String(co2A), String(co2B), `-${co2A - co2B} kg`],
        ],
        theme: "grid",
        headStyles: headGreen,
        alternateRowStyles: alt,
        styles: { fontSize: 8 },
      });
    }

    if (p === 4) {
      sectionTitle(doc, y, "DIAGNOSTIC THERMIQUE — NOTES");
      y += 10;
      doc.setFontSize(9);
      doc.text(
        `Calcul basé sur DPE ${input.step1.dpe} déclaré et DPE visé ${dpeVisé} — valeurs kWh/m²/an indicatives — à affiner avec audit terrain.`,
        14,
        y,
        { maxWidth: 180 }
      );
    }

    if (p === 5) {
      sectionTitle(doc, y, "VOS 3 SCÉNARIOS DE RÉNOVATION");
      y += 10;
      autoTable(doc, {
        startY: y,
        head: [["Critère", "Essentiel", "⭐ Optimal", "Excellence"]],
        body: [
          ["Gain DPE", "+2 classes", "+3 classes", "+4 classes"],
          ["Plafond MPR", "30 000 €", "40 000 €", "40 000 €"],
          ["Taux MPR", mprParcoursRatePct, mprParcoursRatePct, mprParcoursRatePct],
          ["Aide MPR max", eur(ess.mprMax), eur(opt.mprMax), eur(exc.mprMax)],
          ["Coût estimé", eur(ess.cost), eur(opt.cost), eur(exc.cost)],
          ["Reste à charge", eur(ess.rac), eur(opt.rac), eur(exc.rac)],
          ["Économies/an", eur(ess.sav), eur(opt.sav), eur(exc.sav)],
          ["ROI", `${ess.roi.toFixed(1)} ans`, `${opt.roi.toFixed(1)} ans`, `${exc.roi.toFixed(1)} ans`],
        ],
        theme: "grid",
        headStyles: headGreen,
        alternateRowStyles: alt,
        styles: { fontSize: 7 },
      });
      y = lastTableY(doc) + 6;
      doc.setFillColor(255, 237, 0);
      doc.rect(14 + 58, y - 4, 58, 6, "F");
      doc.setFontSize(7);
      doc.text("⭐ RECOMMANDÉ", 14 + 60, y);
      doc.setFontSize(8);
      doc.text("Calcul basé sur barèmes ANAH Fév. 2026", 14, y + 8);
    }

    if (p === 6) {
      sectionTitle(doc, y, "VOS 3 SCÉNARIOS — POURSUITE");
      y += 10;
      doc.setFontSize(9);
      doc.text("Le scénario Optimal équilibre gain énergétique, plafonds MPR et reste à charge.", 14, y, { maxWidth: 180 });
    }

    if (p === 7) {
      sectionTitle(doc, y, "VOS 3 SCÉNARIOS — MÉTHODOLOGIE");
      y += 10;
      doc.setFontSize(9);
      doc.text(
        "Les montants restent des ordres de grandeur sous réserve d'éligibilité, de devis et d'instruction ANAH.",
        14,
        y,
        { maxWidth: 180 }
      );
    }

    if (p === 8) {
      sectionTitle(doc, y, "ISOLATION THERMIQUE");
      y += 8;
      const rows: string[][] = [];
      if (wIso.comblesPerdusM2 > 0)
        rows.push([
          "Combles perdus",
          `${wIso.comblesPerdusM2} m²`,
          "Laine de roche 35 cm",
          "R ≥ 7",
          eur(wIso.comblesPerdusM2 * 55),
          eur(input.parcoursEligible ? 0 : wIso.comblesPerdusM2 * GESTE_RATES[input.profile].combles),
        ]);
      if (wIso.comblesAmenagesM2 > 0)
        rows.push([
          "Combles aménagés",
          `${wIso.comblesAmenagesM2} m²`,
          "Sarking 16 cm",
          "R ≥ 6",
          eur(wIso.comblesAmenagesM2 * 75),
          eur(input.parcoursEligible ? 0 : wIso.comblesAmenagesM2 * GESTE_RATES[input.profile].combles),
        ]);
      if (wIso.iteM2 > 0)
        rows.push([
          "ITE",
          `${wIso.iteM2} m²`,
          "PSE graphité 14 cm",
          "R ≥ 3,7",
          eur(wIso.iteM2 * 180),
          "Parcours",
        ]);
      if (wIso.itiM2 > 0)
        rows.push([
          "ITI",
          `${wIso.itiM2} m²`,
          "Laine de roche 12 cm",
          "R ≥ 3,7",
          eur(wIso.itiM2 * 120),
          "Parcours",
        ]);
      if (wIso.plancherBasM2 > 0)
        rows.push([
          "Plancher bas",
          `${wIso.plancherBasM2} m²`,
          "PU 10 cm",
          "R ≥ 3",
          eur(wIso.plancherBasM2 * 80),
          eur(wIso.plancherBasM2 * GESTE_RATES[input.profile].plancher),
        ]);
      if (rows.length === 0) rows.push(["—", "—", "—", "—", "—", "Non sélectionné"]);
      autoTable(doc, {
        startY: y,
        head: [["Poste", "Surface", "Matériau", "R visé", "Coût HT", "MPR"]],
        body: rows,
        theme: "grid",
        headStyles: headGreen,
        alternateRowStyles: alt,
        styles: { fontSize: 7 },
      });
      y = lastTableY(doc) + 6;
      doc.setFontSize(7);
      doc.text("Artisans : ECO SYSTÈME DURABLE — 01 70 93 97 15 | 2C ENERGIES — 09 72 57 47 47 (matériaux éco)", 14, y);
      y += 5;
      doc.text("ITE : HB FACADIER — Bas HILMI — 06 21 63 58 93 — prix moyen indicatif 180 € TTC/m²", 14, y);
    }

    if (p === 9) {
      sectionTitle(doc, y, "MENUISERIES");
      y += 8;
      const mrows: string[][] = [];
      if (wIso.fenetresCount > 0)
        mrows.push([
          "Fenêtres PVC",
          String(wIso.fenetresCount),
          input.metragesFenetres?.labels.dimensions ?? "Standard",
          "≤ 1,3 W/m²K",
          eur(wIso.fenetresCount * 650),
          eur(wIso.fenetresCount * GESTE_RATES[input.profile].fenetres),
        ]);
      if (wIso.portesEntreeCount > 0)
        mrows.push([
          "Portes d'entrée",
          String(wIso.portesEntreeCount),
          "—",
          "≤ 1,7 W/m²K",
          eur(wIso.portesEntreeCount * 1800),
          eur(wIso.portesEntreeCount * GESTE_RATES[input.profile].portes),
        ]);
      if (mrows.length === 0) mrows.push(["—", "—", "—", "—", "—", "—"]);
      autoTable(doc, {
        startY: y,
        head: [["Type", "Qté", "Dimensions", "Uw visé", "Coût HT", "MPR"]],
        body: mrows,
        theme: "grid",
        headStyles: headGreen,
        alternateRowStyles: alt,
        styles: { fontSize: 7 },
      });
      y = lastTableY(doc) + 6;
      if (input.metragesFenetres) {
        doc.text(`Surface vitrée totale : ${input.metragesFenetres.computed.surfaceTotaleM2} m²`, 14, y);
        y += 5;
      }
      doc.setFontSize(7);
      doc.text("SIPV MENUISERIE — 05 49 43 72 93 — gamme SIGNATURE — NF CSTB Acotherm", 14, y);
    }

    if (p === 10) {
      sectionTitle(doc, y, "SYSTÈME DE CHAUFFAGE");
      y += 8;
      const pac = input.dimensionnementPAC;
      if (wIso.pacAirEauKw > 0 && pac) {
        autoTable(doc, {
          startY: y,
          head: [["Paramètre", "Valeur"]],
          body: [
            ["Surface chauffée", `${surf} m²`],
            ["Volume", `${pac.computed.volumeM3} m³`],
            ["DPE actuel", input.step1.dpe],
            ["Coefficient déperdition", `${pac.computed.coeffDpeWm2} W/m²`],
            ["Puissance calculée", `${pac.computed.puissanceKw} kW`],
            ["Puissance recommandée", `${pac.computed.puissanceKw} kW`],
            ["Après isolation (est.)", `${pac.computed.puissanceApresIsolationKw} kW`],
            ["Type émetteurs", pac.computed.labels.emetteurs],
            ["COP minimum requis", "≥ 4,0"],
          ],
          theme: "grid",
          headStyles: headGreen,
          alternateRowStyles: alt,
          styles: { fontSize: 8 },
        });
        y = lastTableY(doc) + 6;
        autoTable(doc, {
          startY: y,
          head: [["Équipement", "Puissance", "COP", "Coût HT", "MPR"]],
          body: [["PAC Air/Eau", `${wIso.pacAirEauKw} kW`, "≥ 4,0", eur(12000), eur(GESTE_RATES[input.profile].pacAe)]],
          theme: "grid",
          headStyles: headGreen,
          alternateRowStyles: alt,
          styles: { fontSize: 8 },
        });
        y = lastTableY(doc) + 8;
        boxAlert(
          doc,
          y,
          18,
          [
            `⚠️ Dimensionnement après isolation complète — puissance réduite à ${pac.computed.puissanceApresIsolationKw} kW post-isolation (est.).`,
          ],
          ORANGE,
          [255, 247, 237]
        );
        y += 22;
        doc.setFontSize(7);
        doc.text("ECO SYSTÈME DURABLE — 01 70 93 97 15 — certifié QualiPAC", 14, y);
      } else {
        doc.setFontSize(9);
        doc.text("Non concerné (pas de PAC air/eau sélectionnée).", 14, y);
      }
    }

    if (p === 11) {
      sectionTitle(doc, y, "VENTILATION");
      y += 8;
      const debit =
        surf < 80 ? "200-300 m³/h" : surf <= 120 ? "300-400 m³/h" : "400-500 m³/h";
      if (wIso.vmcDoubleM2 > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Type", "Débit", "Rendement", "Coût HT", "MPR"]],
          body: [["VMC double flux", debit, "≥ 85 %", eur(8000), eur(input.parcoursEligible ? 0 : 3500)]],
          theme: "grid",
          headStyles: headGreen,
          alternateRowStyles: alt,
          styles: { fontSize: 8 },
        });
        y = lastTableY(doc) + 8;
        doc.setFontSize(8);
        doc.text("Débit recommandé selon surface : " + debit, 14, y);
        y += 6;
        doc.text("Obligatoire après isolation renforcée — ECO SYSTÈME DURABLE — 01 70 93 97 15", 14, y);
      } else if (wIso.vmcSimpleM2 > 0) {
        doc.setFontSize(9);
        doc.text("VMC simple flux hygro — dimensionnement à affiner avec artisan.", 14, y);
      } else {
        doc.text("Non concerné.", 14, y);
      }
    }

    if (p === 12) {
      sectionTitle(doc, y, "INSTALLATION PHOTOVOLTAÏQUE");
      y += 8;
      const cp = input.calepinagePv;
      if (wIso.pvKwc > 0 && cp) {
        autoTable(doc, {
          startY: y,
          head: [["Paramètre", "Valeur"]],
          body: [
            ["Surface toiture", `${cp.form.roofSurfaceM2} m²`],
            ["Orientation", cp.computed.labels.orientation],
            ["Inclinaison", cp.computed.labels.inclinaison],
            ["Masques solaires", cp.computed.labels.masques],
            ["Nb panneaux (max)", String(cp.computed.nbPanneauxMax)],
            ["Puissance installée", `${wIso.pvKwc} kWc`],
            ["Production annuelle", `${cp.computed.productionKwhAn} kWh/an`],
            ["Autoconsommation", "~60 %"],
            ["Revente surplus", "~40 %"],
          ],
          theme: "grid",
          headStyles: headGreen,
          alternateRowStyles: alt,
          styles: { fontSize: 8 },
        });
        y = lastTableY(doc) + 6;
        autoTable(doc, {
          startY: y,
          head: [["", "Valeur"]],
          body: [
            ["Coût installation", eur(wIso.pvKwc * 2500)],
            ["Prime autoconso", "À vérifier"],
            ["Économies/an", eur(cp.computed.economiesEurAn)],
            ["ROI", `${cp.computed.roiAns.toFixed(1)} ans`],
          ],
          theme: "grid",
          headStyles: headGreen,
          alternateRowStyles: alt,
          styles: { fontSize: 8 },
        });
        y = lastTableY(doc) + 8;
        doc.setFontSize(7);
        doc.text("Non éligible MPR — prime autoconso — S3REnR à vérifier selon commune.", 14, y);
      } else {
        doc.setFontSize(9);
        doc.text("Non concerné.", 14, y);
      }
    }

    if (p === 13) {
      sectionTitle(doc, y, "EAU CHAUDE SANITAIRE");
      y += 8;
      const rows: string[][] = [];
      if (wIso.chauffeEauThermoL > 0)
        rows.push(["Chauffe-eau thermo", `${wIso.chauffeEauThermoL} L`, "≥ 3,3", eur(3500), eur(800)]);
      if (wIso.cesiM2 > 0) rows.push(["CESI", `${wIso.cesiM2} m² capteurs`, "—", eur(wIso.cesiM2 * 7000), eur(3000)]);
      if (rows.length === 0) rows.push(["—", "—", "—", "—", "—"]);
      autoTable(doc, {
        startY: y,
        head: [["Équipement", "Volume", "COP", "Coût HT", "MPR"]],
        body: rows,
        theme: "grid",
        headStyles: headGreen,
        alternateRowStyles: alt,
        styles: { fontSize: 8 },
      });
    }

    if (p === 14 || p === 15 || p === 16) {
      sectionTitle(doc, y, "AIDES FINANCIÈRES 2026");
      y += 8;
      if (p === 14) {
        boxAlert(
          doc,
          y,
          24,
          [
            "⚠️ Barèmes ANAH Février 2026",
            "Bonus sortie passoire : SUPPRIMÉ ❌",
            "Bonus BBC : SUPPRIMÉ ❌",
            "CEE non cumulable avec Parcours ❌",
          ],
          RED,
          [254, 242, 242]
        );
        y += 28;
        const mprBody = input.step2Rows.map((r) => {
          const mid = (r.lowCost + r.highCost) / 2;
          const plaf =
            r.key.includes("combles") || r.key.includes("plancher")
              ? "100 m² max"
              : r.key === "fenetresCount" || r.key === "portesEntreeCount"
                ? "10 u max"
                : r.key.startsWith("pac")
                  ? "forfait"
                  : "—";
          let tauxRow = "—";
          if (input.parcoursEligible && input.estimatedWorksCost > 0) {
            const base = Math.min(
              input.estimatedWorksCost,
              input.works.dpeGainTarget === "2_CLASSES" ? 30000 : 40000
            );
            tauxRow = `${((input.mprTotal / base) * 100).toFixed(0)} %`;
          } else if (mid > 0 && r.mpr > 0) {
            tauxRow = `${((r.mpr / mid) * 100).toFixed(0)} %`;
          }
          return [r.label, eur(mid), plaf, tauxRow, eur(r.mpr)];
        });
        const fix = mprBody.map((row) => [row[0], row[1], row[2], row[3], row[4]]);
        if (fix.length === 0) fix.push(["—", "—", "—", "—", "—"]);
        autoTable(doc, {
          startY: y,
          head: [["Travaux", "Coût HT", "Plafond", `Taux ${input.profile}`, "MPR"]],
          body: fix,
          theme: "grid",
          headStyles: headGreen,
          alternateRowStyles: alt,
          styles: { fontSize: 7 },
        });
      }
      if (p === 15) {
        if (input.parcoursEligible) {
          const plafParcours = input.works.dpeGainTarget === "2_CLASSES" ? 30000 : 40000;
          autoTable(doc, {
            startY: y,
            head: [["Gain DPE", "Plafond HT", `Taux ${input.profile}`, "MPR max"]],
            body: [[`${input.gainClasses} classe(s)`, eur(plafParcours), mprParcoursRatePct, eur(input.mprTotal)]],
            theme: "grid",
            headStyles: headGreen,
            alternateRowStyles: alt,
            styles: { fontSize: 8 },
          });
          y = lastTableY(doc) + 10;
        }
        doc.setFont("helvetica", "bold");
        doc.text("CEE", 14, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        if (input.parcoursEligible) {
          boxAlert(doc, y, 16, ["⚠️ CEE non cumulable avec Parcours Accompagné."], ORANGE, [255, 247, 237]);
        } else {
          autoTable(doc, {
            startY: y,
            head: [["Travaux", "Prime CEE"]],
            body: input.step2Rows.slice(0, 6).map((r) => [r.label, eur(input.ceeEstimate / Math.max(input.step2Rows.length, 1))]),
            theme: "grid",
            headStyles: headGreen,
            alternateRowStyles: alt,
            styles: { fontSize: 8 },
          });
        }
      }
      if (p === 16) {
        autoTable(doc, {
          startY: y,
          head: [["Nb actions", "Plafond", "Durée max"]],
          body: [[`${input.actionCount}`, eur(input.ecoPtz), input.ecoPtz >= 50000 ? "20 ans" : "15 ans"]],
          theme: "grid",
          headStyles: headGreen,
          alternateRowStyles: alt,
          styles: { fontSize: 8 },
        });
        y = lastTableY(doc) + 10;
        doc.text(`Économie TVA (5,5 % vs 20 %) : ${eur(input.tvaSavings)}`, 14, y);
        y += 8;
        autoTable(doc, {
          startY: y,
          head: [["", "Montant"]],
          body: [
            ["Coût MAR", "2 500 € TTC"],
            [`Prise en charge ${input.profile}`, `${marPct} %`],
            ["Reste MAR", eur(marReste)],
          ],
          theme: "grid",
          headStyles: headGreen,
          alternateRowStyles: alt,
          styles: { fontSize: 8 },
        });
        y = lastTableY(doc) + 8;
        doc.setFontSize(7);
        doc.text("Obligatoire pour Parcours — France Rénov' : 0 808 800 700", 14, y);
        y += 10;
        doc.setFillColor(...GREEN);
        doc.rect(14, y, 182, 28, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(`MaPrimeRénov' : ${eur(input.mprTotal)}`, 18, y + 7);
        doc.text(`CEE : ${eur(input.ceeEstimate)}`, 18, y + 14);
        doc.text(`TVA économisée : ${eur(input.tvaSavings)}`, 100, y + 7);
        doc.text(`TOTAL AIDES : ${eur(input.totalAides)}`, 100, y + 14);
        doc.text(`Coût travaux TTC : ${eur(ttc)}`, 18, y + 22);
        doc.text(`RESTE À CHARGE : ${eur(input.resteCharge)}`, 100, y + 22);
        doc.setTextColor(0, 0, 0);
      }
    }

    if (p === 17 || p === 18) {
      sectionTitle(doc, y, "PLAN DE FINANCEMENT");
      y += 8;
      if (p === 17) {
        autoTable(doc, {
          startY: y,
          head: [["", "Montant"]],
          body: [
            ["Coût total TTC", eur(ttc)],
            ["- MaPrimeRénov'", `-${eur(input.mprTotal)}`],
            ["- CEE", `-${eur(input.ceeEstimate)}`],
            ["- TVA économisée", `-${eur(input.tvaSavings)}`],
            ["= Reste à charge", eur(input.resteCharge)],
            ["Éco-PTZ disponible", eur(input.ecoPtz)],
            ["Apport nécessaire", eur(apport)],
          ],
          theme: "grid",
          headStyles: headGreen,
          alternateRowStyles: alt,
          styles: { fontSize: 9 },
        });
      } else {
        autoTable(doc, {
          startY: y,
          head: [["Durée", "Taux", "Mensualité"]],
          body: [
            ["15 ans", "1,5 %", `${mens15} €/mois`],
            ["20 ans", "1,5 %", `${mens20} €/mois`],
          ],
          theme: "grid",
          headStyles: headGreen,
          alternateRowStyles: alt,
          styles: { fontSize: 9 },
        });
        y = lastTableY(doc) + 10;
        boxAlert(
          doc,
          y,
          28,
          [
            "💳 FINANCEMENT SANS APPORT — FABIEN — VIVONS COURTIER",
            "📞 06 71 19 96 45",
            "Spécialité : Éco-PTZ, 0 € apport — accord de principe : 48-72 h",
          ],
          BLUE,
          [239, 246, 255]
        );
      }
    }

    if (p === 19) {
      sectionTitle(doc, y, "ÉCONOMIES ÉNERGÉTIQUES PROJETÉES");
      y += 8;
      const idx = [1, 3, 5, 10, 20];
      const rows = idx.map((yr) => {
        const infl = Math.pow(1.05, yr - 1);
        const fa = Math.round(factAvant * infl);
        const fz = Math.round(factApres * infl);
        const eco = fa - fz;
        const cum = Math.round(eco * yr * 0.85);
        return [`An ${yr}`, eur(fa), eur(fz), eur(eco), eur(cum)];
      });
      autoTable(doc, {
        startY: y,
        head: [["Année", "Facture avant", "Facture après", "Économie/an", "Cumul"]],
        body: rows,
        theme: "grid",
        headStyles: headGreen,
        alternateRowStyles: alt,
        styles: { fontSize: 8 },
      });
      y = lastTableY(doc) + 8;
      doc.setFontSize(8);
      doc.text("Indexation prix énergie +5 %/an (hypothèse).", 14, y);
    }

    if (p === 20) {
      sectionTitle(doc, y, "ÉCONOMIES ÉNERGÉTIQUES (SUITE)");
      y += 10;
      boxAlert(
        doc,
        y,
        18,
        [
          `✅ Investissement rentabilisé en ${input.roiYears.toFixed(1)} ans`,
          `Économies sur 20 ans : ${eur(Math.round((factAvant - factApres) * 20 * 1.4))} (ordre de grandeur)`,
        ],
        GREEN,
        [236, 253, 245]
      );
    }

    if (p === 21) {
      sectionTitle(doc, y, "IMPACT ENVIRONNEMENTAL");
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Indicateur", "Avant", "Après", "Gain"]],
        body: [
          ["Consommation kWh/an", String(consoAvant), String(consoApres), `-${gainPct} %`],
          ["kWh/m²/an", String(kA), String(kB), `-${gainPct} %`],
          ["CO₂/an (kg)", String(co2A), String(co2B), `-${co2A - co2B} kg`],
          [
            "Classe énergie",
            input.step1.dpe,
            dpeVisé,
            `+${dpeClassGain(input.step1.dpe, dpeVisé)} classe(s)`,
          ],
        ],
        theme: "grid",
        headStyles: headGreen,
        alternateRowStyles: alt,
        styles: { fontSize: 8 },
      });
    }

    if (p === 22) {
      sectionTitle(doc, y, "IMPACT ENVIRONNEMENTAL (SUITE)");
      y += 10;
      const trees = Math.round((co2A - co2B) / 22);
      const km = Math.round((co2A - co2B) * 4.5);
      doc.setFontSize(9);
      doc.text(`🌳 Équivalent ${trees} arbres plantés par an — 🚗 ~${km} km voiture évités/an`, 14, y);
      y += 10;
      if (dpeVisé === "A" || dpeVisé === "B") {
        doc.text("🏆 Label BBC atteignable (sous conditions de performance globale).", 14, y);
      }
    }

    if (p === 23) {
      sectionTitle(doc, y, "IMPACT SUR LA VALEUR DU BIEN");
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Classe DPE", "Impact valeur marché"]],
        body: [
          ["G", "-15 à -20 %"],
          ["F", "-10 à -15 %"],
          ["E", "-5 à -10 %"],
          ["D", "Valeur référence"],
          ["C", "+3 à +5 %"],
          ["B", "+8 à +12 %"],
          ["A", "+15 à +25 %"],
        ],
        theme: "grid",
        headStyles: headGreen,
        alternateRowStyles: alt,
        styles: { fontSize: 8 },
      });
      y = lastTableY(doc) + 8;
      doc.text(`Gain estimé sur valeur bien : +${eur(gainPat)} (indicatif)`, 14, y);
    }

    if (p === 24) {
      sectionTitle(doc, y, "OBLIGATIONS RÉGLEMENTAIRES");
      y += 10;
      boxAlert(
        doc,
        y,
        28,
        [
          "⚠️ OBLIGATIONS RÉGLEMENTAIRES",
          "Logements G : interdits à la location jan. 2025",
          "Logements F : interdits à la location jan. 2028",
          "Logements E : interdits à la location jan. 2034",
        ],
        RED,
        [254, 242, 242]
      );
    }

    if (p === 25) {
      sectionTitle(doc, y, "PLANNING PRÉVISIONNEL DES TRAVAUX");
      y += 8;
      boxAlert(
        doc,
        y,
        18,
        [
          "🏠 RÈGLE D'OR : isolation AVANT chauffage",
          "→ Économie dimensionnement : 4 000-6 000 € (ordre de grandeur)",
        ],
        GREEN,
        [236, 253, 245]
      );
      y += 22;
      autoTable(doc, {
        startY: y,
        head: [["Ordre", "Travaux", "Corps de métier", "Durée", "Semaines"]],
        body: [
          ["1", "Isolation combles", "Isolation", "2 jours", "S1-S2"],
          ["2", "ITE/ITI", "Façadier / Plaquiste", "4 sem.", "S3-S6"],
          ["3", "Planchers", "Isolation", "1 sem.", "S7-S8"],
          ["4", "Fenêtres", "Menuisier", "2 sem.", "S9-S10"],
          ["5", "VMC", "Ventilation", "3 jours", "S11"],
          ["6", "PAC", "Chauffagiste", "2 sem.", "S12-S13"],
          ["7", "Ballon thermo", "Plombier", "2 jours", "S14"],
          ["8", "Photovoltaïque", "Électricien", "2 sem.", "S15-S16"],
        ],
        theme: "grid",
        headStyles: headGreen,
        alternateRowStyles: alt,
        styles: { fontSize: 7 },
      });
      y = lastTableY(doc) + 8;
      doc.text("Durée totale indicative : 16 semaines — à affiner avec les artisans.", 14, y);
    }

    if (p === 26) {
      sectionTitle(doc, y, "PLANNING — COORDINATION");
      y += 10;
      doc.setFontSize(9);
      doc.text(
        "Anticiper délais fournisseurs (menuiseries, PAC), accès toiture, hébergement temporaire et reprise des réseaux avec le MAR. Planning indicatif non contractuel.",
        14,
        y,
        { maxWidth: 180 }
      );
    }

    if (p === 27) {
      sectionTitle(doc, y, "MODE OPÉRATOIRE — ÉTAPES CLÉS");
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Étape", "Action", "Délai", "Qui"]],
        body: [
          ["1", "Mandater MAR", "Maintenant", "Client"],
          ["2", "Visite MAR terrain", "J+15", "MAR"],
          ["3", "Validation éligibilité ANAH", "J+30", "MAR + ANAH"],
          ["4", "Dépôt demande MPR", "Avant devis", "MAR"],
          ["5", "Obtention devis artisans RGE", "J+45", "Client"],
          ["6", "Signature devis", "Après accord MPR", "Client"],
          ["7", "Démarrage travaux", "Après signature", "Artisans"],
          ["8", "Réception chantier", "Fin travaux", "Client + MAR"],
          ["9", "Dépôt solde MPR", "Après factures", "MAR"],
          ["10", "Versement MPR", "J+30 après solde", "ANAH"],
        ],
        theme: "grid",
        headStyles: headGreen,
        alternateRowStyles: alt,
        styles: { fontSize: 7 },
      });
    }

    if (p === 28) {
      sectionTitle(doc, y, "MODE OPÉRATOIRE — ALERTE");
      y += 10;
      boxAlert(
        doc,
        y,
        32,
        [
          "🚨 RÈGLE ABSOLUE — NE JAMAIS OUBLIER",
          "Ne signez AUCUN devis AVANT la demande MPR",
          "→ Risque : perte totale des aides (20 000-40 000 €)",
        ],
        RED,
        [254, 242, 242]
      );
    }

    if (p === 29) {
      sectionTitle(doc, y, "CHECKLIST ADMINISTRATIVE COMPLÈTE");
      y += 10;
      doc.setFontSize(9);
      const avant = [
        "DPE récent (moins de 5 ans)",
        "MAR sélectionné et mandaté",
        "Éligibilité ANAH confirmée",
        "Demande MPR déposée (AVANT devis)",
        "Accord MPR reçu",
        "3 devis artisans RGE comparés",
        "Financement Éco-PTZ validé",
        "Devis signés (APRÈS accord MPR)",
        "Photos avant travaux réalisées",
      ];
      const pendant = ["Artisans RGE certifiés vérifiés", "Suivi avancement chantier", "Photos d'avancement", "Réception intermédiaire par poste"];
      let yy = y;
      doc.setFont("helvetica", "bold");
      doc.text("Avant travaux", 14, yy);
      yy += 5;
      doc.setFont("helvetica", "normal");
      avant.forEach((t) => {
        doc.text(`☐ ${t}`, 18, yy);
        yy += 5;
      });
      yy += 3;
      doc.setFont("helvetica", "bold");
      doc.text("Pendant travaux", 14, yy);
      yy += 5;
      doc.setFont("helvetica", "normal");
      pendant.forEach((t) => {
        doc.text(`☐ ${t}`, 18, yy);
        yy += 5;
      });
    }

    if (p === 30) {
      sectionTitle(doc, y, "CHECKLIST — APRÈS TRAVAUX");
      y += 10;
      doc.setFontSize(9);
      const apres = [
        "Réception finale chantier",
        "Factures récupérées (toutes)",
        "Photos après travaux",
        "Dossier solde MPR déposé",
        "Attestation fin travaux signée",
        "Garanties décennales récupérées",
      ];
      let yy = y;
      doc.setFont("helvetica", "bold");
      doc.text("Après travaux", 14, yy);
      yy += 5;
      doc.setFont("helvetica", "normal");
      apres.forEach((t) => {
        doc.text(`☐ ${t}`, 18, yy);
        yy += 5;
      });
    }

    if (p === 31 || p === 32 || p === 33) {
      const fiches: { title: string; rows: string[][] }[] = [];
      if (wIso.pacAirEauKw > 0)
        fiches.push({
          title: "FICHE TECHNIQUE — PAC AIR/EAU",
          rows: [
            ["Performance", "COP ≥ 4,0"],
            ["Garantie", "2 ans pièces / 5 ans compresseur (indicatif)"],
            ["Entretien", "Annuel obligatoire"],
            ["Coût entretien", "150-250 €/an"],
            ["Certification", "RGE QualiPAC obligatoire"],
          ],
        });
      if (wIso.vmcDoubleM2 > 0)
        fiches.push({
          title: "FICHE TECHNIQUE — VMC DOUBLE FLUX",
          rows: [
            ["Performance", "Rendement ≥ 85 %"],
            ["Garantie", "2 ans"],
            ["Entretien", "Filtres 1-2 fois / an"],
            ["Coût entretien", "80-150 €/an"],
            ["Certification", "RGE"],
          ],
        });
      if (wIso.pvKwc > 0)
        fiches.push({
          title: "FICHE TECHNIQUE — PHOTOVOLTAÏQUE",
          rows: [
            ["Performance", "Module ≥ 20 % rendement (indicatif)"],
            ["Garantie", "Produit 25 ans / onduleur 10 ans"],
            ["Entretien", "Lavage occasionnel"],
            ["Coût entretien", "50-100 €/an"],
            ["Certification", "QUALIPV / RGE électricien"],
          ],
        });
      while (fiches.length < 3) {
        fiches.push({
          title: "FICHE TECHNIQUE — ISOLATION",
          rows: [
            ["Performance", "R ≥ 7 combles / R ≥ 3,7 murs"],
            ["Garantie", "Décennale entreprise"],
            ["Entretien", "Contrôle visuel périodique"],
            ["Coût entretien", "Négligeable"],
            ["Certification", "RGE Qualibat"],
          ],
        });
      }
      const fi = p - 31;
      const f = fiches[fi] ?? fiches[0];
      sectionTitle(doc, y, f.title);
      y += 10;
      autoTable(doc, {
        startY: y,
        head: [["Caractéristique", "Valeur minimale requise"]],
        body: f.rows,
        theme: "grid",
        headStyles: headGreen,
        alternateRowStyles: alt,
        styles: { fontSize: 9 },
      });
    }

    if (p === 34) {
      sectionTitle(doc, y, "VOS ARTISANS RGE RECOMMANDÉS");
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Poste", "Artisan", "Téléphone", "Certification"]],
        body: [
          ["ITE / Façade", "HB FACADIER — Bas HILMI", "06 21 63 58 93", "RGE Qualibat E-E 109538"],
          ["PAC / VMC / Isolation", "ECO SYSTÈME DURABLE", "01 70 93 97 15", "RGE QualiPAC"],
          ["Isolation éco", "2C ENERGIES", "09 72 57 47 47", "RGE"],
          ["Menuiseries", "SIPV MENUISERIE", "05 49 43 72 93", "RGE NF CSTB"],
        ],
        theme: "grid",
        headStyles: headGreen,
        alternateRowStyles: alt,
        styles: { fontSize: 7 },
      });
      y = lastTableY(doc) + 6;
      doc.setFontSize(7);
      doc.text("Tous certifiés RGE — obligatoire pour les aides.", 14, y);
    }

    if (p === 35) {
      sectionTitle(doc, y, "CONTACTS UTILES");
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Service", "Contact", "Téléphone / Web"]],
        body: [
          ["France Rénov'", "Conseil gratuit", "0 808 800 700"],
          ["ANAH", "Aides nationales", "anah.fr"],
          ["Courtier", "FABIEN — VIVONS COURTIER", "06 71 19 96 45"],
          ["RenovOptim IA", "Support", "renovoptim-ia.com"],
          ["Energia-Conseil", "AMO Sylvain", "06 10 59 68 98"],
        ],
        theme: "grid",
        headStyles: headGreen,
        alternateRowStyles: alt,
        styles: { fontSize: 8 },
      });
      y = lastTableY(doc) + 10;
      boxAlert(
        doc,
        y,
        32,
        [
          "✅ Ce rapport a été généré par RenovOptim IA",
          "Barèmes officiels ANAH Février 2026",
          "Calcul estimatif non contractuel — sous réserve d'éligibilité et d'instruction du dossier par l'ANAH",
          "renovoptim-ia.com",
        ],
        GREEN,
        [236, 253, 245]
      );
    }
  }

  const name = `rapport-renovation-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(name);
}
