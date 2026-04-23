"use client";

import { useState } from "react";

const PLANS = [
  {
    id: "essentiel" as const,
    name: "Essentiel",
    buttonLabel: "Choisir Essentiel",
    price: "99 €",
    priceId: "price_1TP4voFmKpJcFuDWEKHYYmb4",
    description: "Petites structures, premiers dossiers digitalisés.",
    features: [
      "Jusqu'à 30 dossiers / mois",
      "MPR + CEE (estimation)",
      "1 utilisateur",
      "Support e-mail",
    ],
    variant: "default" as const,
  },
  {
    id: "professionnel" as const,
    name: "Professionnel",
    buttonLabel: "Choisir Professionnel",
    price: "199 €",
    priceId: "price_1TP47wFmKpJcFuDWIr8v57VL",
    description: "Équipes commerciales et techniques.",
    features: [
      "Dossiers illimités",
      "Exports PDF & marque blanche légère",
      "Jusqu'à 5 utilisateurs",
      "Priorité support",
    ],
    variant: "popular" as const,
  },
  {
    id: "expert" as const,
    name: "Expert MAR",
    buttonLabel: "Choisir Expert MAR",
    price: "399 €",
    priceId: "price_1TP4AeFmKpJcFuDW93WwXn82",
    description: "Bureaux d'études et MAR : volume et conformité.",
    features: [
      "Tout Professionnel +",
      "API & intégrations (à venir)",
      "Utilisateurs illimités",
      "Accompagnement onboarding",
    ],
    variant: "default" as const,
  },
];

async function checkout(priceId: string): Promise<string> {
  const endpoint =
    typeof window !== "undefined"
      ? new URL("/api/checkout", window.location.origin).toString()
      : "/api/checkout";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
    credentials: "same-origin",
    redirect: "manual",
  });

  if (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400)) {
    throw new Error(
      "Redirection inattendue : le paiement doit ouvrir Stripe Checkout, pas une autre page."
    );
  }

  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? `Erreur ${res.status}`);
  }
  return data.url;
}

export default function TarifsPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function handleClick(
    e: React.MouseEvent<HTMLButtonElement>,
    priceId: string,
    planId: string
  ) {
    e.preventDefault();
    e.stopPropagation();
    setLoadingId(planId);
    void (async () => {
      try {
        const url = await checkout(priceId);
        window.location.assign(url);
      } catch (err) {
        console.error(err);
        setLoadingId(null);
      }
    })();
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <header className="mb-12 text-center sm:mb-16">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Nos tarifs
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-zinc-600 sm:text-lg">
            Facturation mensuelle, sans engagement. Résiliation possible à tout moment après la période
            d&apos;essai.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-3 lg:items-stretch">
          {PLANS.map((plan) => {
            const isPopular = plan.variant === "popular";
            const loading = loadingId === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl bg-white p-8 shadow-md ${
                  isPopular
                    ? "border-[3px] border-emerald-600 ring-1 ring-emerald-600/20"
                    : "border border-zinc-300"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                    Populaire
                  </span>
                )}

                <h2 className="text-xl font-bold text-zinc-900">{plan.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{plan.description}</p>

                <p className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight sm:text-4xl">{plan.price}</span>
                  <span className="text-sm font-medium text-zinc-500">/mois</span>
                </p>

                <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm text-zinc-700">
                  {plan.features.map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <span className="shrink-0 font-semibold text-emerald-600" aria-hidden>
                        ✓
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={loading}
                  onClick={(e) => handleClick(e, plan.priceId, plan.id)}
                  className={`mt-10 w-full rounded-xl py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    isPopular
                      ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                      : "border-2 border-zinc-900 bg-white text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  {loading ? "Chargement..." : plan.buttonLabel}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center text-sm text-zinc-500">
          Une question ? contact@energia-conseils.com
        </p>
      </div>
    </div>
  );
}
