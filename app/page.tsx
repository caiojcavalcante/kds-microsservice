// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>KDS - Microserviço</h1>
      <p>Escolha um módulo:</p>
      <ul>
        <li><Link href="/pdv">PDV</Link></li>
        <li><Link href="/kds">Cozinha (KDS)</Link></li>
      </ul>
    </main>
  );
}
