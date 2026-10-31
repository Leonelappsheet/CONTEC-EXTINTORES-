import QRCode from 'qrcode';

export async function generateQrCodeDataUrl(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 256,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateBR(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const [year, month, day] = dateString.split('T')[0].split('-');
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

export function formatCNPJ(doc: string): string {
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 14) {
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  if (clean.length === 11) {
    return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  return doc;
}

export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (clean.length === 10) {
    return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
}

export function calculateDaysRemaining(targetDateStr: string): number {
  if (!targetDateStr) return 999;
  const target = new Date(targetDateStr);
  const now = new Date();
  // Strip time for clean day diff
  const utc1 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const utc2 = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export function getExpirationBadge(daysRemaining: number) {
  if (daysRemaining < 0) {
    return {
      level: 'VERMELHO',
      label: `Vencido há ${Math.abs(daysRemaining)} dias`,
      colorClass: 'text-red-700 bg-red-50 border-red-200',
      dotClass: 'bg-red-600',
    };
  }
  if (daysRemaining <= 30) {
    return {
      level: 'LARANJA',
      label: `Vence em ${daysRemaining} dias (Crítico)`,
      colorClass: 'text-orange-700 bg-orange-50 border-orange-200',
      dotClass: 'bg-orange-500',
    };
  }
  if (daysRemaining <= 90) {
    return {
      level: 'AMARELO',
      label: `Vence em ${daysRemaining} dias (Atenção)`,
      colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
      dotClass: 'bg-amber-500',
    };
  }
  return {
    level: 'VERDE',
    label: `Regular (${daysRemaining} dias)`,
    colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    dotClass: 'bg-emerald-600',
  };
}

export function formatPaymentMethodLabel(
  method?: string,
  installmentNumber?: number,
  installmentCount?: number,
  totalInstallmentAmount?: number
): string {
  if (!method) return 'A Critério do Cliente';

  switch (method) {
    case 'PARCELADO': {
      const current = installmentNumber || 1;
      const count = installmentCount || 2;
      const totalPart = totalInstallmentAmount ? ` · Total: ${formatBRL(totalInstallmentAmount)}` : '';
      return `Parcelado (${current}ª de ${count}x${totalPart})`;
    }
    case 'A_VISTA':
      return 'À Vista';
    case 'CARTAO_CREDITO':
      return 'Cartão de Crédito';
    case 'PIX':
      return 'PIX';
    case 'DINHEIRO':
      return 'Dinheiro em Espécie';
    case 'BOLETO':
      return 'Boleto Bancário';
    case 'CARTAO_DEBITO':
      return 'Cartão de Débito';
    case 'TRANSFERENCIA':
      return 'Transferência Bancária / TED';
    case 'A_CRITERIO_CLIENTE':
    default:
      return 'A Critério do Cliente';
  }
}

export function formatReceiptPaymentClause(receipt: {
  paymentMethod?: string;
  installmentNumber?: number;
  installmentCount?: number;
  totalInstallmentAmount?: number;
  amount: number;
}): string {
  if (receipt.paymentMethod === 'PARCELADO') {
    const current = receipt.installmentNumber || 1;
    const count = receipt.installmentCount || 2;
    const totalAmount = receipt.totalInstallmentAmount || receipt.amount * count;
    return `, referente à ${current}ª parcela de ${count} (${count}x de ${formatBRL(receipt.amount)} — com Valor Total de ${formatBRL(totalAmount)} a ser recebido)`;
  }
  if (receipt.paymentMethod === 'A_VISTA') {
    return ', referente a pagamento à vista integral';
  }
  if (receipt.paymentMethod === 'PIX') {
    return ', através de pagamento via PIX';
  }
  if (receipt.paymentMethod === 'CARTAO_CREDITO') {
    return ', através de pagamento no Cartão de Crédito';
  }
  if (receipt.paymentMethod === 'DINHEIRO') {
    return ', em moeda corrente nacional (Dinheiro em Espécie)';
  }
  if (receipt.paymentMethod === 'BOLETO') {
    return ', através de liquidação de Boleto Bancário';
  }
  if (receipt.paymentMethod === 'CARTAO_DEBITO') {
    return ', através de pagamento no Cartão de Débito';
  }
  if (receipt.paymentMethod === 'TRANSFERENCIA') {
    return ', através de Transferência Bancária / TED';
  }
  return ', com forma de pagamento a critério do cliente';
}

