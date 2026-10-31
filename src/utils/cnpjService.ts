import { formatCNPJ, formatPhone } from './formatters';

export interface CnpjLookupResult {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: string;
  dataInicioAtividade?: string;
  cnaeDescricao?: string;
  segmentoSugerido: string;
  email: string;
  telefone: string;
  contatoResponsavel: string;
  porte: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
}

// Fallback registry for local entities in case of network timeout
const LOCAL_FALLBACKS: Record<string, Partial<CnpjLookupResult>> = {
  '47727069000185': {
    cnpj: '47.727.069/0001-85',
    razaoSocial: 'CONTEC EXTINTORES LTDA',
    nomeFantasia: 'CONTEC EXTINTORES',
    situacaoCadastral: 'ATIVA',
    segmentoSugerido: 'Comércio & Varejo',
    cnaeDescricao: 'Comércio varejista de extintores e equipamentos de proteção contra incêndio',
    email: 'comercial@contecextintores.com.br',
    telefone: '(86) 98134-2832',
    contatoResponsavel: 'Carlos Alberto Mendes',
    porte: 'Microempresa (ME)',
    endereco: {
      logradouro: 'QD 288 CS 04',
      numero: '04',
      bairro: 'Dirceu II',
      municipio: 'Teresina',
      uf: 'PI',
      cep: '64078-352',
    },
  },
};

function inferSegment(cnaeDesc: string = '', razao: string = ''): string {
  const text = (cnaeDesc + ' ' + razao).toLowerCase();
  if (text.includes('farmac') || text.includes('medicament') || text.includes('drog') || text.includes('saude') || text.includes('hospital') || text.includes('clinica')) {
    return 'Saúde & Hospitalar';
  }
  if (text.includes('constru') || text.includes('edific') || text.includes('obra') || text.includes('engenhar') || text.includes('incorpor')) {
    return 'Construção Civil & Obras';
  }
  if (text.includes('combustiv') || text.includes('posto') || text.includes('petrole') || text.includes('gasolin')) {
    return 'Postos de Combustíveis';
  }
  if (text.includes('fabric') || text.includes('industr') || text.includes('metal') || text.includes('alimento') || text.includes('laticin')) {
    return 'Indústria & Fabricação';
  }
  if (text.includes('condomin')) {
    return 'Condomínios Residenciais';
  }
  return 'Comércio & Varejo';
}

export async function fetchCompanyDataByCnpj(rawCnpj: string): Promise<CnpjLookupResult> {
  const cleanCnpj = rawCnpj.replace(/\D/g, '');

  if (cleanCnpj.length !== 14) {
    throw new Error('CNPJ deve conter exatamente 14 dígitos numéricos.');
  }

  // 1. Try public BrasilAPI first (CORS enabled, fast, official open data)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      let phone = '';
      if (data.ddd_telefone_1) {
        phone = formatPhone(data.ddd_telefone_1);
      } else if (data.ddd_telefone_2) {
        phone = formatPhone(data.ddd_telefone_2);
      }

      // Check socios/qsa for contact person
      let contactPerson = '';
      if (data.qsa && data.qsa.length > 0 && data.qsa[0].nome_socio) {
        contactPerson = data.qsa[0].nome_socio;
      }

      const segment = inferSegment(data.cnae_fiscal_descricao, data.razao_social);

      return {
        cnpj: formatCNPJ(data.cnpj || cleanCnpj),
        razaoSocial: data.razao_social || '',
        nomeFantasia: data.nome_fantasia || data.razao_social || '',
        situacaoCadastral: data.descricao_situacao_cadastral || 'ATIVA',
        dataInicioAtividade: data.data_inicio_atividade,
        cnaeDescricao: data.cnae_fiscal_descricao || '',
        segmentoSugerido: segment,
        email: data.email ? data.email.toLowerCase() : '',
        telefone: phone,
        contatoResponsavel: contactPerson,
        porte: data.porte || '',
        endereco: {
          logradouro: [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(' ') || data.logradouro || '',
          numero: data.numero || 'S/N',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          municipio: data.municipio || 'Teresina',
          uf: data.uf || 'PI',
          cep: data.cep ? data.cep.replace(/(\d{5})(\d{3})/, '$1-$2') : '',
        },
      };
    }
  } catch (err) {
    console.warn('BrasilAPI request did not complete, trying secondary fallback...', err);
  }

  // 2. Try secondary open API: minha-receita
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`https://minhareceita.org/${cleanCnpj}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const phone = data.ddd_telefone_1 ? formatPhone(data.ddd_telefone_1) : '';
      const contactPerson = data.qsa && data.qsa.length > 0 ? data.qsa[0].nome_socio : '';
      const segment = inferSegment(data.cnae_fiscal_descricao, data.razao_social);

      return {
        cnpj: formatCNPJ(data.cnpj || cleanCnpj),
        razaoSocial: data.razao_social || '',
        nomeFantasia: data.nome_fantasia || data.razao_social || '',
        situacaoCadastral: data.descricao_situacao_cadastral || 'ATIVA',
        cnaeDescricao: data.cnae_fiscal_descricao || '',
        segmentoSugerido: segment,
        email: data.email ? data.email.toLowerCase() : '',
        telefone: phone,
        contatoResponsavel: contactPerson,
        porte: data.porte || '',
        endereco: {
          logradouro: data.logradouro || '',
          numero: data.numero || 'S/N',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          municipio: data.municipio || 'Teresina',
          uf: data.uf || 'PI',
          cep: data.cep || '',
        },
      };
    }
  } catch (err) {
    console.warn('Secondary API request failed, checking local registry...', err);
  }

  // 3. Check local fallback registry
  if (LOCAL_FALLBACKS[cleanCnpj]) {
    const fb = LOCAL_FALLBACKS[cleanCnpj];
    return {
      cnpj: formatCNPJ(cleanCnpj),
      razaoSocial: fb.razaoSocial || '',
      nomeFantasia: fb.nomeFantasia || fb.razaoSocial || '',
      situacaoCadastral: fb.situacaoCadastral || 'ATIVA',
      cnaeDescricao: fb.cnaeDescricao || '',
      segmentoSugerido: fb.segmentoSugerido || 'Comércio & Varejo',
      email: fb.email || '',
      telefone: fb.telefone || '',
      contatoResponsavel: fb.contatoResponsavel || '',
      porte: fb.porte || '',
      endereco: fb.endereco || {
        logradouro: '',
        numero: '',
        bairro: '',
        municipio: 'Teresina',
        uf: 'PI',
        cep: '',
      },
    };
  }

  throw new Error('Não foi possível obter dados para este CNPJ no momento. Verifique se o número está correto.');
}
