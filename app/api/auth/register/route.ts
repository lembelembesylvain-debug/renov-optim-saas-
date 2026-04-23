import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

/** Domaine vérifié Resend (même logique que src/lib/emails/resendFrom côté monorepo). */
const RESEND_VERIFIED_ADDRESS = "noreply@energia-conseil-ia.com";

function buildResendFromHeader(
  envFrom: string | undefined,
  displayName: string,
): string {
  const raw = (envFrom?.trim() || RESEND_VERIFIED_ADDRESS).replace(
    /renovoptim-ia\.com/gi,
    "energia-conseil-ia.com",
  );
  if (raw.includes("<")) {
    return raw;
  }
  return `${displayName} <${raw}>`;
}

type RegisterBody = {
  email?: string;
  password?: string;
  company?: string;
};

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        error: "Inscription serveur indisponible (SUPABASE_SERVICE_ROLE_KEY manquant).",
        fallbackToClient: true,
      },
      { status: 501 }
    );
  }

  let body: RegisterBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-mail et mot de passe requis." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères." },
      { status: 400 }
    );
  }

  const supabaseAdmin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_URL?.replace(/\/$/, "") ??
    new URL(req.url).origin;

  const emailRedirectTo = `${origin.replace(/\/$/, "")}/auth/callback`;

  const userMetadata = {
    company_name: company || undefined,
    trial_started_at: new Date().toISOString(),
  };

  const resendKey = process.env.RESEND_API_KEY;
  const fromHeader = buildResendFromHeader(
    process.env.RESEND_FROM_EMAIL,
    "Rénov'Optim IA",
  );

  /** Avec Resend : lien de confirmation généré puis envoyé par notre serveur. */
  if (resendKey) {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        redirectTo: emailRedirectTo,
        data: userMetadata,
      },
    });

    if (error) {
      console.error("[auth/register] generateLink", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const link = data?.properties?.action_link;
    if (!link) {
      console.error("[auth/register] Pas de action_link dans la réponse Supabase");
      return NextResponse.json(
        { error: "Impossible de générer le lien de confirmation." },
        { status: 500 }
      );
    }

    try {
      const resend = new Resend(resendKey);
      const { error: sendError } = await resend.emails.send({
        from: fromHeader,
        to: email,
        subject: "Confirmez votre compte Rénov'Optim IA",
        html: `
          <p>Bonjour,</p>
          <p>Merci pour votre inscription sur <strong>Rénov'Optim IA</strong>.</p>
          <p>Cliquez sur le lien ci-dessous pour confirmer votre adresse e-mail et activer votre essai :</p>
          <p><a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 20px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Confirmer mon compte</a></p>
          <p style="font-size:12px;color:#666;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>${link}</p>
        `,
      });
      if (sendError) {
        console.error("[auth/register] Resend", sendError);
        return NextResponse.json(
          {
            error:
              "Compte créé mais l’envoi d’e-mail (Resend) a échoué. Vérifiez RESEND_API_KEY et RESEND_FROM_EMAIL.",
            emailSent: false,
          },
          { status: 502 }
        );
      }
      return NextResponse.json({ ok: true, emailSent: true });
    } catch (e) {
      console.error("[auth/register] Resend exception", e);
      return NextResponse.json(
        {
          error: "Compte créé mais l’envoi d’e-mail a échoué.",
          emailSent: false,
        },
        { status: 502 }
      );
    }
  }

  /** Sans Resend : Supabase envoie l’e-mail si « Confirm sign up » est activé (Auth → SMTP / fournisseur par défaut). */
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: userMetadata,
  });

  if (createError) {
    console.error("[auth/register] createUser", createError);
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    emailSent: true,
    channel: "supabase",
  });
}
