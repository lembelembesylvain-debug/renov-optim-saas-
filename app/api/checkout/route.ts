import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Stripe non configuré (STRIPE_SECRET_KEY manquant)." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secret, {
    apiVersion: "2026-03-25.dahlia",
  });

  try {
    const { priceId } = await req.json();
    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json({ error: "priceId invalide." }, { status: 400 });
    }

    const base =
      process.env.NEXT_PUBLIC_URL?.replace(/\/$/, "") ??
      new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/dashboard?success=true`,
      cancel_url: `${base}/tarifs?canceled=true`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Session sans URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[checkout]", error);
    return NextResponse.json({ error: "Erreur Stripe" }, { status: 500 });
  }
}
