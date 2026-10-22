'use client';

import Link from 'next/link';

export default function CuradoriaPage() {
  const acervo = [
    {
      titulo: 'Livro: O Oleiro e a Argila – O Gestor de Comunidades',
      tipo: 'E-BOOK / MANUSCRITO',
      descricao: 'Guia completo sobre a transição do líder tradicional para o arquiteto relacional, mecânica da cooperação e governança de redes.',
      linkText: 'Baixar Material',
    },
    {
      titulo: 'Apresentação Oficial Mini-APN & Projeções de Expansão',
      tipo: 'SLIDES PDF',
      descricao: 'Estrutura gráfica e lâminas oficiais para apresentações individuais e reuniões de alinhamento estratégico.',
      linkText: 'Acessar PDF',
    },
    {
      titulo: 'Estudo Técnico: Suplementação Ozonizada e Mercado Integrativo',
      tipo: 'RELATÓRIO TÉCNICO',
      descricao: 'Compilado sobre formulações, diferenciais competitivos e linhas de produtos para respaldo de atendimento aos clientes.',
      linkText: 'Visualizar Relatório',
    },
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#050505', color: '#fff', padding: '24px 16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '32px', borderBottom: '1px solid rgba(0,255,136,0.2)', paddingBottom: '16px' }}>
          <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
            ACERVO & BIBLIOTECA
          </span>
          <h1 style={{ fontSize: '28px', marginTop: '6px', color: '#fff' }}>Curadoria de Conteúdo</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
            Materiais de apoio, e-books, lâminas de apresentação e documentação técnica recomendada.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {acervo.map((item, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(18, 24, 38, 0.8)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '20px',
              }}
            >
              <span style={{ fontSize: '10px', color: '#00ff88', fontWeight: 800, letterSpacing: '1px' }}>
                {item.tipo}
              </span>
              <h2 style={{ fontSize: '17px', color: '#fff', margin: '6px 0' }}>{item.titulo}</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4', marginBottom: '12px' }}>
                {item.descricao}
              </p>
              <button
                type="button"
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  color: '#00ff88',
                  border: '1px solid rgba(0,255,136,0.4)',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                📄 {item.linkText}
              </button>
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