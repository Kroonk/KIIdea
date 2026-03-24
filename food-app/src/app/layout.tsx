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
  title: "KIIdea Food - Smart Food Tracker",
  description: "Verwalte deinen Kühlschrank, scanne Barcodes und finde passende Rezepte basierend auf deinem Vorrat.",
};

import Navigation from "@/components/Navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground pb-16 md:pb-0`}
      >
        <Navigation />
        <main className="container mx-auto min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
