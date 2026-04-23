import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Exception temporaire de test: bypass middleware pour /dashboard.
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Exclure API (checkout, auth, etc.), statiques et images pour éviter
     * tout effet de bord sur les routes Stripe / Resend / Supabase admin.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
