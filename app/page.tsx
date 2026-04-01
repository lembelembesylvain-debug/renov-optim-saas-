import Link from "next/link";

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <span className="text-sm font-semibold tracking-tight text-zinc-900">
          Rénov&apos;Optim <span className="text-[#10b981]">IA</span>
        </span>
        <nav className="flex items-center gap-6 text-sm text-zinc-600">
          <Link
            href="#solution"
            className="transition-colors hover:text-zinc-900"
          >
            Solution
          </Link>
          <Link
            href="#tarifs"
            className="transition-colors hover:text-zinc-900"
          >
            Tarifs
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[#10b981] px-4 py-2 font-medium text-white shadow-sm transition hover:bg-[#059669]"
          >
            Essai gratuit
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-100 bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-28 lg:px-8 lg:pt-32">
        <p className="mb-6 inline-flex items-center rounded-full border border-[#10b981]/20 bg-[#10b981]/5 px-3 py-1 text-xs font-medium text-[#047857]">
          SaaS B2B · Rénovation énergétique
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl sm:leading-[1.1] lg:text-6xl">
          L&apos;IA qui maximise les aides financières en{" "}
          <span className="bg-gradient-to-r from-[#10b981] to-[#059669] bg-clip-text text-transparent">
            30 secondes
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
          Calculez MaPrimeRénov&apos;, CEE et cumuls sans tableur. Moins
          d&apos;erreurs, plus de dossiers validés — pour bureaux
          d&apos;études, MAR et artisans RGE.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#10b981] px-8 text-sm font-semibold text-white shadow-lg shadow-[#10b981]/25 transition hover:bg-[#059669]"
          >
            Essai gratuit 14 jours
          </Link>
          <Link
            href="#demo"
            className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-8 text-sm font-semibold text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            Voir démo
          </Link>
        </div>
        <p id="demo" className="mt-8 text-sm text-zinc-500">
          Sans carte bancaire · Données hébergées en UE
        </p>
      </div>
    </section>
  );
}

function ProblemCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
        {icon}
      </div>
      <h3 className="text-base font-semibold tracking-tight text-zinc-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        {description}
      </p>
    </div>
  );
}

function ProblemSection() {
  return (
    <section className="border-b border-zinc-100 bg-zinc-50/80 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-[#047857]">
          Le problème
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Votre temps ne devrait pas partir en calculs
        </p>
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          <ProblemCard
            title="Calcul manuel ~45 min"
            description="Chaque dossier : barèmes, plafonds, profils, cumul aides. Un goulot d'étranglement pour vos équipes commerciales et techniques."
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <ProblemCard
            title="Erreurs coûteuses"
            description="Une erreur sur le profil ou l'ordre des travaux peut faire refuser un dossier ou sous-estimer le reste à charge — et la confiance client."
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            }
          />
          <ProblemCard
            title="Barèmes obsolètes"
            description="Les règles évoluent chaque année. Tableurs et PDF figés exposent au risque juridique et à des promesses d'aides non tenues."
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
          />
        </div>
      </div>
    </section>
  );
}

function SolutionCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition hover:border-[#10b981]/30 hover:shadow-md">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10 text-[#047857]">
        {icon}
      </div>
      <h3 className="text-base font-semibold tracking-tight text-zinc-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        {description}
      </p>
    </div>
  );
}

function SolutionSection() {
  return (
    <section
      id="solution"
      className="border-b border-zinc-100 bg-white py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-[#047857]">
          La solution
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Rénov&apos;Optim IA, pensé pour les pros
        </p>
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          <SolutionCard
            title="30 secondes"
            description="Saisissez les données projet : l'outil applique les règles, ordre des travaux et plafonds — export PDF prêt pour le client ou le MAR."
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
          />
          <SolutionCard
            title="Précision 100 %"
            description="Moteur de règles versionné, traçabilité des calculs et alertes si un scénario est incohérent avec l'éligibilité ou le cumul."
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <SolutionCard
            title="Mise à jour auto"
            description="Barèmes et textes réglementaires synchronisés : vous restez alignés ANAH / CEE sans ressaisir vos modèles à chaque arrêté."
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            }
          />
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  highlighted,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 ${
        highlighted
          ? "border-[#10b981] bg-white shadow-xl shadow-[#10b981]/10 ring-1 ring-[#10b981]/20"
          : "border-zinc-200/80 bg-white shadow-sm"
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#10b981] px-3 py-0.5 text-xs font-semibold text-white">
          Populaire
        </span>
      )}
      <h3 className="text-lg font-semibold text-zinc-900">{name}</h3>
      <p className="mt-1 text-sm text-zinc-600">{description}</p>
      <p className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight text-zinc-900">
          {price}
        </span>
        <span className="text-zinc-500">/mois</span>
      </p>
      <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm text-zinc-600">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="mt-0.5 text-[#10b981]" aria-hidden>
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/signup"
        className={`mt-8 inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition ${
          highlighted
            ? "bg-[#10b981] text-white hover:bg-[#059669]"
            : "border border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50"
        }`}
      >
        Choisir {name}
      </Link>
    </div>
  );
}

function PricingSection() {
  return (
    <section
      id="tarifs"
      className="border-b border-zinc-100 bg-zinc-50/50 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-[#047857]">
          Tarifs
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Des formules qui grandissent avec vous
        </p>
        <p className="mx-auto mt-4 max-w-xl text-center text-zinc-600">
          Facturation mensuelle, résiliation à tout moment après la période
          d&apos;essai.
        </p>
        <div className="mt-14 grid gap-8 lg:grid-cols-3 lg:items-start">
          <PricingCard
            name="Essentiel"
            price="99 €"
            description="Petites structures, premiers dossiers digitalisés."
            features={[
              "Jusqu'à 30 dossiers / mois",
              "MPR + CEE (estimation)",
              "1 utilisateur",
              "Support e-mail",
            ]}
          />
          <PricingCard
            name="Professionnel"
            price="199 €"
            description="Équipes commerciales et techniques."
            features={[
              "Dossiers illimités",
              "Exports PDF & marque blanche légère",
              "Jusqu'à 5 utilisateurs",
              "Priorité support",
            ]}
            highlighted
          />
          <PricingCard
            name="Expert MAR"
            price="399 €"
            description="Bureaux d'études et MAR : volume et conformité."
            features={[
              "Tout Professionnel +",
              "API & intégrations (à venir)",
              "Utilisateurs illimités",
              "Accompagnement onboarding",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section
      id="essai"
      className="scroll-mt-20 bg-gradient-to-b from-[#10b981] to-[#059669] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Commencer l&apos;essai gratuit
        </h2>
        <p className="mx-auto mt-4 text-lg text-white/90">
          14 jours pour tester sur vos vrais projets. Aucune carte requise.
        </p>
        <Link
          href="/signup"
          className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-white px-10 text-sm font-semibold text-[#047857] shadow-lg transition hover:bg-zinc-50"
        >
          Créer mon compte
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-zinc-500 sm:flex-row sm:px-6 lg:px-8">
        <span>
          © {new Date().getFullYear()} Rénov&apos;Optim IA — Tous droits
          réservés
        </span>
        <span className="text-zinc-400">Conçu pour les pros RGE & MAR</span>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Nav />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <PricingSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
