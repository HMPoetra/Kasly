import type { Metadata } from "next";
import { Nunito, Inter } from "next/font/google";
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import Script from "next/script";
import "./globals.css";

config.autoAddCss = false;

const nunito = Nunito({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KASLY — Class Cashflow & Savings Management",
  description: "Manage your class cash, savings goals, purchases, and payment proofs — beautifully and transparently.",
  keywords: ["class", "cashflow", "savings", "management", "treasurer", "contribution"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#2B6CB0" />
      </head>
      <body className="min-h-full flex flex-col font-[var(--font-body)]">
        {/* Anti-flash: apply dark class before first paint */}
        <Script id="anti-flash" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('kasly-theme'),d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||(t==='system'&&d)){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.setAttribute('data-theme','light')}}catch(e){}`}
        </Script>
        {children}
      </body>
    </html>
  );
}
