'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('content')
        .insert([{ title, description }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Conteúdo cadastrado com sucesso!' });
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao cadastrar conteúdo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-bold text-cyan-400">Painel de Administração</h1>
          <p className="text-sm text-neutral-400">Cadastre e gerencie o conteúdo da plataforma CRC.SCOUT</p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                : 'bg-rose-950/50 border-rose-500 text-rose-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-neutral-900/50 p-6 rounded-xl border border-neutral-800">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-cyan-500"
              placeholder="Digite o título do conteúdo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-cyan-500"
              placeholder="Digite a descrição detalhada"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Cadastrar Conteúdo'}
          </button>
        </form>
      </div>
    </div>
  );
}
