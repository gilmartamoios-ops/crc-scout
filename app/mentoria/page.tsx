'use client';

import Link from 'next/link';

export default function MentoriaPage() {
  const modulos = [
    {
      titulo: 'Módulo 1: A Arquitetura da Comunidade e o Papel do Oleiro',
      descricao: 'Princípios fundamentais de governança, recrutamento qualificado e gestão de relacionamento no modelo CRC.',
      duracao: '18 min',
      status: 'DISPONÍVEL',
    },
    {
      titulo: 'Módulo 2: O Método SOE & Condução do Script de Qualificação',
      descricao: 'Como guiar prospectos desde o Santinho Digital até a validação e abertura de canal direto no WhatsApp.',
      duracao: '24 min',
      status: 'DISPONÍVEL',
    },
    {
      titulo: 'Módulo 3: Métricas de Unilevel, Bónus Evolution e Expansão',
      descricao: 'Análise detalhada do Simulador de Negócio, VML e estratégias para transição das faixas Executivo a Jade.',
      duracao: '30 min',
      status: 'EM BREVE',
    },
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#050505', color: '#fff', padding: '24px 16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '32px', borderBottom: '1px solid rgba(0,255,136,0.2)', pb: '16px' }}>
          <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
            ACADEMIA CÍVICA · CAPACITAÇÃO
          </span>
          <h1 style={{ fontSize: '28px', marginTop: '6px', color: '#fff' }}>Trilha de Mentoria GCom</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
            Formação estratégica para Gestores de Comunidade, liderança e duplicação acelerada de resultados.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {modulos.map((modulo, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(18, 24, 38, 0.8)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 700 }}>
                  AULA 0{index + 1} · {modulo.duracao}
                </span>
                <span style={{ fontSize: '10px', background: modulo.status === 'DISPONÍVEL' ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.1)', color: modulo.status === 'DISPONÍVEL' ? '#00ff88' : '#aaa', padding: '3px 8px', borderRadius: '8px', fontWeight: 700 }}>
                  {modulo.status}
                </span>
              </div>
              <h2 style={{ fontSize: '17px', color: '#fff', margin: 0 }}>{modulo.titulo}</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: '1.4' }}>{modulo.descricao}</p>
              
              {modulo.status === 'DISPONÍVEL' && (
                <button
                  type="button"
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: '6px',
                    padding: '8px 16px',
                    background: '#00ff88',
                    color: '#050505',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  ▶ Assistir Mentoria
                </button>
              )}
            </div>
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