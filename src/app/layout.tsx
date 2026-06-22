import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://repomind.ai"),
  title: {
    default: "RepoMind AI — Understand any codebase in minutes",
    template: "%s · RepoMind AI",
  },
  description:
    "Paste any public GitHub repository and get an AI-generated architecture breakdown, dependency analysis, onboarding guide, learning roadmap, and a repo-aware chat assistant.",
  keywords: [
    "codebase understanding",
    "repository analysis",
    "AI code intelligence",
    "GitHub analyzer",
    "developer onboarding",
  ],
  openGraph: {
    title: "RepoMind AI — Understand any codebase in minutes",
    description:
      "AI-powered GitHub repository intelligence: architecture, dependencies, onboarding, and a repo-aware chat assistant.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} dark`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
