'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface CuradoriaItem {
  id: string;
  titulo: string;
  descricao: string;
  pdf_url?: string;
  video_url?: string;
  publicado_em: string;
}

export default function CuradoriaPage() {
  const [itens, setItens] = useState<CuradoriaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarCuradoria() {
      try {
        const { data, error } = await supabase
          .from('curadoria')
          .select('*')
          .order('publicado_em', { ascending: false });

        if (error || !data || data.length === 0) {
          // Dados demonstrativos exibidos antes do preenchimento no /admin
          setItens([
            {
              id: '1',
              titulo: 'Curadoria Semanal #01 - Ficha Técnica & Oportunidades',
              descricao: 'Análise detalhada do produto em destaque desta semana, modelo de consumo inteligente e lâmina de apoio para a comunidade.',
              pdf_url: '#',
              video_url: '',
              publicado_em: new Date().toISOString()
            }
          ]);
        } else {
          setItens(data);
        }
      } catch {
        // Fallback em caso de indisponibilidade temporária de rede
      } finally {
        setLoading(false);
      }
    }

    carregarCuradoria();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-cyan-500">
          Atualizado Semanalmente
        </span>
        <h1 className="text-xl font-bold text-neutral-100 mt-1">
          Curadoria de Produtos & Fichas Técnicas
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Acesse os produtos selecionados, relatórios de análise e materiais em PDF disponibilizados pela gestão.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-neutral-500 text-sm">
          Carregando materiais de curadoria...
        </div>
      ) : (
        <div className="space-y-4">
          {itens.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 hover:border-neutral-700 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                <h2 className="text-base font-bold text-neutral-100">
                  {item.titulo}
                </h2>
                <span className="text-[10px] text-neutral-500 bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800 w-fit">
                  {new Date(item.publicado_em).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                {item.descricao}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {item.pdf_url && item.pdf_url !== '#' && (
                  <a
                    href={item.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 rounded-xl text-xs font-medium transition"
                  >
                    <span>📄</span> Baixar Ficha Técnica (PDF)
                  </a>
                )}

                {item.video_url && (
                  <a
                    href={item.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-medium transition"
                  >
                    <span>▶️</span> Assistir Explicativo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}