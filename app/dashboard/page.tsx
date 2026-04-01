import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const company =
    (user.user_metadata?.company_name as string | undefined) ?? null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-zinc-900"
          >
            Rénov&apos;Optim <span className="text-[#10b981]">IA</span>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-widest text-[#047857]">
            Tableau de bord
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            Bienvenue
          </h1>
          <p className="mt-2 text-zinc-600">
            Vous êtes connecté en tant que{" "}
            <span className="font-medium text-zinc-900">{user.email}</span>
          </p>
          {company && (
            <p className="mt-1 text-sm text-zinc-600">
              Entreprise :{" "}
              <span className="font-medium text-zinc-900">{company}</span>
            </p>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
              <p className="text-xs font-medium text-zinc-500">Essai</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">
                14 jours inclus
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Paramétrez vos dossiers et invites d’équipe depuis ici (à
                brancher sur votre logique métier).
              </p>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
              <p className="text-xs font-medium text-zinc-500">Sécurité</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">
                Session Supabase
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Cette page est réservée aux utilisateurs authentifiés
                (middleware + vérification serveur).
              </p>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-medium text-zinc-500">Prochaine étape</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">
                Intégrer le calculateur d’aides
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Branchez vos appels API et règles métier sur ce tableau de bord.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
