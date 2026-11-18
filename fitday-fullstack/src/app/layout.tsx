import type { Metadata } from "next";
import { Anton, Space_Grotesk, Space_Mono } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--ff-display" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--ff-body" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--ff-mono" });

export const metadata: Metadata = {
  title: "FITDAY — Il tuo guardaroba digitale",
  description: "Il tuo guardaroba digitale e il tuo personal stylist AI.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${anton.variable} ${grotesk.variable} ${mono.variable}`}>
      <body><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}