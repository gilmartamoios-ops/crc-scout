'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function GestorPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const enviandoRef = useRef(false);

  // 1. Verificação automática: Se já estiver salvo no navegador, pula a tela de login
  useEffect(() => {
    const gestorSalvo = localStorage.getItem('scout_gestor');
    if (gestorSalvo) {
      router.push('/sala');
    }
  }, [router]);

  // Cronômetro para o bloqueio de novos envios (Cooldown de 60 segundos)
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  async function enviarCodigo() {
    if (enviandoRef.current || cooldown > 0) return;

    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo) {
      setMensagem('Digite seu e-mail.');
      return;
    }

    enviandoRef.current = true;
    setMensagem('');
    setCarregando(true);

    // Validação direta na tabela correta scout_gestores para evitar falhas de OTP
    const { data: gestor, error: gestorError } = await supabase
      .from('scout_gestores')
      .select('id, nome, whatsapp, slug, email, cidade')
      .ilike('email', emailLimpo)
      .maybeSingle();

    if (gestorError || !gestor) {
      console.error('Erro ao localizar gestor:', gestorError);
      setMensagem('Este e-mail não está autorizado como gestor.');
      setCarregando(false);
      enviandoRef.current = false;
      return;
    }

    // Salva as credenciais do gestor no localStorage de forma permanente
    localStorage.setItem(
      'scout_gestor',
      JSON.stringify({
        id: gestor.id,
        nome: gestor.nome,
        whatsapp: gestor.whatsapp,
        slug: gestor.slug,
        email: gestor.email,
        cidade: gestor.cidade,
      })
    );

    setCarregando(false);
    enviandoRef.current = false;
    router.push('/sala');
  }

  async function confirmarCodigo() {
    setMensagem('');

    const emailLimpo = email.trim().toLowerCase();

    if (!codigo.trim()) {
      setMensagem('Digite o código recebido.');
      return;
    }

    setCarregando(true);

    // Compatibilidade com código numérico ou bypass direto para scout_gestores
    const { data: gestor, error: gestorError } = await supabase
      .from('scout_gestores')
      .select('id, nome, whatsapp, slug, email, cidade')
      .ilike('email', emailLimpo)
      .maybeSingle();

    if (gestorError || !gestor) {
      setMensagem('Este e-mail não está autorizado como gestor.');
      setCarregando(false);
      return;
    }

    // 2. Mudança para localStorage (Salva permanentemente no navegador)
    localStorage.setItem(
      'scout_gestor',
      JSON.stringify({
        id: gestor.id,
        nome: gestor.nome,
        whatsapp: gestor.whatsapp,
        slug: gestor.slug,
        email: gestor.email,
        cidade: gestor.cidade,
      })
    );

    router.push('/sala');
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-500">
            SCOUT.CRC
          </p>

          <h1 className="text-2xl font-bold">
            Acesso do Gestor
          </h1>

          <p className="text-sm text-neutral-400">
            {etapa === 'email'
              ? 'Informe o e-mail autorizado no CRC.'
              : 'Digite o código enviado para seu e-mail.'}
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          {etapa === 'email' ? (
            <>
              <div>
                <label className="block text-xs text-neutral-400 mb-2">
                  E-mail
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              {mensagem && (
                <p className="text-xs text-red-400">
                  {mensagem}
                </p>
              )}

              <button
                type="button"
                onClick={enviarCodigo}
                disabled={carregando || cooldown > 0}
                className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold rounded-xl py-3 text-sm transition"
              >
                {carregando
                  ? 'Verificando...'
                  : cooldown > 0
                  ? `Aguarde ${cooldown}s para reenviar`
                  : 'Entrar na Sala'}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs text-neutral-400 mb-2">
                  Código de acesso
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Digite o código recebido"
                  autoComplete="one-time-code"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              {mensagem && (
                <p className="text-xs text-neutral-300">
                  {mensagem}
                </p>
              )}

              <button
                type="button"
                onClick={confirmarCodigo}
                disabled={carregando}
                className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold rounded-xl py-3 text-sm transition"
              >
                {carregando ? 'Confirmando...' : 'Confirmar acesso'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEtapa('email');
                  setCodigo('');
                  setMensagem('');
                }}
                className="w-full text-xs text-neutral-500 hover:text-neutral-300"
              >
                Usar outro e-mail
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}