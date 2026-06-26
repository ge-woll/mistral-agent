import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mistral Agent",
  description: "Next.js Chatoberflaeche fuer einen Mistral Agenten.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
