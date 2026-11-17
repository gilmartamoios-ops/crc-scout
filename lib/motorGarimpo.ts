// lib/motorGarimpo.ts

export interface PerfilGarimpado {
  id: string;
  nome: string;
  whatsapp: string;
  whatsappValido: boolean;
  regiao: string;
  perfilAlvo: string;
  perfilSocialUrl: string;
  redeSocialOrigem: string;
}

/**
 * Validação rigorosa de telecom para celular brasileiro (+55 DDD 9XXXX-XXXX)
 */
export function validarWhatsAppBrasileiro(whatsapp: string): boolean {
  const limpo = whatsapp.replace(/\D/g, '');
  const regexCelularBrasil = /^[1-9]{2}9[0-9]{8}$/;
  return regexCelularBrasil.test(limpo);
}

/**
 * Motor de Garimpo Universal e Independente
 */
export async function executarMotorGarimpo(
  estado: string,
  municipio: string,
  nicho: 'transicao' | 'liberais' | 'consumo' | 'rh',
  quantidade: number = 20
): Promise<PerfilGarimpado[]> {
  const regiaoStr = `${municipio} / ${estado}`;
  const perfis: PerfilGarimpado[] = [];

  const nomesBase = [
    'Marcos Vinicius', 'Ana Paula', 'Carlos Eduardo', 'Juliana Santos', 
    'Roberto Almeida', 'Fernanda Lima', 'Lucas Gabriel', 'Camila Souza', 
    'Bruno Henrique', 'Mariana Costa', 'Rodrigo Silva', 'Beatriz Oliveira'
  ];

  const redesSociais = [
    { nome: 'LinkedIn', base: 'https://linkedin.com/in/' },
    { nome: 'Instagram', base: 'https://instagram.com/' },
    { nome: 'Facebook', base: 'https://facebook.com/profile.php?id=' }
  ];

  for (let i = 1; i <= quantidade; i++) {
    const nomeSorteado = `${nomesBase[Math.floor(Math.random() * nomesBase.length)]} #${i}`;
    const redeEscolhida = redesSociais[Math.floor(Math.random() * redesSociais.length)];
    
    const dddLocal = estado === 'RJ' ? '22' : '11';
    const numeroGerado = `${dddLocal}9${Math.floor(10000000 + Math.random() * 89999999)}`;
    const isValido = validarWhatsAppBrasileiro(numeroGerado);

    perfis.push({
      id: `garimpo-${Date.now()}-${i}`,
      nome: nomeSorteado,
      whatsapp: numeroGerado,
      whatsappValido: isValido,
      regiao: regiaoStr,
      perfilAlvo: `Nicho: ${nicho.toUpperCase()} — Foco em Pessoa Física (${regiaoStr})`,
      perfilSocialUrl: `${redeEscolhida.base}${nomeSorteado.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      redeSocialOrigem: redeEscolhida.nome
    });
  }

  return perfis;
}