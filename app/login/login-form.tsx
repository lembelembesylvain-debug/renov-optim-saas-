"use client";

import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Connexion
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Accédez à votre espace professionnel.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        {searchParams.get("error") === "auth" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Lien de confirmation invalide ou expiré.
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700"
          >
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900 shadow-sm outline-none ring-[#10b981]/0 transition focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center rounded-full bg-[#10b981] text-sm font-semibold text-white transition hover:bg-[#059669] disabled:opacity-60"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        Pas encore de compte ?{" "}
        <Link
          href="/signup"
          className="font-medium text-[#047857] hover:text-[#059669]"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
