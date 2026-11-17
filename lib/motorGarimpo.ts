// lib/motorGarimpo.ts

export interface PerfilGarimpado {
  nome: string;
  whatsapp: string;
  regiao: string;
  perfilAlvo: string;
  perfilSocialUrl: string;
  redeSocialOrigem: string;
  resumoAnalitico: string; // O "DNA do Perfil" (Inteligência de Abordagem)
}

export async function executarMotorGarimpo(
  estado: string,
  municipio: string,
  nichoOuSegmento: string,
  quantidade: number = 20
): Promise<PerfilGarimpado[]> {
  const regiaoStr = `${municipio} / ${estado}`;
  const resultados: PerfilGarimpado[] = [];

  const redesSociaisAlvo = [
    { nomeRede: 'LinkedIn', urlBase: 'https://linkedin.com/in/profissional-' },
    { nomeRede: 'Instagram', urlBase: 'https://instagram.com/contato.' },
    { nomeRede: 'Facebook', urlBase: 'https://facebook.com/perfil.local.' }
  ];

  // Textos base para gerar o resumo analítico ("DNA do Perfil") de acordo com o nicho
  const ganchosAnaliticos = [
    `Alvo com forte aderência para ${nichoOuSegmento}. Ativo na praça de ${municipio} com histórico de decisão rápida.`,
    `Perfil identificado com potencial elevado para ${nichoOuSegmento}. Busca soluções práticas e parcerias locais na região.`,
    `Contato mapeado em ${municipio} com fit direto para ${nichoOuSegmento}. Histórico profissional voltado a resultados e expansão.`,
    `Oportunidade qualificada em ${nichoOuSegmento}. Apresenta comportamento engajado e demanda recorrente na praça.`
  ];

  for (let index = 0; index < quantidade; index++) {
    const idNum = index + 1;
    const redeEscolhida = redesSociaisAlvo[index % redesSociaisAlvo.length];
    const whatsSimulado = `2299${Math.floor(100000 + Math.random() * 900000)}`;
    const resumoGerado = ganchosAnaliticos[index % ganchosAnaliticos.length];

    resultados.push({
      nome: `Contato Qualificado #${idNum}`,
      whatsapp: whatsSimulado,
      regiao: regiaoStr,
      perfilAlvo: `${nichoOuSegmento} — ${regiaoStr}`,
      perfilSocialUrl: `${redeEscolhida.urlBase}${idNum}-${Math.floor(Math.random() * 1000)}`,
      redeSocialOrigem: redeEscolhida.nomeRede,
      resumoAnalitico: resumoGerado
    });
  }

  return resultados;
}