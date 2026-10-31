/**
 * Utilitário para conversão de valores monetários (BRL) em texto por extenso em português.
 * Exemplo: 1540.50 -> "Um mil e quinhentos e quarenta reais e cinquenta centavos"
 */

const UNIDADES = [
  '',
  'um',
  'dois',
  'três',
  'quatro',
  'cinco',
  'seis',
  'sete',
  'oito',
  'nove',
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
];

const DEZENAS = [
  '',
  '',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
];

const CENTENAS = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
];

function converterGrupo(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';

  const c = Math.floor(n / 100);
  const resto = n % 100;
  const d = Math.floor(resto / 10);
  const u = resto % 10;

  const partes: string[] = [];

  if (c > 0) partes.push(CENTENAS[c]);

  if (resto > 0) {
    if (resto < 20) {
      partes.push(UNIDADES[resto]);
    } else {
      if (d > 0) partes.push(DEZENAS[d]);
      if (u > 0) partes.push(UNIDADES[u]);
    }
  }

  return partes.join(' e ');
}

export function numberToWordsBRL(valor: number): string {
  if (!valor || isNaN(valor) || valor <= 0) {
    return 'Zero reais';
  }

  // Limita até 999.999.999,99 para segurança
  const valorFormatado = Math.min(valor, 999999999.99);
  const parteInteira = Math.floor(valorFormatado);
  const centavos = Math.round((valorFormatado - parteInteira) * 100);

  const milhoes = Math.floor(parteInteira / 1000000);
  const milhares = Math.floor((parteInteira % 1000000) / 1000);
  const unidades = parteInteira % 1000;

  const partesTexto: string[] = [];

  if (milhoes > 0) {
    if (milhoes === 1) {
      partesTexto.push('um milhão');
    } else {
      partesTexto.push(`${converterGrupo(milhoes)} milhões`);
    }
  }

  if (milhares > 0) {
    if (milhares === 1) {
      partesTexto.push('um mil');
    } else {
      partesTexto.push(`${converterGrupo(milhares)} mil`);
    }
  }

  if (unidades > 0) {
    partesTexto.push(converterGrupo(unidades));
  }

  let resultado = '';

  if (parteInteira === 0) {
    resultado = '';
  } else if (parteInteira === 1) {
    resultado = `${partesTexto.join(' e ')} real`;
  } else {
    // Ajusta conjunção "e"
    const textoReais = partesTexto.join(' e ');
    resultado = `${textoReais} reais`;
  }

  if (centavos > 0) {
    const textoCentavos = converterGrupo(centavos);
    const sufCentavos = centavos === 1 ? 'centavo' : 'centavos';
    if (parteInteira > 0) {
      resultado += ` e ${textoCentavos} ${sufCentavos}`;
    } else {
      resultado = `${textoCentavos} ${sufCentavos} de real`;
    }
  }

  // Capitaliza a primeira letra
  if (resultado.length > 0) {
    resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);
  }

  return resultado;
}
