import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Love-O-Matic ’86 — Calculateur de compatibilité",
  description: "Une expérience de matching amoureux néon, kitsch et délicieusement rétro.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
