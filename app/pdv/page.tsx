import { Metadata } from 'next'
import PdvClient from './client'

export const metadata: Metadata = {
  title: 'PDV | KDS Serviço',
  description: 'Ponto de Venda KDS',
}

export default function PdvPage() {
  return <div className="py-40"><PdvClient /></div>
}
