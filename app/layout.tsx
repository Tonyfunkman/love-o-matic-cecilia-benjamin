import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Love-O-Matic ’86 — Benjamin & Cécilia", description: "Le calculateur de compatibilité du mariage de Benjamin et Cécilia." };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><body>{children}</body></html>; }
