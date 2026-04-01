import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-zinc-200" />
      <div className="h-4 w-full rounded bg-zinc-100" />
      <div className="mt-8 h-64 rounded-2xl border border-zinc-200 bg-white" />
    </div>
  );
}

export default function LoginPage() {
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
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
