/** Calculs partagés dashboard + rapport PDF (calepinage PV, PAC, fenêtres). */

export type PvOrientation = "SUD" | "SE_SO" | "EO";
export type PvInclinaison = "PLATE" | "FAIBLE" | "OPTIMALE" | "FORTE";
export type PvMasques = "AUCUN" | "PARTIEL" | "IMPORTANT";
export type PvToiture = "TUILES" | "ARDOISES" | "BAC_ACIER" | "TERRASSE";
export type PvClimateZone = "H1" | "H2" | "H3";

export type CalepinagePvForm = {
  roofSurfaceM2: number;
  orientation: PvOrientation;
  inclinaison: PvInclinaison;
  masques: PvMasques;
  roofType: PvToiture;
  climateZone: PvClimateZone;
};

export type PacCeiling = "2_4" | "2_5" | "2_7" | "3_PLUS";
export type PacEmetteurs = "HT" | "BT" | "PC";
export type PacFacades = 1 | 2 | 3 | 4;

export type DimensionnementPacForm = {
  ceiling: PacCeiling;
  emetteurs: PacEmetteurs;
  facades: PacFacades;
};

export type FenetreDimensions = "PETITE" | "STANDARD" | "GRANDE" | "BAIE";
export type FenetreVitrage = "SIMPLE" | "DOUBLE_OLD" | "DOUBLE_NEW";
export type FenetreOrientation = "NORD" | "SUD" | "EO" | "MIXTE";

export type MetragesFenetresForm = {
  dimensions: FenetreDimensions;
  vitrage: FenetreVitrage;
  orientation: FenetreOrientation;
};

export const DEFAULT_CALEPINAGE_FORM: CalepinagePvForm = {
  roofSurfaceM2: 0,
  orientation: "SUD",
  inclinaison: "OPTIMALE",
  masques: "AUCUN",
  roofType: "TUILES",
  climateZone: "H2",
};

export const DEFAULT_PAC_FORM: DimensionnementPacForm = {
  ceiling: "2_5",
  emetteurs: "BT",
  facades: 2,
};

export const DEFAULT_FENETRES_FORM: MetragesFenetresForm = {
  dimensions: "STANDARD",
  vitrage: "DOUBLE_OLD",
  orientation: "MIXTE",
};

const DIM_M2: Record<FenetreDimensions, number> = {
  PETITE: 0.54,
  STANDARD: 1.2,
  GRANDE: 1.8,
  BAIE: 4.4,
};

const UW: Record<FenetreVitrage, number> = {
  SIMPLE: 5.8,
  DOUBLE_OLD: 3.0,
  DOUBLE_NEW: 1.8,
};

const DPE_W_M2: Record<string, number> = {
  G: 120,
  F: 100,
  E: 80,
  D: 60,
  C: 45,
  B: 35,
  A: 30,
};

function orientationCoef(o: PvOrientation): number {
  if (o === "SUD") return 1;
  if (o === "SE_SO") return 0.95;
  return 0.85;
}

function inclinaisonCoef(i: PvInclinaison): number {
  if (i === "OPTIMALE") return 1;
  if (i === "FAIBLE") return 0.95;
  if (i === "PLATE") return 0.85;
  return 0.9;
}

function masquesCoef(m: PvMasques): number {
  if (m === "AUCUN") return 1;
  if (m === "PARTIEL") return 0.85;
  return 0.7;
}

function climateKwhPerKwc(z: PvClimateZone): number {
  if (z === "H1") return 1000;
  if (z === "H2") return 1250;
  return 1500;
}

export type CalepinagePvComputed = {
  nbPanneauxMax: number;
  puissanceMaxKwc: number;
  effectiveKwc: number;
  productionKwhAn: number;
  economiesEurAn: number;
  roiAns: number;
  labels: {
    orientation: string;
    inclinaison: string;
    masques: string;
    toiture: string;
    climateZone: string;
  };
};

const PV_LABELS = {
  orientation: { SUD: "Sud (optimal)", SE_SO: "Sud-Est / Sud-Ouest", EO: "Est / Ouest" },
  inclinaison: {
    PLATE: "Plate 0-10°",
    FAIBLE: "Faible 15-25°",
    OPTIMALE: "Optimale 30-35°",
    FORTE: "Forte 40°+",
  },
  masques: { AUCUN: "Aucun", PARTIEL: "Partiels", IMPORTANT: "Importants" },
  toiture: {
    TUILES: "Tuiles",
    ARDOISES: "Ardoises",
    BAC_ACIER: "Bac acier",
    TERRASSE: "Terrasse",
  },
};

export function computeCalepinagePv(pvKwc: number, roofM2: number, form: CalepinagePvForm): CalepinagePvComputed {
  const nbPanneauxMax = roofM2 > 0 ? Math.floor(roofM2 / 1.7) : 0;
  const puissanceMaxKwc = nbPanneauxMax * 0.5;
  const effectiveKwc =
    pvKwc > 0 && puissanceMaxKwc > 0 ? Math.min(pvKwc, puissanceMaxKwc) : pvKwc > 0 ? pvKwc : puissanceMaxKwc;

  const base = effectiveKwc * climateKwhPerKwc(form.climateZone);
  const productionKwhAn = Math.round(
    base * orientationCoef(form.orientation) * inclinaisonCoef(form.inclinaison) * masquesCoef(form.masques)
  );

  const prixKwh = 0.16;
  const economiesEurAn = Math.round(productionKwhAn * 0.6 * prixKwh + productionKwhAn * 0.4 * 0.08);
  const coutPv = pvKwc * 2500;
  const roiAns = economiesEurAn > 0 && coutPv > 0 ? coutPv / economiesEurAn : 0;

  return {
    nbPanneauxMax,
    puissanceMaxKwc: Math.round(puissanceMaxKwc * 10) / 10,
    effectiveKwc: Math.round(effectiveKwc * 10) / 10,
    productionKwhAn,
    economiesEurAn,
    roiAns,
    labels: {
      orientation: PV_LABELS.orientation[form.orientation],
      inclinaison: PV_LABELS.inclinaison[form.inclinaison],
      masques: PV_LABELS.masques[form.masques],
      toiture: PV_LABELS.toiture[form.roofType],
      climateZone: form.climateZone,
    },
  };
}

export type DimensionnementPacComputed = {
  hauteurM: number;
  volumeM3: number;
  coeffDpeWm2: number;
  puissanceKw: number;
  puissanceApresIsolationKw: number;
  labels: { ceiling: string; emetteurs: string; facades: string };
};

function ceilingToM(c: PacCeiling): number {
  if (c === "2_4") return 2.4;
  if (c === "2_5") return 2.5;
  if (c === "2_7") return 2.7;
  return 3;
}

function facadeCoef(n: PacFacades): number {
  if (n === 1) return 0.8;
  if (n === 2) return 1;
  if (n === 3) return 1.15;
  return 1.3;
}

function emetteurCoef(e: PacEmetteurs): number {
  if (e === "HT") return 1.2;
  if (e === "BT") return 1;
  return 0.9;
}

export function computeDimensionnementPac(
  surfaceM2: number,
  dpe: string,
  form: DimensionnementPacForm
): DimensionnementPacComputed {
  const hauteurM = ceilingToM(form.ceiling);
  const volumeM3 = Math.round(surfaceM2 * hauteurM);
  const coeffDpeWm2 = DPE_W_M2[dpe] ?? 60;
  const w =
    surfaceM2 * coeffDpeWm2 * facadeCoef(form.facades) * emetteurCoef(form.emetteurs);
  const puissanceKw = Math.max(1, Math.ceil(w / 1000));
  const puissanceApresIsolationKw = Math.max(1, Math.ceil(puissanceKw * 0.85));

  const ceilingLbl =
    form.ceiling === "2_4"
      ? "2,4 m"
      : form.ceiling === "2_5"
        ? "2,5 m"
        : form.ceiling === "2_7"
          ? "2,7 m"
          : "3 m+";
  const emLbl =
    form.emetteurs === "HT"
      ? "Radiateurs haute température (>55°C)"
      : form.emetteurs === "BT"
        ? "Radiateurs basse température (<45°C)"
        : "Plancher chauffant";

  return {
    hauteurM,
    volumeM3,
    coeffDpeWm2,
    puissanceKw,
    puissanceApresIsolationKw,
    labels: {
      ceiling: ceilingLbl,
      emetteurs: emLbl,
      facades: `${form.facades} façade(s)`,
    },
  };
}

export type MetragesFenetresComputed = {
  surfaceUnitM2: number;
  surfaceTotaleM2: number;
  uwActuel: number;
  deperditionsAvantW: number;
  deperditionsApresW: number;
  /** W/K (approx. U×surface) */
  gainThermiqueWK: number;
  economieChauffageEurAn: number;
  labels: { dimensions: string; vitrage: string; orientation: string };
};

const DIM_LABELS: Record<FenetreDimensions, string> = {
  PETITE: "Petites 60×90 cm (0,54 m²)",
  STANDARD: "Standard 100×120 cm (1,2 m²)",
  GRANDE: "Grandes 120×150 cm (1,8 m²)",
  BAIE: "Baies vitrées 200×220 cm (4,4 m²)",
};

const VITRAGE_LABELS: Record<FenetreVitrage, string> = {
  SIMPLE: "Simple vitrage (Uw≈5,8)",
  DOUBLE_OLD: "Double vitrage ancien >10 ans (Uw≈3,0)",
  DOUBLE_NEW: "Double vitrage récent <10 ans (Uw≈1,8)",
};

const ORI_LABELS: Record<FenetreOrientation, string> = {
  NORD: "Nord",
  SUD: "Sud",
  EO: "Est/Ouest",
  MIXTE: "Mixte",
};

const DELTA_T = 20;

export function computeMetragesFenetres(count: number, form: MetragesFenetresForm): MetragesFenetresComputed {
  const surfaceUnitM2 = DIM_M2[form.dimensions];
  const surfaceTotaleM2 = count * surfaceUnitM2;
  const uwActuel = UW[form.vitrage];
  const deperditionsAvantW = surfaceTotaleM2 * uwActuel * DELTA_T;
  const deperditionsApresW = surfaceTotaleM2 * 1.1 * DELTA_T;
  const gainThermiqueWK = Math.round(surfaceTotaleM2 * (uwActuel - 1.1) * 10) / 10;
  const heuresChauffe = 1200;
  const economieChauffageEurAn = Math.round(
    (Math.max(0, deperditionsAvantW - deperditionsApresW) / 1000) * heuresChauffe * 0.18
  );

  return {
    surfaceUnitM2,
    surfaceTotaleM2: Math.round(surfaceTotaleM2 * 100) / 100,
    uwActuel,
    deperditionsAvantW: Math.round(deperditionsAvantW),
    deperditionsApresW: Math.round(deperditionsApresW),
    gainThermiqueWK,
    economieChauffageEurAn,
    labels: {
      dimensions: DIM_LABELS[form.dimensions],
      vitrage: VITRAGE_LABELS[form.vitrage],
      orientation: ORI_LABELS[form.orientation],
    },
  };
}
