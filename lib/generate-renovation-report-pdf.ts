import { jsPDF } from "jspdf";  
import autoTable from "jspdf-autotable";

export type MprProfile = "TM" | "MO" | "INT" | "SUP";

export interface RenovationReportInput {  
  clientName: string | null;  
  clientAddress: string | null;  
  clientEmail?: string;  
  clientPhone?: string;  
  advisorName: string | null;  
  advisorCompany: string | null;  
  reportDate: string | null;  
  mprProfile: MprProfile;  
  isIdf: boolean;  
  occupants: number;  
  annualIncome: number;  
  dpe: string | null;  
  dpeGainTarget: string | null;  
  gainClasses: number;  
  actionCount: number;  
  renovationType?: "monogeste" | "parcours_accompagne";  
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

function fmt(n: number): string {  
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);  
}

function profileLabel(p: MprProfile): string {  
  return { TM: "Très Modeste (TM)", MO: "Modeste (MO)", INT: "Intermédiaire (INT)", SUP: "Supérieur (SUP)" }[p];  
}

export function generateRenovationReportPdf(input: RenovationReportInput): void {  
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });  
  const G: [number, number, number] = [34, 139, 34];  
  const W: [number, number, number] = [255, 255, 255];  
  const D: [number, number, number] = [30, 30, 30];  
  const OR: [number, number, number] = [255, 140, 0];  
  const BL: [number, number, number] = [0, 82, 204];  
  let p = 0;

  function newPage(title: string): number {  
    if (p > 0) doc.addPage();  
    p++;  
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
    doc.text(`Page ${p} / 35  —  ${title}`, 200, 10, { align: "right" });  
    doc.setTextColor(...D);  
    const h = doc.internal.pageSize.height;  
    doc.setFillColor(245, 245, 245);  
    doc.rect(0, h - 10, 210, 10, "F");  
    doc.setFontSize(6.5);  
    doc.setTextColor(100, 100, 100);  
    doc.text(`ENERGIA CONSEIL IA® — Rapport généré le ${input.reportDate} — Barèmes ANAH Février 2026 — Estimatif non contractuel`, 105, h - 4, { align: "center" });  
    doc.setTextColor(...D);  
    return 22;  
  }

  function secTitle(y: number, txt: string): number {  
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

  function row(y: number, label: string, value: string, shade = false): number {  
    if (shade) { doc.setFillColor(245, 245, 245); doc.rect(10, y, 190, 7, "F"); }  
    doc.setFontSize(9);  
    doc.setFont("helvetica", "bold");  
    doc.text(label, 14, y + 5);  
    doc.setFont("helvetica", "normal");  
    doc.text(value, 120, y + 5);  
    return y + 7;  
  }

  // PAGE 1 — COUVERTURE  
  let y = newPage("Couverture");  
  doc.setFillColor(...G);  
  doc.rect(0, y, 210, 50, "F");  
  doc.setTextColor(...W);  
  doc.setFontSize(24);  
  doc.setFont("helvetica", "bold");  
  doc.text("RAPPORT DE RÉNOVATION", 105, y + 16, { align: "center" });  
  doc.text("ÉNERGÉTIQUE", 105, y + 28, { align: "center" });  
  doc.setFontSize(10);  
  doc.setFont("helvetica", "normal");  
  doc.text("Analyse complète • Aides financières • Plan d'action", 105, y + 38, { align: "center" });  
  doc.setTextColor(...D);  
  y += 58;

  doc.setFillColor(250, 250, 250);  
  doc.roundedRect(10, y, 90, 60, 3, 3, "F");  
  doc.setDrawColor(...G);  
  doc.setLineWidth(0.5);  
  doc.roundedRect(10, y, 90, 60, 3, 3, "S");  
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

  doc.setFillColor(250, 250, 250);  
  doc.roundedRect(110, y, 90, 60, 3, 3, "F");  
  doc.setDrawColor(...G);  
  doc.roundedRect(110, y, 90, 60, 3, 3, "S");  
  doc.setFont("helvetica", "bold");  
  doc.setTextColor(...G);  
  doc.text("CONSEILLER", 114, y + 8);  
  doc.setTextColor(...D);  
  doc.setFont("helvetica", "normal");  
  doc.text(input.advisorName ?? "", 114, y + 16);   
  doc.text(input.advisorCompany ?? "", 114, y + 23);    
  doc.text(`Date : ${input.reportDate ?? ""}`, 114, y + 33);    
  doc.setFont("helvetica", "bold");  
  doc.text(`Profil : ${profileLabel(input.mprProfile)}`, 114, y + 43);  
  y += 68;

  doc.setFillColor(...D);  
  doc.roundedRect(10, y, 190, 50, 3, 3, "F");  
  doc.setTextColor(...W);  
  doc.setFontSize(11);  
  doc.setFont("helvetica", "bold");  
  doc.text("SYNTHÈSE FINANCIÈRE", 105, y + 10, { align: "center" });  
  doc.setFontSize(9);  
  doc.setFont("helvetica", "normal");  
  doc.text(`Coût travaux HT : ${fmt(input.totalCostHT)}`, 20, y + 22);  
  doc.text(`MaPrimeRénov' : ${fmt(input.totalMpr)}`, 20, y + 30);  
  doc.text(`CEE : ${fmt(input.totalCee)}`, 110, y + 22);  
  doc.text(`Total aides : ${fmt(input.totalAides)}`, 110, y + 30);  
  doc.setFontSize(13);  
  doc.setFont("helvetica", "bold");  
  doc.setTextColor(...OR);  
  doc.text(`Reste à charge : ${fmt(input.resteACharge)}  |  ROI : ${input.roi} ans`, 105, y + 43, { align: "center" });  
  doc.setTextColor(...D);

  // PAGE 2 — SOMMAIRE  
  y = newPage("Sommaire");  
  y = secTitle(y, "SOMMAIRE");  
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
      ["17", "Diagnostic thermique", "17"],  
      ["18", "Économies d'énergie estimées", "18"],  
      ["19", "Bilan carbone", "19"],  
      ["20", "Artisans RGE partenaires", "20"],  
      ["21", "Processus MAR", "21"],  
      ["22", "Documents à fournir", "22"],  
      ["23", "Conditions générales", "23"],  
      ["24-35", "Annexes techniques", "24"],  
    ],  
    theme: "striped",  
    headStyles: { fillColor: G, textColor: W, fontStyle: "bold" },  
    columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 20, halign: "center" } },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });

  // PAGE 3 — CLIENT  
  y = newPage("Présentation du client");  
  y = secTitle(y, "3. PRÉSENTATION DU CLIENT");  
  y = row(y, "Nom", input.clientName || "N/A", false);  
  y = row(y, "Adresse", input.clientAddress || "N/A", true);  
  y = row(y, "Email", input.clientEmail || "—", false);  
  y = row(y, "Téléphone", input.clientPhone || "—", true);  
  y = row(y, "Occupants", `${input.occupants} personne(s)`, false);  
  y = row(y, "Revenus annuels", fmt(input.annualIncome), true);  
  y = row(y, "Zone", input.isIdf ? "Île-de-France" : "Hors Île-de-France", false);  
  y = row(y, "DPE actuel → cible", `${input.dpe} → ${input.dpeGainTarget}`, true);  
  y = row(y, "Gain classes", `${input.gainClasses} classe(s)`, false);  
  y = row(y, "Profil MPR", profileLabel(input.mprProfile), true);  
  y = row(y, "Parcours", input.renovationType === "parcours_accompagne" ? "Accompagné" : "Monogeste", false);  
  y = row(y, "Conseiller", `${input.advisorName} — ${input.advisorCompany}`, true);

  // PAGE 4 — CONTEXTE  
  y = newPage("Contexte réglementaire 2026");  
  y = secTitle(y, "4. CONTEXTE RÉGLEMENTAIRE 2026");  
  autoTable(doc, {  
    startY: y,  
    head: [["Dispositif", "Description", "Plafond"]],  
    body: [  
      ["MaPrimeRénov'", "Aide principale État gérée par l'ANAH", "Selon profil"],  
      ["Parcours Accompagné", "Obligatoire gain ≥ 2 classes DPE", "40 000€ HT"],  
      ["CEE", "Certificats Économies d'Énergie", "Variable"],  
      ["Éco-PTZ", "Prêt taux zéro reste à charge", "50 000€"],  
      ["TVA 5,5%", "Taux réduit travaux rénovation", "—"],  
    ],  
    theme: "striped",  
    headStyles: { fillColor: G, textColor: W, fontStyle: "bold" },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });  
  y = (doc as any).lastAutoTable.finalY + 8;  
  y = secTitle(y, "POINTS CLÉS 2026");  
  autoTable(doc, {  
    startY: y,  
    body: [  
      ["❌", "Bonus passoire et BBC supprimés depuis sept. 2025"],  
      ["❌", "CEE non cumulables avec Parcours Accompagné"],  
      ["❌", "ITE/ITI/Biomasse : Parcours Accompagné uniquement"],  
      ["❌", "Profil SUP : aucune aide monogeste"],  
      ["✅", "Éco-PTZ cumulable avec MaPrimeRénov'"],  
      ["✅", "TVA 5,5% maintenue sur gestes éligibles"],  
    ],  
    theme: "plain",  
    columnStyles: { 0: { cellWidth: 10, fontStyle: "bold" } },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });

  // PAGE 5 — BARÈMES  
  y = newPage("Barèmes MaPrimeRénov' 2026");  
  y = secTitle(y, "5. BARÈMES MAPRIMERENOV' — ANAH FÉVRIER 2026");  
  autoTable(doc, {  
    startY: y,  
    head: [["Zone", "Profil", "1 pers.", "2 pers.", "3 pers.", "4 pers.", "5 pers."]],  
    body: [  
      ["Hors IDF", "Très Modeste", "17 363€", "25 393€", "30 540€", "35 676€", "40 835€"],  
      ["Hors IDF", "Modeste", "22 259€", "32 553€", "39 148€", "45 735€", "52 348€"],  
      ["Hors IDF", "Intermédiaire", "31 185€", "45 842€", "55 196€", "64 550€", "73 907€"],  
      ["IDF", "Très Modeste", "24 031€", "35 270€", "42 357€", "—", "—"],  
      ["IDF", "Modeste", "29 253€", "42 933€", "51 564€", "—", "—"],  
      ["IDF", "Intermédiaire", "40 851€", "60 051€", "71 846€", "—", "—"],  
    ],  
    theme: "striped",  
    headStyles: { fillColor: G, textColor: W, fontStyle: "bold" },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });  
  y = (doc as any).lastAutoTable.finalY + 8;  
  y = secTitle(y, "TAUX PARCOURS ACCOMPAGNÉ");  
  autoTable(doc, {  
    startY: y,  
    head: [["Gain DPE", "Plafond HT", "TM", "MO", "INT", "SUP"]],  
    body: [  
      ["2 classes", "30 000€", "90%", "80%", "50%", "10%"],  
      ["3+ classes", "40 000€", "100%", "80%", "50%", "10%"],  
    ],  
    theme: "striped",  
    headStyles: { fillColor: BL, textColor: W, fontStyle: "bold" },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });

  // PAGE 6 — TRAVAUX  
  y = newPage("Détail des travaux");  
  y = secTitle(y, "6. DÉTAIL DES TRAVAUX PRÉCONISÉS");  
  autoTable(doc, {  
    startY: y,  
    head: [["Geste", "Coût HT", "Taux MPR", "MPR", "CEE", "TVA"]],  
    body: input.selectedActions.length > 0  
      ? input.selectedActions.map((a) => [a.label, fmt(a.costHT), `${Math.round(a.mprRate * 100)}%`, fmt(a.mprAmount), fmt(a.ceeAmount), `${a.tva}%`])  
      : [["Aucun geste sélectionné", "—", "—", "—", "—", "—"]],  
    foot: [["TOTAL", fmt(input.totalCostHT), "", fmt(input.totalMpr), fmt(input.totalCee), ""]],  
    theme: "striped",  
    headStyles: { fillColor: G, textColor: W, fontStyle: "bold" },  
    footStyles: { fillColor: D, textColor: W, fontStyle: "bold" },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8 },  
  });

  // PAGE 7 — MPR  
  y = newPage("MaPrimeRénov' détaillée");  
  y = secTitle(y, "7. CALCUL MAPRIMERENOV' DÉTAILLÉ");  
  y = row(y, "Profil", profileLabel(input.mprProfile), false);  
  y = row(y, "Parcours", input.renovationType === "parcours_accompagne" ? "Accompagné" : "Monogeste", true);  
  y = row(y, "Gain DPE", `${input.gainClasses} classe(s)`, false);  
  y = row(y, "Base HT", fmt(input.totalCostHT), true);  
  y = row(y, "MPR totale", fmt(input.totalMpr), false);  
  y += 8;  
  autoTable(doc, {  
    startY: y,  
    head: [["Geste", "Base HT", "Taux", "MPR"]],  
    body: input.selectedActions.length > 0  
      ? input.selectedActions.map((a) => [a.label, fmt(a.costHT), `${Math.round(a.mprRate * 100)}%`, fmt(a.mprAmount)])  
      : [["—", "—", "—", "—"]],  
    foot: [["TOTAL", fmt(input.totalCostHT), "", fmt(input.totalMpr)]],  
    theme: "striped",  
    headStyles: { fillColor: G, textColor: W, fontStyle: "bold" },  
    footStyles: { fillColor: G, textColor: W, fontStyle: "bold" },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });

  // PAGE 8 — CEE  
  y = newPage("CEE");  
  y = secTitle(y, "8. CERTIFICATS D'ÉCONOMIES D'ÉNERGIE (CEE)");  
  autoTable(doc, {  
    startY: y,  
    head: [["Geste", "CEE estimé"]],  
    body: input.selectedActions.length > 0  
      ? input.selectedActions.map((a) => [a.label, fmt(a.ceeAmount)])  
      : [["—", "—"]],  
    foot: [["TOTAL CEE", fmt(input.totalCee)]],  
    theme: "striped",  
    headStyles: { fillColor: OR, textColor: W, fontStyle: "bold" },  
    footStyles: { fillColor: D, textColor: W, fontStyle: "bold" },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 8.5 },  
  });

  // PAGE 9 — PTZ  
  y = newPage("Éco-PTZ");  
  y = secTitle(y, "9. ÉCO-PTZ & FINANCEMENT");  
  y = row(y, "Coût total HT", fmt(input.totalCostHT), false);  
  y = row(y, "Total aides", fmt(input.totalAides), true);  
  y = row(y, "Reste à charge", fmt(input.resteACharge), false);  
  y = row(y, "Éco-PTZ max", fmt(input.ecoPtz), true);  
  y = row(y, "Reste à financer", fmt(Math.max(0, input.resteACharge - input.ecoPtz)), false);

  // PAGE 10 — TVA  
  y = newPage("TVA 5,5%");  
  y = secTitle(y, "10. TVA À TAUX RÉDUIT 5,5%");  
  y = row(y, "TVA économisée", fmt(input.totalTva), false);  
  y = row(y, "Condition", "Logement achevé depuis + 2 ans", true);  
  y = row(y, "Taux applicable", "5,5% (vs 20% normal)", false);

  // PAGE 11 — RÉCAP FINANCIER  
  y = newPage("Récapitulatif financier");  
  y = secTitle(y, "11. RÉCAPITULATIF FINANCIER GLOBAL");  
  autoTable(doc, {  
    startY: y,  
    head: [["Poste", "Montant"]],  
    body: [  
      ["Coût total travaux HT", fmt(input.totalCostHT)],  
      ["MaPrimeRénov'", fmt(input.totalMpr)],  
      ["CEE", fmt(input.totalCee)],  
      ["TVA économisée", fmt(input.totalTva)],  
      ["Total aides", fmt(input.totalAides)],  
      ["Éco-PTZ disponible", fmt(input.ecoPtz)],  
      ["RESTE À CHARGE", fmt(input.resteACharge)],  
      ["ROI estimé", `${input.roi} ans`],  
    ],  
    theme: "striped",  
    headStyles: { fillColor: D, textColor: W, fontStyle: "bold" },  
    margin: { left: 10, right: 10 },  
    styles: { fontSize: 9 },  
  });

  // PAGE 12 — PV  
  y = newPage("Calepinage PV");  
  y = secTitle(y, "12. CALEPINAGE PHOTOVOLTAÏQUE");  
  if (input.calepinagePv) {  
    const { form, computed } = input.calepinagePv;  
    y = row(y, "Surface toiture", `${form.surfaceToiture} m²`, false);  
    y = row(y, "Orientation", form.orientation, true);  
    y = row(y, "Inclinaison", `${form.inclinaison}°`, false);  
    y = row(y, "Puissance crête", `${computed.puissanceCrete} kWc`, true);  
    y = row(y, "Nb panneaux", `${computed.nombrePanneaux}`, false);  
    y = row(y, "Production annuelle", `${computed.productionAnnuelle} kWh/an`, true);  
    y = row(y, "Économies annuelles", fmt(computed.economiesAnnuelles), false);  
    y = row(y, "ROI", `${computed.roi} ans`, true);  
  } else {  
    doc.setFontSize(9);  
    doc.setTextColor(150, 150, 150);  
    doc.text("Aucun calepinage PV renseigné.", 14, y + 8);  
    doc.setTextColor(...D);  
  }

  // PAGE 13 — PAC  
  y = newPage("Dimensionnement PAC");  
  y = secTitle(y, "13. DIMENSIONNEMENT POMPE À CHALEUR");  
  if (input.dimensionnementPac) {  
    const { form, computed } = input.dimensionnementPac;  
    y = row(y, "Surface chauffée", `${form.surfaceChauffee} m²`, false);  
    y = row(y, "Hauteur plafond", `${form.hauteurPlafond} m`, true);  
    y = row(y, "Zone climatique", form.zoneClimatique, false);  
    y = row(y, "DPE actuel", form.dpe, true);  
    y = row(y, "Puissance recommandée", `${computed.puissanceRecommandee} kW`, false);  
    y = row(y, "Modèle suggéré", computed.modeleSuggere, true);  
    y = row(y, "COP estimé", `${computed.copEstime}`, false);  
    y = row(y, "Économies annuelles", fmt(computed.economiesAnnuelles), true);  
  } else {  
    doc.setFontSize(9);  
    doc.setTextColor(150, 150, 150);  
    doc.text("Aucun dimensionnement PAC renseigné.", 14, y + 8);  
    doc.setTextColor(...D);  
  }

  // PAGE 14 — MÉTRAGES  
  y = newPage("Métrages Menuiseries");  
  y = secTitle(y, "14. MÉTRAGES MENUISERIES");  
  if (input.metragesFenetres) {  
    const { computed } = input.metragesFenetres;  
    autoTable(doc, {  
      startY: y,  
      head: [["Type", "Qté", "Surface unit.", "Surface totale"]],  
      body: computed.labels.map((label: string, i: number) => [  
        label, computed.quantities[i], `${computed.unitSurfaces[i]} m²`, `${computed.totalSurfaces[i]} m²`,  
      ]),  
      foot: [["TOTAL", "", "", `${computed.grandTotal} m²`]],  
      theme: "striped",  
      headStyles: { fillColor: G, textColor: W, fontStyle: "bold" },  
      footStyles: { fillColor: D, textColor: W, fontStyle: "bold" },  
      margin: { left: 10, right: 10 },  
    });  
  } else {  
    doc.setFontSize(9);  
    doc.setTextColor(150, 150, 150);  
    doc.text("Aucun métrage renseigné.", 14, y + 8);  
    doc.setTextColor(...D);  
  }

  // PAGES 15-35 — ANNEXES  
  const sections = [  
    "15. Planning prévisionnel des travaux",  
    "16. Impact sur la valeur du bien",  
    "17. Diagnostic thermique simplifié",  
    "18. Économies d'énergie estimées",  
    "19. Bilan carbone",  
    "20. Artisans RGE partenaires",  
    "21. Processus MAR",  
    "22. Documents à fournir",  
    "23. Conditions générales",  
    "24. Annexe technique — Isolation",  
    "25. Annexe technique — PAC",  
    "26. Annexe technique — PV",  
    "27. Annexe technique — Menuiseries",  
    "28. Annexe technique — VMC",  
    "29. Annexe technique — Chaudière",  
    "30. Annexe — Barèmes CEE",  
    "31. Annexe — Aides régionales",  
    "32. Annexe — Financement",  
    "33. Annexe — Artisans RGE",  
    "34. Annexe — Glossaire",  
    "35. Annexe — Contacts utiles",  
  ];

  const sectionContent: Record<string, string[]> = {  
    "15. Planning prévisionnel des travaux": [  
      "Phase 1 — Audit & dépôt dossier MPR : 2-4 semaines",  
      "Phase 2 — Accord de financement ANAH : 4-8 semaines",  
      "Phase 3 — Consultation artisans RGE : 2-3 semaines",  
      "Phase 4 — Réalisation des travaux : 2-8 semaines",  
      "Phase 5 — Contrôle post-travaux : 1-2 semaines",  
      "Phase 6 — Versement des aides : 4-8 semaines",  
    ],  
    "16. Impact sur la valeur du bien": [  
      "Gain 1 classe DPE : +3 à +5% de valeur vénale estimée",  
      "Gain 2 classes DPE : +6 à +10% de valeur vénale estimée",  
      "Gain 3+ classes DPE : +10 à +15% de valeur vénale estimée",  
      `Votre gain prévu : ${input.gainClasses} classe(s) (${input.dpe} → ${input.dpeGainTarget})`,  
      "Meilleure attractivité locative",  
      "Réduction des charges énergétiques",  
      "Conformité loi Climat et Résilience",  
    ],  
    "17. Diagnostic thermique simplifié": [  
      "Toiture / Combles : 25-30% des déperditions",  
      "Murs / Façades : 20-25% des déperditions",  
      "Fenêtres / Menuiseries : 10-15% des déperditions",  
      "Planchers bas : 7-10% des déperditions",  
      "Ponts thermiques : 5-10% des déperditions",  
      "Ventilation / Infiltrations : 20-25% des déperditions",  
    ],  
    "18. Économies d'énergie estimées": [  
      "Réduction consommation estimée : 40-60% selon gestes",  
      `Économies financières : ${fmt(input.totalCostHT * 0.05)} à ${fmt(input.totalCostHT * 0.08)}/an`,  
      `ROI global estimé : ${input.roi} ans`,  
      "Source : ADEME — Référentiel rénovation énergétique 2026",  
    ],  
    "19. Bilan carbone": [  
      "Chauffage gaz → PAC : -70% d'émissions CO₂",  
      "Isolation renforcée : -30% de besoins énergétiques",  
      "Panneaux PV : production d'énergie verte locale",  
      "Impact positif sur l'empreinte carbone du logement",  
    ],  
    "20. Artisans RGE partenaires": [  
      "HB FACADIER (Bas HILMI) — ITE — RGE Qualibat — 06 21 63 58 93",  
      "ECO SYSTÈME DURABLE — PAC/VMC/Isolation — RGE QualiPAC — 01 70 93 97 15",  
      "2C ENERGIES — Isolation éco — 09 72 57 47 47",  
      "SIPV MENUISERIE — Menuiseries PVC — RGE — 05 49 43 72 93",  
    ],  
    "21. Processus MAR": [  
      "Le Mandataire en Architecture de Rénovation (MAR) :",  
      "• Accompagne le ménage de A à Z",  
      "• Vérifie l'éligibilité et monte le dossier ANAH",  
      "• Coordonne les artisans RGE certifiés",  
      "• Contrôle la qualité des travaux réalisés",  
      "• Assure le suivi post-travaux",  
    ],  
    "22. Documents à fournir": [  
      "• Avis d'imposition N-1 (tous les occupants)",  
      "• Titre de propriété ou bail",  
      "• Devis des artisans RGE (avant travaux)",  
      "• Audit énergétique (Parcours Accompagné)",  
      "• RIB du bénéficiaire",  
      "• Justificatif d'identité",  
    ],  
    "23. Conditions générales": [  
      "Ce rapport est établi à titre estimatif.",  
      "Les montants sont calculés sur les barèmes ANAH Février 2026.",  
      "Ils ne constituent pas un engagement de l'ANAH.",  
      "ENERGIA CONSEIL IA® décline toute responsabilité en cas de modification réglementaire.",  
      "Validité du rapport : 3 mois à compter de la date d'émission.",  
      `Contact : contact@energia-conseil.com`,  
    ],  
  };

  sections.forEach((section) => {  
    y = newPage(section.replace(/^\d+\.\s/, ""));  
    y = secTitle(y, section.toUpperCase());  
    const content = sectionContent[section];  
    if (content) {  
      doc.setFontSize(9);  
      content.forEach((line) => {  
        doc.text(line, 14, y);  
        y += 7;  
      });  
    } else {  
      doc.setFontSize(9);  
      doc.setTextColor(150, 150, 150);  
      doc.text("Contenu technique disponible sur demande.", 14, y + 8);  
      doc.setTextColor(...D);  
    }  
  });

  doc.save(`rapport-renovation-${input.reportDate}.pdf`);  
}  
