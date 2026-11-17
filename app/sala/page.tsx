// app/sala/page.tsx
'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import InformesPage from '@/app/informes/page';
import MentoriaPage from '@/app/mentoria/page';
import CuradoriaPage from '@/app/curadoria/page';
import Script from 'next/script';
import { executarMotorGarimpo } from '@/lib/motorGarimpo';

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
  gestor_nome?: string;
  categoria_origem?: string;
  dados: {
    convidado?: {
      nome: string;
      whatsapp: string;
      email?: string;
      cidade?: string;
      perfil_social_url?: string;
      rede_social_origem?: string;
      resumo_analitico?: string;
    };
    perfil?: string;
    respostas?: Record<string, string>;
    status_atendimento?: 'novo' | 'em_atendimento' | 'concluido';
    origem?: string;
    gestor_nome?: string;
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
    descricao: 'Bem-vindo ao ecossistema SCOUT e à central do Gestor.',
    icone: '🏛️',
  },
  {
    nome: 'O Oleiro e a Argila',
    descricao: 'A base conceitual e filosófica do Gestor de Comunidades.',
    icone: '📖',
  },
  {
    nome: 'Apresentação do Negócio',
    descricao: 'Sua ferramenta para reuniões caseiras e apresentações online ao vivo.',
    icone: '🚀',
    sublinks: ['Simulador de Negócio', 'Slides do Negócio', 'Catálogos & Vendas'],
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
    sublinks: ['Prospecto Digital', 'Santinho Digital', 'Gestores Desbloqueados'],
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

  const [manutencaoAtiva, setManutencaoAtiva] = useState(false);

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

  const [patrocinadorGestor, setPatrocinadorGestor] = useState<GestorItem | null>(null);
  const [listaGestores, setListaGestores] = useState<GestorItem[]>([]);
  const [carregandoGestores, setCarregandoGestores] = useState<boolean>(true);

  const [estadoSelecionado, setEstadoSelecionado] = useState<string>('RJ');
  const [municipiosDoEstado, setMunicipiosDoEstado] = useState<string[]>([]);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>('Cabo Frio');
  const [carregandoCidades, setCarregandoCidades] = useState<boolean>(false);
  
  // Seleção via Lista Suspensa (Dropdown)
  const [nichoSelecionado, setNichoSelecionado] = useState<string>('Pessoas querendo revender cosméticos e ganhar renda extra');

  const [leads, setLeads] = useState<ConvidadoRegistro[]>([]);
  const [carregandoLeads, setCarregandoLeads] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroGestorId, setFiltroGestorId] = useState<string>('todos');
  const [buscaNome, setBuscaNome] = useState<string>('');
  const [buscaRegiao, setBuscaRegiao] = useState<string>('');
  
  const [novoLeadAlerta, setNovoLeadAlerta] = useState<string | null>(null);

  const eUuidValido = (id: string | null | undefined): boolean => {
    if (!id) return false;
    const regexUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regexUuid.test(id);
  };
  
  const isMasterUser = useMemo(() => {
    if (gestor?.slug === 'master' || gestor?.nome?.toLowerCase().includes('gilmar')) return true;
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('scout_gestor') || sessionStorage.getItem('scout_gestor');
      if (local && (local.toLowerCase().includes('gilmar') || local.toLowerCase().includes('master'))) return true;
    }
    return false;
  }, [gestor]);

  useEffect(() => {
    async function verificarManutencao() {
      try {
        const { data, error } = await supabase
          .from('configuracoes')
          .select('ativo')
          .eq('chave', 'modo_manutencao')
          .single();
        if (!error && data) {
          setManutencaoAtiva(data.ativo);
        }
      } catch (err) {
        console.error('Erro ao verificar manutenção:', err);
      }
    }
    verificarManutencao();
  }, []);

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

      if (!isMasterUser) {
        if (eUuidValido(gestor?.id)) {
          query = query.eq('gestor_id', gestor?.id);
        } else {
          query = query.eq('gestor_id', '00000000-0000-0000-0000-000000000000');
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

  const identificarPatrocinadorLogado = async (gestorIdLogado: string | null) => {
    if (!gestorIdLogado || !eUuidValido(gestorIdLogado)) {
      setPatrocinadorGestor({
        id: 'master',
        nome: 'Gilmar Aguiar (Master)',
        whatsapp: '5522999231211',
        slug: 'master'
      });
      return;
    }

    try {
      const { data: reg } = await supabase
        .from('scout_registros')
        .select('gestor_id')
        .eq('id', gestorIdLogado)
        .single();

      if (reg?.gestor_id && eUuidValido(reg.gestor_id)) {
        const { data: patroc } = await supabase
          .from('scout_gestores')
          .select('*')
          .eq('id', reg.gestor_id)
          .single();

        if (patroc) {
          setPatrocinadorGestor(patroc as GestorItem);
          return;
        }
      }

      setPatrocinadorGestor({
        id: 'master',
        nome: 'Gilmar Aguiar (Master)',
        whatsapp: '5522999231211',
        slug: 'master'
      });
    } catch (err) {
      console.error('Erro ao identificar patrocinador:', err);
      setPatrocinadorGestor({
        id: 'master',
        nome: 'Gilmar Aguiar (Master)',
        whatsapp: '5522999231211',
        slug: 'master'
      });
    }
  };

  useEffect(() => {
    async function verificarSessao() {
      const dados = localStorage.getItem('scout_gestor') || sessionStorage.getItem('scout_gestor');
      if (!dados) return;

      try {
        const gestorSalvo = JSON.parse(dados);
        
        if (gestorSalvo?.email || gestorSalvo?.slug || gestorSalvo?.id) {
          let query = supabase.from('scout_gestores').select('*');
          
          if (gestorSalvo?.email) {
            query = query.eq('email', gestorSalvo.email);
          } else if (gestorSalvo?.slug) {
            query = query.eq('slug', gestorSalvo.slug);
          } else {
            query = query.eq('id', gestorSalvo.id);
          }

          const { data: gestorBanco, error } = await query.single();

          if (!error && gestorBanco) {
            setGestor(gestorBanco);
            setGestorDesbloqueado(true);
            localStorage.setItem('scout_gestor', JSON.stringify(gestorBanco));
            identificarPatrocinadorLogado(gestorBanco.id);
            carregarLeadsScout();
            return;
          }
        }
      } catch (err) {
        console.error('Erro ao verificar sessão:', err);
        localStorage.removeItem('scout_gestor');
        sessionStorage.removeItem('scout_gestor');
      }
    }

    verificarSessao();
    carregarListaGestores();
  }, []);

  const carregarListaGestores = async () => {
    setCarregandoGestores(true);
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
    } finally {
      setCarregandoGestores(false);
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

  const perfisGarimpados = useMemo(() => {
    return leads
      .filter((l) => (l.tipo === 'garimpo' || !l.tipo) && (!gestor?.id || l.gestor_id === gestor.id || isMasterUser))
      .map((item) => ({
        idRegistro: item.id,
        nome: item.dados?.convidado?.nome || 'Contato',
        whats: item.dados?.convidado?.whatsapp || '',
        regiao: item.dados?.convidado?.cidade || '',
        perfil: item.dados?.perfil || '',
        gestorNome: item.gestor_nome || item.dados?.gestor_nome || 'Master/Geral',
        categoriaOrigem: item.categoria_origem || 'Contato Pessoal / Geral',
        perfilSocialUrl: item.dados?.convidado?.perfil_social_url || '',
        redeSocialOrigem: item.dados?.convidado?.rede_social_origem || '',
        resumoAnalitico: item.dados?.convidado?.resumo_analitico || 'Alvo qualificado com fit para abordagem direta na praça.'
      }));
  }, [leads, gestor, isMasterUser]);

  // Executa o motor com base na lista suspensa selecionada
  const executarGarimpoUnificado = async () => {
    if (nichoSelecionado === 'OUTRO NICHO (Solicitar Manutenção / Suporte)') {
      alert('⚠️ Para novos nichos não listados, entre em contato com o suporte para atualização do motor.');
      return;
    }

    const nomeGestorAtual = gestor?.nome || 'Master';
    const categoriaDefinida = `Garimpo: ${nichoSelecionado}`;
    const tituloGarimpo = `Garimpo [${nichoSelecionado}] - ${municipioSelecionado}/${estadoSelecionado}`;

    try {
      const perfisBrutos = await executarMotorGarimpo(
        estadoSelecionado,
        municipioSelecionado,
        nichoSelecionado,
        20
      );

      if (gestor?.id) {
        const registrosParaInserir = perfisBrutos.map(p => ({
          gestor_id: gestor.id,
          tipo: 'garimpo',
          titulo: tituloGarimpo,
          gestor_nome: nomeGestorAtual,
          categoria_origem: categoriaDefinida,
          dados: {
            convidado: {
              nome: p.nome,
              whatsapp: p.whatsapp,
              cidade: p.regiao,
              email: `${p.whatsapp}@garimpo.scout`,
              perfil_social_url: p.perfilSocialUrl,
              rede_social_origem: p.redeSocialOrigem,
              resumo_analitico: p.resumoAnalitico
            },
            perfil: p.perfilAlvo,
            status_atendimento: 'novo',
            gestor_nome: nomeGestorAtual
          }
        }));

        await supabase.from('scout_registros').insert(registrosParaInserir);
        carregarLeadsScout();
      }
    } catch (err) {
      console.error('Erro ao executar o motor unificado de garimpo:', err);
    }
  };

  const descartarPerfilIndividual = async (idRegistro: string) => {
    if (!idRegistro) return;
    try {
      await supabase
        .from('scout_registros')
        .delete()
        .eq('id', idRegistro);

      setLeads((anterior) => anterior.filter((item) => item.id !== idRegistro));
    } catch (err) {
      console.error('Erro ao deletar do Supabase:', err);
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

          if (!isMasterUser && eUuidValido(gestor?.id) && novoRegistro.gestor_id !== gestor?.id) {
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
  }, [gestorDesbloqueado, gestor, isMasterUser]);

  useEffect(() => {
    if (gestorDesbloqueado) {
      carregarLeadsScout();
    }
  }, [gestorDesbloqueado, moduloAtivo, subModuloAtivo]);

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

  const deletarRegistroMaster = async (id: string) => {
    if (!confirm('🛑 (MASTER) Deseja excluir definitivamente este registro do banco de dados?')) return;

    const { error } = await supabase
      .from('scout_registros')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Erro ao excluir registro: ' + error.message);
      return;
    }

    setLeads((anterior) => anterior.filter((item) => item.id !== id));
  };

  const atualizarStatusAtendimento = async (id: string, novoStatus: 'novo' | 'em_atendimento' | 'concluido') => {
    const leadAlvo = leads.find((l) => l.id === id);
    if (!leadAlvo) return;

    const novosDados = {
      ...leadAlvo.dados,
      status_atendimento: novoStatus,
    };

    const { error } = await supabase
      .from('scout_registros')
      .update({ dados: novosDados })
      .eq('id', id);

    if (error) {
      alert('Erro ao atualizar status de atendimento.');
      return;
    }

    setLeads((anterior) =>
      anterior.map((item) =>
        item.id === id ? { ...item, dados: novosDados } : item
      )
    );
  };

  const linkBaseGestor = `https://crc-scout.vercel.app/?gestor_id=${gestor?.slug || 'master'}`;

  const leadsAtivosGestor = leads.filter((l) => l.tipo !== 'garimpo');

  const totalLeads = leadsAtivosGestor.length;
  const novosAtendimento = leadsAtivosGestor.filter((l) => (l.dados?.status_atendimento || 'novo') === 'novo').length;
  const emAtendimentoLeads = leadsAtivosGestor.filter((l) => l.dados?.status_atendimento === 'em_atendimento').length;
  const concluidosLeads = leadsAtivosGestor.filter((l) => l.dados?.status_atendimento === 'concluido').length;

  const leadsFiltrados = leadsAtivosGestor.filter((item) => {
    const nome = item.dados?.convidado?.nome?.toLowerCase() || '';
    const regiao = item.dados?.convidado?.cidade?.toLowerCase() || '';
    const email = item.dados?.convidado?.email?.toLowerCase() || '';
    const whats = item.dados?.convidado?.whatsapp || '';
    const status = item.dados?.status_atendimento || 'novo';

    const buscaLower = buscaNome.toLowerCase();
    const matchesNome = nome.includes(buscaLower) || email.includes(buscaLower) || whats.includes(buscaLower);
    const matchesRegiao = regiao.includes(buscaRegiao.toLowerCase());
    const matchesStatus = filtroStatus === 'todos' ? true : status === filtroStatus;

    let matchesGestor = true;
    if (isMasterUser && filtroGestorId !== 'todos') {
      if (filtroGestorId === 'sem_gestor') {
        matchesGestor = item.gestor_id === null;
      } else {
        matchesGestor = item.gestor_id === filtroGestorId;
      }
    }

    return matchesNome && matchesRegiao && matchesStatus && matchesGestor;
  });

  if (manutencaoAtiva && !isMasterUser) {
    return (
      <main style={{ minHeight: '100vh', background: '#050505', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ maxWidth: '480px', background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 40px rgba(255,68,68,0.15)' }}>
          <div style={{ fontSize: '42px', marginBottom: '16px' }}>🛠️</div>
          <h1 style={{ color: '#ff4444', fontSize: '24px', margin: '0 0 12px' }}>Sistema em Manutenção Programada</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.6', margin: '0 0 24px' }}>
            Estamos atualizando os recursos operacionais da Sala de Operações. Retornaremos em breve com melhorias na rede. Apenas o Master possui acesso operacional no momento.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🔄 Verificar Novamente
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="sala-page">
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0" strategy="beforeInteractive" />

      <div className="sala-shell">
        <header className="sala-header">
          <div className="sala-brand" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div className="sala-brand-name" style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '3px', color: '#fff' }}>SCOUT</div>
            <div className="sala-brand-subtitle" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.45)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              sala de operações · gestão de comunidades {isMasterUser ? '👑 [MASTER]' : `👤 [GESTOR: ${gestor?.nome || 'Ativo'}]`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            
            <a
              href={`https://wa.me/55${patrocinadorGestor?.whatsapp?.replace(/\D/g, '') || '5522999231211'}?text=${encodeURIComponent(`Olá ${patrocinadorGestor?.nome || 'Gestor'}! Acabei de acessar a Sala de Operações do SCOUT e gostaria de falar com meu gestor de referência.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                color: '#050505',
                padding: '8px 14px',
                borderRadius: '10px',
                fontWeight: '900',
                fontSize: '11px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 20px rgba(0,255,136,0.35)'
              }}
            >
              💬 Fale com seu Gestor: {patrocinadorGestor?.nome || 'Gilmar Aguiar (Master)'}
            </a>

            {isMasterUser && (
              <button
                type="button"
                onClick={async () => {
                  const novoEstado = !manutencaoAtiva;
                  const { error } = await supabase
                    .from('configuracoes')
                    .update({ ativo: novoEstado })
                    .eq('chave', 'modo_manutencao');

                  if (error) {
                    alert('Erro ao alterar status de manutenção: ' + error.message);
                  } else {
                    setManutencaoAtiva(novoEstado);
                  }
                }}
                style={{
                  background: manutencaoAtiva ? 'rgba(255,68,68,0.2)' : 'rgba(0,255,136,0.15)',
                  border: `1px solid ${manutencaoAtiva ? '#ff4444' : '#00ff88'}`,
                  color: manutencaoAtiva ? '#ff4444' : '#00ff88',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '10px',
                  cursor: 'pointer',
                  letterSpacing: '0.5px'
                }}
              >
                {manutencaoAtiva ? '🔴 Desativar Manutenção' : '🟢 Ativar Manutenção'}
              </button>
            )}

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
              <span className="mobile-hide">AMBIENTE ATIVO</span>
            </div>
          </div>
        </header>

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
            <span>🚨 NOVO GESTOR DESBLOQUEADO VIA TOKEN:</span>
            <strong style={{ textDecoration: 'underline' }}>{novoLeadAlerta}</strong>
            <span>➔ Verifique na Fila de Gestores Desbloqueados!</span>
          </div>
        )}

        <div className="sala-layout">
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
                    <small>Quiz de Qualificação</small>
                  </span>
                  <span className="sala-lock">➔</span>
                </button>
              )}

              {modulos.map((modulo) => {
                return (
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
                        {modulo.sublinks.map((sub) => {
                          return (
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
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {!modoVisitante && (
              <div className="sala-sidebar-footer">
                {gestor ? (
                  <>
                    <span className="sala-visitor-tag">
                      {isMasterUser ? '👑 GESTOR MASTER (GLOBAL)' : 'GESTOR DE COMUNIDADE'}
                    </span>
                    <strong className="sala-gestor-name">{gestor.nome}</strong>
                    <p>Operação SCOUT ativa com rastreio direto no banco.</p>
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
                  Prospecção, atração visual e inteligência de qualificação para a Gestão de Comunidades.
                </p>
              </div>

              <div className="sala-welcome-mark mobile-hide">
                <span>SCOUT</span>
                <small>COMUNIDADE · RELAÇÃO · CONSUMO</small>
              </div>
            </div>

            <div className="sala-center-viewport">
              
              {moduloAtivo === 'Visão Geral & Boas-Vindas' && (
                <div className="sala-dynamic-card" style={{ border: '1px solid rgba(0, 255, 136, 0.35)', background: 'linear-gradient(135deg, rgba(0,255,136,0.06), rgba(5,5,5,0.98))' }}>
                  <div style={{ maxWidth: '820px' }}>
                    <span style={{ color: '#00ff88', fontSize: '10px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                      ✦ BEM-VINDO À SALA DE OPERAÇÕES DA GESTÃO DE COMUNIDADES
                    </span>
                    <h2 style={{ fontSize: '26px', color: '#fff', margin: '0 0 14px', lineHeight: '1.2' }}>
                      Liderança Relacional & Arquitetura de Comunidades
                    </h2>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.7', marginBottom: '24px' }}>
                      Você está no coração operacional do <strong>SCOUT</strong>. Nossa tecnologia transforma a atração tradicional de negócios em uma jornada de valor, onde o <strong>Gestor de Comunidade</strong> organiza redes sustentáveis de consumo consciente e alto alinhamento.
                    </p>

                    {!isMasterUser && patrocinadorGestor && (
                      <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '16px', padding: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <span style={{ color: '#00ff88', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', display: 'block' }}>SEU PATROCINADOR DE REFERÊNCIA</span>
                          <strong style={{ color: '#fff', fontSize: '16px' }}>{patrocinadorGestor.nome}</strong>
                        </div>
                        <a
                          href={`https://wa.me/55${patrocinadorGestor.whatsapp?.replace(/\D/g, '') || '5522999231211'}?text=${encodeURIComponent(`Olá ${patrocinadorGestor.nome}! Acabei de desbloquear meu acesso no SCOUT e gostaria de falar com meu gestor/patrocinador.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: '#00ff88',
                            color: '#050505',
                            padding: '10px 18px',
                            borderRadius: '10px',
                            fontWeight: '900',
                            fontSize: '12px',
                            textDecoration: 'none',
                            boxShadow: '0 4px 15px rgba(0,255,136,0.35)'
                          }}
                        >
                          💬 Fale com seu Gestor no WhatsApp →
                        </a>
                      </div>
                    )}

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
                        <h4 style={{ color: '#00ff88', fontSize: '14px', margin: '0 0 6px' }}>Gestores Desbloqueados</h4>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', lineHeight: '1.5', margin: 0 }}>
                          Acompanhe os novos gestores que desbloquearam a plataforma automaticamente via token para acompanhar o crescimento da rede.
                        </p>
                      </div>
                    </div>

                    {!gestorDesbloqueado && (
                      <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.35)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                        <h4 style={{ color: '#fff', fontSize: '15px', margin: '0 0 6px' }}>Pronto para iniciar a sua comunidade?</h4>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '0 0 14px' }}>
                          Responda ao Quiz de Qualificação para registrar seu objetivo e desbloquear seu acesso.
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

              {gestorDesbloqueado && moduloAtivo === 'Apresentação do Negócio' && subModuloAtivo === 'Simulador de Negócio' && (
                <div className="sala-dynamic-card" style={{ border: '1px solid rgba(0, 255, 136, 0.4)', background: 'linear-gradient(135deg, rgba(0,255,136,0.05), rgba(5,5,5,0.98))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                    <div>
                      <span className="eyebrow-sim">Gestão de Comunidade | Modelo de Expansão</span>
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

              {gestorDesbloqueado && moduloAtivo === 'Apresentação do Negócio' && subModuloAtivo === 'Slides do Negócio' && (
                <div className="sala-dynamic-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <span className="sala-eyebrow" style={{ color: '#00ff88' }}>APN INSTITUCIONAL</span>
                      <h3 style={{ fontSize: '20px', margin: '4px 0 2px', color: '#fff' }}>🖼️ Slides da Apresentação do Negócio</h3>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                        Material visual em alta definição para reuniões caseiras ou conferências via Zoom/Google Meet.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href="/assets/apn-ozonteck.pdf"
                        download="APN_Oficial.pdf"
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
                      title="Apresentação de Negócio"
                    />
                  </div>
                </div>
              )}

              {gestorDesbloqueado && moduloAtivo === 'Apresentação do Negócio' && subModuloAtivo === 'Catálogos & Vendas' && (
                <div className="sala-dynamic-card" style={{ border: '1px solid rgba(0, 255, 136, 0.4)', background: 'linear-gradient(135deg, rgba(0,255,136,0.05), rgba(5,5,5,0.98))' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                    <div>
                      <span className="sala-eyebrow" style={{ color: '#00ff88' }}>COMÉRCIO & VENDAS DIRETAS</span>
                      <h3 style={{ fontSize: '22px', margin: '4px 0 2px', color: '#fff' }}>🛍️ Vitrine de Catálogo Unificado & Produtos</h3>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                        Envie o catálogo geral completo em PDF com capa ou utilize a vitrine de itens (1 a 40) para inspecionar e baixar para o atendimento.
                      </p>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '16px', padding: '20px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                      
                      <div style={{ width: '120px', height: '160px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0,255,136,0.3)', background: '#111', flexShrink: 0 }}>
                        <img src="/assets/capa-catalogo-geral.jpg" alt="Capa Catálogo Geral" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>

                      <div style={{ flex: 1, minWidth: '250px' }}>
                        <span style={{ background: 'rgba(0,255,136,0.2)', color: '#00ff88', padding: '3px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', border: '1px solid rgba(0,255,136,0.4)' }}>
                          CATÁLOGO OFICIAL UNIFICADO
                        </span>
                        <h4 style={{ color: '#fff', fontSize: '18px', margin: '6px 0 4px' }}>📁 Catálogo Geral 2026 (PDF Completo)</h4>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '0 0 14px' }}>
                          Conheça a nossa linha completa de produtos e de bem-estar para o seu lar.
                        </p>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <a 
                            href="/assets/catalogo-geral.pdf" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' }}
                          >
                            👁️ Visualizar PDF
                          </a>
                          <button
                            onClick={() => {
                              const urlPdf = `${window.location.origin}/assets/catalogo-geral.pdf`;
                              const textoMensagem = encodeURIComponent(
                                `✨ *Olá! É um prazer falar com você.*\n\nConheça a nossa linha completa de produtos e de bem-estar para o seu lar.\n\n📖 *Confira o Catálogo Oficial Completo:* \n${urlPdf}\n\nEstou à disposição para tirar qualquer dúvida e ajudar no seu pedido! 🌿\n*(Gestor: ${gestor?.nome || 'Ativo'})*`
                              );
                              window.open(`https://wa.me/?text=${textoMensagem}`, '_blank');
                            }}
                            style={{ background: 'linear-gradient(135deg, #00ff88, #00cc6a)', color: '#050505', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,255,136,0.3)' }}
                          >
                            💬 Enviar Catálogo no WhatsApp
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>🎯 Vitrine Rápida por Item (Páginas 1 a 40)</h4>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '16px' }}>
                      Clique na imagem de qualquer item para abrir a janela de inspeção detalhada.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                    {Array.from({ length: 40 }, (_, index) => {
                      const num = index + 1;
                      const imagemSrc = `/assets/produto/imagem%20(${num}).jpg`;

                      return (
                        <div key={num} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '900', color: '#00ff88' }}>ITEM #{num}</span>
                              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>🔍 Inspecionar</span>
                            </div>
                            
                            <div 
                              onClick={() => {
                                const modalEl = document.getElementById('modal-zoom-produto');
                                const imgEl = document.getElementById('img-zoom-preview') as HTMLImageElement;
                                const btnDownload = document.getElementById('btn-download-item') as HTMLAnchorElement;
                                
                                if (modalEl && imgEl && btnDownload) {
                                  imgEl.src = imagemSrc;
                                  modalEl.style.display = 'flex';
                                  btnDownload.href = imagemSrc;
                                  btnDownload.download = `produto-item-${num}.jpg`;
                                }
                              }}
                              style={{ width: '100%', height: '180px', borderRadius: '8px', overflow: 'hidden', background: '#111', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', position: 'relative' }}
                              title="Clique para inspecionar os detalhes"
                            >
                              <img 
                                src={imagemSrc} 
                                alt={`Produto ${num}`} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  const step = target.dataset.step ? parseInt(target.dataset.step) : 0;
                                  if (step === 0) {
                                    target.dataset.step = "1";
                                    target.src = `/assets/produto/imagem(${num}).jpg`;
                                  } else if (step === 1) {
                                    target.dataset.step = "2";
                                    target.src = `/assets/produto/imagem-${num}.jpg`;
                                  } else if (step === 2) {
                                    target.dataset.step = "3";
                                    target.src = `/assets/produto/${num}.jpg`;
                                  } else {
                                    target.style.display = 'none';
                                  }
                                }}
                              />
                            </div>
                          </div>

                          <a
                            href={imagemSrc}
                            download={`produto-item-${num}.jpg`}
                            style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center', display: 'block', transition: 'all 0.2s' }}
                          >
                            📥 Baixar Imagem Item #{num}
                          </a>
                        </div>
                      );
                    })}
                  </div>

                  <div 
                    id="modal-zoom-produto"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        e.currentTarget.style.display = 'none';
                      }
                    }}
                    style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', zIndex: 9999, alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                  >
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '92vh', background: '#111', border: '1px solid rgba(0,255,136,0.4)', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 40px rgba(0,255,136,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }} onClick={(e) => e.stopPropagation()}>
                      
                      <button 
                        onClick={() => {
                          const modalEl = document.getElementById('modal-zoom-produto');
                          if (modalEl) modalEl.style.display = 'none';
                        }}
                        style={{ position: 'absolute', top: '12px', right: '12px', background: '#ff4444', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(255,68,68,0.4)' }}
                        title="Fechar janela"
                      >
                        ✕
                      </button>

                      <div style={{ maxWidth: '80vw', maxHeight: '64vh', overflow: 'auto', display: 'flex', justifyContent: 'center', background: '#050505', borderRadius: '8px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <img 
                          id="img-zoom-preview"
                          src="" 
                          alt="Produto Detalhado" 
                          style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '6px', display: 'block' }} 
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '350px', alignItems: 'center' }}>
                        <a
                          id="btn-download-item"
                          href=""
                          download="produto.jpg"
                          style={{ background: 'linear-gradient(135deg, #00ff88, #00cc6a)', color: '#050505', border: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '900', textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,255,136,0.4)', width: '100%', display: 'block' }}
                        >
                          📥 Baixar Imagem em Alta Resolução
                        </a>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', textAlign: 'center' }}>
                          💡 Dica: Clique com o botão direito na imagem acima e escolha <b>"Copiar imagem"</b>, ou utilize o botão de baixar.
                        </span>
                      </div>

                    </div>
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
                      <span className="sala-eyebrow" style={{ color: '#00ff88' }}>FILOSOFIA & GOVERNANÇA</span>
                      <h2 style={{ fontSize: '22px', color: '#fff', margin: '8px 0 12px' }}>A Relação entre o Livro e a Plataforma</h2>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', marginBottom: '16px' }}>
                        A plataforma <strong>SCOUT</strong> não é apenas uma ferramenta de prospecção; ela é a materialização prática dos conceitos apresentados no livro <em>"O Oleiro e a Argila"</em>. 
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

              {gestorDesbloqueado && moduloAtivo === 'Seu SCOUT' && subModuloAtivo === 'Prospecto Digital' && (
                <div className="sala-dynamic-card">
                  <h3 style={{ fontSize: '20px', margin: '0 0 4px', color: '#fff' }}>Prospecto Digital (Garimpo Inteligente)</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
                    Escolha sua região e selecione o objetivo no menu abaixo para iniciar o garimpo cirúrgico.
                  </p>

                  <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
                    <div>
                      <div style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,0,0,0.5))', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '14px', padding: '16px 18px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px' }}>📊</span>
                          <strong style={{ color: '#00ff88', fontSize: '13px', letterSpacing: '0.5px' }}>
                            MOTOR DE INTELIGÊNCIA TERRITORIAL & DNA DO PERFIL.
                          </strong>
                        </div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.5' }}>
                          O motor cruza a geolocalização com o objetivo escolhido na lista, entregando contatos validados com WhatsApp, redes sociais e resumo analítico pronto para abordagem.
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

                        {/* Substituição da Caixa de Texto por Lista Suspensa (Dropdown) Segura e Organizada */}
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', fontSize: '10px', color: '#00ff88', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '0.5px' }}>
                            🎯 SELECIONE O OBJETIVO DO GARIMPO NA LISTA ABAIXO:
                          </label>
                          <select
                            value={nichoSelecionado}
                            onChange={(e) => setNichoSelecionado(e.target.value)}
                            style={{
                              width: '100%',
                              background: '#050505',
                              border: '1px solid rgba(0,255,136,0.4)',
                              padding: '14px',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              outline: 'none',
                              boxSizing: 'border-box',
                              cursor: 'pointer'
                            }}
                          >
                            <optgroup label="💄 BELEZA, REVENDA & CONSUMO (PESSOAS)">
                              <option value="Pessoas querendo revender cosméticos e ganhar renda extra">Pessoas querendo revender cosméticos e ganhar renda extra</option>
                              <option value="Clientes para comprar maquiagens e perfumes">Clientes para comprar maquiagens e perfumes</option>
                              <option value="Pessoas interessadas em cuidados com a pele (Skincare)">Pessoas interessadas em cuidados com a pele (Skincare)</option>
                              <option value="Consumidoras de produtos para cabelo e tratamento">Consumidoras de produtos para cabelo e tratamento</option>
                              <option value="Donas de casa focadas em produtos para o lar">Donas de casa focadas em produtos para o lar</option>
                            </optgroup>

                            <optgroup label="🏢 COMÉRCIOS E EMPRESAS LOCAIS (CNPJ / PARCERIAS)">
                              <option value="Salões de beleza, esmalterias e clínicas de estética">Salões de beleza, esmalterias e clínicas de estética</option>
                              <option value="Lojas de varejo, comércio local e boutiques de bairro">Lojas de varejo, comércio local e boutiques de bairro</option>
                              <option value="Restaurantes, lanchonetes, bares e panificadoras">Restaurantes, lanchonetes, bares e panificadoras</option>
                              <option value="Escritórios de prestação de serviços (Contabilidade, Advocacia, Imobiliárias)">Escritórios de prestação de serviços (Contabilidade, Advocacia, Imobiliárias)</option>
                              <option value="Pequenas indústrias, oficinas e prestadores técnicos">Pequenas indústrias, oficinas e prestadores técnicos</option>
                            </optgroup>

                            <optgroup label="👨‍💼 PROFISSIONAIS EM BUSCA DE EMPREGO (VAGAS E SELEÇÃO)">
                              <option value="Profissionais da área operacional e produção (Estoque, logística)">Profissionais da área operacional e produção (Estoque, logística)</option>
                              <option value="Profissionais de cozinha, salão e atendimento (Cozinheiros, garçons)">Profissionais de cozinha, salão e atendimento (Cozinheiros, garçons)</option>
                              <option value="Profissionais de vendas, caixa e atendimento ao cliente">Profissionais de vendas, caixa e atendimento ao cliente</option>
                              <option value="Profissionais de beleza, estética e cuidados pessoais">Profissionais de beleza, estética e cuidados pessoais</option>
                              <option value="Profissionais administrativos, escritório e recepção">Profissionais administrativos, escritório e recepção</option>
                              <option value="Profissionais técnicos e especializados (Manutenção, mecânicos)">Profissionais técnicos e especializados (Manutenção, mecânicos)</option>
                            </optgroup>

                            <optgroup label="⚙️ SUPORTE E MANUTENÇÃO">
                              <option value="OUTRO NICHO (Solicitar Manutenção / Suporte)">OUTRO NICHO (Solicitar Manutenção / Suporte)</option>
                            </optgroup>
                          </select>
                        </div>

                        {/* Botão Unificado de Garimpo */}
                        <button
                          type="button"
                          onClick={executarGarimpoUnificado}
                          style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                            color: '#050505',
                            border: 'none',
                            padding: '14px 20px',
                            borderRadius: '12px',
                            fontWeight: '900',
                            fontSize: '13px',
                            cursor: 'pointer',
                            letterSpacing: '0.5px',
                            boxShadow: '0 4px 20px rgba(0,255,136,0.4)',
                            textAlign: 'center',
                          }}
                        >
                          ⚡ EXECUTAR GARIMPO COM DNA DO PERFIL (20 PERFIS + WHATSAPP & REDES)
                        </button>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                          <h4 style={{ fontSize: '14px', color: '#fff', margin: 0 }}>
                            ⚡ Lote Ativo no Banco ({perfisGarimpados.length} Perfis Persistidos com Resumo Analítico)
                          </h4>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                            💡 Cada registro traz o DNA do perfil para orientar sua abordagem
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px', width: '100%', boxSizing: 'border-box' }}>
                          {perfisGarimpados.length === 0 ? (
                            <div style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px dashed rgba(0,255,136,0.2)' }}>
                              Nenhum lote garimpado ativo. Selecione um objetivo na lista acima e execute o garimpo para gerar sua lista inteligente.
                            </div>
                          ) : (
                            perfisGarimpados.map((lead) => {
                              const msgSantinho = encodeURIComponent(`Olá ${lead.nome}! Analisei seu perfil na praça de ${lead.regiao} e gostaria de apresentar uma proposta alinhada ao seu momento. Acesse nossa comunidade: ${linkBaseGestor}`);
                              const linkWhatsSantinho = `https://wa.me/55${lead.whats}?text=${msgSantinho}`;

                              return (
                                <div
                                  key={lead.idRegistro}
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
                                      <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.08)', color: '#2bd9ff', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                                        Gestor: {lead.gestorNome}
                                      </span>
                                      <span style={{ fontSize: '9px', background: 'rgba(255,215,0,0.15)', color: '#ffd700', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                                        Origem: {lead.categoriaOrigem}
                                      </span>
                                    </div>
                                    
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: '6px 0 0', wordBreak: 'break-word' }}>
                                      🎯 <strong>Perfil Alvo:</strong> {lead.perfil}
                                    </p>
                                    
                                    {/* Exibição do DNA do Perfil (Resumo Analítico) */}
                                    <div style={{ background: 'rgba(0,255,136,0.05)', borderLeft: '3px solid #00ff88', padding: '8px 12px', borderRadius: '0 8px 8px 0', marginTop: '8px' }}>
                                      <span style={{ fontSize: '9px', color: '#00ff88', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                                        📌 DNA DO PERFIL / RESUMO DE ABORDAGEM:
                                      </span>
                                      <p style={{ fontSize: '11px', color: '#fff', margin: 0, fontStyle: 'italic', lineHeight: '1.4' }}>
                                        "{lead.resumoAnalitico}"
                                      </p>
                                    </div>

                                    {lead.perfilSocialUrl && (
                                      <p style={{ fontSize: '11px', color: '#2bd9ff', margin: '8px 0 0', wordBreak: 'break-word' }}>
                                        🌐 <strong>Rede Social ({lead.redeSocialOrigem || 'Rede Social'}):</strong> <a href={lead.perfilSocialUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2bd9ff', textDecoration: 'underline' }}>{lead.perfilSocialUrl}</a>
                                      </p>
                                    )}
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
                                      📱 WhatsApp (Validado)
                                    </a>

                                    {lead.perfilSocialUrl && (
                                      <a
                                        href={lead.perfilSocialUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          background: 'rgba(43,217,255,0.15)',
                                          border: '1px solid rgba(43,217,255,0.4)',
                                          color: '#2bd9ff',
                                          fontWeight: 'bold',
                                          fontSize: '11px',
                                          padding: '8px 12px',
                                          borderRadius: '8px',
                                          textDecoration: 'none',
                                          textAlign: 'center',
                                          flex: 1,
                                          minWidth: '130px',
                                        }}
                                      >
                                        🔗 Acessar {lead.redeSocialOrigem || 'Rede'}
                                      </a>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => descartarPerfilIndividual(lead.idRegistro)}
                                      style={{
                                        background: 'rgba(255,68,68,0.18)',
                                        border: '1px solid rgba(255,68,68,0.4)',
                                        color: '#ff4444',
                                        fontWeight: 'bold',
                                        fontSize: '11px',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                      }}
                                    >
                                      🗑️ Descartar
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {gestorDesbloqueado && moduloAtivo === 'Seu SCOUT' && subModuloAtivo === 'Santinho Digital' && (
                <div className="sala-dynamic-card">
                  <span className="sala-eyebrow" style={{ color: '#00ff88' }}>SEU SCOUT · LINK 2</span>
                  <h3 style={{ fontSize: '20px', margin: '8px 0 4px', color: '#fff' }}>Banner Institucional de Atração</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>
                    Sua assinatura visual de impacto para atração unificada ao ecossistema.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(0,255,136,0.3)' }}>
                    <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,255,136,0.3)', textAlign: 'center', padding: '10px' }}>
                      <span style={{ fontSize: '10px', color: '#00ff88', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>BANNER INSTITUCIONAL OFICIAL</span>
                      <img src="/assets/banner-scout.jpg" alt="Banner Scout" style={{ width: '100%', borderRadius: '6px', display: 'block' }} />
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

              {gestorDesbloqueado && moduloAtivo === 'Seu SCOUT' && subModuloAtivo === 'Gestores Desbloqueados' && (
                <div className="sala-dynamic-card">
                  <div style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,0,0,0.6))', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '16px', padding: '18px 20px', marginBottom: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: '#00ff88', color: '#050505', padding: '3px 8px', borderRadius: '6px', fontWeight: '900', fontSize: '10px', letterSpacing: '1px' }}>
                          {isMasterUser ? '👑 PAINEL MASTER' : `👤 GESTOR: ${gestor?.nome?.toUpperCase()}`}
                        </span>
                        <h4 style={{ margin: 0, color: '#fff', fontSize: '15px' }}>
                          Gestores Desbloqueados via Token (Acesso Imediato)
                        </h4>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                      {isMasterUser 
                        ? 'Estes membros desbloquearam o site automaticamente pelo Quiz. Como Master, você visualiza a rede global e o patrocínio de cada membro.'
                        : 'Estes são os novos gestores que entraram através dos seus links e santinhos digitais. Acompanhe o crescimento da sua comunidade em tempo real.'}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '22px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', display: 'block' }}>TOTAL MEMBROS</span>
                      <strong style={{ fontSize: '20px', color: '#fff' }}>{totalLeads}</strong>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', display: 'block' }}>NOVOS</span>
                      <strong style={{ fontSize: '20px', color: '#00ff88' }}>{novosAtendimento}</strong>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', display: 'block' }}>EM ACOMPANHAMENTO</span>
                      <strong style={{ fontSize: '20px', color: '#2bd9ff' }}>{emAtendimentoLeads}</strong>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', display: 'block' }}>CONCLUÍDO</span>
                      <strong style={{ fontSize: '20px', color: '#ffd700' }}>{concluidosLeads}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span className="sala-eyebrow" style={{ color: '#00ff88' }}>RELATÓRIO DE REDE</span>
                      <h3 style={{ fontSize: '18px', margin: '2px 0', color: '#fff' }}>Cadastros de Gestores Desbloqueados</h3>
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
                        🔄 Atualizar Registros
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
                        <option value="todos">👤 Todos os Patrocinadores</option>
                        <option value="sem_gestor">❓ (Sem Patrocinador - Pool Master)</option>
                        {listaGestores.map((g) => (
                          <option key={g.id} value={g.id}>
                            👤 Patrocínio de: {g.nome}
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
                      <option value="todos">Todos os Status</option>
                      <option value="novo">Novo</option>
                      <option value="em_atendimento">Em Acompanhamento</option>
                      <option value="concluido">Concluído</option>
                    </select>
                  </div>

                  {carregandoLeads ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#00ff88', fontSize: '12px' }}>
                      ⚙️ Conectando ao banco de dados e buscando registros...
                    </div>
                  ) : leadsFiltrados.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '12px', border: '1px dashed rgba(0,255,136,0.2)', borderRadius: '14px', background: 'rgba(0,0,0,0.3)' }}>
                      <strong style={{ color: '#fff', display: 'block', fontSize: '14px', marginBottom: '6px' }}>Nenhum gestor desbloqueado encontrado para esse filtro.</strong>
                      Ajuste a busca ou aguarde novos cadastros automáticos via token.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {leadsFiltrados.map((item) => {
                        const convidado = item.dados?.convidado;
                        const whatsClean = convidado?.whatsapp?.replace(/\D/g, '') || '';
                        const statusAtendimento = item.dados?.status_atendimento || 'novo';
                        const perfilSocialUrl = convidado?.perfil_social_url || '';
                        const redeSocialOrigem = convidado?.rede_social_origem || 'Rede Social';
                        const perfilObjetivo = item.dados?.perfil || 'Não informado';
                        
                        const msgWhats = encodeURIComponent(`Olá ${convidado?.nome || ''}, vi que você concluiu o Quiz com o objetivo "${perfilObjetivo}" e desbloqueou o SCOUT! Seja muito bem-vindo à nossa comunidade.`);
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
                                  {convidado?.nome || 'Novo Gestor'}
                                </strong>
                                <span style={{ fontSize: '9px', background: 'rgba(0,255,136,0.15)', color: '#00ff88', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(0,255,136,0.3)', fontWeight: 'bold' }}>
                                  🎯 OBJETIVO: {perfilObjetivo.toUpperCase()}
                                </span>
                                
                                <span style={{ 
                                  fontSize: '9px', 
                                  padding: '2px 8px', 
                                  borderRadius: '10px', 
                                  fontWeight: 'bold', 
                                  background: statusAtendimento === 'concluido' ? 'rgba(255,215,0,0.2)' : statusAtendimento === 'em_atendimento' ? 'rgba(43,217,255,0.2)' : 'rgba(0,255,136,0.2)', 
                                  color: statusAtendimento === 'concluido' ? '#ffd700' : statusAtendimento === 'em_atendimento' ? '#2bd9ff' : '#00ff88' 
                                }}>
                                  {statusAtendimento === 'concluido' ? '✅ CONCLUÍDO' : statusAtendimento === 'em_atendimento' ? '💬 EM ACOMPANHAMENTO' : '🆕 NOVO'}
                                </span>
                              </div>

                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                                <span>📱 WhatsApp: <strong style={{ color: '#00ff88' }}>{convidado?.whatsapp || 'Sem WhatsApp'}</strong></span>
                                <span style={{ color: '#00ff88', fontWeight: 'bold' }}>
                                  📍 {convidado?.cidade || 'Região não informada'}
                                </span>
                                <span>✉️ {convidado?.email || 'Sem e-mail'}</span>
                                <span>📅 {new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                              </div>

                              {perfilSocialUrl && (
                                <div style={{ fontSize: '11px', color: '#2bd9ff', marginTop: '4px' }}>
                                  🌐 <strong>Origem ({redeSocialOrigem}):</strong> <a href={perfilSocialUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2bd9ff', textDecoration: 'underline' }}>{perfilSocialUrl}</a>
                                </div>
                              )}

                              {isMasterUser && (
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
                                    <option value="">(Sem Patrocinador - Pool Master)</option>
                                    {listaGestores.map((g) => (
                                      <option key={g.id} value={g.id}>
                                        {g.nome}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }} className="no-print">
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginRight: '2px' }}>Status:</span>
                                  
                                  <button
                                    onClick={() => atualizarStatusAtendimento(item.id, 'novo')}
                                    style={{ background: statusAtendimento === 'novo' ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,255,136,0.4)', color: '#00ff88', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                  >
                                    🆕 Novo
                                  </button>

                                  <button
                                    onClick={() => atualizarStatusAtendimento(item.id, 'em_atendimento')}
                                    style={{ background: statusAtendimento === 'em_atendimento' ? 'rgba(43,217,255,0.3)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(43,217,255,0.4)', color: '#2bd9ff', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                  >
                                    💬 Em Acompanhamento
                                  </button>

                                  <button
                                    onClick={() => atualizarStatusAtendimento(item.id, 'concluido')}
                                    style={{ background: statusAtendimento === 'concluido' ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,215,0,0.4)', color: '#ffd700', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                  >
                                    ✅ Concluído
                                  </button>

                                  {isMasterUser && (
                                    <button
                                      onClick={() => deletarRegistroMaster(item.id)}
                                      style={{ background: 'rgba(255,68,68,0.18)', border: '1px solid rgba(255,68,68,0.4)', color: '#ff4444', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '6px' }}
                                      title="Excluir definitivo"
                                    >
                                      🗑️ Deletar
                                    </button>
                                  )}
                                </div>

                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
                                      💬 Contatar no WhatsApp (Personalizado)
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
                <div className="sala-dynamic-card" style={{ padding: 0, background: 'transparent', border: '1px solid rgba(0,255,136,0.2)' }}>
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
          <span>SCOUT</span>
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
              <strong>Aguarde a validação do seu Gestor de referência para desbloquear este recurso no atendimento.</strong>
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