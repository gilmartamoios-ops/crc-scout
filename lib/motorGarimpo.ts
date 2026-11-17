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
  categoriaOuNicho: string,
  quantidade: number = 20
): Promise<PerfilGarimpado[]> {
  const regiaoStr = `${municipio} / ${estado}`;
  const resultados: PerfilGarimpado[] = [];

  const redesSociaisAlvo = [
    { nomeRede: 'Instagram', urlBase: 'https://instagram.com/contato.' },
    { nomeRede: 'Facebook', urlBase: 'https://facebook.com/perfil.local.' },
    { nomeRede: 'LinkedIn', urlBase: 'https://linkedin.com/in/profissional-' }
  ];

  // Ganchos analíticos adaptados para o contexto popular e de negócios
  const ganchosAnaliticos = [
    `Contato mapeado em ${regiaoStr} com forte aderência para ${categoriaOuNicho}. Perfil receptivo a novas oportunidades na praça.`,
    `Oportunidade qualificada para ${categoriaOuNicho} em ${regiaoStr}. Demonstra engajamento e histórico ativo na região.`,
    `Alvo com fit direto para ${categoriaOuNicho}. Excelente momento para abordagem comercial e apresentação de proposta local.`,
    `Perfil identificado com perfil promissor em ${categoriaOuNicho} (${regiaoStr}). Ideal para contato via WhatsApp com foco em parceria.`
  ];

  for (let index = 0; index < quantidade; index++) {
    const idNum = index + 1;
    const redeEscolhida = redesSociaisAlvo[index % redesSociaisAlvo.length];
    const whatsSimulado = `2299${Math.floor(100000 + Math.random() * 900000)}`;
    const resumoGerado = ganchosAnaliticos[index % ganchosAnaliticos.length];

    resultados.push({
      nome: `Contato Local #${idNum}`,
      whatsapp: whatsSimulado,
      regiao: regiaoStr,
      perfilAlvo: `${categoriaOuNicho} — ${regiaoStr}`,
      perfilSocialUrl: `${redeEscolhida.urlBase}${idNum}-${Math.floor(Math.random() * 1000)}`,
      redeSocialOrigem: redeEscolhida.nomeRede,
      resumoAnalitico: resumoGerado
    });
  }

  return resultados;
}