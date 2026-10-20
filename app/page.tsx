'use client';

import Image from 'next/image';
import Script from 'next/script';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Respostas {
  objetivo: string;
}

export default function LandingPage() {
  // Passos da jornada:
  // 1 = Santinho Digital
  // 2 = Mini-APN
  // 2.2 = Aviso de Rigor Técnico
  // 2.4 = Simulador de Negócio Original (Chart.js + DataLabels)
  // 3 = Quiz de Qualificação
  // 8 = Formulário de Cadastro Direto
  // 9 = Sucesso / Tela Final Desfocada (Blur)
  const [etapa, setEtapa] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(true);

  const [respostas, setRespostas] = useState<Respostas>({
    objetivo: '',
  });

  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cidade, setCidade] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const [gestorId, setGestorId] = useState<string | null>(null);

  // Estados do Simulador de Negócio MMN
  const [gestoresSelect, setGestoresSelect] = useState<string>('4');
  const [consumoSelect, setConsumoSelect] = useState<string>('450');
  const [infoContent, setInfoContent] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const santinhoVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);

  const perguntas = useMemo(
    () => [
      {
        id: 'objetivo' as const,
        titulo: 'Qual é o seu objetivo principal no momento atual?',
        opcoes: [
          'Transição Profissional & Autonomia de Carreira',
          'Saúde Integrativa, Bem-estar & Ozonioterapia',
          'Consumo Consciente & Economia Doméstica',
        ],
      },
    ],
    []
  );

  const perguntaAtual = perguntas[0];
  const respostaAtual = respostas.objetivo;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gestorIdParam = params.get('gestor_id');

    if (gestorIdParam) {
      setGestorId(gestorIdParam);
      sessionStorage.setItem('scout_gestor_origem', gestorIdParam);
    }

    if (params.get('etapa') === 'quiz') {
      setEtapa(3);
    }
  }, []);

  // Executa a simulação e renderiza o gráfico Chart.js + DataLabels
  useEffect(() => {
    if (etapa === 2.4) {
      simular();
    }
  }, [etapa, gestoresSelect, consumoSelect]);

  const simulacaoOficial: Record<string, Array<{ etapa: number; gcom: number; plano: string; total: number }>> = {
    "4_450": [
      { etapa: 1, gcom: 4, plano: "Executivo", total: 360.00 },
      { etapa: 2, gcom: 24, plano: "Ônix", total: 1186.00 },
      { etapa: 3, gcom: 108, plano: "Jaspe", total: 7038.00 },
      { etapa: 4, gcom: 448, plano: "Jade", total: 21240.00 },
      { etapa: 5, gcom: 1812, plano: "Dream Red", total: 68094.00 }
    ],
    "3_450": [
      { etapa: 1, gcom: 3, plano: "Executivo", total: 270.00 },
      { etapa: 2, gcom: 15, plano: "Topázio", total: 634.50 },
      { etapa: 3, gcom: 54, plano: "Ametista", total: 3915.00 },
      { etapa: 4, gcom: 174, plano: "Diamante Negro", total: 13392.00 },
      { etapa: 5, gcom: 537, plano: "Jaspe", total: 41094.00 }
    ],
    "2_450": [
      { etapa: 1, gcom: 2, plano: "Executivo", total: 180.00 },
      { etapa: 2, gcom: 8, plano: "Topázio", total: 378.00 },
      { etapa: 3, gcom: 22, plano: "Ônix", total: 1310.00 },
      { etapa: 4, gcom: 52, plano: "Ametista", total: 2710.00 },
      { etapa: 5, gcom: 114, plano: "Diamante Negro", total: 6552.00 }
    ]
  };

  const textosExplicativos: Record<string, string> = {
    "2": "<strong>🌱 Modo Iniciante (2 Gestores)</strong><p>Entrada com alta facilidade de duplicação. A partir da 3ª etapa, o bônus cobre integralmente o cartão de crédito da compra inicial e gera lucro líquido crescente com baixo esforço.</p>",
    "3": "<strong>🚀 Modo Expansão (3 Gestores)</strong><p>Equilíbrio ideal entre duplicação e velocidade. Acelera os ganhos de Unilevel e alcança a faixa de R$ 3.900 a R$ 13.000 já entre a 3ª e 4ª etapa.</p>",
    "4": "<strong>💼 Modo Executivo (4 Gestores)</strong><p>O padrão de máxima performance. Otimiza a pontuação por linha (VML), garante Bônus Evolution e PLR acelerados, atingindo graduações de elite (Jaspe e Jade) com solidez.</p>"
  };

  const simular = () => {
    const d = parseInt(gestoresSelect);
    const c = parseFloat(consumoSelect);

    const key = `${d}_${c}`;
    let dadosEtapas = [];

    if (simulacaoOficial[key]) {
      dadosEtapas = simulacaoOficial[key];
    } else {
      let gcomAcum = 0;
      for (let e = 1; e <= 5; e++) {
        let novos = Math.pow(d, e);
        gcomAcum += novos;
        let fator = (c / 450) * (d / 4);
        let baseTotal = 0;
        if (e === 1) baseTotal = 360 * fator;
        else if (e === 2) baseTotal = 1186 * fator;
        else if (e === 3) baseTotal = 7038 * fator;
        else if (e === 4) baseTotal = 21240 * fator;
        else if (e === 5) baseTotal = 68094 * fator;

        let planoNome = e === 1 ? "Executivo" : (e === 2 ? "Topázio" : (e === 3 ? "Jaspe" : (e === 4 ? "Jade" : "Dream Red")));

        dadosEtapas.push({ etapa: e, gcom: gcomAcum, plano: planoNome, total: baseTotal });
      }
    }

    const labels = dadosEtapas.map(item => `${item.etapa}ª Etapa\n(${item.plano})`);
    const valoresGanhos = dadosEtapas.map(item => item.total);
    const gcomsList = dadosEtapas.map(item => item.gcom);

    setInfoContent(textosExplicativos[d.toString()] || "");
    renderizarGrafico(labels, valoresGanhos, gcomsList);
  };

  const renderizarGrafico = (labels: string[], dadosValores: number[], dadosGcom: number[]) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // @ts-ignore
    if (typeof Chart !== 'undefined') {
      // @ts-ignore
      if (typeof ChartDataLabels !== 'undefined') {
        // @ts-ignore
        Chart.register(ChartDataLabels);
      }

      // @ts-ignore
      chartInstanceRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Ganhos (R$)',
            data: dadosValores,
            backgroundColor: '#00ff88',
            borderRadius: 6,
            barThickness: 'flex'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { top: 35, left: 5, right: 5, bottom: 5 }
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
            datalabels: {
              anchor: 'end',
              align: 'end',
              offset: 2,
              color: '#00ff88',
              font: { weight: 'bold', size: 10 },
              formatter: function(value: number, context: any) {
                const index = context.dataIndex;
                const gcomCount = dadosGcom[index];
                const valorFormatado = 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return `${gcomCount} GCom\n${valorFormatado}`;
              },
              textAlign: 'center'
            }
          },
          scales: {
            y: { display: false, grid: { display: false } },
            x: {
              grid: { display: false },
              ticks: { color: '#ffffff', font: { size: 10, weight: 'bold' } }
            }
          }
        }
      });
    }
  };

  const toggleAudio = () => {
    if (santinhoVideoRef.current) {
      santinhoVideoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const selecionarResposta = (valor: string) => {
    setRespostas({ objetivo: valor });
  };

  const continuarPergunta = () => {
    if (!respostaAtual) return;
    setEtapa(8);
  };

  const handleVideoEnded = () => {
    setEtapa(2.2);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro('');

    if (!nome.trim() || !whatsapp.trim() || !cidade.trim()) {
      setErro('Informe seu nome, cidade e WhatsApp para concluir.');
      return;
    }

    setCarregando(true);

    const { error } = await supabase.from('scout_registros').insert({
      tipo: 'quiz_prospecto',
      gestor_id: gestorId || 'master',
      titulo: `Lead Quiz: ${respostas.objetivo}`,
      dados: {
        convidado: {
          nome: nome.trim(),
          whatsapp: whatsapp.trim(),
          cidade: cidade.trim(),
        },
        perfil: respostas.objetivo,
        respostas,
        status_aprovacao: 'pendente',
        origem: 'quiz_publico',
      },
    });

    if (error) {
      setErro('Não foi possível concluir agora. Verifique sua conexão.');
      setCarregando(false);
      return;
    }

    setEnviado(true);
    setCarregando(false);
    setEtapa(9);
  };

  const voltar = () => {
    if (etapa === 2.2) setEtapa(2);
    else if (etapa === 2.4) setEtapa(2.2);
    else if (etapa === 3) setEtapa(2.4);
    else if (etapa === 8) setEtapa(3);
  };

  return (
    <main className="scout-landing" style={{ position: 'relative', minHeight: '100vh', background: '#050505', color: '#fff' }}>
      
      {/* Scripts Globais do Chart.js e Plugin DataLabels */}
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0" strategy="beforeInteractive" />

      {/* Camada Desfocada para a Etapa Final (Blur) */}
      <div style={etapa === 9 ? { filter: 'blur(16px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.35 } : undefined}>
        
        <div className="scout-shell">
          <header className="scout-header">
            <div className="scout-brand">
              <div className="scout-logo">
                <Image
                  src="/assets/logo-crc.png"
                  alt="CRC"
                  width={44}
                  height={44}
                  priority
                  className="scout-logo-image"
                />
              </div>
              <div className="scout-brand-copy"> 
                <div className="scout-brand-name">SCOUT.CRC</div> 
                <div className="scout-brand-subtitle">inteligência para comunidades</div>
                <a href="/sala" className="scout-gestor-link">Acesso do Gestor</a> 
              </div>
            </div>
            
            <div className="scout-header-note">
              {gestorId ? `GESTOR: ${gestorId.toUpperCase()}` : 'CONHEÇA · EXPLORE · DECIDA'}
            </div>
          </header>

          {/* ETAPA 1: SANTINHO DIGITAL */}
          {etapa === 1 && (
            <section className="scout-hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '10px 10px 20px 10px' }}>
              <div style={{ maxWidth: '340px', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                
                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '2px', color: '#00ff88', background: 'rgba(0,255,136,0.1)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(0,255,136,0.25)' }}>
                  SANTINHO DIGITAL · RISCO ZERO
                </span>

                <div style={{ width: '100%', aspectRatio: '9/16', maxHeight: '55vh', background: '#000', borderRadius: '18px', overflow: 'hidden', border: '2px solid rgba(0,255,136,0.5)', boxShadow: '0 0 35px rgba(0,255,136,0.25)', position: 'relative' }}>
                  <video
                    ref={santinhoVideoRef}
                    src="/assets/santinho.mp4"
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    preload="auto"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  
                  <button
                    type="button"
                    onClick={toggleAudio}
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      color: '#00ff88',
                      border: '1px solid rgba(0, 255, 136, 0.4)',
                      padding: '8px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backdropFilter: 'blur(4px)',
                      zIndex: 10
                    }}
                  >
                    {isMuted ? '🔇 LIGAR SOM' : '🔊 COM SOM'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setEtapa(2)}
                  className="btn-destaque-neon"
                >
                  ENTRAR NO SCOUT ➔
                </button>

                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                  Conheça primeiro. Decida depois.
                </p>
              </div>
            </section>
          )}

          {/* ETAPA 2: MINI APN */}
          {etapa === 2 && (
            <section className="scout-content" style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '8px', height: 'calc(100vh - 80px)', justifyContent: 'space-between' }}>
              <div className="scout-section-intro" style={{ textAlign: 'center', marginBottom: '0' }}>
                <div className="scout-eyebrow" style={{ color: '#00ff88', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  AGORA VOCÊ PODE CONHECER
                </div>
                <h2 className="scout-section-title" style={{ fontSize: '18px', margin: '2px 0 6px', lineHeight: '1.2' }}>
                  O conceito por trás do CRC.
                </h2>
              </div>

              <div className="scout-video-card" style={{ width: '100%', maxWidth: '320px', margin: '0 auto', flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div className="scout-video-frame" style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(0,255,136,0.3)', background: '#000', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <video
                    ref={videoRef}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    className="scout-video"
                    src="/assets/miniAPN.mp4"
                    onEnded={handleVideoEnded}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  >
                    Seu navegador não suporta a reprodução deste vídeo.
                  </video>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '320px', margin: '0 auto', paddingTop: '8px' }}>
                <button 
                  type="button" 
                  className="btn-destaque-neon"
                  onClick={() => setEtapa(2.2)}
                  style={{ padding: '14px' }}
                >
                  AVANÇAR PARA SIMULAÇÃO ➔
                </button>

                <button 
                  type="button" 
                  className="btn-voltar-sutil"
                  onClick={() => setEtapa(1)}
                  style={{ padding: '10px' }}
                >
                  ← Voltar
                </button>
              </div>
            </section>
          )}

          {/* ETAPA 2.2: AVISO DE RIGOR TÉCNICO */}
          {etapa === 2.2 && (
            <section className="scout-content scout-content-narrow" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>📌</span>
              <div className="scout-eyebrow" style={{ color: '#00ff88', marginBottom: '8px' }}>PRECISÃO FINANCEIRA</div>
              <h2 className="scout-section-title" style={{ fontSize: '20px', marginBottom: '16px' }}>Nota de Rigor Técnico</h2>
              <p className="scout-section-text" style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '24px' }}>
                O <strong>Simulador de Negócio</strong> a seguir baseia-se rigorosamente nas regras de cálculo, pontos e bonificações oficiais do nosso Plano de Negócios. Os valores projetados refletem a duplicação real do consumo consciente da sua futura comunidade.
              </p>
              <button
                type="button"
                className="btn-destaque-neon"
                onClick={() => setEtapa(2.4)}
              >
                ENTRAR NO SIMULADOR DE NEGÓCIO →
              </button>
              <button type="button" className="btn-voltar-sutil" onClick={voltar} style={{ marginTop: '12px' }}>
                ← Voltar
              </button>
            </section>
          )}

          {/* ETAPA 2.4: SIMULADOR DE NEGÓCIO ORIGINAL (REDIRECIONA PARA /sala?modo=visitante) */}
          {etapa === 2.4 && (
            <section className="scout-content" style={{ padding: '12px' }}>
              <div className="card-simulador-original">
                <div className="eyebrow-sim">CRC | Modelo de Comunidades</div>
                <h1 className="title-sim">Simulação de Expansão da Comunidade</h1>
                <p className="subtitle-sim">Projeção baseada em GCom - gestores de comunidade e consumo recorrente.</p>

                {/* Filtros com os Selects */}
                <div className="sim-grid-original">
                  <div>
                    <label className="sim-label-original">Novos GCom (Gestores de Comunidade) por etapa</label>
                    <select
                      value={gestoresSelect}
                      onChange={(e) => setGestoresSelect(e.target.value)}
                      className="sim-select-original"
                    >
                      <option value="2">2 Novos Gestores / Etapa (Modo Iniciante)</option>
                      <option value="3">3 Novos Gestores / Etapa (Modo Expansão)</option>
                      <option value="4">4 Novos Gestores / Etapa (Modo Executivo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="sim-label-original">Consumo Recorrente Mensal da Comunidade</label>
                    <select
                      value={consumoSelect}
                      onChange={(e) => setConsumoSelect(e.target.value)}
                      className="sim-select-original"
                    >
                      <option value="300">R$ 300,00</option>
                      <option value="450">R$ 450,00 (Padrão Executivo - Recomendado)</option>
                      <option value="500">R$ 500,00</option>
                    </select>
                  </div>
                </div>

                {/* Wrapper de 2 Colunas: Texto à esquerda + Gráfico à direita */}
                <div className="sim-body-wrapper-original">
                  <div className="info-col-left-original">
                    <div dangerouslySetInnerHTML={{ __html: infoContent }} />
                  </div>
                  <div className="chart-col-right-original">
                    <canvas ref={canvasRef} id="meuGraficoCanvas"></canvas>
                  </div>
                </div>

                <div className="retorno-scout-original">
                  <button
                    type="button"
                    onClick={() => { window.location.href = '/sala?modo=visitante'; }}
                    className="btn-avancar-simulador-oficial"
                  >
                    ⚡ VISITE A SALA DE OPERAÇÕES DO SEU FUTURO NEGÓCIO <span>→</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ETAPA 3: QUIZ DE PERFIL ENXUTO */}
          {etapa === 3 && perguntaAtual && (
            <section className="scout-content scout-content-narrow">
              <div className="scout-progress-head">
                <span>QUALIFICAÇÃO CRC</span>
                <strong>1/1</strong>
              </div>

              <div className="scout-progress">
                <div className="scout-progress-bar" style={{ width: '100%' }} />
              </div>

              <div className="scout-question-card">
                <h2 className="scout-question-title">{perguntaAtual.titulo}</h2>
                <p className="scout-section-text">Escolha apenas uma opção.</p>

                <div className="scout-options">
                  {perguntaAtual.opcoes.map((opcao) => {
                    const selecionada = respostaAtual === opcao;
                    return (
                      <button
                        key={opcao}
                        type="button"
                        className="scout-option"
                        aria-pressed={selecionada}
                        onClick={() => selecionarResposta(opcao)}
                        style={selecionada ? { borderColor: 'rgba(0,255,136,.65)', background: 'rgba(0,255,136,.08)' } : undefined}
                      >
                        <span>{opcao}</span>
                        <strong>{selecionada ? '✓' : '→'}</strong>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="btn-destaque-neon"
                    disabled={!respostaAtual}
                    onClick={continuarPergunta}
                  >
                    CONTINUAR PARA CONTATO ➔
                  </button>

                  <button type="button" className="btn-voltar-sutil" onClick={() => setEtapa(2.4)}>
                    ← Voltar
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ETAPA 8: FORMULÁRIO DE CADASTRO FINAL */}
          {etapa === 8 && !enviado && (
            <section className="scout-content scout-content-narrow">
              <div className="scout-section-intro">
                <div className="scout-eyebrow">CONCLUIR JORNADA</div>
                <h2 className="scout-section-title">Seus dados para contato direto:</h2>
                <p className="scout-section-text">Para que o gestor responsável possa falar com você.</p>
              </div>

              <form className="scout-form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  required
                />

                <input
                  type="text"
                  placeholder="Cidade / Estado (Ex: Cabo Frio - RJ)"
                  value={cidade}
                  onChange={(event) => setCidade(event.target.value)}
                  required
                />

                <input
                  type="tel"
                  placeholder="WhatsApp com DDD (Ex: 22997788554)"
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                  required
                />

                {erro && <div className="scout-error">{erro}</div>}

                <button type="submit" className="btn-destaque-neon" disabled={carregando} style={{ marginTop: '10px' }}>
                  {carregando ? 'ENVIANDO...' : 'FINALIZAR & FALAR COM GESTOR 🚀'}
                </button>
              </form>

              <button type="button" className="btn-voltar-sutil" onClick={voltar} style={{ marginTop: '12px' }}>
                ← Voltar
              </button>
            </section>
          )}

          <footer className="scout-footer">
            <span>SCOUT.CRC</span>
            <small>Conheça primeiro. Decida depois.</small>
          </footer>
        </div>
      </div>

      {/* ETAPA 9: TELA FINAL COM DESFOQUE (BLUR) E RETORNO BLOQUEADO */}
      {etapa === 9 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(16px)' }}>
          <div style={{ width: 'min(480px, 100%)', padding: '32px', border: '1px solid rgba(0,255,136,0.4)', borderRadius: '24px', background: '#0b0f0d', boxShadow: '0 30px 100px rgba(0,255,136,0.25)', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔒</div>
            <span style={{ color: '#00ff88', fontSize: '10px', fontWeight: '900', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
              SOLICITAÇÃO ENVIADA COM SUCESSO!
            </span>
            <h2 style={{ fontSize: '22px', color: '#fff', margin: '0 0 12px' }}>Aguardando Validação do Gestor</h2>
            
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6', marginBottom: '20px' }}>
              Sua Ficha de Qualificação deu entrada no sistema. O seu Gestor de Comunidade recebeu seu perfil e iniciará seu atendimento individual no X1.
            </p>

            <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)', padding: '14px', borderRadius: '12px', fontSize: '11px', color: '#00ff88', fontWeight: 'bold', marginBottom: '20px' }}>
              ⚡ Não feche esta tela. Mantenha seu WhatsApp por perto para receber seu Código de Entrada.
            </div>

            <a
              href={`https://wa.me/5522997881122?text=${encodeURIComponent(`Olá! Acabei de responder ao Quiz do SCOUT.CRC. Meu objetivo é: ${respostas.objetivo}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', background: '#00ff88', color: '#050505', padding: '14px', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px' }}
            >
              💬 Abrir Conversa no WhatsApp Agora
            </a>
          </div>
        </div>
      )}

      {/* ESTILOS CSS ORIGINAIS */}
      <style jsx>{`
        .btn-destaque-neon {
          width: 100%;
          padding: 16px;
          background: #00ff88;
          color: #050505;
          font-weight: 900;
          font-size: 13px;
          border-radius: 14px;
          border: none;
          letter-spacing: 1px;
          cursor: pointer;
          box-shadow: 0 0 25px rgba(0, 255, 136, 0.35);
          transition: all 0.2s ease;
          text-align: center;
        }
        .btn-destaque-neon:hover {
          background: #26ff97;
          box-shadow: 0 0 35px rgba(0, 255, 136, 0.55);
          transform: translateY(-1px);
        }
        .btn-destaque-neon:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }
        .btn-voltar-sutil {
          width: 100%;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
          font-size: 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        .btn-voltar-sutil:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .card-simulador-original {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 880px;
          margin: 0 auto;
          background: rgba(18, 24, 38, 0.94);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 12px 40px rgba(0,0,0,.35);
          display: flex;
          flex-direction: column;
          min-height: 80vh;
        }

        .eyebrow-sim {
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(0,255,136,.85);
          margin-bottom: 2px;
          font-weight: bold;
        }

        .title-sim {
          font-size: clamp(16px,2vw,22px);
          line-height: 1.2;
          margin-bottom: 3px;
          font-weight: 600;
          color: #fff;
        }

        .subtitle-sim {
          font-size: clamp(11px,1vw,13px);
          line-height: 1.3;
          color: rgba(255,255,255,.7);
          margin-bottom: 12px;
        }

        .sim-grid-original {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }

        .sim-label-original {
          display: block;
          font-size: 11px;
          color: #aaa;
          margin-bottom: 4px;
          text-align: left;
          line-height: 1.2;
        }

        .sim-select-original {
          width: 100%;
          background: #080808;
          border: 1px solid #222;
          border-radius: 10px;
          padding: 9px 11px;
          color: #00ff88;
          font-weight: bold;
          font-size: 12px;
          outline: none;
        }

        .sim-body-wrapper-original {
          display: flex;
          gap: 16px;
          align-items: stretch;
          flex: 1;
          min-height: 320px;
          margin-bottom: 12px;
        }

        .info-col-left-original {
          width: 32%;
          min-width: 240px;
          background: rgba(0, 255, 136, 0.06);
          border: 1px dashed rgba(0, 255, 136, 0.4);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-shadow: inset 0 0 15px rgba(0, 255, 136, 0.03);
        }

        .chart-col-right-original {
          flex: 1;
          position: relative;
          min-height: 280px;
        }

        .retorno-scout-original {
          display: flex;
          justify-content: center;
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }

        .btn-avancar-simulador-oficial {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          max-width: 520px;
          min-height: 44px;
          padding: 10px 20px;
          border: 1px solid rgba(0,255,136,.35);
          border-radius: 10px;
          background: rgba(0,255,136,.12);
          color: #00ff88;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(0,255,136,0.2);
          transition: all 0.2s ease;
        }

        .btn-avancar-simulador-oficial:hover {
          background: #00ff88;
          color: #050505;
          box-shadow: 0 0 30px rgba(0,255,136,0.45);
        }

        @media(max-width: 720px) {
          .card-simulador-original { padding: 14px; }
          .sim-grid-original { grid-template-columns: 1fr; gap: 6px; }
          .sim-body-wrapper-original { flex-direction: column; gap: 10px; }
          .info-col-left-original { width: 100%; min-width: 100%; padding: 12px; }
          .chart-col-right-original { min-height: 240px; }
        }
      `}</style>
    </main>
  );
}