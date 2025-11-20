// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "KDS",
  description: "KDS simples para restaurante"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-slate-50 text-slate-900">
        <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-20">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
                KDS
              </span>
              <span className="text-sm font-medium text-slate-700">
                Painel do Restaurante
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Link
                href="/"
                className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100"
              >
                Home
              </Link>
              <Link
                href="/pdv"
                className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100"
              >
                PDV
              </Link>
              <Link
                href="/kds"
                className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100"
              >
                Cozinha
              </Link>
              <Link
                href="/admin"
                className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100"
              >
                Admin
              </Link>
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-4">
          {children}
        </main>
      </body>
    </html>
  );
}
