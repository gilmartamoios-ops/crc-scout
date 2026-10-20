
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function GestorPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const enviandoRef = useRef(false);

    async function enviarCodigo() {
    if (enviandoRef.current) return;

    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo) {
      setMensagem('Digite seu e-mail.');
      return;
    }

    enviandoRef.current = true;
    console.log('SCOUT — enviarCodigo foi executada');

    setMensagem('');
    setCarregando(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: emailLimpo,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: 'https://crc-scout.vercel.app/gestor',
      },
    });

    if (error) {
      console.error('Erro ao enviar código:', error);
      setMensagem('Não foi possível enviar o código de acesso.');
      setCarregando(false);
      enviandoRef.current = false;
      return;
    }

    setMensagem('Código enviado para seu e-mail.');
    setEtapa('codigo');
    setCarregando(false);
    enviandoRef.current = false;
  }
  async function confirmarCodigo() {
    setMensagem('');

    const emailLimpo = email.trim().toLowerCase();

    if (!codigo.trim()) {
      setMensagem('Digite o código recebido.');
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email: emailLimpo,
      token: codigo.trim(),
      type: 'email',
    });

    if (error || !data.session) {
      console.error('Erro ao confirmar código:', error);
      setMensagem('Código inválido ou expirado.');
      setCarregando(false);
      return;
    }

    const { data: gestor, error: gestorError } = await supabase
      .from('gestores')
      .select('id, nome, whatsapp, slug, email')
      .ilike('email', emailLimpo)
      .maybeSingle();

    if (gestorError) {
      console.error('Erro ao localizar gestor:', gestorError);
      await supabase.auth.signOut();
      setMensagem('Não foi possível confirmar o cadastro do gestor.');
      setCarregando(false);
      return;
    }

    if (!gestor) {
      await supabase.auth.signOut();
      setMensagem('Este e-mail não está autorizado como gestor.');
      setCarregando(false);
      return;
    }

    sessionStorage.setItem(
      'scout_gestor',
      JSON.stringify({
        id: gestor.id,
        nome: gestor.nome,
        whatsapp: gestor.whatsapp,
        slug: gestor.slug,
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
                disabled={carregando}
                className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold rounded-xl py-3 text-sm transition"
              >
                {carregando ? 'Enviando...' : 'Enviar código'}
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




