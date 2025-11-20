// app/layout.tsx
import type { ReactNode } from "react";

export const metadata = {
  title: "KDS",
  description: "KDS simples para restaurante"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
