import { NextResponse, type NextRequest } from "next/server";  
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {  
  const { pathname } = request.nextUrl;

  // Pages publiques — pas de vérification auth  
  if (  
    pathname === "/" ||  
    pathname.startsWith("/login") ||  
    pathname.startsWith("/signup") ||  
    pathname.startsWith("/tarifs") ||  
    pathname.startsWith("/mentions-legales") ||  
    pathname.startsWith("/api/")  
  ) {  
    return NextResponse.next();  
  }

  // Pour tout le reste (dashboard, etc.) → vérifier la session  
  return await updateSession(request);  
}

export const config = {  
  matcher: [  
    "/((?!_next/static|_next/image|favicon.ico).*)",  
  ],  
};  