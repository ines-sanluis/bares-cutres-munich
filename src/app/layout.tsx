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
  title: "Bares cutres de Múnich",
  description:
    "Mapa interactivo con los mejores bares cutres de Múnich. Kneipen, Stüberl y más.",
  openGraph: {
    title: "Bares cutres de Múnich",
    description: "Mapa interactivo con los mejores bares cutres de Múnich.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-stone-950 font-sans text-stone-100">
        {children}
      </body>
    </html>
  );
}
