'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [gestorId, setGestorId] = useState<string | null>(null);

  useEffect(() => {
    // Recupera o gestor de origem se houver na sessão
    const savedGestor = sessionStorage.getItem('scout_gestor_origem');
    if (savedGestor) {
      setGestorId(savedGestor);
    }
  }, []);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050505', color: '#ffffff', padding: '24px', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#00ff88', margin: 0 }}>
          Painel do Gestor SCOUT
        </h1>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0 0' }}>
          {gestorId ? `Sessão ativa: ${gestorId.toUpperCase()}` : 'Visão Geral de Leads e Comunidade'}
        </p>
      </header>

      <section style={{ background: '#111111', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0' }}>Status da Operação</h2>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
          O ambiente de gestão do SCOUT está conectado e pronto para receber novos convidados do Hall.
        </p>
      </section>
    </main>
  );
}