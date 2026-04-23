"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type MprProfile = "TM" | "MO" | "INT" | "SUP";
type Zone = "IDF" | "HORS_IDF";

type Message = {
  id: number;
  role: "bot" | "user";
  text: string;
};

const SUGGESTIONS = [
  "Quel est mon profil MPR ?",
  "Barèmes par geste 2026",
  "Aides PAC 2026",
  "Parcours accompagné",
  "Aides VMC",
  "CEE cumulable ?",
  "Éco-PTZ 2026",
  "MAR obligatoire ?",
];

const LIMITS = {
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

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function computeProfile(zone: Zone, persons: number, income: number): MprProfile {
  const table = LIMITS[zone];
  const index = Math.min(Math.max(persons, 1), 5) - 1;
  const extraPeople = Math.max(persons - 5, 0);
  const tm = table.TM[index] + extraPeople * table.extra.TM;
  const mo = table.MO[index] + extraPeople * table.extra.MO;
  const int = table.INT[index] + extraPeople * table.extra.INT;
  if (income <= tm) return "TM";
  if (income <= mo) return "MO";
  if (income <= int) return "INT";
  return "SUP";
}

function extractIncome(text: string) {
  const compact = text.replace(/\s/g, "");
  const match = compact.match(/(\d{4,7})(?:€|euros?|e\/an|\/an|an)?/i);
  return match ? Number(match[1]) : null;
}

function extractPersons(text: string) {
  const patterns = [
    /(\d+)\s*(personnes?|pers|p)\b/i,
    /foyer\s*de\s*(\d+)/i,
    /(\d+)\s*parts?/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

function extractZone(text: string): Zone | null {
  const t = normalizeText(text);
  if (t.includes("hors idf") || t.includes("hors ile de france")) return "HORS_IDF";
  if (t.includes("idf") || t.includes("ile de france")) return "IDF";
  return null;
}

function formatProfile(profile: MprProfile) {
  if (profile === "TM") return "Très modeste (TM)";
  if (profile === "MO") return "Modeste (MO)";
  if (profile === "INT") return "Intermédiaire (INT)";
  return "Supérieur (SUP)";
}

function fullProfileTable() {
  return `📊 Plafonds MPR 2026 (TM / MO / INT / SUP)

HORS ÎLE-DE-FRANCE
TM: 1p≤17 363€ | 2p≤25 393€ | 3p≤30 540€ | 4p≤35 676€ | 5p≤40 835€
MO: 1p≤22 259€ | 2p≤32 553€ | 3p≤39 148€ | 4p≤45 735€ | 5p≤52 348€
INT: 1p≤31 185€ | 2p≤45 842€ | 3p≤55 196€ | 4p≤64 550€ | 5p≤73 907€
SUP: au-dessus des plafonds INT

ÎLE-DE-FRANCE
TM: 1p≤24 031€ | 2p≤35 270€ | 3p≤42 357€
MO: 1p≤29 253€ | 2p≤42 933€ | 3p≤51 564€
INT: 1p≤40 851€ | 2p≤60 051€ | 3p≤71 846€
SUP: au-dessus des plafonds INT`;
}

function monogesteTable() {
  return `🧾 Monogeste ANAH Février 2026

Isolation combles: TM 25€/m² | MO 20€/m² | INT 15€/m²
Plancher bas: TM 50€/m² | MO 40€/m² | INT 25€/m²
Toiture terrasse: TM 75€/m² | MO 60€/m² | INT 40€/m²
Fenêtres: TM 100€/u | MO 80€/u | INT 40€/u
Portes d'entrée: TM 150€/u | MO 120€/u | INT 80€/u
PAC Air/Eau: TM 5 000€ | MO 4 000€ | INT 3 000€
PAC Géothermique: TM 11 000€ | MO 9 000€ | INT 6 000€
PAC Air/Air: TM 1 200€ | MO 900€ | INT 600€
VMC DF: TM 4 000€ | MO 3 000€ | INT 2 000€
VMC SF: TM 800€ | MO 600€ | INT 400€

⚠️ Ménages SUP: aucune aide MPR monogeste.`;
}

function keywordReply(rawMessage: string) {
  const message = normalizeText(rawMessage);

  if (message.includes("profil") || message.includes("revenus") || message.includes("couleur")) {
    return fullProfileTable();
  }
  if (message.includes("parcours") || message.includes("accompagne") || message.includes("global")) {
    return `✅ Parcours Accompagné 2026 :
- Gain 2 classes → plafond 30 000€ HT
  TM:90% / MO:80% / INT:50% / SUP:10%
- Gain 3+ classes → plafond 40 000€ HT
  TM:100% / MO:80% / INT:50% / SUP:10%
- ⚠️ DPE E/F/G obligatoire
- ❌ Bonus supprimés
- ❌ CEE non cumulable`;
  }
  if (message.includes("monogeste") || message.includes("par geste")) {
    return monogesteTable();
  }
  if (message.includes("pac") || message.includes("pompe")) {
    return `💰 Aides PAC 2026 :
PAC Air/Eau : TM:5000€ MO:4000€ INT:3000€
PAC Géothermique : TM:11000€ MO:9000€ INT:6000€
PAC Air/Air : TM:1200€ MO:900€ INT:600€
⚠️ SUP : aucune aide monogeste`;
  }
  if (message.includes("combles") || message.includes("isolation")) {
    return `💰 Isolation combles :
TM:25€/m² MO:20€/m² INT:15€/m²
Plancher bas : TM:50€/m² MO:40€/m² INT:25€/m²
⚠️ ITE/ITI : Parcours Accompagné uniquement`;
  }
  if (message.includes("fenetre") || message.includes("menuiserie")) {
    return `💰 Menuiseries :
Fenêtres : TM:100€/u MO:80€/u INT:40€/u
Portes : TM:150€/u MO:120€/u INT:80€/u
Plafond : 10 équipements max`;
  }
  if (message.includes("vmc") || message.includes("ventilation")) {
    return `💰 VMC 2026 :
Double flux : TM:4000€ MO:3000€ INT:2000€
Simple flux : TM:800€ MO:600€ INT:400€
❌ VMC éligible UNIQUEMENT si geste isolation`;
  }
  if (message.includes("cee")) {
    return `⚠️ CEE 2026 :
❌ NON cumulable avec Parcours Accompagné
✅ Cumulable avec Monogeste uniquement
Montants : Combles 10-20€/m² / PAC 2500-4000€`;
  }
  if (message.includes("ite") || message.includes("exterieure")) {
    return `⚠️ ITE 2026 :
❌ NON éligible MPR Monogeste
✅ Éligible Parcours Accompagné uniquement`;
  }
  if (message.includes("bonus") || message.includes("passoire") || message.includes("bbc")) {
    return `❌ Bonus supprimés depuis septembre 2025 :
- Bonus sortie passoire : supprimé
- Bonus BBC : supprimé
Ces bonus n'existent plus en 2026.`;
  }
  if (message.includes("sup") || message.includes("superieur") || message.includes("aise")) {
    return `ℹ️ Ménages SUP 2026 :
❌ Aucune aide MPR Monogeste
✅ Parcours Accompagné : 10% uniquement
Plafond 30 000€ (2 classes) / 40 000€ (3+)`;
  }
  if (message.includes("eco-ptz") || message.includes("ecoptz") || message.includes("pret")) {
    return `💰 Éco-PTZ 2026 :
1 action → 15 000€ / 15 ans
2 actions → 25 000€ / 15 ans
3 actions+ → 50 000€ / 20 ans`;
  }
  if (message.includes("mar") || message.includes("accompagnateur")) {
    return `💰 MAR 2026 :
Coût ~2500€ TTC — Obligatoire Parcours
TM:100% / MO:80% / INT:60% / SUP:40%`;
  }
  return `Je n'ai pas compris votre question.
Essayez : profil MPR, PAC, isolation,
fenêtres, VMC, CEE, Parcours Accompagné,
éco-PTZ, MAR`;
}

export default function DashboardChatPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "bot",
      text: "Bonjour, je suis Expert MPR 2026 🤖. Posez votre question sur les aides ANAH Février 2026.",
    },
  ]);

  const quickPrompts = useMemo(() => SUGGESTIONS, []);

  function handleSend(content?: string) {
    const text = (content ?? input).trim();
    if (!text) return;

    const userMessage: Message = { id: Date.now(), role: "user", text };
    const income = extractIncome(text);
    const persons = extractPersons(text);
    const zone = extractZone(text);

    let botText = "";
    if (income !== null && persons !== null && zone) {
      const profile = computeProfile(zone, persons, income);
      botText = `🎯 Profil détecté automatiquement: ${formatProfile(profile)}
Revenus: ${income.toLocaleString("fr-FR")}€ | Personnes: ${persons} | Zone: ${zone === "IDF" ? "Île-de-France" : "Hors Île-de-France"}

${keywordReply(text)}`;
    } else {
      botText = keywordReply(text);
    }

    const botMessage: Message = {
      id: Date.now() + 1,
      role: "bot",
      text: botText,
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput("");
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-semibold text-zinc-700 hover:text-zinc-900">
            ← Retour dashboard
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between rounded-t-2xl bg-[#10b981] px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <p className="text-sm font-semibold">Expert MPR 2026</p>
                  <p className="text-xs text-emerald-50">Règles ANAH Février 2026 - Local</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMinimized((v) => !v)}
                  className="rounded bg-white/20 px-2 py-1 text-xs font-semibold hover:bg-white/30"
                >
                  {isMinimized ? "▢" : "—"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded bg-white/20 px-2 py-1 text-xs font-semibold hover:bg-white/30"
                >
                  ×
                </button>
              </div>
            </div>

            {isOpen && !isMinimized && (
              <>
                <div className="h-[420px] space-y-3 overflow-y-auto p-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                          message.role === "user"
                            ? "bg-emerald-600 text-white"
                            : "border border-zinc-200 bg-zinc-50 text-zinc-800"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-200 p-3">
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                      }}
                      placeholder="Ex: revenus 32000€, 2 personnes, hors IDF"
                      className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleSend()}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Envoyer
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <aside className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-zinc-800">Raccourcis</p>
            <div className="flex flex-col gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-100"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Assistant local sans API externe.
            </p>
          </aside>
        </div>
      </div>

      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-5 right-5 rounded-full bg-[#10b981] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-600"
        >
          💬 Expert MPR
        </button>
      )}
    </div>
  );
}
