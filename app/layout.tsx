import type { Metadata } from "next";  
import { Geist, Geist_Mono } from "next/font/google";  
import "./globals.css";

const geistSans = Geist({  
  variable: "--font-geist-sans",  
  subsets: ["latin"],  
});

const geistMono = Geist_Mono({  
  variable: "--font-geist-mono",  
  subsets: ["latin"],  
});

export const metadata: Metadata = {  
  title: "Rénov'Optim IA — Calcul aides rénovation pour les pros",  
  description:  
    "SaaS B2B : calculez MaPrimeRénov', CEE et cumuls en 30 secondes. Précision 100%, barèmes à jour. Pour bureaux d'études, MAR et artisans RGE. Essai gratuit 14 jours.",  
  alternates: {  
    canonical: "https://renovoptim-ia.com/",  
  },  
  openGraph: {  
    title: "Rénov'Optim IA — Calcul aides rénovation pour les pros",  
    description:  
      "SaaS B2B : calculez MaPrimeRénov', CEE et cumuls en 30 secondes. Précision 100%, barèmes à jour. Pour bureaux d'études, MAR et artisans RGE.",  
    url: "https://renovoptim-ia.com/",  
    siteName: "Rénov'Optim IA",  
    locale: "fr_FR",  
    type: "website",  
  },  
  twitter: {  
    card: "summary_large_image",  
    title: "Rénov'Optim IA — Calcul aides rénovation pour les pros",  
    description:  
      "SaaS B2B : calculez MaPrimeRénov', CEE et cumuls en 30 secondes. Essai gratuit 14 jours.",  
  },  
};

export default function RootLayout({  
  children,  
}: Readonly<{  
  children: React.ReactNode;  
}>) {  
  return (  
    <html  
      lang="fr"  
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}  
    >  
      <body className="min-h-full flex flex-col">{children}</body>  
    </html>  
  );  
}  
