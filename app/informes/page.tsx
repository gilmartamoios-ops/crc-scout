'use client';

import Link from 'next/link';

export default function InformesPage() {
  const comunicados = [
    {
      id: 1,
      data: '21 OUT 2026',
      categoria: 'SISTEMA',
      titulo: 'Estabilização e Atualização do Simulador de Expansão CRC',
      resumo: 'O Simulador de Negócio foi otimizado para melhor performance mobile e cálculo em tempo real dos bónus e projeções de GCom.',
      destaque: true,
    },
    {
      id: 2,
      data: '18 OUT 2026',
      categoria: 'COMUNIDADE',
      titulo: 'Regras de Duplicação e Boas Práticas de Prospecção',
      resumo: 'Consulte as orientações oficiais para abordagem via WhatsApp e alinhamento do Quiz de Qualificação com o seu público.',
      destaque: false,
    },
    {
      id: 3,
      data: '15 OUT 2026',
      categoria: 'OPERAÇÕES',
      titulo: 'Cronograma de Ativações e Relatório de Validação de Leads',
      resumo: 'Checklist para validação dos dados de prospectos antes do encaminhamento para os Gestores de Comunidade.',
      destaque: false,
    },
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#050505', color: '#fff', padding: '24px 16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '32px', borderBottom: '1px solid rgba(0,255,136,0.2)', pb: '16px' }}>
          <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
            SCOUT.CRC · BOLETIM OFICIAL
          </span>
          <h1 style={{ fontSize: '28px', marginTop: '6px', color: '#fff' }}>Central de Informes</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
            Acompanhe em tempo real os comunicados, orientações operacionais e novidades do ecossistema.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {comunicados.map((item) => (
            <article
              key={item.id}
              style={{
                background: 'rgba(18, 24, 38, 0.8)',
                border: item.destaque ? '1px solid rgba(0,255,136,0.5)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: item.destaque ? '0 0 20px rgba(0,255,136,0.1)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', background: 'rgba(0,255,136,0.15)', color: '#00ff88', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>
                  {item.categoria}
                </span>
                <time style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{item.data}</time>
              </div>
              <h2 style={{ fontSize: '18px', color: '#fff', margin: '8px 0' }}>{item.titulo}</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>{item.resumo}</p>
            </article>
          ))}
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <Link href="/sala" style={{ color: '#00ff88', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
            ← Voltar para a Sala de Operações
          </Link>
        </div>
      </div>
    </main>
  );
}