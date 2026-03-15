import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Eat Out Adviser",
  description:
    "Plataforma de recomendação de restaurantes acessíveis para pessoas com mobilidade reduzida.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <a
          href="#conteudo-principal"
          className="bg-primary focus:ring-primary-dark fixed left-2 top-2 z-50 -translate-y-full rounded-md px-4 py-2 text-white transition-transform focus:translate-y-0 focus:outline-none focus:ring-2"
        >
          Saltar para o conteúdo principal
        </a>
        {children}
      </body>
    </html>
  );
}
