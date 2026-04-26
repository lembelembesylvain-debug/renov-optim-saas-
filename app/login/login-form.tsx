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
    setLoading(true);  
    setError(null);

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

    router.refresh();  
    router.push(redirectTo);  
  }

  return (  
    <div className="w-full max-w-md">  
      <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>  
      <p className="mt-2 text-sm text-zinc-600">  
        Accédez à votre espace professionnel.  
      </p>  
      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">  
        {searchParams.get("error") === "auth" && (  
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">  
            Lien de confirmation invalide ou expiré.  
          </p>  
        )}  
        {error && (  
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">  
            {error}  
          </p>  
        )}  
        <div>  
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">E-mail</label>  
          <input id="email" name="email" type="email" autoComplete="email" required value={email}  
            onChange={(e) => setEmail(e.target.value)}  
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#047857] focus:outline-none focus:ring-1 focus:ring-[#047857]"  
          />  
        </div>  
        <div>  
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">Mot de passe</label>  
          <input id="password" name="password" type="password" autoComplete="current-password" required value={password}  
            onChange={(e) => setPassword(e.target.value)}  
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#047857] focus:outline-none focus:ring-1 focus:ring-[#047857]"  
          />  
        </div>  
        <button type="submit" disabled={loading}  
          className="flex h-11 w-full items-center justify-center rounded-lg bg-[#047857] text-sm font-medium text-white hover:bg-[#065f46] disabled:opacity-50">  
          {loading ? "Connexion…" : "Se connecter"}  
        </button>  
      </form>  
      <p className="mt-6 text-center text-sm text-zinc-600">  
        Pas encore de compte ?{" "}  
        <Link href="/signup" className="font-medium text-[#047857] hover:text-[#065f46]">  
          Créer un compte  
        </Link>  
      </p>  
    </div>  
  );  
}  