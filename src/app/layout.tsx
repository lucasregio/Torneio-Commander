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
  title: "Torneio Commander 500",
  description:
    "Classificação suíça Bo1 para o Torneio Commander 500 do grupo — pontos, mesas e resultados no celular.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ ["--font-sans" as string]: "var(--font-geist-sans)" }}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
