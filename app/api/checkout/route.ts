import { NextRequest, NextResponse } from 'next/server'  
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {  
  apiVersion: '2024-06-20',  
})

export async function POST(req: NextRequest) {  
  try {  
    const { priceId } = await req.json()  
    const session = await stripe.checkout.sessions.create({  
      mode: 'subscription',  
      payment_method_types: ['card'],  
      line_items: [{ price: priceId, quantity: 1 }],  
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,  
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/tarifs?canceled=true`,  
    })  
    return NextResponse.json({ url: session.url })  
  } catch (error) {  
    return NextResponse.json({ error: 'Erreur Stripe' }, { status: 500 })  
  }  
}  
