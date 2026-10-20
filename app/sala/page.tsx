'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

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
    status_aprovacao?: 'pendente' | 'acompanhamento' | 'solicitado_master' | 'codigo_liberado' | 'desqualificado' | 'nao_interesse';
    codigo_master?: string;
    origem?: string;
  };
}

const modulos: Modulo[] = [
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
    sublinks: ['Prospecto Digital', 'Santinho Digital', 'Feedback de Prospectos'],
  },
];

const estadosBrasil = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function SalaPage() {
  const [moduloAtivo, setModuloAtivo] = useState<string | null>('Seu SCOUT');
  const [subModuloAtivo, setSubModuloAtivo] = useState<string | null>('Prospecto Digital');
  const [moduloRestrito, setModuloRestrito] = useState<Modulo | null>(null);
  const [gestorDesbloqueado, setGestorDesbloqueado] = useState(false);
  const [modoVisitante, setModoVisitante] = useState(false);

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

  const [estadoSelecionado, setEstadoSelecionado] = useState<string>('RJ');
  const [municipiosDoEstado, setMunicipiosDoEstado] = useState<string[]>([]);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>('Cabo Frio');
  const [carregandoCidades, setCarregandoCidades] = useState<boolean>(false);
  const [nichoPfSelecionado, setNichoPfSelecionado] = useState<'transicao' | 'liberais' | 'consumo'>('transicao');
  const [perfisGarimpados, setPerfisGarimpados] = useState<Array<{ nome: string; perfil: string; regiao: string; whats: string }>>([]);
  const [executouGarimpo, setExecutouGarimpo] = useState<boolean>(false);

  const [leads, setLeads] = useState<ConvidadoRegistro[]>([]);
  const [carregandoLeads, setCarregandoLeads] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [buscaNome, setBuscaNome] = useState<string>('');
  const [buscaRegiao, setBuscaRegiao] = useState<string>('');

  const lidarComCliqueModulo = (modulo: Modulo) => {
    if (!gestorDesbloqueado && !modoVisitante) {
      setModuloRestrito(modulo);
      return;
    }
    setModuloAtivo(modulo.nome);
    if (modulo.sublinks && modulo.sublinks.length > 0) {
      setSubModuloAtivo(modulo.sublinks[0]);
    } else {
      setSubModuloAtivo(null);
    }
  };

  useEffect(() => {
    function verificarSessao() {
      const dados = sessionStorage.getItem('scout_gestor');
      if (!dados) return;

      try {
        const gestorSalvo = JSON.parse(dados);
        if (gestorSalvo?.id && gestorSalvo?.nome) {
          setGestor(gestorSalvo);
          setGestorDesbloqueado(true);
        }
      } catch {
        sessionStorage.removeItem('scout_gestor');
      }
    }

    verificarSessao();
  }, []);

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

  const executarGarimpoTerritorial = () => {
    const regiaoStr = `${municipioSelecionado} / ${estadoSelecionado}`;
    setExecutouGarimpo(true);

    if (nichoPfSelecionado === 'transicao') {
      setPerfisGarimpados([
        { nome: 'Carlos Eduardo', perfil: 'Transição de Carreira (LinkedIn / Adm)', regiao: regiaoStr, whats: '22998877111' },
        { nome: 'Beatriz Lima', perfil: 'Open to Work (LinkedIn / RH)', regiao: regiaoStr, whats: '22988772222' },
        { nome: 'Marcelo Santos', perfil: 'Transição de Carreira (Comercial)', regiao: regiaoStr, whats: '22996655333' },
        { nome: 'Ana Paula', perfil: 'Open to Work (LinkedIn / Finanças)', regiao: regiaoStr, whats: '22995544444' },
      ]);
    } else if (nichoPfSelecionado === 'liberais') {
      setPerfisGarimpados([
        { nome: 'Dra. Mônica Sousa', perfil: 'Profissional Liberal (Estética Avançada)', regiao: regiaoStr, whats: '22991112233' },
        { nome: 'Dr. Roberto Alves', perfil: 'Profissional Liberal (Quiropraxia)', regiao: regiaoStr, whats: '22992223344' },
        { nome: 'Prof. Carla Dias', perfil: 'Educadora Física / Personal Trainer', regiao: regiaoStr, whats: '22993334455' },
      ]);
    } else {
      setPerfisGarimpados([
        { nome: 'Família Mendonça', perfil: 'Consumo Consciente & Economia Doméstica', regiao: regiaoStr, whats: '22991002003' },
        { nome: 'Casal Alvarenga', perfil: 'Busca de Renda Recorrente para o Lar', regiao: regiaoStr, whats: '22992003004' },
        { nome: 'Dona Maria de Lourdes', perfil: 'Consumidora Focada em Longevidade', regiao: regiaoStr, whats: '22993004005' },
      ]);
    }
  };

  const carregarLeadsScout = async () => {
    setCarregandoLeads(true);
    try {
      let query = supabase
        .from('scout_registros')
        .select('*')
        .order('created_at', { ascending: false });

      if (gestor && gestor.slug !== 'master') {
        query = query.eq('gestor_id', gestor.slug || gestor.id);
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
    if (gestorDesbloqueado && moduloAtivo === 'Seu SCOUT' && subModuloAtivo === 'Feedback de Prospectos') {
      carregarLeadsScout();
    }
  }, [gestorDesbloqueado, moduloAtivo, subModuloAtivo]);

  const atualizarStatusLead = async (id: string, novoStatus: 'pendente' | 'acompanhamento' | 'solicitado_master' | 'codigo_liberado' | 'desqualificado' | 'nao_interesse') => {
    const leadAlvo = leads.find((l) => l.id === id);
    if (!leadAlvo) return;

    const novosDados = {
      ...leadAlvo.dados,
      status_aprovacao: novoStatus,
      data_atualizacao_status: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('scout_registros')
      .update({ dados: novosDados })
      .eq('id', id);

    if (error) {
      alert('Erro ao atualizar status do prospecto no banco.');
      return;
    }

    setLeads((anterior) =>
      anterior.map((item) =>
        item.id === id ? { ...item, dados: novosDados } : item
      )
    );
  };

  const linkBaseGestor = `https://crc-scout.vercel.app/?gestor_id=${gestor?.slug || 'master'}`;

  const totalLeads = leads.length;
  const pendentesFila = leads.filter((l) => (l.dados?.status_aprovacao || 'pendente') === 'pendente').length;
  const acompanhamentoLeads = leads.filter((l) => l.dados?.status_aprovacao === 'acompanhamento').length;
  const solicitadosMaster = leads.filter((l) => l.dados?.status_aprovacao === 'solicitado_master').length;
  const codigosLiberados = leads.filter((l) => l.dados?.status_aprovacao === 'codigo_liberado').length;

  const leadsFiltrados = leads.filter((item) => {
    const nome = item.dados?.convidado?.nome?.toLowerCase() || '';
    const regiao = item.dados?.convidado?.cidade?.toLowerCase() || '';
    const status = item.dados?.status_aprovacao || 'pendente';

    const matchesNome = nome.includes(buscaNome.toLowerCase());
    const matchesRegiao = regiao.includes(buscaRegiao.toLowerCase());
    const matchesStatus = filtroStatus === 'todos' || status === filtroStatus;

    return matchesNome && matchesRegiao && matchesStatus;
  });

  return (
    <main className="sala-page">
      <div className="sala-shell">
        <header className="sala-header">
          <div className="sala-brand">
            <div className="sala-brand-mark">CRC</div>
            <div>
              <div className="sala-brand-name">SCOUT.CRC</div>
              <div className="sala-brand-subtitle">
                sala de operações · ambiente operacional
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
                <span>GESTOR · {gestor.nome}</span>
              ) : (
                <button
                  type="button"
                  className="sala-chave-btn"
                  onClick={() => { window.location.href = '/gestor'; }}
                >
                  🔑 Chave do gestor
                </button>
              )}

              <span className="sala-status-dot" />
              AMBIENTE CRC
            </div>
          </div>
        </header>

        <div className="sala-layout">
          {/* Menu Lateral */}
          <aside className="sala-sidebar">
            <div className="sala-sidebar-heading">
              <span>AMBIENTES</span>
              <small>ACESSOS</small>
            </div>

            <nav className="sala-menu">
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
                      <small>{gestorDesbloqueado ? 'acesso de gestor' : '🔒 restrito'}</small>
                    </span>
                    <span className="sala-lock">{gestorDesbloqueado ? '✦' : '⌕'}</span>
                  </button>

                  {(gestorDesbloqueado || modoVisitante) && modulo.sublinks && moduloAtivo === modulo.nome && (
                    <div className="sala-sublinks">
                      {modulo.sublinks.map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          className={`sala-sublink-btn ${subModuloAtivo === sub ? 'active' : ''}`}
                          onClick={() => setSubModuloAtivo(sub)}
                        >
                          ↳ {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {modoVisitante && !gestorDesbloqueado && (
              <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  onClick={() => { window.location.href = '/gestor'; }}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #00ff88 0%, #00bfff 100%)',
                    color: '#0a0f1d',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  🚀 QUERO MEU SCOUT
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
