import { jsPDF } from "jspdf";

export type RenovationReportInput = {
  step1: {
    housingType: string;
    surfaceM2: number;
    constructionPeriod: string;
    zone: string;
    dpe: string;
    income: number;
    persons: number;
  };
  works: Record<string, unknown>;
  profile: string;
  profileLabel: string;
  userEmail: string | null;
  clientName?: string | null;
  clientAddress?: string | null;
  parcoursEligible: boolean;
  estimatedWorksCost: number;
  mprTotal: number;
  ceeEstimate: number;
  tvaSavings: number;
  totalAides: number;
  resteCharge: number;
  ecoPtz: number;
  annualSavings: number;
  roiYears: number;
  step2Rows: Array<{
    key: string;
    label: string;
    quantity: string;
    lowCost: number;
    highCost: number;
    mpr: number;
    mprNote?: string;
  }>;
};

function fmtEur(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}

function line(doc: jsPDF, y: number, label: string, value: string) {
  doc.setFont("helvetica", "normal");
  doc.text(label, 14, y);
  doc.setFont("helvetica", "bold");
  doc.text(value, 95, y);
  doc.setFont("helvetica", "normal");
}

export function generateRenovationReportPdf(input: RenovationReportInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const date = new Date().toLocaleDateString("fr-FR");
  let y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("RenovOptim IA — Synthèse client", 14, y);
  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date : ${date}`, 14, y);
  y += 7;
  doc.text(`Client : ${input.clientName?.trim() || input.userEmail || "N/A"}`, 14, y);
  y += 7;
  if (input.clientAddress?.trim()) {
    doc.text(`Adresse : ${input.clientAddress.trim()}`, 14, y);
    y += 7;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Logement", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  line(doc, y, "Type", input.step1.housingType);
  y += 6;
  line(doc, y, "Surface (m²)", String(input.step1.surfaceM2));
  y += 6;
  line(doc, y, "Zone", input.step1.zone);
  y += 6;
  line(doc, y, "DPE", input.step1.dpe);
  y += 6;
  line(doc, y, "Revenus / personnes", `${fmtEur(input.step1.income)} / ${input.step1.persons}`);

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Profil & parcours", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  line(doc, y, "Profil MPR", `${input.profileLabel} (${input.profile})`);
  y += 6;
  line(doc, y, "Parcours accompagné", input.parcoursEligible ? "Oui" : "Non");

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Montants (estimatif)", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  line(doc, y, "Coût travaux estimé", fmtEur(input.estimatedWorksCost));
  y += 6;
  line(doc, y, "MPR", fmtEur(input.mprTotal));
  y += 6;
  line(doc, y, "CEE", fmtEur(input.ceeEstimate));
  y += 6;
  line(doc, y, "TVA économisée", fmtEur(input.tvaSavings));
  y += 6;
  line(doc, y, "Total aides", fmtEur(input.totalAides));
  y += 6;
  line(doc, y, "Reste à charge", fmtEur(input.resteCharge));
  y += 6;
  line(doc, y, "Éco-PTZ (plafond)", fmtEur(input.ecoPtz));
  y += 6;
  line(doc, y, "Économies/an (est.)", fmtEur(input.annualSavings));
  y += 6;
  line(doc, y, "ROI (est.)", `${input.roiYears.toFixed(1)} ans`);

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Travaux retenus (aperçu)", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const row of input.step2Rows.slice(0, 12)) {
    if (y > 270) {
      doc.addPage();
      y = 16;
    }
    doc.text(`${row.label} — ${row.quantity} — MPR ${fmtEur(row.mpr)}`, 14, y, { maxWidth: 180 });
    y += 5;
  }
  if (input.step2Rows.length === 0) {
    doc.text("Aucune ligne détaillée.", 14, y);
    y += 5;
  }

  y += 8;
  if (y > 255) {
    doc.addPage();
    y = 16;
  }
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "Document indicatif — barèmes ANAH Février 2026 — non contractuel — renovoptim-ia.com",
    14,
    y,
    { maxWidth: 180 }
  );

  const name = `rapport-renovation-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(name);
}
