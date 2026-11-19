import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "Estúdio de Temas para Blogger", description: "Crie e adapte temas do Blogger conversando." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
