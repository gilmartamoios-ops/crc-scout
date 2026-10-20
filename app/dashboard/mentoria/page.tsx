'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface MentoriaItem {
  id: string;
  titulo: string;
  youtube_url: string;
  modulo: string;
  pdf_apoio_url?: string;
  criado_em: string;
}

export default function MentoriaPage() {
  const [mentorias, setMentorias] = useState<MentoriaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Converte URLs padrao do YouTube para formato Embed sem distrações
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
  };

  useEffect(() => {
    async function carregarMentorias() {
      try {
        const { data, error } = await supabase
          .from('mentorias')
          .select('*')
          .order('criado_em', { ascending: false });

        if (error || !data || data.length === 0) {
          // Dados demonstrativos exibidos antes do preenchimento via /admin
          setMentorias([
            {
              id: '1',
              titulo: 'Mentoria #01 - Princípios da Rede e Consumo Inteligente',
              youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              modulo: 'Módulo 01: Fundamentos da Comunidade',
              pdf_apoio_url: '#',
              criado_em: new Date().toISOString()
            }
          ]);
        } else {
          setMentorias(data);
        }
      } catch {
        // Fallback em caso de indisponibilidade de rede
      } finally {
        setLoading(false);
      }
    }

    carregarMentorias();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-cyan-500">
          Gestão de Comunidade
        </span>
        <h1 className="text-xl font-bold text-neutral-100 mt-1">
          Trilha de Mentoria e Formação
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Assista às mentorias do nosso canal do YouTube sem distrações externas, acompanhadas do material de apoio.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-neutral-500 text-sm">
          Carregando módulos de mentoria...
        </div>
      ) : (
        <div className="space-y-6">
          {mentorias.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 hover:border-neutral-700 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded-md">
                    {item.modulo}
                  </span>
                  <h2 className="text-base font-bold text-neutral-100 mt-2">
                    {item.titulo}
                  </h2>
                </div>
                <span className="text-[10px] text-neutral-500 bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800 w-fit">
                  {new Date(item.criado_em).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* Player do YouTube Embutido */}
              <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
                <iframe
                  src={getEmbedUrl(item.youtube_url)}
                  title={item.titulo}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {item.pdf_apoio_url && item.pdf_apoio_url !== '#' && (
                <div className="pt-1">
                  <a
                    href={item.pdf_apoio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 rounded-xl text-xs font-medium transition"
                  >
                    <span>📚</span> Material de Apoio em PDF
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
