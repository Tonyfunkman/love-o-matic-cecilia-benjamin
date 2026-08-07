import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Love-O-Matic ’86 — Benjamin & Cécilia", description: "Le calculateur de compatibilité du mariage de Benjamin et Cécilia." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><body>{children}</body></html>; }
