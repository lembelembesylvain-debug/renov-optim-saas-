"use client";

import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            company_name: company || undefined,
            trial_started_at: new Date().toISOString(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setInfo(
        "Compte créé. Si la confirmation e-mail est activée sur votre projet Supabase, vérifiez votre boîte pour activer l’essai de 14 jours."
      );
      setLoading(false);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-900"
        >
          Rénov&apos;Optim <span className="text-[#10b981]">IA</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-[#10b981]/25 bg-[#10b981]/5 px-4 py-3 text-sm text-[#047857]">
            <strong className="font-semibold">Essai gratuit 14 jours</strong> —
            accès complet sans engagement. Aucune carte bancaire requise au
            démarrage.
          </div>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-zinc-900">
            Créer un compte
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Pour bureaux d&apos;études, MAR et professionnels RGE.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-[#047857]">
                {info}
              </p>
            )}

            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-zinc-700"
              >
                Entreprise <span className="font-normal text-zinc-400">(optionnel)</span>
              </label>
              <input
                id="company"
                name="company"
                type="text"
                autoComplete="organization"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700"
              >
                E-mail professionnel
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700"
              >
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Au moins 8 caractères.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-full bg-[#10b981] text-sm font-semibold text-white transition hover:bg-[#059669] disabled:opacity-60"
            >
              {loading ? "Création…" : "Démarrer l’essai gratuit"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Déjà inscrit ?{" "}
            <Link
              href="/login"
              className="font-medium text-[#047857] hover:text-[#059669]"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
