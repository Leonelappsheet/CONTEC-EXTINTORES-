/**
 * Serviço de Consulta de CNPJ na Receita Federal via BrasilAPI
 * Permite autocompletar Razão Social, Nome Fantasia e Endereço Completo em 1 clique.
 */

export interface CnpjLookupResult {
  name: string;
  tradeName?: string;
  document: string;
  phone?: string;
  email?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export async function fetchCnpjData(rawCnpj: string): Promise<CnpjLookupResult> {
  const clean = rawCnpj.replace(/\D/g, '');

  if (clean.length !== 14) {
    throw new Error('CNPJ deve conter exatamente 14 dígitos numéricos.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('CNPJ não encontrado na base de dados da Receita Federal.');
      }
      throw new Error(`Falha na consulta do CNPJ (Código: ${response.status}).`);
    }

    const data = await response.json();

    const formattedCep = data.cep
      ? data.cep.replace(/^(\d{5})(\d{3})/, '$1-$2')
      : '';

    let phone = '';
    if (data.ddd_telefone_1) {
      const p = data.ddd_telefone_1.replace(/\D/g, '');
      if (p.length === 10) {
        phone = `(${p.slice(0, 2)}) ${p.slice(2, 6)}-${p.slice(6)}`;
      } else if (p.length === 11) {
        phone = `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}`;
      } else {
        phone = data.ddd_telefone_1;
      }
    }

    return {
      name: data.razao_social || data.nome_fantasia || '',
      tradeName: data.nome_fantasia || data.razao_social || '',
      document: clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'),
      phone,
      email: data.email ? data.email.toLowerCase() : '',
      address: {
        street: data.logradouro ? `${data.descricao_tipo_de_logradouro || ''} ${data.logradouro}`.trim() : '',
        number: data.numero || 'S/N',
        complement: data.complemento || '',
        neighborhood: data.bairro || '',
        city: data.municipio || '',
        state: data.uf || '',
        zipCode: formattedCep,
      },
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Tempo limite excedido ao consultar a base da Receita Federal. Preencha manualmente.');
    }
    throw new Error(err.message || 'Erro ao consultar CNPJ.');
  }
}
