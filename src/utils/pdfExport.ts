import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CompanyConfig, PaymentReceipt, Quote } from '../types';
import { formatBRL, formatDateBR, formatCNPJ, formatPhone, formatPaymentMethodLabel, formatReceiptPaymentClause } from './formatters';

/**
 * Formats customer full address into a clean single or multi-line string
 */
export function formatReceiptAddress(a?: PaymentReceipt['customerAddress']): string {
  if (!a) return 'Endereço não informado';
  const parts = [
    a.street ? `${a.street}, Nº ${a.number || 'S/N'}` : '',
    a.complement ? `Compl: ${a.complement}` : '',
    a.neighborhood ? `Bairro: ${a.neighborhood}` : '',
    a.city && a.state ? `${a.city} - ${a.state}` : (a.city || a.state || ''),
    a.zipCode ? `CEP: ${a.zipCode}` : '',
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : 'Endereço comercial em Teresina - PI';
}

/**
 * Returns Brazilian Portuguese long date string (e.g., "Teresina - PI, 26 de outubro de 2026")
 */
export function formatReceiptLongDate(dateStr?: string, city: string = 'Teresina', state: string = 'PI'): string {
  if (!dateStr) return `${city} - ${state}`;
  const date = new Date(dateStr + 'T12:00:00');
  if (isNaN(date.getTime())) return dateStr;
  const months = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];
  return `${city} - ${state}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

/**
 * Generates a 100% Vector, standalone A4 PDF document for Payment Receipts using pure jsPDF commands.
 * Completely immune to modern CSS / OKLCH parser failures, ultra-fast and crisp on all devices.
 */
export function generateReceiptVectorPdf(receipt: PaymentReceipt, companyConfig: CompanyConfig): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 14;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2; // 182mm
  const rightMargin = margin + contentWidth; // 196mm

  // 1. Top Decorative Red Bar (CONTEC Corporate Red)
  doc.setFillColor(220, 38, 38); // #dc2626
  doc.rect(margin, 10, contentWidth, 2.5, 'F');

  // 2. Company Brand Letterhead
  // Logo or CONTEC vector shield
  let hasImage = false;
  if (companyConfig.logoUrl) {
    if (typeof document !== 'undefined') {
      try {
        const domImg = document.querySelector(`img[src="${companyConfig.logoUrl}"]`) as HTMLImageElement | null;
        if (domImg && domImg.complete && domImg.naturalWidth > 0) {
          doc.addImage(domImg, 'PNG', margin, 14, 18, 18);
          hasImage = true;
        }
      } catch (err) {
        console.warn('Could not add DOM logo image to PDF:', err);
      }
    }
    if (!hasImage && companyConfig.logoUrl.startsWith('data:image/')) {
      try {
        const format = companyConfig.logoUrl.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(companyConfig.logoUrl, format, margin, 14, 18, 18);
        hasImage = true;
      } catch {
        hasImage = false;
      }
    }
  }

  if (!hasImage) {
    // Elegant Vector CONTEC Fire Shield
    doc.setFillColor(220, 38, 38);
    doc.roundedRect(margin, 15, 18, 18, 2.5, 2.5, 'F');
    doc.setFillColor(185, 28, 28);
    doc.roundedRect(margin + 1, 16, 16, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('C', margin + 9, 27, { align: 'center' });
  }

  // Company Name & Subtitle
  const textX = margin + 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(companyConfig.name.toUpperCase(), textX, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(220, 38, 38); // red-600
  doc.text('COMÉRCIO, MANUTENÇÃO E RECARGA DE EXTINTORES DE INCÊNDIO', textX, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    `CNPJ: ${formatCNPJ(companyConfig.cnpj)}   |   Inscrição Estadual: ${companyConfig.stateRegistration}`,
    textX,
    28
  );
  doc.text(
    `${companyConfig.address}, ${companyConfig.neighborhood} - CEP: ${companyConfig.zipCode} - ${companyConfig.city}/${companyConfig.state}`,
    textX,
    32
  );

  // Contact info on the right
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`WhatsApp: ${companyConfig.whatsapp}`, rightMargin, 20, { align: 'right' });
  doc.text(`Telefone: ${companyConfig.phone}`, rightMargin, 24, { align: 'right' });
  doc.text(`Email: ${companyConfig.email}`, rightMargin, 28, { align: 'right' });

  // Inmetro Accreditation Pill
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightMargin - 68, 30.5, 68, 5, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(185, 28, 28);
  doc.text(companyConfig.inmetroAccreditation || 'CREDENCIADO INMETRO / CBM-PI', rightMargin - 34, 34, {
    align: 'center',
  });

  // Header bottom divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, 38, rightMargin, 38);

  // 3. Receipt Identification & Quittance Amount Box (y = 42 to 67)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, 42, contentWidth, 25, 2, 2, 'FD');

  // Left Title & Document Badge
  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(254, 202, 202); // red-200
  doc.roundedRect(margin + 4, 45, 66, 4.5, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(185, 28, 28);
  doc.text('DOCUMENTO DE QUITAÇÃO FINANCEIRA · VIA ÚNICA', margin + 6, 48.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('RECIBO DE PAGAMENTO', margin + 4, 56);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(220, 38, 38);
  doc.text(`Nº ${receipt.receiptNumber}`, margin + 4, 62);

  // Right Quittance Amount Card
  const isParcelado = receipt.paymentMethod === 'PARCELADO';
  const installmentCount = receipt.installmentCount || 2;
  const installmentNumber = receipt.installmentNumber || 1;
  const totalInstallmentAmount = receipt.totalInstallmentAmount || receipt.amount * installmentCount;
  const methodLabel = formatPaymentMethodLabel(receipt.paymentMethod, installmentNumber, installmentCount, totalInstallmentAmount);

  const amountBoxW = isParcelado ? 82 : 75;
  const amountBoxX = rightMargin - amountBoxW - 4;
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(0.6);
  doc.roundedRect(amountBoxX, 43.5, amountBoxW, isParcelado ? 22 : 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isParcelado ? 6.5 : 7);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text(
    isParcelado ? `VALOR RECEBIDO (PARCELA ${installmentNumber}/${installmentCount})` : 'VALOR PAGO (QUITAÇÃO)',
    amountBoxX + amountBoxW / 2,
    48,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text(formatBRL(receipt.amount), amountBoxX + amountBoxW / 2, 55, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(4, 120, 87);
  doc.text(`FORMA: ${methodLabel.toUpperCase()}`, amountBoxX + amountBoxW / 2, 60, { align: 'center' });
  if (isParcelado) {
    doc.setFontSize(6);
    doc.text(`TOTAL A RECEBER: ${formatBRL(totalInstallmentAmount)}`, amountBoxX + amountBoxW / 2, 63.5, { align: 'center' });
  }

  // 4. Quittance Body & Customer Information Container (y = 71)
  const bodyY = 71;
  const bodyH = 92;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, bodyY, contentWidth, bodyH, 2, 2, 'FD');

  // Customer declaration paragraph
  const fullAddress = formatReceiptAddress(receipt.customerAddress);
  const paymentClause = formatReceiptPaymentClause(receipt);
  const declarationText = `Recebemos de ${receipt.customerName.toUpperCase()}, inscrito no CNPJ/CPF sob o nº ${formatCNPJ(
    receipt.customerDocument
  )}, estabelecido(a) no endereço ${fullAddress}, a quantia líquida e certa de ${formatBRL(
    receipt.amount
  )} (${receipt.amountInWords})${paymentClause}, liquidado na data de ${formatDateBR(
    receipt.paymentDate
  )}.`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const declarationLines = doc.splitTextToSize(declarationText, contentWidth - 10);
  doc.text(declarationLines, margin + 5, bodyY + 7);

  // Description / Discriminative Section
  const descY = bodyY + 7 + declarationLines.length * 4.2 + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('REFERENTE AOS SEGUINTES SERVIÇOS / FORNECIMENTO:', margin + 5, descY);

  // Description Box
  const descBoxY = descY + 2.5;
  const descBoxH = 20;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + 5, descBoxY, contentWidth - 10, descBoxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const descLines = doc.splitTextToSize(receipt.description || 'Quitação de serviços de extintores', contentWidth - 16);
  doc.text(descLines.slice(0, 4), margin + 8, descBoxY + 5.5);

  // Reference order / OS badges (if available)
  const refsY = descBoxY + descBoxH + 4;
  let hasRefs = false;
  let refOffset = margin + 5;

  if (receipt.orderNumber) {
    hasRefs = true;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(refOffset, refsY, 50, 5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Pedido de Venda: #${receipt.orderNumber}`, refOffset + 25, refsY + 3.5, { align: 'center' });
    refOffset += 54;
  }

  if (receipt.workOrderCode) {
    hasRefs = true;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(refOffset, refsY, 55, 5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Ordem de Serviço (OS): #${receipt.workOrderCode}`, refOffset + 27.5, refsY + 3.5, { align: 'center' });
  }

  // Quittance Status Stamp Box
  const stampY = refsY + (hasRefs ? 9 : 2);
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin + 5, stampY, contentWidth - 10, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 95, 70);
  doc.text(
    isParcelado ? `QUITAÇÃO DA PARCELA ${installmentNumber} DE ${installmentCount}` : 'QUITAÇÃO CONCLUÍDA & EFETIVADA',
    margin + 9,
    stampY + 5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const stampMethodText = isParcelado
    ? `Recebimento da ${installmentNumber}ª parcela de ${installmentCount} (${formatBRL(receipt.amount)}) compensado em ${formatDateBR(receipt.paymentDate)}. Total a receber: ${formatBRL(totalInstallmentAmount)}.`
    : receipt.paymentMethod === 'A_VISTA'
    ? `Pagamento integral à vista compensado e quitado na data de ${formatDateBR(receipt.paymentDate)}.`
    : receipt.paymentMethod && receipt.paymentMethod !== 'A_CRITERIO_CLIENTE'
    ? `Pagamento compensado via ${methodLabel} na data de ${formatDateBR(receipt.paymentDate)}.`
    : `Pagamento compensado e quitado na data de ${formatDateBR(receipt.paymentDate)}.`;
  doc.text(stampMethodText, margin + 9, stampY + 9.5);

  // Right Stamp Seal
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.6);
  doc.roundedRect(rightMargin - 56, stampY + 2, 48, 8, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(5, 150, 105);
  doc.text(
    isParcelado ? `★ PARCELA ${installmentNumber}/${installmentCount} QUITADA ★` : '★ QUITADO / PAGO ★',
    rightMargin - 32,
    stampY + 7.2,
    { align: 'center' }
  );

  // 5. Notes & Legal Discharge Clause
  let nextY = bodyY + bodyH + 5;

  if (receipt.notes) {
    doc.setFillColor(254, 252, 232); // amber-50
    doc.setDrawColor(254, 240, 138); // amber-200
    doc.roundedRect(margin, nextY, contentWidth, 10, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(146, 64, 14);
    doc.text(`OBSERVAÇÕES: ${receipt.notes}`, margin + 4, nextY + 6.2);
    nextY += 14;
  }

  // Legal Term
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const legalText =
    'E, por ser verdade e ter recebido o valor citado, firmamos o presente recibo dando plena, geral e irrevogável quitação da quantia paga, para nada mais exigir em relação ao objeto e serviços descritos acima.';
  const legalLines = doc.splitTextToSize(legalText, contentWidth);
  doc.text(legalLines, margin, nextY + 3);

  // Location & Date
  const dateStr = formatReceiptLongDate(receipt.paymentDate, companyConfig.city, companyConfig.state);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(dateStr, rightMargin, nextY + 12, { align: 'right' });

  // 6. Signatures Section (y = ~208 to 238)
  const sigY = 210;
  const colW = 75;

  // Left Signature: Emitente (CONTEC)
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(margin + 5, sigY, margin + 5 + colW, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(companyConfig.name.toUpperCase(), margin + 5 + colW / 2, sigY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`CNPJ: ${formatCNPJ(companyConfig.cnpj)} · Emitente`, margin + 5 + colW / 2, sigY + 8.5, {
    align: 'center',
  });
  doc.text('Departamento Financeiro & Tesouraria', margin + 5 + colW / 2, sigY + 12, { align: 'center' });

  // Right Signature: Pagador (Cliente)
  const clientSigX = rightMargin - colW - 5;
  doc.line(clientSigX, sigY, clientSigX + colW, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const truncatedCustomer =
    receipt.customerName.length > 32 ? receipt.customerName.substring(0, 30) + '...' : receipt.customerName;
  doc.text(truncatedCustomer.toUpperCase(), clientSigX + colW / 2, sigY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`CNPJ/CPF: ${formatCNPJ(receipt.customerDocument)}`, clientSigX + colW / 2, sigY + 8.5, {
    align: 'center',
  });
  doc.text('Responsável / Pagador', clientSigX + colW / 2, sigY + 12, { align: 'center' });

  // 7. Security Authenticity Seal & Footer (y = 265 to 275)
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, 265, rightMargin, 265);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`AUTENTICAÇÃO: CONTEC-REC-${receipt.id.toUpperCase()}`, margin, 270);

  doc.setFont('helvetica', 'normal');
  doc.text('Documento emitido eletronicamente via Sistema Operacional CONTEC B2B', pageWidth / 2, 270, {
    align: 'center',
  });

  doc.text(`${companyConfig.city} - ${companyConfig.state}`, rightMargin, 270, { align: 'right' });

  return doc;
}

/**
 * Downloads the Vector PDF directly to user's device.
 */
export function downloadReceiptVectorPdf(receipt: PaymentReceipt, companyConfig: CompanyConfig): void {
  const doc = generateReceiptVectorPdf(receipt, companyConfig);
  const safeCustomer = receipt.customerName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Recibo-${receipt.receiptNumber}-${safeCustomer}.pdf`;
  doc.save(fileName);
}

/**
 * Returns the PDF Blob for direct file attachment and Web Share API.
 */
export function getReceiptPdfBlob(receipt: PaymentReceipt, companyConfig: CompanyConfig): Blob {
  const doc = generateReceiptVectorPdf(receipt, companyConfig);
  return doc.output('blob');
}

/**
 * Generates an isolated, standard HTML string for printing.
 * Uses 100% pure standard Hex CSS colors (NO Tailwind OKLCH),
 * ensuring the browser print dialog renders the exact A4 layout perfectly without errors.
 */
export function printReceiptHtml(receipt: PaymentReceipt, companyConfig: CompanyConfig): void {
  try {
    const fullAddress = formatReceiptAddress(receipt.customerAddress);
    const dateStr = formatReceiptLongDate(receipt.paymentDate, companyConfig.city, companyConfig.state);
    const isHtmlParcelado = receipt.paymentMethod === 'PARCELADO';
    const htmlInstallmentCount = receipt.installmentCount || 2;
    const htmlInstallmentNumber = receipt.installmentNumber || 1;
    const htmlTotalAmount = receipt.totalInstallmentAmount || receipt.amount * htmlInstallmentCount;
    const htmlMethodLabel = formatPaymentMethodLabel(receipt.paymentMethod, htmlInstallmentNumber, htmlInstallmentCount, htmlTotalAmount);
    const htmlPaymentClause = formatReceiptPaymentClause(receipt);

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Recibo Oficial ${receipt.receiptNumber} - ${companyConfig.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      padding: 0;
    }
    .receipt-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 24px;
      background: #ffffff;
    }
    .top-bar {
      height: 4px;
      background: #dc2626;
      border-radius: 4px 4px 0 0;
      margin: -24px -24px 20px -24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #dc2626;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .company-title {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: -0.5px;
    }
    .company-subtitle {
      font-size: 10px;
      font-weight: bold;
      color: #dc2626;
      text-transform: uppercase;
      margin-top: 3px;
    }
    .company-info {
      font-size: 10px;
      color: #475569;
      margin-top: 4px;
    }
    .header-contacts {
      text-align: right;
      font-size: 10px;
      color: #334155;
    }
    .inmetro-badge {
      display: inline-block;
      margin-top: 6px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      font-size: 9px;
      font-weight: bold;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .title-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 16px;
    }
    .title-badge {
      font-size: 9px;
      font-weight: bold;
      color: #b91c1c;
      background: #fee2e2;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      display: inline-block;
      margin-bottom: 4px;
    }
    .receipt-title {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
    }
    .receipt-number {
      font-size: 12px;
      font-weight: bold;
      color: #dc2626;
      font-family: monospace;
    }
    .amount-box {
      background: #ecfdf5;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 10px 18px;
      text-align: right;
    }
    .amount-label {
      font-size: 9px;
      font-weight: bold;
      color: #047857;
      text-transform: uppercase;
    }
    .amount-value {
      font-size: 24px;
      font-weight: 900;
      color: #065f46;
      font-family: monospace;
    }
    .amount-method {
      font-size: 10px;
      font-weight: bold;
      color: #047857;
    }
    .declaration-box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      line-height: 1.6;
    }
    .declaration-text {
      text-align: justify;
      color: #1e293b;
      font-size: 12px;
    }
    .desc-box {
      margin-top: 12px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }
    .desc-label {
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }
    .desc-content {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      font-size: 11px;
      white-space: pre-wrap;
    }
    .status-stamp {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
    }
    .stamp-badge {
      border: 2px dashed #059669;
      color: #059669;
      font-weight: 900;
      font-size: 12px;
      padding: 6px 12px;
      border-radius: 6px;
      background: #ffffff;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .notes-box {
      background: #fffbeb;
      border: 1px solid #fef08a;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 11px;
      color: #713f12;
      margin-bottom: 14px;
    }
    .legal-clause {
      font-style: italic;
      color: #64748b;
      font-size: 10px;
      text-align: justify;
      margin-bottom: 14px;
    }
    .date-right {
      text-align: right;
      font-weight: bold;
      font-size: 12px;
      color: #1e293b;
      margin-bottom: 30px;
    }
    .signatures {
      display: flex;
      justify-content: space-around;
      gap: 30px;
      margin-top: 30px;
      text-align: center;
    }
    .sig-col {
      flex: 1;
    }
    .sig-line {
      border-top: 1.5px solid #0f172a;
      margin-bottom: 6px;
      width: 80%;
      margin-left: auto;
      margin-right: auto;
    }
    .sig-title {
      font-weight: 900;
      font-size: 11px;
      text-transform: uppercase;
      color: #0f172a;
    }
    .sig-sub {
      font-size: 9px;
      color: #64748b;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      margin-top: 24px;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="top-bar"></div>
    <div class="header">
      <div style="display: flex; align-items: center; gap: 14px;">
        ${companyConfig.logoUrl ? `
          <img 
            src="${companyConfig.logoUrl}" 
            alt="${companyConfig.name}" 
            style="width: 58px; height: 58px; object-fit: contain; border-radius: 8px; border: 1px solid #cbd5e1; padding: 2px; background: #ffffff; flex-shrink: 0;" 
          />
        ` : ''}
        <div>
          <div class="company-title">${companyConfig.name}</div>
          <div class="company-subtitle">Comércio, Manutenção e Recarga de Extintores de Incêndio</div>
          <div class="company-info">
            CNPJ: ${formatCNPJ(companyConfig.cnpj)} &nbsp;|&nbsp; Inscrição Estadual: ${companyConfig.stateRegistration}<br />
            ${companyConfig.address}, ${companyConfig.neighborhood} - CEP: ${companyConfig.zipCode} - ${companyConfig.city}/${companyConfig.state}
          </div>
        </div>
      </div>
      <div class="header-contacts">
        <div>WhatsApp: <strong>${companyConfig.whatsapp}</strong></div>
        <div>Telefone: ${companyConfig.phone}</div>
        <div>Email: ${companyConfig.email}</div>
        <div class="inmetro-badge">${companyConfig.inmetroAccreditation}</div>
      </div>
    </div>

    <div class="title-banner">
      <div>
        <div class="title-badge">Documento de Quitação Financeira · Via Única</div>
        <div class="receipt-title">Recibo de Pagamento</div>
        <div class="receipt-number">Nº ${receipt.receiptNumber}</div>
      </div>
      <div class="amount-box">
        <div class="amount-label">${isHtmlParcelado ? `Valor Recebido (Parcela ${htmlInstallmentNumber}/${htmlInstallmentCount})` : 'Valor Pago (Quitação)'}</div>
        <div class="amount-value">${formatBRL(receipt.amount)}</div>
        <div class="amount-method">Forma: ${htmlMethodLabel}</div>
        ${isHtmlParcelado ? `<div style="font-size: 9px; font-weight: bold; color: #064e3b; margin-top: 3px;">Total da Venda: ${formatBRL(htmlTotalAmount)} (${htmlInstallmentCount}x de ${formatBRL(receipt.amount)})</div>` : ''}
      </div>
    </div>

    <div class="declaration-box">
      <div class="declaration-text">
        Recebemos de <strong>${receipt.customerName.toUpperCase()}</strong>, inscrito no CNPJ/CPF sob o nº <strong>${formatCNPJ(
      receipt.customerDocument
    )}</strong>, estabelecido(a) no endereço <strong>${fullAddress}</strong>, a quantia líquida e certa de <strong>${formatBRL(
      receipt.amount
    )}</strong> <em>(${receipt.amountInWords})</em>${htmlPaymentClause}, liquidado na data de <strong>${formatDateBR(
      receipt.paymentDate
    )}</strong>.
      </div>

      <div class="desc-box">
        <div class="desc-label">Referente aos seguintes serviços / fornecimento:</div>
        <div class="desc-content">${receipt.description || 'Quitação financeira referente a serviços de extintores.'}</div>
      </div>

      ${
        receipt.orderNumber || receipt.workOrderCode
          ? `<div style="margin-top: 8px; font-size: 10px; color: #475569;">
              ${receipt.orderNumber ? `<span>Pedido de Venda: <strong>#${receipt.orderNumber}</strong></span> &nbsp; ` : ''}
              ${receipt.workOrderCode ? `<span>Ordem de Serviço (OS): <strong>#${receipt.workOrderCode}</strong></span>` : ''}
            </div>`
          : ''
      }
    </div>

    <div class="status-stamp">
      <div>
        <strong style="color: #065f46; font-size: 12px; display: block;">${isHtmlParcelado ? `QUITAÇÃO DA PARCELA ${htmlInstallmentNumber} DE ${htmlInstallmentCount}` : 'QUITAÇÃO CONCLUÍDA & EFETIVADA'}</strong>
        <span style="color: #047857; font-size: 11px;">${
          isHtmlParcelado
            ? `Recebimento da ${htmlInstallmentNumber}ª parcela de ${htmlInstallmentCount} (${formatBRL(receipt.amount)}) compensado em ${formatDateBR(receipt.paymentDate)}. Valor total a ser recebido: ${formatBRL(htmlTotalAmount)}.`
            : receipt.paymentMethod === 'A_VISTA'
            ? `Pagamento integral à vista compensado e quitado na data de ${formatDateBR(receipt.paymentDate)}.`
            : receipt.paymentMethod && receipt.paymentMethod !== 'A_CRITERIO_CLIENTE'
            ? `Pagamento compensado via ${htmlMethodLabel} na data de ${formatDateBR(receipt.paymentDate)}.`
            : `Pagamento compensado e quitado na data de ${formatDateBR(receipt.paymentDate)}.`
        }</span>
      </div>
      <div class="stamp-badge">${isHtmlParcelado ? `★ PARCELA ${htmlInstallmentNumber}/${htmlInstallmentCount} QUITADA ★` : '★ QUITADO / PAGO ★'}</div>
    </div>

    ${
      receipt.notes
        ? `<div class="notes-box">
            <strong>OBSERVAÇÕES:</strong> ${receipt.notes}
          </div>`
        : ''
    }

    <div class="legal-clause">
      E, por ser verdade e ter recebido o valor citado, firmamos o presente recibo dando plena, geral e irrevogável quitação da quantia paga, para nada mais exigir em relação ao objeto e serviços descritos acima.
    </div>

    <div class="date-right">
      ${dateStr}
    </div>

    <div class="signatures">
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-title">${companyConfig.name}</div>
        <div class="sig-sub">CNPJ: ${formatCNPJ(companyConfig.cnpj)} · Emitente</div>
        <div class="sig-sub">Departamento Financeiro & Tesouraria</div>
      </div>
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-title">${receipt.customerName}</div>
        <div class="sig-sub">CNPJ/CPF: ${formatCNPJ(receipt.customerDocument)}</div>
        <div class="sig-sub">Responsável / Pagador</div>
      </div>
    </div>

    <div class="footer">
      <div>AUTENTICAÇÃO: CONTEC-REC-${receipt.id.toUpperCase()}</div>
      <div>Documento emitido eletronicamente via Sistema Operacional CONTEC B2B</div>
      <div>${companyConfig.city} - ${companyConfig.state}</div>
    </div>
  </div>
</body>
</html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print falhou, executando fallback window.print:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1500);
      }
    }, 300);
  } catch (err) {
    console.error('Falha geral no serviço de impressão:', err);
    window.print();
  }
}

/**
 * Robust fallback for printing generic HTML element
 */
export function printIsolatedElement(element: HTMLElement, title: string = 'Documento'): void {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
          </style>
        </head>
        <body>
          <div style="width: 100%; margin: 0 auto;">
            ${element.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        window.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1500);
      }
    }, 400);
  } catch (err) {
    window.print();
  }
}

/**
 * Generates a 100% Vector, standalone A4 PDF document for Commercial Quotes / Proposals using pure jsPDF commands.
 * Renders complete corporate header, client data, full items table, displacement fee, totals, warranty, notes, and signatures.
 */
export function generateQuoteVectorPdf(quote: Quote, companyConfig: CompanyConfig): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 12;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2; // 186mm
  const rightMargin = margin + contentWidth; // 198mm

  // 1. Top Decorative Red Bar
  doc.setFillColor(220, 38, 38); // #dc2626
  doc.rect(margin, 10, contentWidth, 2.5, 'F');

  // 2. Company Brand Letterhead
  let hasImage = false;
  if (typeof document !== 'undefined') {
    try {
      const domImg = document.querySelector('img[src*="extintor"], img[src*="image_3829201b"], img[src*="logo"]') as HTMLImageElement | null;
      if (domImg && domImg.complete && domImg.naturalWidth > 0) {
        doc.addImage(domImg, 'PNG', margin, 14, 18, 18);
        hasImage = true;
      }
    } catch {
      hasImage = false;
    }
  }

  if (!hasImage && companyConfig.logoUrl) {
    if (typeof document !== 'undefined') {
      try {
        const domImg = document.querySelector(`img[src="${companyConfig.logoUrl}"]`) as HTMLImageElement | null;
        if (domImg && domImg.complete && domImg.naturalWidth > 0) {
          doc.addImage(domImg, 'PNG', margin, 14, 18, 18);
          hasImage = true;
        }
      } catch {
        hasImage = false;
      }
    }
    if (!hasImage && companyConfig.logoUrl.startsWith('data:image/')) {
      try {
        const format = companyConfig.logoUrl.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(companyConfig.logoUrl, format, margin, 14, 18, 18);
        hasImage = true;
      } catch {
        hasImage = false;
      }
    }
  }

  if (!hasImage) {
    // Vector CONTEC fire shield fallback
    doc.setFillColor(220, 38, 38);
    doc.roundedRect(margin, 14, 18, 18, 2, 2, 'F');
    doc.setFillColor(185, 28, 28);
    doc.roundedRect(margin + 1, 15, 16, 16, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('C', margin + 9, 26, { align: 'center' });
  }

  const textX = margin + 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(companyConfig.name.toUpperCase(), textX, 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(220, 38, 38); // red-600
  doc.text('COMÉRCIO E MANUTENÇÃO DE EQUIPAMENTOS DE COMBATE A INCÊNDIO', textX, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `CNPJ: ${formatCNPJ(companyConfig.cnpj)}   |   IE: ${companyConfig.stateRegistration}`,
    textX,
    27
  );
  doc.text(
    `${companyConfig.address}, ${companyConfig.neighborhood} - CEP: ${companyConfig.zipCode} - ${companyConfig.city}/${companyConfig.state}`,
    textX,
    31
  );

  // Right Side Contacts
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`WhatsApp/Plantão: ${companyConfig.whatsapp}`, rightMargin, 19, { align: 'right' });
  doc.text(`Telefone: ${companyConfig.phone}`, rightMargin, 23, { align: 'right' });
  doc.text(`Email: ${companyConfig.email}`, rightMargin, 27, { align: 'right' });

  // Inmetro Accreditation Pill
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightMargin - 66, 29.5, 66, 4.5, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(185, 28, 28);
  doc.text(companyConfig.inmetroAccreditation || 'Portaria INMETRO nº 005481/2022 - Registro Ativo', rightMargin - 33, 32.8, {
    align: 'center',
  });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, 36, rightMargin, 36);

  // 3. Document Identification Bar
  let curY = 40;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, contentWidth, 14, 1.5, 1.5, 'FD');

  const colW = contentWidth / 4;
  // Col 1: Proposta Comercial
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PROPOSTA COMERCIAL', margin + 3, curY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(quote.code || 'ORC-CONTEC', margin + 3, curY + 10.5);

  // Col 2: Data de Emissão
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DATA DE EMISSÃO', margin + colW + 3, curY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(formatDateBR(quote.createdAt), margin + colW + 3, curY + 10.5);

  // Col 3: Validade da Proposta
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('VALIDADE DA PROPOSTA', margin + colW * 2 + 3, curY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(220, 38, 38);
  doc.text(formatDateBR(quote.validityDate), margin + colW * 2 + 3, curY + 10.5);

  // Col 4: Consultor Responsável
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CONSULTOR RESPONSÁVEL', margin + colW * 3 + 3, curY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(quote.salespersonName || 'Luciano Lopes', margin + colW * 3 + 3, curY + 10.5);

  curY += 18;

  // 4. Customer Information Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, contentWidth, 23, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DADOS DO CLIENTE B2B', margin + 3, curY + 5);
  doc.setDrawColor(241, 245, 249);
  doc.line(margin + 3, curY + 6.5, rightMargin - 3, curY + 6.5);

  const halfW = contentWidth / 2;
  // Left:
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Razão Social: ', margin + 3, curY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(quote.customerName || 'Cliente Avulso', margin + 22, curY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('CNPJ / CPF: ', margin + 3, curY + 15.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCNPJ(quote.customerDocument), margin + 22, curY + 15.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Endereço: ', margin + 3, curY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const safeAddress = quote.deliveryAddress || 'Conforme cadastro comercial';
  doc.text(safeAddress.length > 55 ? safeAddress.substring(0, 52) + '...' : safeAddress, margin + 22, curY + 20);

  // Right:
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Condições Comerciais: ', margin + halfW, curY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(quote.paymentTerms || 'A combinar', margin + halfW + 31, curY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Prazo de Entrega: ', margin + halfW, curY + 15.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(quote.deliveryDeadline || '3 a 5 dias úteis', margin + halfW + 31, curY + 15.5);

  const contactText = [quote.contactPerson, quote.customerPhone].filter(Boolean).join(' · ');
  if (contactText) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Contato / Fone: ', margin + halfW, curY + 20);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(contactText, margin + halfW + 31, curY + 20);
  }

  curY += 27;

  // 5. Items Table
  const colXItem = margin;
  const colWItem = 90;
  const colXUnid = colXItem + colWItem;
  const colWUnid = 15;
  const colXQtd = colXUnid + colWUnid;
  const colWQtd = 16;
  const colXUnit = colXQtd + colWQtd;
  const colWUnit = 24;
  const colXDesc = colXUnit + colWUnit;
  const colWDesc = 15;
  const colXTot = colXDesc + colWDesc;
  const colWTot = 26;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, curY, contentWidth, 6.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text('ITEM / DESCRIÇÃO DOS SERVIÇOS E PRODUTOS', colXItem + 3, curY + 4.5);
  doc.text('UNID', colXUnid + colWUnid / 2, curY + 4.5, { align: 'center' });
  doc.text('QTD', colXQtd + colWQtd / 2, curY + 4.5, { align: 'center' });
  doc.text('VLR. UNIT.', colXUnit + colWUnit - 2, curY + 4.5, { align: 'right' });
  doc.text('DESC %', colXDesc + colWDesc / 2, curY + 4.5, { align: 'center' });
  doc.text('TOTAL', colXTot + colWTot - 2, curY + 4.5, { align: 'right' });

  curY += 6.5;

  // Items rows
  (quote.items || []).forEach((it, idx) => {
    // Check if new page needed
    if (curY > 245) {
      doc.addPage();
      curY = 20;
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, curY, contentWidth, 6.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      doc.text('ITEM / DESCRIÇÃO (CONTINUAÇÃO)', colXItem + 3, curY + 4.5);
      doc.text('UNID', colXUnid + colWUnid / 2, curY + 4.5, { align: 'center' });
      doc.text('QTD', colXQtd + colWQtd / 2, curY + 4.5, { align: 'center' });
      doc.text('VLR. UNIT.', colXUnit + colWUnit - 2, curY + 4.5, { align: 'right' });
      doc.text('DESC %', colXDesc + colWDesc / 2, curY + 4.5, { align: 'center' });
      doc.text('TOTAL', colXTot + colWTot - 2, curY + 4.5, { align: 'right' });
      curY += 6.5;
    }

    const rowH = 8.5;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, curY, contentWidth, rowH, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, curY + rowH, rightMargin, curY + rowH);

    // Item name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const itemName = it.productName || 'Produto / Serviço CONTEC';
    doc.text(itemName.length > 52 ? itemName.substring(0, 50) + '...' : itemName, colXItem + 3, curY + 4.2);

    if (it.sku) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(`Ref: ${it.sku}`, colXItem + 3, curY + 7.2);
    }

    // Unid
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(it.unit || 'UN', colXUnid + colWUnid / 2, curY + 5.2, { align: 'center' });

    // Qtd
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(it.quantity), colXQtd + colWQtd / 2, curY + 5.2, { align: 'center' });

    // Unit Price
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(formatBRL(it.unitPrice), colXUnit + colWUnit - 2, curY + 5.2, { align: 'right' });

    // Discount
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(it.discountPercent > 0 ? 217 : 100, it.discountPercent > 0 ? 119 : 116, it.discountPercent > 0 ? 6 : 139);
    doc.text(`${it.discountPercent}%`, colXDesc + colWDesc / 2, curY + 5.2, { align: 'center' });

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(formatBRL(it.totalPrice), colXTot + colWTot - 2, curY + 5.2, { align: 'right' });

    curY += rowH;
  });

  curY += 4;

  // 6. Summary Card & Notes
  if (curY > 215) {
    doc.addPage();
    curY = 20;
  }

  const summaryW = 75;
  const summaryX = rightMargin - summaryW;
  const summaryH = Number(quote.displacementFee || 0) > 0 ? 30 : 25;

  // Notes Box on left
  const notesW = contentWidth - summaryW - 5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, notesW, summaryH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('OBSERVAÇÕES COMERCIAIS & GARANTIA', margin + 3, curY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  const notesText = quote.notes || 'Incluso frete e entrega técnica no canteiro/sede do cliente.';
  const splitNotes = doc.splitTextToSize(notesText, notesW - 6);
  doc.text(splitNotes, margin + 3, curY + 9);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Garantia legal de 12 meses conforme normas ABNT NBR 12962 e 15808.', margin + 3, curY + summaryH - 2.5);

  // Financial Summary on right
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(summaryX, curY, summaryW, summaryH, 1.5, 1.5, 'FD');

  let sumY = curY + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal Bruto:', summaryX + 4, sumY);
  doc.text(formatBRL(quote.subtotal), rightMargin - 4, sumY, { align: 'right' });

  if (quote.totalDiscount > 0) {
    sumY += 4.5;
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text('Desconto Comercial:', summaryX + 4, sumY);
    doc.text(`- ${formatBRL(quote.totalDiscount)}`, rightMargin - 4, sumY, { align: 'right' });
  }

  if (Number(quote.displacementFee || 0) > 0) {
    sumY += 4.5;
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text('Taxa de Deslocamento:', summaryX + 4, sumY);
    doc.text(`+ ${formatBRL(quote.displacementFee || 0)}`, rightMargin - 4, sumY, { align: 'right' });
  }

  sumY += 5;
  doc.setDrawColor(226, 232, 240);
  doc.line(summaryX + 4, sumY - 1.5, rightMargin - 4, sumY - 1.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(220, 38, 38); // red-600
  doc.text('VALOR TOTAL:', summaryX + 4, sumY + 3);
  doc.setFontSize(10.5);
  doc.text(formatBRL(quote.totalAmount), rightMargin - 4, sumY + 3.5, { align: 'right' });

  curY += summaryH + 10;

  // 7. Signature & Acceptance Section
  if (curY > 250) {
    doc.addPage();
    curY = 30;
  }

  const sigW = (contentWidth - 10) / 2;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(margin + 5, curY + 12, margin + sigW - 5, curY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('DE ACORDO DO CLIENTE', margin + sigW / 2, curY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(quote.customerName ? (quote.customerName.length > 38 ? quote.customerName.substring(0, 36) + '...' : quote.customerName) : 'Assinatura e Carimbo', margin + sigW / 2, curY + 20, { align: 'center' });

  // CONTEC signature line
  const contecX = margin + sigW + 10;
  doc.line(contecX + 5, curY + 12, rightMargin - 5, curY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('CONTEC EXTINTORES LTDA', contecX + sigW / 2, curY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Consultor: ${quote.salespersonName || 'Luciano Lopes'}`, contecX + sigW / 2, curY + 20, { align: 'center' });

  // 8. Page Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento gerado eletronicamente em ${formatDateBR(quote.createdAt)} · CONTEC Extintores - Portaria INMETRO nº 005481/2022`,
    pageWidth / 2,
    290,
    { align: 'center' }
  );

  return doc;
}

/**
 * Downloads generic document PDF using high-resolution html2canvas capture
 */
export async function downloadPdfFromElement(element: HTMLElement, fileName: string): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const noPrintEls = clonedDoc.querySelectorAll('.no-print');
        noPrintEls.forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
  } catch (err) {
    console.error('Falha ao renderizar PDF por elemento:', err);
    window.print();
  }
}

