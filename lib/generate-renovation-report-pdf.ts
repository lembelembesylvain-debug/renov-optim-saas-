import { jsPDF } from "jspdf";  
import autoTable from "jspdf-autotable";

export type MprProfile = "TM" | "MO" | "INT" | "SUP";

export interface RenovationReportInput {  
  clientName: string;  
  clientAddress: string;  
  clientEmail?: string;  
  clientPhone?: string;  
  advisorName: string;  
  advisorCompany: string;  
  reportDate: string;  
  mprProfile: MprProfile;  
  isIdf: boolean;  
  occupants: number;  
  annualIncome: number;  
  dpe: string;  
  dpeGainTarget: string;  
  gainClasses: number;  
  actionCount: number;  
  renovationType: "monogeste" | "parcours_accompagne";  
  selectedActions: {  
    label: string;  
    costHT: number;  
    mprRate: number;  
    mprAmount: number;  
    ceeAmount: number;  
    tva: number;  
  }[];  
  totalCostHT: number;  
  totalMpr: number;  
  totalCee: number;  
  totalTva: number;  
  totalAides: number;  
  resteACharge: number;  
  ecoPtz: number;  
  roi: number;  
  calepinagePv?: {  
    form: { surfaceToiture: number; orientation: string; inclinaison: number };  
    computed: { puissanceCrete: number; nombrePanneaux: number; productionAnnuelle: number; economiesAnnuelles: number; roi: number };  
  };  
  dimensionnementPac?: {  
    form: { surfaceChauffee: number; hauteurPlafond: number; zoneClimatique: string; dpe: string };  
    computed: { puissanceRecommandee: number; modeleSuggere: string; copEstime: number; economiesAnnuelles: number };  
  };  
  metragesFenetres?: {  
    form: Record<string, unknown>;  
    computed: { labels: string[]; quantities: number[]; unitSurfaces: number[]; totalSurfaces: number[]; grandTotal: number };  
  };  
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const G: [number, number, number] = [34, 139, 34];  
const W: [number, number, number] = [255, 255, 255];  
const D: [number, number, number] = [30, 30, 30];  
const LG: [number, number, number] = [245, 245, 245];  
const OR: [number, number, number] = [255, 140, 0];  
const BL: [number, number, number] = [0, 82, 204];

function fmt(n: number): string {  
  return new Intl.NumberFormat("fr-FR", {  
    style: "currency", currency: "EUR", maximumFractionDigits: 0,  
  }).format(n);  
}

function profileLabel(p: MprProfile): string {  
  return { TM: "Très Modeste (TM)", MO: "Modeste (MO)", INT: "Intermédiaire (INT)", SUP: "Supérieur (SUP)" }[p];  
}

function header(doc: jsPDF, page: number, total: number, title: string) {  
  doc.setFillColor(...D);  
  doc.rect(0, 0, 210, 16, "F");  
  doc.setFillColor(...G);  
  doc.rect(0, 0, 6, 16, "F");  
  doc.setTextColor(...W);  
  doc.setFontSize(8);  
  doc.setFont("helvetica", "bold");  
  doc.text("ENERGIA CONSEIL IA®", 10, 7);  
  doc.setFont("helvetica", "normal");  
  doc.text("Rapport de Rénovation Énergétique", 10, 12);  
  doc.text(`Page ${page} / ${total}  —  ${title}`, 200, 10, { align: "right" });  
  doc.setTextColor(...D);  
}

function footer(doc: jsPDF, date: string) {  
  const h = doc.internal.pageSize.height;  
  doc.setFillColor(...LG);  
  doc.rect(0, h - 10, 210, 10, "F");  
  doc.setFontSize(6.5);  
  doc.setTextColor(100, 100, 100);  
  doc.text(`ENERGIA CONSEIL IA®  —  Rapport généré le ${date}  —  Barèmes ANAH Février 2026  —  Estimatif non contractuel`, 105, h - 4, { align: "center" });  
  doc.setTextColor(...D);  
}

function secTitle(doc: jsPDF, y: number, txt: string): number {  
  doc.setFillColor(...G);  
  doc.rect(10, y, 190, 9, "F");  
  doc.setTextColor(...W);  
  doc.setFontSize(10);  
  doc.setFont("helvetica", "bold");  
  doc.text(txt, 14, y + 6.2);  
  doc.setTextColor(...D);  
  doc.setFont("helvetica", "normal");  
  return y + 13;  
}

function row(doc: jsPDF, y: number, label: string, value: string, shade = false): number {  
  if (shade) { doc.setFillColor(...LG); doc.rect(10, y, 190, 7, "F"); }  
  doc.setFontSize(9);  
  doc.setFont("helvetica", "bold");  
  doc.text(label, 14, y + 5);  
  doc.setFont("helvetica", "normal");  
  doc.text(value, 120, y + 5);  
  return y + 7;  
}

function badge(doc: jsPDF, x: number, y: number, txt: string, color: [number, number, number]) {  
  doc.setFillColor(...color);  
  doc.roundedRect(x, y, 40, 8, 2, 2, "F");  
  doc.setTextColor(...W);  
  doc.setFontSize(8);  
  doc.setFont("helvetica", "bold");  
  doc.text(txt, x + 20, y + 5.5, { align: "center" });  
  doc.setTextColor(...D);  
  doc.setFont("helvetica", "normal");  
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export function generateRenovationReportPdf(input: RenovationReportInput): void {  
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });  
  const TOTAL = 35;  
  let p = 0;

  function newPage(title: string): number {  
    if (p > 0) doc.addPage();  
    p++;  
    header(doc, p, TOTAL, title);  
    footer(doc, input.reportDate);  
    return 22;  
  }

  // ══════════════════════════════════════════════════════════════════════════  
  // PAGE 1 — COUVERTURE  
  // ══════════════════════════════════════════════════════════════════════════  
  let y = newPage("Couverture");

  // Bandeau hero  
  doc.setFillColor(...G);  
  doc.rect(0, y, 210, 55, "F");  
  doc.setFillColor(255, 255, 255, 0.1 as unknown as number);

  doc.setTextColor(...W);  
  doc.setFontSize(28);  
  doc.setFont("helvetica", "bold");  
  doc.text("RAPPORT DE RÉNOVATION", 105, y + 18, { align: "center" });  
  doc.text("ÉNERGÉTIQUE", 105, y + 30, { align: "center" });  
  doc.setFontSize(11);  
  doc.setFont("helvetica", "normal");  
  doc.text("Analyse complète • Aides financières • Plan d'action", 105, y + 40, { align: "center" });  
  doc.setFontSize(9);  
  doc.text(`Référence : RPT-${input.reportDate.replace(/-/g, "")}-${input.mprProfile}`, 105, y + 50, { align: "center" });  
  doc.setTextColor(...D);  
  y += 62;

  // Infos client  
  doc.setFillColor(250, 250, 250);  
  doc.roundedRect(10, y, 90, 65, 3, 3, "F");  
  doc.setDrawColor(...G);  
  doc.setLineWidth(0.5);  
  doc.roundedRect(10, y, 90, 65, 3, 3, "S");  
  doc.setFontSize(9);  
  doc.setFont("helvetica", "bold");  
  doc.setTextColor(...G);  
  doc.text("CLIENT", 14, y + 8);  
  doc.setTextColor(...D);  
  doc.setFont("helvetica", "normal");  
  doc.text(input.clientName || "Non renseigné", 14, y + 16);  
  doc.text(input.clientAddress || "—", 14, y + 23, { maxWidth: 82 });  
  doc.text(input.clientEmail || "—", 14, y + 33);  
  doc.text(input.clientPhone || "—", 14, y + 40);  
  doc.setFont("helvetica", "bold");  
  doc.text(`DPE : ${input.dpe} → ${input.dpeGainTarget}`, 14, y + 50);  
  doc.text(`${input.occupants} occupant(s) — ${input.isIdf ? "Île-de-France" : "Hors IDF"}`, 14, y + 57);

  // Infos conseiller  
  doc.setFillColor(250, 250, 250);  
  doc.roundedRect(110, y, 90, 65, 3, 3, "F");  
  doc.setDrawColor(...G);  
  doc.roundedRect(110, y, 90, 65, 3, 3, "S");  
  doc.setFont("helvetica", "bold");  
  doc.setTextColor(...G);  
  doc.text("CONSEILLER", 114, y + 8);  
  doc.setTextColor(...D);  
  doc.setFont("helvetica", "normal");  
  doc.text(input.advisorName, 114, y + 16);  
  doc.text(input.advisorCompany, 114, y + 23);  
  doc.text(`Date : ${input.reportDate}`, 114, y + 33);  
  doc.setFont("helvetica", "bold");  
  doc.text(`Profil : ${profileLabel(input.mprProfile)}`, 114, y + 43);  
  doc.text(`Parcours : ${input.renovationType === "parcours_accompagne" ? "Accompagné" : "Monogeste"}`, 114, y + 50);  
  y += 72;

  // Synthèse financière couverture  
  doc.setFillColor(...D);  
  doc.roundedRect(10, y, 190, 55, 3, 3, "F");  
  doc.setTextColor(...W);  
  doc.setFontSize(11);  
  doc.setFont("helvetica", "bold");  
  doc.text("SYNTHÈSE FINANCIÈRE", 105, y + 10, { align: "center" });

  const cols = [  
    { label: "Coût travaux HT", value: fmt(input.totalCostHT), color: W },  
    { label: "MaPrimeRénov'", value: fmt(input.totalMpr), color: [100, 255, 100] as [number,number,number] },  
    { label: "CEE", value: fmt(input.totalCee), color: [100, 200, 255] as [number,number,number] },  
    { label: "Total aides", value: fmt(input.totalAides), color: OR },  
  ];  
  cols.forEach((c, i) => {  
    const cx = 14 + i * 48;  
    doc.setFontSize(7.5);  
    doc.setFont("helvetica", "normal");  
    doc.setTextColor(...W);  
    doc.text(c.label, cx, y + 22);  
    doc.setFontSize(10);  
    doc.setFont("helvetica", "bold");  
    doc.setTextColor(...c.color);  
    doc.text(c.value, cx, y + 30);  
  });

  doc.setFontSize(13);  
  doc.setTextColor(...OR);  
  doc.text(`Reste à charge : ${fmt(input.resteACharge)}`, 14, y + 43);  
  doc.setFontSize(9);  
  doc.setTextColor(...W);  
  doc.setFont("helvetica", "normal");  
  doc.text(`ROI estimé : ${input.roi} ans  |  Éco-PTZ disponible : ${fmt(input.ecoPtz)}`, 200, y + 43, { align: "right" });  
  doc.setTextColor(...D);

  // ══════════════════════════════════════════════════════════════════════════  
  // PAGE 2 — SOMMAIRE  
  // ══════════════════════════════════════════════════════════════════════════  
  y = newPage("Sommaire");  
  y = secTitle(doc, y, "SOMMAIRE");  
  autoTable(doc, {  
    startY: y,  
    head: [["N°", "Section", "Page"]],  
    body: [  
      ["1", "Couverture & Synthèse financière", "1"],  
      ["2", "Sommaire", "2"],  
      ["3", "Présentation du client", "3"],  
      ["4", "Contexte réglementaire 2026", "4"],  
      ["5", "Barèmes MaPrimeRénov' ANAH Février 2026", "5"],  
      ["6", "Détail des travaux préconisés", "6"],  
      ["7", "Calcul MaPrimeRénov' détaillé", "7"],  
      ["8", "Certificats d'Économies d'Énergie (CEE)", "8"],  
      ["9", "Éco-PTZ & Financement", "9"],  
      ["10", "TVA à taux réduit 5,5%", "10"],  
      ["11", "Récapitulatif financier global", "11"],  
      ["12", "Calepinage Photovoltaïque", "12"],  
      ["13", "Dimensionnement Pompe à Chaleur", "13"],  
      ["14", "Métrages Menuiseries", "14"],  
      ["15", "Planning prévisionnel des travaux", "15"],  
      ["16", "Impact sur la valeur du bien", "16"],  
      ["17", "Diagnostic thermique simplifié", "17"],  
      ["18", "Économies d'énergie estimées", "18"],  
      ["19", "Bilan carbone", "19"],  
      ["20", "Artisans RGE partenaires", "20"],  
      ["21", "Processus MAR", "21"],  
      ["22", "Documents à fournir", "22"],  
      ["23", "Conditions générales", "23"],  
      ["24-35", "Annexes techniques", "24"],  
    ],  
    theme: "striped",  
    headStyles: { fillColor: G, textColor: W, fontStyle: "bold", fontSize: 9 },  
    columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 20, halign: "center" } },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });

  // ══════════════════════════════════════════════════════════════════════════  
  // PAGE 3 — CLIENT  
  // ══════════════════════════════════════════════════════════════════════════  
  y = newPage("Présentation du client");  
  y = secTitle(doc, y, "3. PRÉSENTATION DU CLIENT");  
  y = row(doc, y, "Nom / Raison sociale", input.clientName || "N/A", false);  
  y = row(doc, y, "Adresse du bien", input.clientAddress || "N/A", true);  
  y = row(doc, y, "Email", input.clientEmail || "—", false);  
  y = row(doc, y, "Téléphone", input.clientPhone || "—", true);  
  y = row(doc, y, "Nombre d'occupants", `${input.occupants} personne(s)`, false);  
  y = row(doc, y, "Revenus annuels", fmt(input.annualIncome), true);  
  y = row(doc, y, "Zone géographique", input.isIdf ? "Île-de-France" : "Hors Île-de-France", false);  
  y = row(doc, y, "DPE actuel", input.dpe, true);  
  y = row(doc, y, "DPE cible", input.dpeGainTarget, false);  
  y = row(doc, y, "Gain de classes", `${input.gainClasses} classe(s)`, true);  
  y = row(doc, y, "Profil MPR", profileLabel(input.mprProfile), false);  
  y = row(doc, y, "Type de parcours", input.renovationType === "parcours_accompagne" ? "Parcours Accompagné" : "Monogeste", true);  
  y = row(doc, y, "Nombre de gestes", `${input.actionCount}`, false);  
  y = row(doc, y, "Conseiller", `${input.advisorName} — ${input.advisorCompany}`, true);  
  y += 5;  
  badge(doc, 14, y, profileLabel(input.mprProfile), G);  
  badge(doc, 60, y, input.isIdf ? "ILE-DE-FRANCE" : "HORS IDF", BL);  
  badge(doc, 106, y, `DPE ${input.dpe} → ${input.dpeGainTarget}`, OR);

  // ══════════════════════════════════════════════════════════════════════════  
  // PAGE 4 — CONTEXTE RÉGLEMENTAIRE  
  // ══════════════════════════════════════════════════════════════════════════  
  y = newPage("Contexte réglementaire 2026");  
  y = secTitle(doc, y, "4. CONTEXTE RÉGLEMENTAIRE 2026");  
  autoTable(doc, {  
    startY: y,  
    head: [["Dispositif", "Description", "Plafond"]],  
    body: [  
      ["MaPrimeRénov'", "Aide principale de l'État gérée par l'ANAH", "Selon profil"],  
      ["Parcours Accompagné", "Obligatoire pour gain ≥ 2 classes DPE", "40 000€ HT"],  
      ["CEE", "Certificats d'Économies d'Énergie (fournisseurs)", "Variable"],  
      ["Éco-PTZ", "Prêt à taux zéro pour financer le reste à charge", "50 000€"],  
      ["TVA 5,5%", "Taux réduit sur travaux de rénovation énergétique", "—"],  
    ],  
    theme: "striped",  
    headStyles: { fillColor: G, textColor: W, fontStyle: "bold" },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });  
  y = (doc as any).lastAutoTable.finalY + 8;  
  y = secTitle(doc, y, "MODIFICATIONS 2026 — POINTS CLÉS");  
  autoTable(doc, {  
    startY: y,  
    body: [  
      ["❌", "Bonus passoire et bonus BBC supprimés depuis septembre 2025"],  
      ["❌", "CEE non cumulables avec le Parcours Accompagné MPR"],  
      ["❌", "ITE, ITI et Biomasse : Parcours Accompagné uniquement"],  
      ["❌", "Profil Supérieur (SUP) : aucune aide monogeste"],  
      ["❌", "VMC : uniquement si couplée à un geste d'isolation"],  
      ["✅", "Éco-PTZ cumulable avec MaPrimeRénov'"],  
      ["✅", "TVA 5,5% maintenue sur tous les gestes éligibles"],  
    ],  
    theme: "plain",  
    columnStyles: { 0: { cellWidth: 10, fontStyle: "bold" } },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });

  // ══════════════════════════════════════════════════════════════════════════  
  // PAGE 5 — BARÈMES MPR  
  // ══════════════════════════════════════════════════════════════════════════  
  y = newPage("Barèmes MaPrimeRénov' 2026");  
  y = secTitle(doc, y, "5. BARÈMES MAPRIMERENOV' — ANAH FÉVRIER 2026");  
  autoTable(doc, {  
    startY: y,  
    head: [["Zone", "Profil", "1 pers.", "2 pers.", "3 pers.", "4 pers.", "5 pers."]],  
    body: [  
      ["Hors IDF", "Très Modeste (TM)", "17 363€", "25 393€", "30 540€", "35 676€", "40 835€"],  
      ["Hors IDF", "Modeste (MO)", "22 259€", "32 553€", "39 148€", "45 735€", "52 348€"],  
      ["Hors IDF", "Intermédiaire (INT)", "31 185€", "45 842€", "55 196€", "64 550€", "73 907€"],  
      ["IDF", "Très Modeste (TM)", "24 031€", "35 270€", "42 357€", "—", "—"],  
      ["IDF", "Modeste (MO)", "29 253€", "42 933€", "51 564€", "—", "—"],  
      ["IDF", "Intermédiaire (INT)", "40 851€", "60 051€", "71 846€", "—", "—"],  
    ],  
    theme: "striped",  
    headStyles: { fillColor: G, textColor: W, fontStyle: "bold" },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });  
  y = (doc as any).lastAutoTable.finalY + 8;  
  y = secTitle(doc, y, "TAUX PARCOURS ACCOMPAGNÉ 2026");  
  autoTable(doc, {  
    startY: y,  
    head: [["Gain DPE", "Plafond HT", "Très Modeste", "Modeste", "Intermédiaire", "Supérieur"]],  
    body: [  
      ["Gain 2 classes", "30 000€", "90%", "80%", "50%", "10%"],  
      ["Gain 3+ classes", "40 000€", "100%", "80%", "50%", "10%"],  
    ],  
    theme: "striped",  
    headStyles: { fillColor: BL, textColor: W, fontStyle: "bold" },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });

  // ══════════════════════════════════════════════════════════════════════════  
  // PAGE 6 — DÉTAIL TRAVAUX  
  // ══════════════════════════════════════════════════════════════════════════  
  y = newPage("Détail des travaux préconisés");  
  y = secTitle(doc, y, "6. DÉTAIL DES TRAVAUX PRÉCONISÉS");  
  autoTable(doc, {  
    startY: y,  
    head: [["Geste de rénovation", "Coût HT", "Taux MPR", "MPR estimée", "CEE estimé", "TVA"]],  
    body: input.selectedActions.length > 0 ? input.selectedActions.map((a) => [  
      a.label,  
      fmt(a.costHT),  
      `${Math.round(a.mprRate * 100)}%`,  
      fmt(a.mprAmount),  
      fmt(a.ceeAmount),  
      `${a.tva}%`,  
    ]) : [["Aucun geste sélectionné", "—", "—", "—", "—", "—"]],  
    foot: [["TOTAL", fmt(input.totalCostHT), "", fmt(input.totalMpr), fmt(input.totalCee), ""]],  
    theme: "striped",  
    headStyles: { fillColor: G, textColor: W, fontStyle: "bold" },  
    footStyles: { fillColor: D, textColor: W, fontStyle: "bold" },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8 },  
  });

  // ══════════════════════════════════════════════════════════════════════════  
  // PAGE 7 — MPR DÉTAILLÉ  
  // ══════════════════════════════════════════════════════════════════════════  
  y = newPage("Calcul MaPrimeRénov' détaillé");  
  y = secTitle(doc, y, "7. CALCUL MAPRIMERENOV' DÉTAILLÉ");  
  y = row(doc, y, "Profil retenu", profileLabel(input.mprProfile), false);  
  y = row(doc, y, "Type de parcours", input.renovationType === "parcours_accompagne" ? "Parcours Accompagné" : "Monogeste", true);  
  y = row(doc, y, "Gain de classes DPE", `${input.gainClasses} classe(s) (${input.dpe} → ${input.dpeGainTarget})`, false);  
  y = row(doc, y, "Nombre de gestes", `${input.actionCount} geste(s)`, true);  
  y = row(doc, y, "Base de calcul HT", fmt(input.totalCostHT), false);  
  y = row(doc, y, "MaPrimeRénov' totale estimée", fmt(input.totalMpr), true);  
  y += 8;  
  autoTable(doc, {  
    startY: y,  
    head: [["Geste", "Base HT", "Taux appliqué", "MPR estimée"]],  
    body: input.selectedActions.length > 0 ? input.selectedActions.map((a) => [  
      a.label, fmt(a.costHT), `${Math.round(a.mprRate * 100)}%`, fmt(a.mprAmount),  
    ]) : [["—", "—", "—", "—"]],  
    foot: [["TOTAL MPR", fmt(input.totalCostHT), "", fmt(input.totalMpr)]],  
    theme: "striped",  
    headStyles: { fillColor: G, textColor: W, fontStyle: "bold" },  
    footStyles: { fillColor: G, textColor: W, fontStyle: "bold" },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });

  // ══════════════════════════════════════════════════════════════════════════  
  // PAGE 8 — CEE  
  // ══════════════════════════════════════════════════════════════════════════  
  y = newPage("Certificats d'Économies d'Énergie");  
  y = secTitle(doc, y, "8. CERTIFICATS D'ÉCONOMIES D'ÉNERGIE (CEE)");  
  autoTable(doc, {  
    startY: y,  
    head: [["Geste", "CEE estimé"]],  
    body: input.selectedActions.length > 0 ? input.selectedActions.map((a) => [a.label, fmt(a.ceeAmount)]) : [["—", "—"]],  
    foot: [["TOTAL CEE", fmt(input.totalCee)]],  
    theme: "striped",  
    headStyles: { fillColor: OR, textColor: W, fontStyle: "bold" },  
    footStyles: { fillColor: D, textColor: W, fontStyle: "bold" },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });  
  y = (doc as any).lastAutoTable.finalY + 8;  
  doc.setFontSize(8);  
  doc.setTextColor(150, 150, 150);  
  doc.text("⚠ Les CEE ne sont pas cumulables avec le Parcours Accompagné MaPrimeRénov'. Montants estimatifs.", 14, y);  
  doc.setTextColor(...D);

  // ══════════════════════════════════════════════════════════════════════════  
  // PAGE 9 — ÉCO-PTZ  
  // ══════════════════════════════════════════════════════════════════════════  
  y = newPage("Éco-PTZ & Financement");  
  y = secTitle(doc, y, "9. ÉCO-PTZ & PLAN DE FINANCEMENT");  
  autoTable(doc, {  
    startY: y,  
    head: [["Poste", "Montant"]],  
    body: [  
      ["Coût total travaux HT", fmt(input.totalCostHT)],  
      ["MaPrimeRénov'", `- ${fmt(input.totalMpr)}`],  
      ["CEE", `- ${fmt(input.totalCee)}`],  
      ["Reste à charge avant Éco-PTZ", fmt(input.resteACharge)],  
      ["Éco-PTZ disponible (max)", fmt(input.ecoPtz)],  
      ["Reste à financer", fmt(Math.max(0, input.resteACharge - input.ecoPtz))],  
    ],  
    theme: "striped",  
    headStyles: { fillColor: BL, textColor: W, fontStyle: "bold" },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 9 },  
  });  
  y = (doc as any).lastAutoTable.finalY + 8;  
  y = secTitle(doc, y, "CONDITIONS ÉCO-PTZ 2026");  
  autoTable(doc, {  
    startY: y,  
    body: [  
      ["Plafond", "50 000€ pour Parcours Accompagné"],  
      ["Durée", "Jusqu'à 20 ans"],  
      ["Taux", "0% (sans intérêts)"],  
      ["Cumulable avec", "MaPrimeRénov' et aides collectivités"],  
      ["Souscription", "Banque partenaire (Crédit Agricole, BNP, CIC...)"],  
    ],  
    theme: "plain",  
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });

  // ══════════════════════════════════════════════════════════════════════════  
  // PAGE 10 — TVA  
  // ══════════════════════════════════════════════════════════════════════════  
  y = newPage("TVA à taux réduit 5,5%");  
  y = secTitle(doc, y, "10. TVA À TAUX RÉDUIT 5,5%");  
  y = row(doc, y, "TVA économisée (vs taux 20%)", fmt(input.totalTva), false);  
  y += 8;  
  autoTable(doc, {  
    startY: y,  
    body: [  
      ["Taux applicable", "5,5% sur travaux de rénovation énergétique"],  
      ["Économie réalisée", fmt(input.totalTva)],  
      ["Condition logement", "Achevé depuis plus de 2 ans"],  
      ["Condition artisan", "Doit facturer au taux réduit 5,5%"],  
      ["Travaux éligibles", "Isolation, PAC, VMC, fenêtres, chaudière biomasse"],  
    ],  
    theme: "striped",  
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });

  // ══════════════════════════════════════════════════════════════════════════  
  // PAGE 11 — RÉCAPITULATIF FINANCIER  
  // ══════════════════════════════════════════════════════════════════════════  
  y = newPage("Récapitulatif financier global");  
  y = secTitle(doc, y, "11. RÉCAPITULATIF FINANCIER GLOBAL");  
  autoTable(doc, {  
    startY: y,  
    head: [["Poste financier", "Montant", "Détail"]],  
    body: [  
      ["Coût total travaux HT", fmt(input.totalCostHT), `${input.actionCount} geste(s)`],  
      ["MaPrimeRénov' (MPR)", fmt(input.totalMpr), `Profil ${input.mprProfile}`],  
      ["CEE", fmt(input.totalCee), "Fournisseurs énergie"],  
      ["TVA économisée", fmt(input.totalTva), "5,5% vs 20%"],  
      ["Total aides cumulées", fmt(input.totalAides), "MPR + CEE + TVA"],  
      ["Éco-PTZ disponible", fmt(input.ecoPtz), "Prêt à 0%"],  
      ["RESTE À CHARGE", fmt(input.resteACharge), "Après toutes aides"],  
      ["ROI estimé", `${input.roi} ans`, "Retour sur investissement"],  
    ],  
    theme: "striped",  
    headStyles: { fillColor: D, textColor: W, fontStyle: "bold" },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 9 },  
    didParseCell: (data) => {  
      if (data.row.index === 6) {  
        data.cell.styles.fillColor = G;  
        data.cell.styles.textColor = W;  
        data.cell.styles.fontStyle = "bold";  
      }  
    },  
  });

  // ══════════════════════════════════════════════════════════════════════════  
  // PAGE 12 — CALEPINAGE PV  
  // ══════════════════════════════════════════════════════════════════════════  
  y = newPage("Calepinage Photovoltaïque");  
  y = secTitle(doc, y, "12. CALEPINAGE PHOTOVOLTAÏQUE");  
  if (input.calepinagePv) {  
    const { form, computed } = input.calepinagePv;  
    y = row(doc, y, "Surface toiture disponible", `${form.surfaceToiture} m²`, false);  
    y = row(doc, y, "Orientation", form.orientation, true);  
    y = row(doc, y, "Inclinaison", `${form.inclinaison}°`, false);  
    y = row(doc, y, "Puissance crête installée", `${computed.puissanceCrete} kWc`, true);  
    y = row(doc, y, "Nombre de panneaux", `${computed.nombrePanneaux} panneaux`, false);  
    y = row(doc, y, "Production annuelle estimée", `${computed.productionAnnuelle} kWh/an`, true);  
    y = row(doc, y, "Économies annuelles", fmt(computed.economiesAnnuelles), false);  
    y = row(doc, y, "ROI panneaux solaires", `${computed.roi} ans`, true);  
  } else {  
    doc.setFontSize(9);  
    doc.setTextColor(150, 150, 150);  
    doc.text("Aucun calepinage photovoltaïque renseigné pour ce dossier.", 14, y + 8);  
    doc.setTextColor(...D);  
  }

  // ══════════════════════════════════════════════════════════════════════════  
  // PAGE 13 — PAC  
  // ══════════════════════════════════════════════════════════════════════════  
  y = newPage("Dimensionnement Pompe à Chaleur");  
  y = secTitle(doc, y, "13. DIMENSIONNEMENT POMPE À CHALEUR");  
  if (input.dimensionnementPac) {  
    const { form, computed } = input.dimensionnementPac;  
    y = row(doc, y, "Surface chauffée", `${form.surfaceChauffee} m²`, false);  
    y = row(doc, y, "Hauteur sous plafond", `${form.hauteurPlafond} m`, true);  
    y = row(doc, y, "Zone climatique", form.zoneClimatique, false);  
    y = row(doc, y, "DPE actuel", form.dpe, true);  
    y = row(doc, y, "Puissance recommandée", `${computed.puissanceRecommandee} kW`, false);  
    y = row(doc, y, "Modèle suggéré", computed.modeleSuggere, true);  
    y = row(doc, y, "COP estimé", `${computed.copEstime}`, false);  
    y = row (doc, y, "Économies annuelles PAC", fmt(computed.economiesAnnuelles), true);  
  } else {  
    doc.setFontSize(9);  
    doc.setTextColor(150, 150, 150);  
    doc.text("Aucun dimensionnement PAC renseigné pour ce dossier.", 14, y + 8);  
    doc.setTextColor(...D);  
  }

  // Pages 14-35  
  for (let i = p + 1; i <= 35; i++) {  
    y = newPage(`Annexe ${i}`);  
    y = secTitle(doc, y, `${i}. SECTION EN COURS`);  
    doc.setFontSize(9);  
    doc.text("Contenu en cours de rédaction — prochaine mise à jour.", 14, y + 8);  
  }

  doc.save(`rapport-renovation-${input.reportDate}.pdf`);  
}  