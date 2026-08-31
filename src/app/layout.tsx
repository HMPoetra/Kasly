import type { Metadata } from "next";
import { Nunito, Inter } from "next/font/google";
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
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
        {children}
      </body>
    </html>
  );
}
