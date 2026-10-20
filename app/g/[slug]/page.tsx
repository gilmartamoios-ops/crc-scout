import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  params: {
    slug: string;
  };
};

export default async function GestorPublicoPage({ params }: Props) {
  const slug = params.slug.trim().toLowerCase();

  const { data: gestor, error } = await supabase
    .from('gestores')
    .select('id, nome, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
  return (
    <main>
      <h1>ERRO NA CONSULTA</h1>
      <pre>{JSON.stringify(error, null, 2)}</pre>
    </main>
  );
}

if (!gestor) {
  return (
    <main>
      <h1>GESTOR NÃO ENCONTRADO</h1>
      <p>Slug recebido: {slug}</p>
    </main>
  );
}

  return (
  <main>
    <h1>SCOUT.CRC</h1>
    <p>Prospecção vinculada a {gestor.nome}</p>

    <a href={`/?gestor_id=${gestor.id}`}>
      Entrar no SCOUT
    </a>
  </main>
);
}