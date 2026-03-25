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
  title: "Foodlabs",
  description: "Verwalte deinen Kühlschrank, scanne Barcodes und finde passende Rezepte basierend auf deinem Vorrat.",
};

import Navigation from "@/components/Navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { getCurrentUser } from "@/app/actions/auth";
import { Toaster } from "sonner";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser()

  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground pb-16 md:pb-0`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navigation username={user?.username} isAdmin={user?.role === "admin"} />
          <main className="container mx-auto min-h-screen px-4 md:px-6 py-6">
            {children}
          </main>
          <Toaster position="bottom-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
