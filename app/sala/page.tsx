'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import InformesPage from '@/app/informes/page';
import MentoriaPage from '@/app/mentoria/page';
import CuradoriaPage from '@/app/curadoria/page';
import Script from 'next/script';

type Modulo = {
  nome: string;
  descricao: string;
  icone: string;
  sublinks?: string[];
};

interface ConvidadoRegistro {
  id: string;
  created_at: string;
  gestor_id: string | null;
  tipo: string;
  titulo: string;
  dados: {
    convidado?: {
      nome: string;
      whatsapp: string;
      email?: string;
      cidade?: string;
    };
    perfil?: string;
    respostas?: Record<string, string>;
    status_aprovacao?: 'pendente' | 'aprovado' | 'reprovado' | 'bloqueado' | 'acompanhamento' | 'solicitado_master' | 'codigo_liberado';
    codigo_lib?: string;
    codigo_master?: string;
    origem?: string;
  };
}

interface GestorItem {
  id: string;
  nome: string;
  slug: string | null;
  email?: string;
  whatsapp?: string;
  cidade?: string;
}

const modulos: Modulo[] = [
  {
    nome: 'Visão Geral & Boas-Vindas',
    descricao: 'Bem-vindo ao ecossistema SCOUT.CRC e à central do Gestor.',
    icone: '🏛️',
  },
  {
    nome: 'O Oleiro e a Argila',
    descricao: 'A base conceitual e filosófica do Gestor de Comunidades no modelo CRC.',
    icone: '📖',
  },
  {
    nome: 'Apresentação do Negócio',
    descricao: 'Sua ferramenta para reuniões caseiras e apresentações online ao vivo.',
    icone: '🚀',
    sublinks: ['Simulador de Negócio', 'Slides do Negócio'],
  },
  {
    nome: 'Informativos',
    descricao: 'Informes, atualizações e notícias do mercado.',
    icone: '◈',
  },
  {
    nome: 'Mentoria',
    descricao: 'Gestão de comunidade e desenvolvimento de liderança.',
    icone: '✦',
  },
  {
    nome: 'Curadoria',
    descricao: 'Ciência do produto, produtos e ativos selecionados.',
    icone: '◇',
  },
  {
    nome: 'Seu SCOUT',
    descricao: 'Sua operação de prospecção e gestão de convidados.',
    icone: '✧',
    sublinks: ['Prospecto Digital', 'Santinho Digital', 'Feedback de Prospectos', 'Gestores Aprovados'],
  },
];

const estadosBrasil = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function SalaPage() {
  const [moduloAtivo, setModuloAtivo] = useState<string | null>('Visão Geral & Boas-Vindas');
  const [subModuloAtivo, setSubModuloAtivo] = useState<string | null>(null);
  const [moduloRestrito, setModuloRestrito] = useState<Modulo | null>(null);
  const [gestorDesbloqueado, setGestorDesbloqueado] = useState(false);
  const [modoVisitante, setModoVisitante] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  // ESTADOS DO SIMULADOR OFICIAL (EXATAMENTE IDÊNTICOS À JORNADA)
  const [gestoresSelect, setGestoresSelect] = useState<string>('4');
  const [consumoSelect, setConsumoSelect] = useState<string>('450');
  const [infoContent, setInfoContent] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('modo') === 'visitante') {
        setModoVisitante(true);
      }
    }
  }, []);

  const [gestor, setGestor] = useState<{
    id: string;
    nome: string;
    whatsapp: string;
    email?: string;
    slug: string | null;
  } | null>(null);

  const [listaGestores, setListaGestores] = useState<GestorItem[]>([]);

  const [estadoSelecionado, setEstadoSelecionado] = useState<string>('RJ');
  const [municipiosDoEstado, setMunicipiosDoEstado] = useState<string[]>([]);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>('Cabo Frio');
  const [carregandoCidades, setCarregandoCidades] = useState<boolean>(false);
  const [nichoPfSelecionado, setNichoPfSelecionado] = useState<'transicao' | 'liberais' | 'consumo'>('transicao');
  
  // PERFIS GARIMPADOS E STATUS SALVOS NA SESSÃO DO NAVEGADOR (NÃO SOMEM AO MUDAR DE ABA)
  const [perfisGarimpados, setPerfisGarimpados] = useState<Array<{ nome: string; perfil: string; regiao: string; whats: string }>>(() => {
    if (typeof window !== 'undefined') {
      const salvo = sessionStorage.getItem('scout_perfis_garimpados');
      if (salvo) {
        try { return JSON.parse(salvo); } catch (e) {}
      }
    }
    return [];
  });

  const [executouGarimpo, setExecutouGarimpo] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('scout_executou_garimpo') === 'true';
    }
    return false;
  });

  const [leads, setLeads] = useState<ConvidadoRegistro[]>([]);
  const [carregandoLeads, setCarregandoLeads] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('pendente');
  const [filtroGestorId, setFiltroGestorId] = useState<string>('todos');
  const [modoVisaoMaster, setModoVisaoMaster] = useState<'global' | 'pessoal'>('global');
  const [buscaNome, setBuscaNome] = useState<string>('');
  const [buscaRegiao, setBuscaRegiao] = useState<string>('');
  
  const [novoLeadAlerta, setNovoLeadAlerta] = useState<string | null>(null);

  const eUuidValido = (id: string | null | undefined): boolean => {
    if (!id) return false;
    const regexUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regexUuid.test(id);
  };
  const isMasterUser = gestor?.slug === 'master' || gestor?.nome?.toLowerCase().includes('gilmar');

  const tocarAlertaSonoro = () => {
    try {
      // @ts-ignore
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.log('Áudio bloqueado pelo navegador até interação', e);
    }
  };

  const lidarComCliqueModulo = (modulo: Modulo) => {
    if (!gestorDesbloqueado) {
      setModuloRestrito(modulo);
      setMenuMobileAberto(false);
      return;
    }
    setModuloAtivo(modulo.nome);
    if (modulo.sublinks && modulo.sublinks.length > 0) {
      setSubModuloAtivo(modulo.sublinks[0]);
    } else {
      setSubModuloAtivo(null);
    }
    setMenuMobileAberto(false);
  };

  const carregarLeadsScout = async () => {
    setCarregandoLeads(true);
    try {
      let query = supabase
        .from('scout_registros')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isMasterUser || modoVisaoMaster === 'pessoal') {
        if (eUuidValido(gestor?.id)) {
          query = query.or(`gestor_id.eq.${gestor?.id},gestor_id.is.null`);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar dados reais:', error);
      } else if (data) {
        setLeads(data as ConvidadoRegistro[]);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
    } finally {
      setCarregandoLeads(false);
    }
  };

  useEffect(() => {
    function verificarSessao() {
      const dados = localStorage.getItem('scout_gestor') || sessionStorage.getItem('scout_gestor');
      if (!dados) return;

      try {
        const gestorSalvo = JSON.parse(dados);
        if (gestorSalvo?.id && gestorSalvo?.nome) {
          setGestor(gestorSalvo);
          setGestorDesbloqueado(true);
          carregarLeadsScout();
        }
      } catch {
        localStorage.removeItem('scout_gestor');
        sessionStorage.removeItem('scout_gestor');
      }
    }

    verificarSessao();
    carregarListaGestores();
  }, []);

  const carregarListaGestores = async () => {
    try {
      const { data, error } = await supabase
        .from('scout_gestores')
        .select('id, nome, slug, email, whatsapp, cidade')
        .order('nome', { ascending: true });

      if (!error && data) {
        setListaGestores(data as GestorItem[]);
      }
    } catch (err) {
      console.error('Erro ao buscar lista de gestores:', err);
    }
  };

  useEffect(() => {
    async function carregarMunicipiosIBGE() {
      setCarregandoCidades(true);
      try {
        const resposta = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSelecionado}/municipios`);
        const dados = await resposta.json();
        const nomesCidades = dados.map((cidade: { nome: string }) => cidade.nome).sort();
        setMunicipiosDoEstado(nomesCidades);
        if (nomesCidades.length > 0) {
          setMunicipioSelecionado(nomesCidades[0]);
        }
      } catch (erro) {
        console.error('Erro ao buscar municípios do IBGE:', erro);
      } finally {
        setCarregandoCidades(false);
      }
    }

    carregarMunicipiosIBGE();
  }, [estadoSelecionado]);

  // LOGICA E DADOS DO SIMULADOR EXATAMENTE IGUAIS À JORNADA
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

    const labels = dadosEtapas.map(item => `${item.etapa}ª Etapa (${item.plano})`);
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

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

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
            barThickness: isMobile ? 18 : 22
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          layout: {
            padding: isMobile 
              ? { top: 5, left: 2, right: 65, bottom: 5 } 
              : { top: 35, left: 5, right: 110, bottom: 5 }
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
            datalabels: {
              anchor: 'end',
              align: 'end',
              offset: 4,
              color: '#00ff88',
              font: { weight: 'bold', size: isMobile ? 8.5 : 10 },
              formatter: function(value: number, context: any) {
                const index = context.dataIndex;
                const gcomCount = dadosGcom[index];
                if (isMobile) {
                  const valFormatado = value >= 1000 
                    ? 'R$ ' + (value / 1000).toFixed(1).replace('.', ',') + 'k'
                    : 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                  return `${gcomCount} GCom • ${valFormatado}`;
                }
                const valorFormatado = 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return `${gcomCount} GCom • ${valorFormatado}`;
              },
              textAlign: 'left'
            }
          },
          scales: {
            x: { 
              display: false, 
              grid: { display: false } 
            },
            y: {
              display: true,
              grid: { display: false },
              ticks: { 
                color: '#ffffff', 
                font: { size: isMobile ? 9 : 10, weight: 'bold' },
                autoSkip: false
              }
            }
          }
        }
      });
    }
  };

  useEffect(() => {
    if (moduloAtivo === 'Apresentação do Negócio' && subModuloAtivo === 'Simulador de Negócio') {
      const timer = setTimeout(() => {
        simular();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [moduloAtivo, subModuloAtivo, gestoresSelect, consumoSelect]);

  // GARIMPO DIGITAL DE TERRITÓRIO - WHATSAPP FILTRADO E REDES SOCIAIS FILTRADAS
  const executarGarimpo = (modo: 'whatsapp' | 'redes_sociais') => {
    const regiaoStr = `${municipioSelecionado} / ${estadoSelecionado}`;
    setExecutouGarimpo(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('scout_executou_garimpo', 'true');
    }

    const novosPerfis = Array.from({ length: 20 }, (_, index) => {
      const idNum = index + 1;
      
      if (modo === 'redes_sociais') {
        // Redes Sociais Filtradas (com indicação explícita da rede social do prospecto)
        const redesSociaisAlvo = [
          'LinkedIn (Open to Work / Profissional Ativo)',
          'Instagram (Perfil Profissional / Autônomo)',
          'Facebook (Grupo de Empreendedorismo Local)',
          'X / Twitter (Networking Profissional)',
          'TikTok (Criador / Negócios Locais)'
        ];
        const redeAtual = redesSociaisAlvo[index % redesSociaisAlvo.length];
        
        return {
          nome: `Titular Ativo #${idNum}`,
          perfil: `Rede: ${redeAtual} — ${regiaoStr}`,
          regiao: regiaoStr,
          whats: `2299${Math.floor(100000 + Math.random() * 900000)}`
        };
      } else {
        // WhatsApp Filtrado (Direto ao Titular)
        return {
          nome: `Contato WhatsApp #${idNum}`,
          perfil: `WhatsApp Direto / Foco em Titular (${nichoPfSelecionado.toUpperCase()}) — ${regiaoStr}`,
          regiao: regiaoStr,
          whats: `2298${Math.floor(100000 + Math.random() * 900000)}`
        };
      }
    });

    setPerfisGarimpados(novosPerfis);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('scout_perfis_garimpados', JSON.stringify(novosPerfis));
    }
  };
  useEffect(() => {
    if (!gestorDesbloqueado) return;

    const canal = supabase
      .channel('sala_operacoes_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scout_registros',
        },
        (payload) => {
          const novoRegistro = payload.new as ConvidadoRegistro;

          if (!isMasterUser && eUuidValido(gestor?.id) && novoRegistro.gestor_id !== gestor?.id && novoRegistro.gestor_id !== null) {
            return;
          }

          tocarAlertaSonoro();
          const nomeLead = novoRegistro.dados?.convidado?.nome || 'Novo Prospecto';
          setNovoLeadAlerta(nomeLead);

          setTimeout(() => {
            setNovoLeadAlerta(null);
          }, 6000);

          setLeads((anterior) => [novoRegistro, ...anterior]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [gestorDesbloqueado, gestor, modoVisaoMaster]);

  useEffect(() => {
    if (gestorDesbloqueado) {
      carregarLeadsScout();
    }
  }, [gestorDesbloqueado, moduloAtivo, subModuloAtivo, modoVisaoMaster]);

  const atribuirGestorLead = async (id: string, novoGestorId: string) => {
    const leadAlvo = leads.find((l) => l.id === id);
    if (!leadAlvo) return;

    const valorParaSalvar = eUuidValido(novoGestorId) ? novoGestorId : null;

    const { error } = await supabase
      .from('scout_registros')
      .update({ gestor_id: valorParaSalvar })
      .eq('id', id);

    if (error) {
      alert('Erro ao atribuir gestor: ' + error.message);
      return;
    }

    setLeads((anterior) =>
      anterior.map((item) =>
        item.id === id ? { ...item, gestor_id: valorParaSalvar } : item
      )
    );

    alert(`✅ Lead reatribuído com sucesso!`);
  };

  const aprovarLead = async (id: string) => {
    const leadAlvo = leads.find((l) => l.id === id);
    if (!leadAlvo) return;

    const nomeConvidado = leadAlvo.dados?.convidado?.nome || 'Novo Gestor';
    const emailConvidado = leadAlvo.dados?.convidado?.email?.trim().toLowerCase() || '';
    const whatsConvidado = leadAlvo.dados?.convidado?.whatsapp || '';
    const cidadeConvidado = leadAlvo.dados?.convidado?.cidade || '';

    if (!emailConvidado) {
      alert('⚠️ Este lead não possui e-mail cadastrado. Por favor, adicione o e-mail antes de aprovar.');
      return;
    }

    const slugGerado = nomeConvidado
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);

    const { error: erroGestor } = await supabase
      .from('scout_gestores')
      .upsert([
        {
          nome: nomeConvidado,
          whatsapp: whatsConvidado,
          email: emailConvidado,
          cidade: cidadeConvidado,
          slug: slugGerado,
        }
      ], { onConflict: 'email' });

    if (erroGestor) {
      console.error('Erro ao registrar na tabela scout_gestores:', erroGestor.message);
      alert('⚠️ Erro ao registrar na tabela de gestores: ' + erroGestor.message);
      return;
    }

    const { error: erroDelete } = await supabase
      .from('scout_registros')
      .delete()
      .eq('id', id);

    if (erroDelete) {
      alert('Gestor criado, mas houve erro ao remover da fila de registros: ' + erroDelete.message);
      return;
    }

    setLeads((anterior) => anterior.filter((item) => item.id !== id));
    carregarListaGestores();

    alert(`✅ Gestor aprovado com sucesso!\n• E-mail: ${emailConvidado}\n• Movido para a aba Gestores Aprovados.`);
  };

  const aprovarTodosPendentes = async () => {
    const pendentes = leadsFiltrados.filter(l => (l.dados?.status_aprovacao || 'pendente') === 'pendente');
    if (pendentes.length === 0) {
      alert('Nenhum prospecto pendente na fila filtrada para aprovação.');
      return;
    }

    if (!confirm(`👑 DESEJA APROVAR TODOS OS ${pendentes.length} PENDENTES?\nEles serão cadastrados em scout_gestores e removidos da fila de prospectos.`)) {
      return;
    }

    let aprovados = 0;
    for (const item of pendentes) {
      const emailConvidado = item.dados?.convidado?.email?.trim().toLowerCase();
      if (!emailConvidado) continue;

      const nomeConvidado = item.dados?.convidado?.nome || 'Novo Gestor';
      const whatsConvidado = item.dados?.convidado?.whatsapp || '';
      const cidadeConvidado = item.dados?.convidado?.cidade || '';

      const slugGerado = nomeConvidado
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);

      await supabase.from('scout_gestores').upsert([{
        nome: nomeConvidado,
        whatsapp: whatsConvidado,
        email: emailConvidado,
        cidade: cidadeConvidado,
        slug: slugGerado,
      }], { onConflict: 'email' });

      await supabase.from('scout_registros').delete().eq('id', item.id);

      aprovados++;
    }

    carregarListaGestores();
    carregarLeadsScout();
    alert(`🚀 SUCESSO! ${aprovados} gestores foram aprovados em lote e removidos da fila.`);
  };

  const deletarLeadDefinitivo = async (id: string) => {
    if (!confirm('🛑 ATENÇÃO (PODER MASTER): Deseja DELETAR DEFINITIVAMENTE este registro do banco de dados?')) return;

    const { error } = await supabase
      .from('scout_registros')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Erro ao deletar registro do Supabase: ' + error.message);
      return;
    }

    setLeads((anterior) => anterior.filter((item) => item.id !== id));
    alert('🗑️ Registro deletado com sucesso do banco de dados.');
  };

  const deletarGestorAprovado = async (email: string | undefined, gestorId: string) => {
    if (!confirm(`🛑 ATENÇÃO (PODER MASTER): Deseja revogar e DELETAR o acesso deste Gestor (${email})?\nIsso removerá a conta dele da tabela oficial scout_gestores.`)) return;

    if (email) {
      await supabase.from('scout_gestores').delete().eq('email', email);
    }

    carregarListaGestores();
    carregarLeadsScout();
    alert('🗑️ Acesso do gestor revogado com sucesso!');
  };

  const atualizarStatusGenerico = async (id: string, novoStatus: 'pendente' | 'acompanhamento') => {
    const leadAlvo = leads.find((l) => l.id === id);
    if (!leadAlvo) return;

    const novosDados = {
      ...leadAlvo.dados,
      status_aprovacao: novoStatus,
    };

    const { error } = await supabase
      .from('scout_registros')
      .update({ dados: novosDados })
      .eq('id', id);

    if (error) {
      alert('Erro ao atualizar status do registo.');
      return;
    }

    setLeads((anterior) =>
      anterior.map((item) =>
        item.id === id ? { ...item, dados: novosDados } : item
      )
    );
  };

  const linkBaseGestor = `https://crc-scout.vercel.app/?gestor_id=${gestor?.slug || 'master'}`;

  const leadsAtivosGestor = leads.filter((l) => l.dados?.status_aprovacao !== 'reprovado');

  const totalLeads = leadsAtivosGestor.length;
  const pendentesFila = leadsAtivosGestor.filter((l) => (l.dados?.status_aprovacao || 'pendente') === 'pendente').length;
  const acompanhamentoLeads = leadsAtivosGestor.filter((l) => l.dados?.status_aprovacao === 'acompanhamento').length;

  const leadsFiltrados = leadsAtivosGestor.filter((item) => {
    const nome = item.dados?.convidado?.nome?.toLowerCase() || '';
    const regiao = item.dados?.convidado?.cidade?.toLowerCase() || '';
    const email = item.dados?.convidado?.email?.toLowerCase() || '';
    const whats = item.dados?.convidado?.whatsapp || '';
    const status = item.dados?.status_aprovacao || 'pendente';

    const buscaLower = buscaNome.toLowerCase();
    const matchesNome = nome.includes(buscaLower) || email.includes(buscaLower) || whats.includes(buscaLower);
    const matchesRegiao = regiao.includes(buscaRegiao.toLowerCase());
    const matchesStatus = filtroStatus === 'todos' ? true : status === filtroStatus;

    let matchesGestor = true;
    if (filtroGestorId !== 'todos') {
      if (filtroGestorId === 'sem_gestor') {
        matchesGestor = item.gestor_id === null;
      } else {
        matchesGestor = item.gestor_id === filtroGestorId;
      }
    }

    return matchesNome && matchesRegiao && matchesStatus && matchesGestor;
  });

  return (
    <main className="sala-page">
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0" strategy="beforeInteractive" />

      <div className="sala-shell">
        <header className="sala-header">
          <div className="sala-brand">
            <div className="sala-brand-mark">CRC</div>
            <div>
              <div className="sala-brand-name">SCOUT.CRC</div>
              <div className="sala-brand-subtitle">
                sala de operações · ambiente operacional {isMasterUser && '👑 [MASTER]'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => { window.location.href = '/'; }}
              style={{
                background: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid rgba(0, 255, 136, 0.35)',
                color: '#00ff88',
                padding: '7px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '10px',
                letterSpacing: '1px',
              }}
            >
              ← VOLTAR AO HALL (CAPA)
            </button>

            <div className="sala-header-status">
              {gestor ? (
                <span className="mobile-hide">GESTOR · {gestor.nome} {isMasterUser && '👑'}</span>
              ) : (
                <button
                  type="button"
                  className="sala-chave-btn"
                  onClick={() => { window.location.href = '/gestor'; }}
                >
                  🔑 Acesso por E-mail
                </button>
              )}

              <span className="sala-status-dot mobile-hide" />
              <span className="mobile-hide">AMBIENTE CRC</span>
            </div>
          </div>
        </header>

        {/* BARRA FIXA DE NAVEGAÇÃO APENAS PARA MOBILE */}
        <div className="mobile-nav-bar">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '9px', color: '#00ff88', fontWeight: 'bold' }}>MÓDULO ATIVO</span>
            <strong style={{ fontSize: '13px', color: '#fff' }}>{moduloAtivo} {subModuloAtivo ? `› ${subModuloAtivo}` : ''}</strong>
          </div>
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMenuMobileAberto(!menuMobileAberto)}
          >
            ☰ Módulos
          </button>
        </div>

        {novoLeadAlerta && (
          <div style={{
            background: 'linear-gradient(90deg, #00ff88, #00cc6a)',
            color: '#050505',
            padding: '12px 20px',
            textAlign: 'center',
            fontWeight: '900',
            fontSize: '13px',
            letterSpacing: '0.5px',
            boxShadow: '0 4px 25px rgba(0,255,136,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            zIndex: 100,
            animation: 'fadeInOut 0.3s ease'
          }}>
            <span>🚨 NOVO LEAD DETECTADO EM TEMPO REAL:</span>
            <strong style={{ textDecoration: 'underline' }}>{novoLeadAlerta}</strong>
            <span>➔ Verifique na Fila!</span>
          </div>
        )}

        <div className="sala-layout">
          {/* SIDEBAR COM SUPORTE A MENU RETRÁTIL NO MOBILE */}
          <aside
            className={`sala-sidebar ${menuMobileAberto ? 'mobile-open' : ''}`}
            style={{
              pointerEvents: !gestorDesbloqueado ? 'none' : 'auto',
              opacity: !gestorDesbloqueado ? 0.5 : 1,
              filter: !gestorDesbloqueado ? 'grayscale(0.6)' : 'none',
              userSelect: !gestorDesbloqueado ? 'none' : 'auto',
            }}
          >
            <div className="sala-sidebar-heading">
              <span>AMBIENTES E MÓDULOS</span>
              <button 
                className="mobile-close-btn"
                onClick={() => setMenuMobileAberto(false)}
              >
                ✕ Fechar
              </button>
            </div>

            <nav className="sala-menu">
              {!gestorDesbloqueado && (
                <button
                  type="button"
                  className="sala-menu-quiz"
                  onClick={() => { window.location.href = '/?etapa=quiz'; }}
                  style={{ pointerEvents: 'auto' }}
                >
                  <span className="sala-menu-icon">🔥</span>
                  <span className="sala-menu-copy">
                    <strong>QUERO CONSTRUIR MINHA COMUNIDADE</strong>
                    <small>Quiz de Qualificação CRC</small>
                  </span>
                  <span className="sala-lock">➔</span>
                </button>
              )}

              {modulos.map((modulo) => (
                <div key={modulo.nome} className="sala-menu-group">
                  <button
                    type="button"
                    className={`sala-menu-item ${moduloAtivo === modulo.nome ? 'active' : ''}`}
                    onClick={() => lidarComCliqueModulo(modulo)}
                  >
                    <span className="sala-menu-icon">{modulo.icone}</span>
                    <span className="sala-menu-copy">
                      <strong>{modulo.nome}</strong>
                      <small>{gestorDesbloqueado ? 'ambiente livre' : '🔒 restrito'}</small>
                    </span>
                    <span className="sala-lock">{gestorDesbloqueado ? '✦' : '⌕'}</span>
                  </button>

                  {gestorDesbloqueado && modulo.sublinks && moduloAtivo === modulo.nome && (
                    <div className="sala-sublinks">
                      {modulo.sublinks.map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          className={`sala-sublink-btn ${subModuloAtivo === sub ? 'active' : ''}`}
                          onClick={() => {
                            setSubModuloAtivo(sub);
                            setMenuMobileAberto(false);
                          }}
                        >
                          ↳ {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {!modoVisitante && (
              <div className="sala-sidebar-footer">
                {gestor ? (
                  <>
                    <span className="sala-visitor-tag">
                      {isMasterUser ? '👑 GESTOR MASTER (GLOBAL)' : 'GESTOR DE COMUNIDADE'}
                    </span>
                    <strong className="sala-gestor-name">{gestor.nome}</strong>
                    <p>Operação SCOUT ativa com rastreio direto no Supabase.</p>
                  </>
                ) : (
                  <>
                    <span className="sala-visitor-tag">CONVIDADO / VISITANTE</span>
                    <p>Explore as possibilidades do ecossistema e responda ao Quiz para iniciar.</p>
                  </>
                )}
              </div>
            )}
          </aside>

          <section className="sala-main">
            <div className="sala-welcome mobile-compact-welcome">
              <div>
                <div className="sala-eyebrow">MÓDULO DE INTELIGÊNCIA</div>
                <h1>
                  Sua Central <span>SCOUT.</span>
                </h1>
                <p className="mobile-hide">
                  Prospecção, atração visual e inteligência de qualificação para o modelo CRC.
                </p>
              </div>

              <div className="sala-welcome-mark mobile-hide">
                <span>CRC</span>
                <small>COMUNIDADE · RELAÇÃO · CONSUMO</small>
              </div>
            </div>

            <div className="sala-center-viewport">
              
              {moduloAtivo === 'Visão Geral & Boas-Vindas' && (
                <div className="sala-dynamic-card" style={{ border: '1px solid rgba(0, 255, 136, 0.35)', background: 'linear-gradient(135deg, rgba(0,255,136,0.06), rgba(5,5,5,0.98))' }}>
                  <div style={{ maxWidth: '820px' }}>
                    <span style={{ color: '#00ff88', fontSize: '10px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                      ✦ BEM-VINDO À SALA DE OPERAÇÕES DO CRC
                    </span>
                    <h2 style={{ fontSize: '26px', color: '#fff', margin: '0 0 14px', lineHeight: '1.2' }}>
                      Liderança Relacional & Arquitetura de Comunidades
                    </h2>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.7', marginBottom: '24px' }}>
                      Você está no coração operacional do <strong>SCOUT.CRC</strong>. Nossa tecnologia transforma a atração tradicional de negócios em uma jornada de valor, onde o <strong>Gestor de Comunidade</strong> organiza redes sustentáveis de consumo consciente e alto alinhamento.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                      <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '14px', padding: '18px' }}>
                        <div style={{ fontSize: '22px', marginBottom: '8px' }}>🎯</div>
                        <h4 style={{ color: '#00ff88', fontSize: '14px', margin: '0 0 6px' }}>Inteligência Territorial</h4>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', lineHeight: '1.5', margin: 0 }}>
                          Mapeie oportunidades por estado e município com filtros direcionados para transição profissional, saúde integrativa e consumo do lar.
                        </p>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '14px', padding: '18px' }}>
                        <div style={{ fontSize: '22px', marginBottom: '8px' }}>📈</div>
                        <h4 style={{ color: '#00ff88', fontSize: '14px', margin: '0 0 6px' }}>Projeção Recorrente</h4>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', lineHeight: '1.5', margin: 0 }}>
                          Simule a expansão de GCom e visualize com precisão o impacto financeiro da duplicação do consumo consciente.
                        </p>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '14px', padding: '18px' }}>
                        <div style={{ fontSize: '22px', marginBottom: '8px' }}>🤝</div>
                        <h4 style={{ color: '#00ff88', fontSize: '14px', margin: '0 0 6px' }}>Acompanhamento X1</h4>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', lineHeight: '1.5', margin: 0 }}>
                          Qualifique e organize seus convidados com uma prancheta integrada em tempo real com o banco do sistema.
                        </p>
                      </div>
                    </div>

                    {!gestorDesbloqueado && (
                      <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.35)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                        <h4 style={{ color: '#fff', fontSize: '15px', margin: '0 0 6px' }}>Pronto para iniciar a sua comunidade?</h4>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '0 0 14px' }}>
                          Responda ao Quiz de Qualificação para registrar seu objetivo e acionar seu gestor.
                        </p>
                        <button
                          type="button"
                          onClick={() => { window.location.href = '/?etapa=quiz'; }}
                          style={{
                            background: '#ff4444',
                            color: '#ffffff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '10px',
                            fontWeight: '900',
                            fontSize: '12px',
                            cursor: 'pointer',
                            letterSpacing: '0.5px',
                            boxShadow: '0 0 20px rgba(255,68,68,0.35)',
                          }}
                        >
                          QUERO CONSTRUIR MINHA COMUNIDADE ➔
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* APRESENTAÇÃO DO NEGÓCIO (APN ONLINE) - SIMULADOR OFICIAL IDÊNTICO À JORNADA COM ÁUDIO */}
              {gestorDesbloqueado && moduloAtivo === 'Apresentação do Negócio' && subModuloAtivo === 'Simulador de Negócio' && (
                <div className="sala-dynamic-card" style={{ border: '1px solid rgba(0, 255, 136, 0.4)', background: 'linear-gradient(135deg, rgba(0,255,136,0.05), rgba(5,5,5,0.98))' }}>
                  
                  {/* CABEÇALHO DO SIMULADOR E PLAYER DE ÁUDIO DO NARRADOR */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                    <div>
                      <span className="eyebrow-sim">CRC | Modelo de Comunidades</span>
                      <h3 className="title-sim" style={{ fontSize: '22px', color: '#fff', margin: '4px 0 2px' }}>Simulação de Expansão da Comunidade</h3>
                      <p className="subtitle-sim" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                        Projeção baseada em GCom - gestores de comunidade e consumo recorrente.
                      </p>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,255,136,0.3)', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>🔊</span>
                      <div>
                        <strong style={{ fontSize: '10px', color: '#00ff88', display: 'block', letterSpacing: '0.5px' }}>EXPLICAÇÃO DO SIMULADOR (26s)</strong>
                        <audio src="/assets/narrador do simulador.mp3" controls style={{ height: '28px', maxWidth: '200px', marginTop: '4px' }} />
                      </div>
                    </div>
                  </div>

                  <div className="sim-grid-original" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    <div>
                      <label className="sim-label-original" style={{ display: 'block', fontSize: '11px', color: '#00ff88', fontWeight: 'bold', marginBottom: '6px' }}>
                        Novos GCom (Gestores de Comunidade) por etapa
                      </label>
                      <select
                        value={gestoresSelect}
                        onChange={(e) => {
                          setGestoresSelect(e.target.value);
                          setTimeout(simular, 50);
                        }}
                        className="sim-select-original"
                        style={{ width: '100%', background: '#050505', border: '1px solid rgba(0,255,136,0.3)', padding: '10px 12px', borderRadius: '10px', color: '#00ff88', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        <option value="2">2 Novos Gestores / Etapa (Modo Iniciante)</option>
                        <option value="3">3 Novos Gestores / Etapa (Modo Expansão)</option>
                        <option value="4">4 Novos Gestores / Etapa (Modo Executivo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="sim-label-original" style={{ display: 'block', fontSize: '11px', color: '#00ff88', fontWeight: 'bold', marginBottom: '6px' }}>
                        Consumo Recorrente Mensal da Comunidade
                      </label>
                      <select
                        value={consumoSelect}
                        onChange={(e) => {
                          setConsumoSelect(e.target.value);
                          setTimeout(simular, 50);
                        }}
                        className="sim-select-original"
                        style={{ width: '100%', background: '#050505', border: '1px solid rgba(0,255,136,0.3)', padding: '10px 12px', borderRadius: '10px', color: '#00ff88', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        <option value="300">R$ 300,00</option>
                        <option value="450">R$ 450,00 (Padrão Executivo - Recomendado)</option>
                        <option value="500">R$ 500,00</option>
                      </select>
                    </div>
                  </div>

                  <div className="sim-body-wrapper-original" style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'stretch', width: '100%', minHeight: '320px', marginBottom: '16px' }}>
                    <div className="info-col-left-original" style={{ width: '32%', minWidth: '220px', background: 'rgba(0, 255, 136, 0.06)', border: '1px dashed rgba(0, 255, 136, 0.4)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div dangerouslySetInnerHTML={{ __html: infoContent }} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', lineHeight: '1.6' }} />
                    </div>
                    <div className="chart-col-right-original" style={{ flex: 1, position: 'relative', minHeight: '300px', width: '100%' }}>
                      <canvas ref={canvasRef} id="meuGraficoCanvas"></canvas>
                    </div>
                  </div>
                </div>
              )}

              {/* APRESENTAÇÃO DO NEGÓCIO (APN ONLINE) - SLIDES */}
              {gestorDesbloqueado && moduloAtivo === 'Apresentação do Negócio' && subModuloAtivo === 'Slides do Negócio' && (
                <div className="sala-dynamic-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <span className="sala-eyebrow" style={{ color: '#00ff88' }}>APN INSTITUCIONAL · OZONTECK</span>
                      <h3 style={{ fontSize: '20px', margin: '4px 0 2px', color: '#fff' }}>🖼️ Slides da Apresentação do Negócio</h3>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                        Material visual em alta definição para reuniões caseiras ou conferências via Zoom/Google Meet.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href="/assets/apn-ozonteck.pdf"
                        download="APN_Ozonteck_Oficial.pdf"
                        style={{
                          background: 'rgba(0,255,136,0.15)',
                          border: '1px solid rgba(0,255,136,0.4)',
                          color: '#00ff88',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        📥 Baixar PDF Oficial
                      </a>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '70vh', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '16px', overflow: 'hidden', background: '#000' }}>
                    <iframe
                      src="/assets/apn-ozonteck.pdf#toolbar=1&navpanes=0&scrollbar=1"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      title="Apresentação de Negócio Ozonteck"
                    />
                  </div>
                </div>
              )}

              {gestorDesbloqueado && moduloAtivo === 'O Oleiro e a Argila' && (
                <div className="sala-dynamic-card" style={{ border: '1px solid rgba(0, 255, 136, 0.4)', background: 'linear-gradient(135deg, rgba(0,255,136,0.05), rgba(5,5,5,0.95))' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', alignItems: 'center' }}>
                    
                    <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.6)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ width: '100%', maxWidth: '180px', margin: '0 auto 14px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 25px rgba(0,0,0,0.7)', border: '1px solid rgba(0,255,136,0.3)' }}>
                        <img 
                          src="/assets/capa-livro.jpg" 
                          alt="Capa do Livro O Oleiro e a Argila" 
                          style={{ width: '100%', height: 'auto', display: 'block' }} 
                        />
                      </div>
                      <span style={{ fontSize: '10px', color: '#00ff88', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>
                        OBRA OFICIAL DE FUNDAÇÃO
                      </span>
                      <h3 style={{ fontSize: '18px', color: '#fff', margin: '8px 0 4px' }}>O Oleiro e a Argila</h3>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>O Gestor de Comunidades</p>
                    </div>

                    <div>
                      <span className="sala-eyebrow" style={{ color: '#00ff88' }}>FILOSOFIA & GOVERNANÇA CRC</span>
                      <h2 style={{ fontSize: '22px', color: '#fff', margin: '8px 0 12px' }}>A Relação entre o Livro e a Plataforma</h2>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', marginBottom: '16px' }}>
                        A plataforma <strong>SCOUT.CRC</strong> não é apenas uma ferramenta de prospecção; ela é a materialização prática dos conceitos apresentados no livro <em>"O Oleiro e a Argila"</em>. 
                      </p>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', marginBottom: '20px' }}>
                        Assim como o oleiro molda a argila com intenção e cuidado, o Gestor de Comunidades molda relações de consumo sustentáveis, liderança relacional e pertencimento na rede.
                      </p>

                      <a
                        href="https://www.amazon.com/dp/B0HL9JZBTW"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                          color: '#050505',
                          padding: '12px 22px',
                          borderRadius: '12px',
                          fontWeight: '900',
                          fontSize: '12px',
                          textDecoration: 'none',
                          letterSpacing: '0.5px',
                          boxShadow: '0 4px 15px rgba(0,255,136,0.3)',
                        }}
                      >
                        🛒 ADQUIRIR LIVRO NA AMAZON →
                      </a>
                    </div>

                  </div>
                </div>
              )}

              {/* PROSPECTO DIGITAL */}
              {gestorDesbloqueado && moduloAtivo === 'Seu SCOUT' && subModuloAtivo === 'Prospecto Digital' && (
                <div className="sala-dynamic-card">
                  <h3 style={{ fontSize: '20px', margin: '0 0 4px', color: '#fff' }}>Prospecto Digital</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
                    Filtre sua busca para encontrar novos Gestores de Comunidade
                  </p>

                  <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
                    <div>
                      <div style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,0,0,0.5))', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '14px', padding: '16px 18px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px' }}>📊</span>
                          <strong style={{ color: '#00ff88', fontSize: '13px', letterSpacing: '0.5px' }}>
                            O SCOUT DO CRC OPERA SEGUNDO A LEI DAS MÉDIAS.
                          </strong>
                        </div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.5' }}>
                          <strong>A Lei das Médias é o princípio de que, quanto maior o número de pessoas apresentadas ao negócio, maior a probabilidade de resultados.</strong>
                        </p>
                        <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                          Exemplo: de cada 20 pessoas abordadas, 4 demonstram interesse.
                        </p>
                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', lineHeight: '1.5' }}>
                          A qualidade da abordagem e o perfil das pessoas influenciam os resultados.
                        </p>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '16px', padding: '20px', marginBottom: '22px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px', alignItems: 'center', marginBottom: '18px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '10px', color: '#00ff88', fontWeight: 'bold', marginBottom: '6px' }}>📍 ESTADO (UF):</label>
                            <select
                              value={estadoSelecionado}
                              onChange={(e) => setEstadoSelecionado(e.target.value)}
                              style={{ width: '100%', background: '#050505', border: '1px solid rgba(0,255,136,0.3)', padding: '10px 12px', borderRadius: '10px', color: '#00ff88', fontSize: '12px', fontWeight: 'bold' }}
                            >
                              {estadosBrasil.map((uf) => (
                                <option key={uf} value={uf}>{uf}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', color: '#00ff88', fontWeight: 'bold', marginBottom: '6px' }}>
                              🏙️ MUNICÍPIO ({carregandoCidades ? 'Carregando IBGE...' : `${municipiosDoEstado.length} cidades`}):
                            </label>
                            <select
                              value={municipioSelecionado}
                              onChange={(e) => setMunicipioSelecionado(e.target.value)}
                              disabled={carregandoCidades}
                              style={{ width: '100%', background: '#050505', border: '1px solid rgba(0,255,136,0.3)', padding: '10px 12px', borderRadius: '10px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            >
                              {municipiosDoEstado.map((cidade) => (
                                <option key={cidade} value={cidade}>{cidade}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <label style={{ display: 'block', fontSize: '10px', color: '#00ff88', fontWeight: 'bold', marginBottom: '10px', letterSpacing: '0.5px' }}>
                          SELECIONE O PERFIL DESEJADO:
                        </label>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => setNichoPfSelecionado('transicao')}
                            style={{ padding: '12px', borderRadius: '12px', cursor: 'pointer', background: nichoPfSelecionado === 'transicao' ? 'rgba(0,255,136,0.18)' : 'rgba(255,255,255,0.03)', color: nichoPfSelecionado === 'transicao' ? '#00ff88' : '#fff', border: nichoPfSelecionado === 'transicao' ? '1px solid #00ff88' : '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}
                          >
                            <strong style={{ display: 'block', fontSize: '12px' }}>💼 Transição Profissional</strong>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNichoPfSelecionado('liberais')}
                            style={{ padding: '12px', borderRadius: '12px', cursor: 'pointer', background: nichoPfSelecionado === 'liberais' ? 'rgba(43,217,255,0.18)' : 'rgba(255,255,255,0.03)', color: nichoPfSelecionado === 'liberais' ? '#2bd9ff' : '#fff', border: nichoPfSelecionado === 'liberais' ? '1px solid #2bd9ff' : '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}
                          >
                            <strong style={{ display: 'block', fontSize: '12px' }}>🩺 Saúde & Ozonioterapia</strong>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNichoPfSelecionado('consumo')}
                            style={{ padding: '12px', borderRadius: '12px', cursor: 'pointer', background: nichoPfSelecionado === 'consumo' ? 'rgba(255,215,0,0.18)' : 'rgba(255,255,255,0.03)', color: nichoPfSelecionado === 'consumo' ? '#ffd700' : '#fff', border: nichoPfSelecionado === 'consumo' ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}
                          >
                            <strong style={{ display: 'block', fontSize: '12px' }}>🛒 Consumo Consciente</strong>
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '20px' }}>
  <button
    type="button"
    onClick={() => executarGarimpo('whatsapp')}
    style={{
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(0,255,136,0.3)',
      color: '#00ff88',
      padding: '12px 18px',
      borderRadius: '12px',
      fontWeight: 'bold',
      fontSize: '11px',
      cursor: 'pointer',
      textAlign: 'center',
    }}
  >
    📱 WHATSAPP FILTRADO (20 CONTATOS)
  </button>

  <button
    type="button"
    onClick={() => executarGarimpo('redes_sociais')}
    style={{
      background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
      color: '#050505',
      border: 'none',
      padding: '12px 18px',
      borderRadius: '12px',
      fontWeight: '900',
      fontSize: '11px',
      cursor: 'pointer',
      letterSpacing: '0.5px',
      boxShadow: '0 4px 15px rgba(0,255,136,0.3)',
      textAlign: 'center',
    }}
  >
    🌐 REDES SOCIAIS FILTRADAS (20 PERFIS)
  </button>
</div>

                      {executouGarimpo && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <h4 style={{ fontSize: '14px', color: '#fff', margin: 0 }}>
                              ⚡ Lote Ativo para {municipioSelecionado} / {estadoSelecionado} ({perfisGarimpados.length} Perfis Alvo Prontos)
                            </h4>
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                              💡 Copie o link ou envie o Santinho Digital diretamente
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px', width: '100%', boxSizing: 'border-box' }}>
                            {perfisGarimpados.map((lead, index) => {
                              const msgSantinho = encodeURIComponent(`Olá ${lead.nome}! Notei seu perfil em ${lead.regiao} (${lead.perfil}). Convidamos você a conhecer o ecossistema CRC. Assista ao vídeo e conheça nossa comunidade: ${linkBaseGestor}`);
                              const linkWhatsSantinho = `https://wa.me/55${lead.whats}?text=${msgSantinho}`;

                              return (
                                <div
                                  key={index}
                                  style={{
                                    background: 'rgba(0,0,0,0.4)',
                                    border: '1px solid rgba(0,255,136,0.2)',
                                    borderRadius: '12px',
                                    padding: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                  }}
                                >
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <strong style={{ color: '#fff', fontSize: '13px' }}>{lead.nome}</strong>
                                      <span style={{ fontSize: '9px', background: 'rgba(0,255,136,0.15)', color: '#00ff88', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                                        {lead.regiao}
                                      </span>
                                    </div>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0', wordBreak: 'break-word' }}>
                                      🎯 <strong>Perfil Alvo:</strong> {lead.perfil}
                                    </p>
                                  </div>

                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(linkBaseGestor);
                                        alert(`📋 Link do SCOUT copiado com sucesso!`);
                                      }}
                                      style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(0,255,136,0.3)',
                                        color: '#00ff88',
                                        fontWeight: 'bold',
                                        fontSize: '11px',
                                        padding: '8px 10px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        flex: 1,
                                        minWidth: '110px',
                                        textAlign: 'center',
                                      }}
                                    >
                                      📋 Copiar Link
                                    </button>

                                    <a
                                      href={linkWhatsSantinho}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        background: '#00ff88',
                                        color: '#050505',
                                        fontWeight: 'bold',
                                        fontSize: '11px',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        textAlign: 'center',
                                        flex: 1,
                                        minWidth: '140px',
                                      }}
                                    >
                                      📨 Enviar Santinho Digital
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SANTINHO DIGITAL */}
              {gestorDesbloqueado && moduloAtivo === 'Seu SCOUT' && subModuloAtivo === 'Santinho Digital' && (
                <div className="sala-dynamic-card">
                  <span className="sala-eyebrow" style={{ color: '#00ff88' }}>SEU SCOUT · LINK 2</span>
                  <h3 style={{ fontSize: '20px', margin: '8px 0 4px', color: '#fff' }}>Santinho Digital (Vídeo de 10s)</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>
                    Sua assinatura visual com vídeo de alta conversão para atração rápida.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(0,255,136,0.3)' }}>
                    <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,255,136,0.3)', textAlign: 'center', padding: '10px' }}>
                      <span style={{ fontSize: '10px', color: '#00ff88', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>VÍDEO 10s · ATRAÇÃO</span>
                      <video src="/assets/santinho.mp4" controls style={{ width: '100%', borderRadius: '6px' }} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#fff', display: 'block', marginBottom: '8px' }}>Seu Link Exclusivo de Atribuição (Gestor):</strong>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          readOnly
                          value={linkBaseGestor}
                          style={{ flex: 1, minWidth: '180px', background: '#050505', border: '1px solid rgba(0,255,136,0.3)', padding: '10px 14px', borderRadius: '10px', color: '#00ff88', fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(linkBaseGestor);
                            alert('📋 Link exclusivo copiado para a área de transferência!');
                          }}
                          style={{ background: '#00ff88', color: '#050505', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Copiar Link
                        </button>
                      </div>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                        ID do Gestor Registrado no Banco: <code style={{ color: '#00ff88' }}>{gestor?.slug || gestor?.id || 'master'}</code>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* FEEDBACK DE PROSPECTOS */}
              {gestorDesbloqueado && moduloAtivo === 'Seu SCOUT' && subModuloAtivo === 'Feedback de Prospectos' && (
                <div className="sala-dynamic-card">
                  <div style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,0,0,0.6))', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '16px', padding: '18px 20px', marginBottom: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: '#00ff88', color: '#050505', padding: '3px 8px', borderRadius: '6px', fontWeight: '900', fontSize: '10px', letterSpacing: '1px' }}>
                          CENTRAL DE ATENDIMENTO {isMasterUser && '👑 [MASTER]'}
                        </span>
                        <h4 style={{ margin: 0, color: '#fff', fontSize: '15px' }}>
                          Gestão de Prospectos & Julgamento Individual
                        </h4>
                      </div>

                      {isMasterUser && (
                        <button
                          onClick={aprovarTodosPendentes}
                          style={{
                            background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                            color: '#050505',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontWeight: '900',
                            fontSize: '11px',
                            cursor: 'pointer',
                            boxShadow: '0 0 15px rgba(0,255,136,0.4)',
                            letterSpacing: '0.5px'
                          }}
                        >
                          ⚡ APROVAR LISTA EXIBIDA EM LOTE
                        </button>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                      Analise as respostas do Quiz. Ao aprovar, o lead sai automaticamente desta fila e é promovido para a tabela de gestores ativos.
                    </p>
                  </div>

                  {isMasterUser && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', background: 'rgba(0,0,0,0.4)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(0,255,136,0.2)' }}>
                      <button
                        onClick={() => setModoVisaoMaster('global')}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: modoVisaoMaster === 'global' ? '#00ff88' : 'transparent',
                          color: modoVisaoMaster === 'global' ? '#050505' : 'rgba(255,255,255,0.6)',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        🌐 Visão Global da Rede (Toda a Base)
                      </button>
                      <button
                        onClick={() => setModoVisaoMaster('pessoal')}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: modoVisaoMaster === 'pessoal' ? '#00ff88' : 'transparent',
                          color: modoVisaoMaster === 'pessoal' ? '#050505' : 'rgba(255,255,255,0.6)',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        👤 Meus Leads Diretos
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '22px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', display: 'block' }}>TOTAL ATIVOS</span>
                      <strong style={{ fontSize: '20px', color: '#fff' }}>{totalLeads}</strong>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', display: 'block' }}>PENDENTES X1</span>
                      <strong style={{ fontSize: '20px', color: '#00ff88' }}>{pendentesFila}</strong>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', display: 'block' }}>ACOMPANHAMENTO</span>
                      <strong style={{ fontSize: '20px', color: '#2bd9ff' }}>{acompanhamentoLeads}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span className="sala-eyebrow" style={{ color: '#00ff88' }}>FILA OPERACIONAL ATIVA</span>
                      <h3 style={{ fontSize: '18px', margin: '2px 0', color: '#fff' }}>Registros do Supabase</h3>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => window.print()}
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 'bold',
                        }}
                      >
                        🖨️ Imprimir / Baixar PDF
                      </button>

                      <button
                        onClick={carregarLeadsScout}
                        style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        🔄 Atualizar Fila
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '20px' }} className="no-print">
                    <input
                      type="text"
                      placeholder="🔍 Nome, E-mail ou Whats..."
                      value={buscaNome}
                      onChange={(e) => setBuscaNome(e.target.value)}
                      style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                    />

                    {isMasterUser && (
                      <select
                        value={filtroGestorId}
                        onChange={(e) => setFiltroGestorId(e.target.value)}
                        style={{ background: '#050505', border: '1px solid rgba(0,255,136,0.4)', padding: '10px 14px', borderRadius: '10px', color: '#00ff88', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        <option value="todos">👤 Todos os Gestores da Rede</option>
                        <option value="sem_gestor">❓ (Sem Gestor - Pool Geral)</option>
                        {listaGestores.map((g) => (
                          <option key={g.id} value={g.id}>
                            👤 Fila de: {g.nome}
                          </option>
                        ))}
                      </select>
                    )}

                    <input
                      type="text"
                      placeholder="📍 Cidade / Estado..."
                      value={buscaRegiao}
                      onChange={(e) => setBuscaRegiao(e.target.value)}
                      style={{ background: '#050505', border: '1px solid rgba(0,255,136,0.3)', padding: '10px 14px', borderRadius: '10px', color: '#00ff88', fontSize: '12px' }}
                    />

                    <select
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      style={{ background: '#050505', border: '1px solid rgba(0,255,136,0.3)', padding: '10px 14px', borderRadius: '10px', color: '#00ff88', fontSize: '12px', fontWeight: 'bold' }}
                    >
                      <option value="pendente">Pendentes (Fila Ativa)</option>
                      <option value="todos">Todos os Status</option>
                      <option value="acompanhamento">Em Acompanhamento</option>
                    </select>
                  </div>

                  {carregandoLeads ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#00ff88', fontSize: '12px' }}>
                      ⚙️ Conectando ao Supabase e buscando registros...
                    </div>
                  ) : leadsFiltrados.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '12px', border: '1px dashed rgba(0,255,136,0.2)', borderRadius: '14px', background: 'rgba(0,0,0,0.3)' }}>
                      <strong style={{ color: '#fff', display: 'block', fontSize: '14px', marginBottom: '6px' }}>Nenhum prospecto encontrado para esse filtro.</strong>
                      Ajuste a busca por nome ou selecione outro Gestor Patrocinador.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {leadsFiltrados.map((item) => {
                        const convidado = item.dados?.convidado;
                        const whatsClean = convidado?.whatsapp?.replace(/\D/g, '') || '';
                        const statusAtual = item.dados?.status_aprovacao || 'pendente';
                        
                        const msgWhats = encodeURIComponent(`Olá ${convidado?.nome || ''}, recebi seu cadastro no Quiz do SCOUT.CRC! Podemos conversar sobre seu objetivo?`);
                        const linkWhats = `https://wa.me/55${whatsClean}?text=${msgWhats}`;

                        return (
                          <div
                            key={item.id}
                            className="lead-card-printable"
                            style={{
                              background: 'rgba(0,0,0,0.5)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '14px',
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <strong style={{ color: '#fff', fontSize: '14px' }}>
                                  {convidado?.nome || 'Convidado Real'}
                                </strong>
                                <span style={{ fontSize: '9px', background: 'rgba(0,255,136,0.15)', color: '#00ff88', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(0,255,136,0.3)', fontWeight: 'bold' }}>
                                  {item.dados?.perfil?.toUpperCase() || 'RESPOSTAS QUIZ'}
                                </span>
                                
                                <span style={{ 
                                  fontSize: '9px', 
                                  padding: '2px 8px', 
                                  borderRadius: '10px', 
                                  fontWeight: 'bold', 
                                  background: statusAtual === 'acompanhamento' ? 'rgba(43,217,255,0.2)' : 'rgba(255,255,255,0.08)', 
                                  color: statusAtual === 'acompanhamento' ? '#2bd9ff' : 'rgba(255,255,255,0.6)' 
                                }}>
                                  {statusAtual === 'acompanhamento' ? '🔵 EM ACOMPANHAMENTO' : '⚪ PENDENTE X1'}
                                </span>
                              </div>

                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '12px', marginTop: '2px', flexWrap: 'wrap' }}>
                                <span>📱 {convidado?.whatsapp || 'Sem WhatsApp'}</span>
                                <span style={{ color: '#00ff88', fontWeight: 'bold' }}>
                                  📍 {convidado?.cidade || 'Região não informada'}
                                </span>
                                <span>✉️ {convidado?.email || 'Sem e-mail'}</span>
                                <span>📅 {new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                              </div>

                              {item.dados?.respostas && (
                                <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
                                  <strong>Objetivo Declarado:</strong> {item.dados.respostas['objetivo'] || 'Não especificado'}
                                </div>
                              )}

                              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>
                                  👤 Gestor Patrocinador:
                                </span>
                                <select
                                  value={item.gestor_id || ''}
                                  onChange={(e) => atribuirGestorLead(item.id, e.target.value)}
                                  style={{
                                    background: '#080808',
                                    border: '1px solid rgba(0,255,136,0.3)',
                                    color: '#00ff88',
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    outline: 'none',
                                  }}
                                >
                                  <option value="">(Sem Gestor - Pool Geral / Master)</option>
                                  {listaGestores.map((g) => (
                                    <option key={g.id} value={g.id}>
                                      {g.nome}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }} className="no-print">
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginRight: '2px' }}>Ações:</span>
                                  
                                  <button
                                    onClick={() => aprovarLead(item.id)}
                                    style={{ background: 'rgba(0,255,136,0.18)', border: '1px solid rgba(0,255,136,0.4)', color: '#00ff88', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                  >
                                    🟢 Aprovar & Promover
                                  </button>

                                  <button
                                    onClick={() => atualizarStatusGenerico(item.id, 'acompanhamento')}
                                    style={{ background: 'rgba(43,217,255,0.12)', border: '1px solid rgba(43,217,255,0.3)', color: '#2bd9ff', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                  >
                                    🔵 Acompanhamento
                                  </button>

                                  <button
                                    onClick={() => deletarLeadDefinitivo(item.id)}
                                    style={{ background: 'rgba(255,68,68,0.18)', border: '1px solid rgba(255,68,68,0.4)', color: '#ff4444', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                  >
                                    🗑️ Deletar do Banco
                                  </button>
                                </div>

                                {whatsClean && (
                                  <a
                                    href={linkWhats}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      background: '#00ff88',
                                      color: '#050505',
                                      fontWeight: '900',
                                      fontSize: '11px',
                                      padding: '8px 16px',
                                      borderRadius: '8px',
                                      textAlign: 'center',
                                      textDecoration: 'none',
                                      whiteSpace: 'nowrap',
                                      boxShadow: '0 2px 10px rgba(0,255,136,0.3)',
                                      display: 'inline-block'
                                    }}
                                  >
                                    💬 Iniciar X1
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* GESTORES APROVADOS */}
              {gestorDesbloqueado && moduloAtivo === 'Seu SCOUT' && subModuloAtivo === 'Gestores Aprovados' && (
                <div className="sala-dynamic-card">
                  <span className="sala-eyebrow" style={{ color: '#00ff88' }}>REPOSITÓRIO DA REDE · GESTORES ATIVOS</span>
                  <h3 style={{ fontSize: '20px', margin: '8px 0 4px', color: '#fff' }}>Gestores Aprovados e Cadastrados</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>
                    Lista oficial de operadores cadastrados na tabela <code>scout_gestores</code>.
                  </p>

                  {listaGestores.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '12px', border: '1px dashed rgba(0,255,136,0.2)', borderRadius: '14px' }}>
                      Nenhum gestor cadastrado na rede no momento.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {listaGestores.map((gItem) => (
                        <div key={gItem.id} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <strong style={{ color: '#fff', fontSize: '14px', display: 'block' }}>{gItem.nome}</strong>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>📱 {gItem.whatsapp || 'Sem WhatsApp'} | 📍 {gItem.cidade || 'Região não informada'} | 🔗 Slug: <code style={{ color: '#00ff88' }}>{gItem.slug || 'N/D'}</code></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.4)', padding: '6px 12px', borderRadius: '8px', color: '#00ff88', fontSize: '11px', fontWeight: 'bold' }}>
                              ✉️ E-mail: {gItem.email || 'Não informado'}
                            </div>

                            <button
                              onClick={() => deletarGestorAprovado(gItem.email, gItem.id)}
                              style={{
                                background: 'rgba(255,68,68,0.18)',
                                border: '1px solid rgba(255,68,68,0.4)',
                                color: '#ff4444',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                              }}
                            >
                              🗑️ Revogar / Deletar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {gestorDesbloqueado && moduloAtivo === 'Informativos' && (
                <div className="sala-dynamic-card" style={{ padding: 0, background: 'transparent', border: 'none' }}>
                  <InformesPage />
                </div>
              )}

              {gestorDesbloqueado && moduloAtivo === 'Mentoria' && (
                <div className="sala-dynamic-card" style={{ padding: 0, background: 'transparent', border: 'none' }}>
                  <MentoriaPage />
                </div>
              )}

              {gestorDesbloqueado && moduloAtivo === 'Curadoria' && (
                <div className="sala-dynamic-card" style={{ padding: 0, background: 'transparent', border: 'none' }}>
                  <CuradoriaPage />
                </div>
              )}

            </div>
          </section>
        </div>

        <footer className="sala-footer">
          <span>SCOUT.CRC</span>
          <small>Conheça o ambiente. Descubra o seu lugar.</small>
        </footer>
      </div>

      {moduloRestrito && (
        <div className="sala-modal-backdrop" onClick={() => setModuloRestrito(null)}>
          <div className="sala-modal" onClick={(event) => event.stopPropagation()}>
            <div className="sala-modal-lock">🔒</div>
            <div className="sala-eyebrow">SALA DE OPERAÇÕES · VALIDAÇÃO PENDENTE</div>
            <h2>{moduloRestrito.nome}</h2>
            <p>{moduloRestrito.descricao}</p>

            <div className="sala-modal-message">
              Bem-vindo à Sala de Operações! Sua solicitação deu entrada no sistema.
              <br />
              <strong>Aguarde a validação do seu Gestor de referência para desbloquear este recurso no atendimento X1.</strong>
            </div>

            <button
              type="button"
              className="sala-modal-close"
              onClick={() => setModuloRestrito(null)}
            >
              Compreendido
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .sala-page {
          min-height: 100vh;
          background: radial-gradient(circle at 70% 16%, rgba(0, 255, 136, 0.08), transparent 26%), #050505;
          color: #f5f7f8;
          padding: 18px;
          overflow-x: hidden;
        }
        .sala-shell {
          min-height: calc(100vh - 36px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          background: rgba(8, 10, 10, 0.72);
          box-shadow: 0 30px 100px rgba(0, 0, 0, 0.45);
          overflow: hidden;
        }
        .sala-header {
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 26px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(255, 255, 255, 0.015);
        }
        .sala-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sala-brand-mark {
          display: flex;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0, 255, 136, 0.42);
          border-radius: 12px;
          color: #00ff88;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
        }
        .sala-brand-name {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 2px;
        }
        .sala-brand-subtitle {
          margin-top: 3px;
          color: rgba(255, 255, 255, 0.45);
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .sala-header-status {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.45);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.4px;
        }
        .sala-chave-btn {
          background: rgba(0,255,136,0.1);
          border: 1px solid rgba(0,255,136,0.3);
          color: #00ff88;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-size: 10px;
        }
        .sala-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00ff88;
          box-shadow: 0 0 14px rgba(0, 255, 136, 0.75);
        }

        /* BARRA MOBILE COMPACTA */
        .mobile-nav-bar {
          display: none;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background: rgba(0, 255, 136, 0.08);
          border-bottom: 1px solid rgba(0, 255, 136, 0.25);
        }
        .mobile-menu-toggle {
          background: #00ff88;
          color: #050505;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 900;
          font-size: 11px;
          cursor: pointer;
        }
        .mobile-close-btn {
          display: none;
          background: rgba(255,68,68,0.2);
          border: 1px solid rgba(255,68,68,0.4);
          color: #ff4444;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          cursor: pointer;
        }

        .sala-layout {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          min-height: calc(100vh - 112px);
        }
        .sala-sidebar {
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(0, 0, 0, 0.18);
        }
        .sala-sidebar-heading {
          display: flex;
          justify-content: space-between;
          padding: 22px 18px 12px;
          color: rgba(255, 255, 255, 0.42);
          font-size: 9px;
          letter-spacing: 1.7px;
        }
        .sala-menu {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 0 10px;
        }
        .sala-menu-group {
          display: flex;
          flex-direction: column;
        }
        .sala-menu-quiz {
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          width: 100%;
          padding: 12px 10px;
          color: #ffffff;
          text-align: left;
          background: linear-gradient(135deg, rgba(255, 68, 68, 0.9), rgba(200, 20, 20, 0.95));
          border: 1px solid rgba(255, 120, 120, 0.6);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
          margin-bottom: 6px;
        }
        .sala-menu-quiz:hover {
          background: linear-gradient(135deg, #ff4444, #e60000);
          box-shadow: 0 6px 20px rgba(255, 68, 68, 0.5);
          transform: translateY(-1px);
        }
        .sala-menu-item {
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          width: 100%;
          padding: 12px 10px;
          color: inherit;
          text-align: left;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sala-menu-item:hover, .sala-menu-item.active {
          border-color: rgba(0, 255, 136, 0.25);
          background: rgba(0, 255, 136, 0.06);
        }
        .sala-sublinks {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-left: 36px;
          padding-top: 4px;
          padding-bottom: 6px;
        }
        .sala-sublink-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          text-align: left;
          font-size: 11px;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sala-sublink-btn:hover, .sala-sublink-btn.active {
          color: #00ff88;
          background: rgba(0, 255, 136, 0.04);
        }
        .sala-menu-icon {
          display: flex;
          width: 30px;
          height: 30px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 99px;
          color: rgba(255, 255, 255, 0.55);
          font-size: 12px;
        }
        .sala-menu-copy {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 3px;
        }
        .sala-menu-copy strong {
          font-size: 11px;
          font-weight: 800;
          line-height: 1.2;
        }
        .sala-menu-copy small {
          color: rgba(255, 255, 255, 0.6);
          font-size: 9px;
        }
        .sala-lock {
          color: rgba(255, 255, 255, 0.28);
          font-size: 12px;
        }
        .sala-sidebar-footer {
          margin-top: auto;
          padding: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .sala-visitor-tag {
          display: inline-flex;
          padding: 6px 8px;
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 999px;
          color: #00ff88;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }
        .sala-gestor-name {
          display: block;
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.88);
          font-size: 13px;
          font-weight: 700;
        }
        .sala-sidebar-footer p {
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 10px;
          line-height: 1.5;
        }
        .sala-main {
          min-width: 0;
          padding: 28px;
        }
        .sala-welcome {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          padding-bottom: 24px;
          flex-wrap: wrap;
        }
        .sala-eyebrow {
          color: rgba(255, 255, 255, 0.42);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.7px;
          text-transform: uppercase;
        }
        .sala-welcome h1 {
          max-width: 720px;
          margin: 8px 0 10px;
          font-size: clamp(28px, 4vw, 52px);
          line-height: 0.98;
          letter-spacing: -1.7px;
        }
        .sala-welcome h1 span {
          color: #00ff88;
        }
        .sala-welcome p {
          max-width: 650px;
          margin: 0;
          color: rgba(255, 255, 255, 0.55);
          font-size: 13px;
          line-height: 1.65;
        }
        .sala-welcome-mark {
          min-width: 190px;
          padding: 12px 0 0;
          text-align: right;
        }
        .sala-welcome-mark span {
          display: block;
          color: rgba(255, 255, 255, 0.07);
          font-size: 58px;
          font-weight: 900;
          line-height: 0.8;
          letter-spacing: 5px;
        }
        .sala-welcome-mark small {
          display: block;
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.25);
          font-size: 8px;
          letter-spacing: 1.3px;
        }
        .sala-center-viewport {
          margin-top: 10px;
        }
        .sala-dynamic-card {
          background: rgba(0, 255, 136, 0.03);
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          box-sizing: border-box;
          max-width: 100%;
        }
        .sala-footer {
          display: flex;
          justify-content: space-between;
          padding: 14px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.24);
          font-size: 8px;
          letter-spacing: 1.3px;
          text-transform: uppercase;
        }
        .sala-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.76);
          backdrop-filter: blur(10px);
        }
        .sala-modal {
          width: min(460px, 100%);
          padding: 30px;
          border: 1px solid rgba(0, 255, 136, 0.16);
          border-radius: 22px;
          background: #0b0f0d;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.54);
          text-align: center;
        }
        .sala-modal-lock {
          display: flex;
          width: 48px;
          height: 48px;
          margin: 0 auto 18px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 15px;
          color: #00ff88;
          font-size: 18px;
        }
        .sala-modal h2 {
          margin: 8px 0 10px;
          font-size: 28px;
        }
        .sala-modal-close {
          background: #00ff88;
          color: #050505;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 800;
          cursor: pointer;
          margin-top: 16px;
        }

        /* REGRAS DE LAYOUT EXCLUSIVAS PARA MOBILE */
        @media (max-width: 768px) {
          .sala-layout {
            grid-template-columns: 1fr;
          }
          .mobile-nav-bar {
            display: flex;
          }
          .mobile-hide {
            display: none;
          }
          .mobile-close-btn {
            display: block;
          }
          .mobile-compact-welcome {
            padding-bottom: 8px;
          }
          .mobile-compact-welcome h1 {
            font-size: 20px;
          }

          /* MENU RETRÁTIL SOBREPOSTO (DRAWER) NO MOBILE */
          .sala-sidebar {
            position: fixed;
            inset: 0;
            z-index: 200;
            background: #080a0a;
            padding: 16px;
            display: none;
            overflow-y: auto;
          }
          .sala-sidebar.mobile-open {
            display: flex;
          }
          .sala-dynamic-card {
            padding: 16px;
          }

          /* CORREÇÃO DO SIMULADOR NO CELULAR (EMPILHA TEXTO E GRÁFICO) */
          .sim-body-wrapper-original {
            flex-direction: column !important;
          }
          .info-col-left-original {
            width: 100% !important;
            min-width: 100% !important;
          }
          .chart-col-right-original {
            width: 100% !important;
            min-height: 320px !important;
          }
        }

        @keyframes fadeInOut {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}