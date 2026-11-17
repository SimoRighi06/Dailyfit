import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FITDAY — Your digital wardrobe",
  description: "Il tuo guardaroba digitale e il tuo personal stylist AI.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it"><body>{children}</body></html>;
}
