import type { Metadata } from "next";  
import { Geist, Geist_Mono } from "next/font/google";  
import "./globals.css";  
import Script from "next/script";

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
  verification: {  
    google: "aF0CpKC3qikT9aPQBuaWyuXYPGeLW9GATEI6cQ70O2w",  
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
      <head>  
        <Script  
          src="https://www.googletagmanager.com/gtag/js?id=G-HFVTLVM947"  
          strategy="afterInteractive"  
        />  
        <Script id="google-analytics" strategy="afterInteractive">  
          {`  
            window.dataLayer = window.dataLayer || [];  
            function gtag(){dataLayer.push(arguments);}  
            gtag('js', new Date());  
            gtag('config', 'G-HFVTLVM947');  
          `}  
        </Script>  
      </head>  
      <body className="min-h-full flex flex-col">{children}</body>  
    </html>  
  );  
}  
