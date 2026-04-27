// lib/generate-pdf.ts
// Génération PDF côté client avec jsPDF
// Usage : import { generateRenovOptimPdf } from "@/lib/generate-pdf"

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type MprProfile = "TM" | "MO" | "INT" | "SUP";

const PROFILE_LABELS: Record<MprProfile, string> = {
  TM: "Très modeste",
  MO: "Modeste",
  INT: "Intermédiaire",
  SUP: "Supérieur",
};

export type PdfInput = {
  // Logement
  housingType: "MAISON" | "APPARTEMENT" | "COPROPRIETE";
  surfaceM2: number;
  zone: "IDF" | "HORS_IDF";
  dpe: string;
  income: number;
  persons: number;
  profile: MprProfile;
  // Résultats financiers
  mprTotal: number;
  ceeEstimate: number;
  tvaSavings: number;
  totalAides: number;
  estimatedWorksCost: number;
  resteCharge: number;
  ecoPtz: number;
  annualSavings: number;
  roiYears: number;
  // Tableau détail
  rows: {
    label: string;
    quantity: string;
    lowCost: number;
    highCost: number;
    mpr: number;
    mprNote?: string;
  }[];
  // Meta
  userEmail?: string;
};

function formatEur(value: number): string {
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

function formatDate(): string {
  return new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Couleurs Rénov'Optim IA
const GREEN = "#047857";
const GREEN_LIGHT = "#d1fae5";
const BLUE = "#1d4ed8";
const BLUE_LIGHT = "#dbeafe";
const PURPLE = "#7c3aed";
const ORANGE = "#ea580c";
const RED = "#dc2626";
const INDIGO = "#4338ca";
const ZINC_800 = "#27272a";
const ZINC_500 = "#71717a";
const ZINC_100 = "#f4f4f5";
const WHITE = "#ffffff";

export function generateRenovOptimPdf(input: PdfInput): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 14;
  const contentW = W - margin * 2;
  let y = 0;

  // ─────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────
  const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const setFill = (hex: string) => doc.setFillColor(...hexToRgb(hex));
  const setTextColor = (hex: string) => doc.setTextColor(...hexToRgb(hex));
  const setDrawColor = (hex: string) => doc.setDrawColor(...hexToRgb(hex));

  const newPage = () => {
    doc.addPage();
    y = 20;
    // Footer sur chaque page
    drawFooter();
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > 270) newPage();
  };

  // ─────────────────────────────────────────
  // FOOTER
  // ─────────────────────────────────────────
  const drawFooter = () => {
    const pageCount = doc.getNumberOfPages();
    const currentPage = doc.getCurrentPageInfo().pageNumber;
    setFill(GREEN);
    doc.rect(0, 285, W, 12, "F");
    setTextColor(WHITE);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Rénov'Optim IA — www.renovoptim-ia.com — contact@renovoptim-ia.com", margin, 292);
    doc.text(`Page ${currentPage} / ${pageCount}`, W - margin, 292, { align: "right" });
  };

  // ─────────────────────────────────────────
  // PAGE 1 — HEADER + RÉSUMÉ
  // ─────────────────────────────────────────

  // Bandeau header vert
  setFill(GREEN);
  doc.rect(0, 0, W, 42, "F");

  // Logo / Titre
  setTextColor(WHITE);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Rénov'Optim IA", margin, 16);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Estimation des aides à la rénovation énergétique", margin, 24);

  doc.setFontSize(9);
  doc.text(`Généré le ${formatDate()}${input.userEmail ? ` · ${input.userEmail}` : ""}`, margin, 32);

  // Badge profil
  const profileLabel = PROFILE_LABELS[input.profile];
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Profil : ${profileLabel}`, W - margin, 20, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Zone : ${input.zone === "IDF" ? "Île-de-France" : "Hors IDF"} · DPE : ${input.dpe}`, W - margin, 28, { align: "right" });

  y = 50;

  // ─── SECTION : Votre logement ───
  setTextColor(ZINC_800);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Votre logement", margin, y);
  y += 6;

  setDrawColor("#e4e4e7");
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 6;

  const housingLabels: Record<string, string> = {
    MAISON: "Maison individuelle",
    APPARTEMENT: "Appartement",
    COPROPRIETE: "Copropriété",
  };

  const infoItems = [
    ["Type de logement", housingLabels[input.housingType] ?? input.housingType],
    ["Surface", `${input.surfaceM2} m²`],
    ["Zone géographique", input.zone === "IDF" ? "Île-de-France" : "Hors Île-de-France"],
    ["DPE actuel", `Classe ${input.dpe}`],
    ["Revenus fiscaux", formatEur(input.income) + " / an"],
    ["Personnes dans le foyer", `${input.persons}`],
    ["Profil MaPrimeRénov'", profileLabel],
  ];

  // Grille 2 colonnes
  const colW = contentW / 2 - 4;
  infoItems.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * (colW + 8);
    const itemY = y + row * 10;

    setFill(ZINC_100);
    doc.roundedRect(x, itemY - 4, colW, 9, 1, 1, "F");

    setTextColor(ZINC_500);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(item[0], x + 3, itemY + 0.5);

    setTextColor(ZINC_800);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(item[1], x + 3, itemY + 5);
  });

  y += Math.ceil(infoItems.length / 2) * 10 + 8;

  // ─── SECTION : Récapitulatif des aides ───
  checkPageBreak(70);

  setTextColor(ZINC_800);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Récapitulatif des aides estimées", margin, y);
  y += 6;

  setDrawColor("#e4e4e7");
  doc.line(margin, y, W - margin, y);
  y += 8;

  // 4 cartes aides
  const aideCards = [
    { label: "MaPrimeRénov'", value: input.mprTotal, color: GREEN, bg: GREEN_LIGHT },
    { label: "CEE (estimation)", value: input.ceeEstimate, color: BLUE, bg: BLUE_LIGHT },
    { label: "TVA 5,5%", value: input.tvaSavings, color: PURPLE, bg: "#ede9fe" },
    { label: "Total aides", value: input.totalAides, color: ORANGE, bg: "#ffedd5" },
  ];

  const cardW = contentW / 4 - 3;
  aideCards.forEach((card, i) => {
    const x = margin + i * (cardW + 4);
    const [br, bg, bb] = hexToRgb(card.bg);
    doc.setFillColor(br, bg, bb);
    doc.roundedRect(x, y, cardW, 22, 2, 2, "F");

    setTextColor(ZINC_500);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(card.label, x + cardW / 2, y + 6, { align: "center" });

    setTextColor(card.color);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(formatEur(card.value), x + cardW / 2, y + 16, { align: "center" });
  });

  y += 30;

  // 3 cartes financières
  const finCards = [
    { label: "Coût total estimé", value: input.estimatedWorksCost, color: ZINC_800 },
    { label: "Reste à charge", value: input.resteCharge, color: RED },
    { label: "Éco-PTZ estimé", value: input.ecoPtz, color: INDIGO },
  ];

  const finCardW = contentW / 3 - 3;
  finCards.forEach((card, i) => {
    const x = margin + i * (finCardW + 4.5);
    setFill(ZINC_100);
    doc.roundedRect(x, y, finCardW, 22, 2, 2, "F");

    setTextColor(ZINC_500);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(card.label, x + finCardW / 2, y + 6, { align: "center" });

    setTextColor(card.color);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(formatEur(card.value), x + finCardW / 2, y + 16, { align: "center" });
  });

  y += 30;

  // 2 cartes ROI
  const roiCards = [
    { label: "Économies annuelles estimées", value: formatEur(input.annualSavings), color: GREEN },
    { label: "Retour sur investissement", value: `${input.roiYears.toFixed(1)} ans`, color: ZINC_800 },
  ];

  const roiCardW = contentW / 2 - 3;
  roiCards.forEach((card, i) => {
    const x = margin + i * (roiCardW + 6);
    setFill(ZINC_100);
    doc.roundedRect(x, y, roiCardW, 22, 2, 2, "F");

    setTextColor(ZINC_500);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(card.label, x + roiCardW / 2, y + 6, { align: "center" });

    setTextColor(card.color);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, x + roiCardW / 2, y + 16, { align: "center" });
  });

  y += 32;

  // ─────────────────────────────────────────
  // PAGE 2 — DÉTAIL PAR POSTE
  // ─────────────────────────────────────────
  if (input.rows.length > 0) {
    checkPageBreak(40);

    setTextColor(ZINC_800);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Détail par poste de travaux", margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Travaux", "Quantité", "Coût estimé", "MPR estimée"]],
      body: input.rows.map((row) => [
        row.mprNote ? `${row.label}\n(${row.mprNote})` : row.label,
        row.quantity,
        `${formatEur(row.lowCost)} – ${formatEur(row.highCost)}`,
        formatEur(row.mpr),
      ]),
      headStyles: {
        fillColor: hexToRgb(GREEN),
        textColor: hexToRgb(WHITE),
        fontStyle: "bold",
        fontSize: 8.5,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: hexToRgb(ZINC_800),
      },
      alternateRowStyles: {
        fillColor: hexToRgb(ZINC_100),
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: 55, halign: "right" },
        3: { cellWidth: 30, halign: "right", textColor: hexToRgb(GREEN), fontStyle: "bold" },
      },
      didParseCell: (data) => {
        // Ligne totale
        if (data.row.index === input.rows.length - 1) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─────────────────────────────────────────
  // SECTION : Informations réglementaires
  // ─────────────────────────────────────────
  checkPageBreak(60);

  setTextColor(ZINC_800);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Informations réglementaires", margin, y);
  y += 6;

  setDrawColor("#e4e4e7");
  doc.line(margin, y, W - margin, y);
  y += 6;

  const legalItems = [
    {
      title: "MaPrimeRénov' (MPR)",
      text: "Aide de l'État versée par l'ANAH. Le montant dépend de votre profil de revenus, de la zone géographique et des travaux réalisés. Les barèmes 2026 sont appliqués. Sous réserve d'éligibilité et de validation par l'ANAH.",
    },
    {
      title: "Certificats d'Économies d'Énergie (CEE)",
      text: "Primes versées par les fournisseurs d'énergie. Les montants sont estimatifs et varient selon les offres du marché au moment des travaux.",
    },
    {
      title: "TVA à 5,5%",
      text: "Taux réduit applicable aux travaux de rénovation énergétique réalisés par un professionnel RGE dans une résidence principale de plus de 2 ans. L'économie est calculée par rapport au taux normal de 20%.",
    },
    {
      title: "Éco-PTZ (Éco-Prêt à Taux Zéro)",
      text: "Prêt sans intérêt jusqu'à 50 000€ pour financer des travaux de rénovation énergétique. Cumulable avec MaPrimeRénov'. Sous réserve d'acceptation par votre établissement bancaire.",
    },
  ];

  legalItems.forEach((item) => {
    checkPageBreak(22);
    setFill(GREEN_LIGHT);
    doc.roundedRect(margin, y, contentW, 18, 2, 2, "F");

    setTextColor(GREEN);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(item.title, margin + 3, y + 5);

    setTextColor(ZINC_800);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(item.text, contentW - 6);
    doc.text(lines, margin + 3, y + 11);

    y += 22;
  });

  // ─────────────────────────────────────────
  // SECTION : CTA / Prochaines étapes
  // ─────────────────────────────────────────
  checkPageBreak(50);

  y += 4;
  setFill(GREEN);
  doc.roundedRect(margin, y, contentW, 40, 3, 3, "F");

  setTextColor(WHITE);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Passez à l'étape suivante !", margin + contentW / 2, y + 12, { align: "center" });

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Obtenez votre Audit Énergétique IA complet pour maximiser vos aides et planifier vos travaux.",
    margin + contentW / 2,
    y + 20,
    { align: "center" }
  );

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Commander l'Audit IA — 199 € → www.renovoptim-ia.com", margin + contentW / 2, y + 32, {
    align: "center",
  });

  y += 48;

  // ─────────────────────────────────────────
  // DISCLAIMER
  // ─────────────────────────────────────────
  checkPageBreak(20);
  setTextColor(ZINC_500);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  const disclaimer =
    "Ce document est une estimation indicative générée automatiquement. Les montants d'aides sont calculés sur la base des barèmes 2026 et peuvent évoluer. Ils ne constituent pas un engagement de l'ANAH ou des organismes concernés. Consultez un professionnel qualifié pour une étude personnalisée.";
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentW);
  doc.text(disclaimerLines, margin, y);

  // ─────────────────────────────────────────
  // FOOTER sur toutes les pages
  // ─────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter();
  }

  // ─────────────────────────────────────────
  // TÉLÉCHARGEMENT
  // ─────────────────────────────────────────
  const fileName = `RenovOptim-Estimation-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
