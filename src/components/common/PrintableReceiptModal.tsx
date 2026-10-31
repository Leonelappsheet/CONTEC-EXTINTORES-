import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  X,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Phone,
  Copy,
  FileText,
  Loader2,
  AlertCircle,
  Paperclip,
} from 'lucide-react';
import { PaymentReceipt } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatBRL, formatDateBR, formatCNPJ, formatPaymentMethodLabel, formatReceiptPaymentClause } from '../../utils/formatters';
import {
  downloadReceiptVectorPdf,
  formatReceiptAddress,
  formatReceiptLongDate,
  getReceiptPdfBlob,
  printReceiptHtml,
} from '../../utils/pdfExport';

interface PrintableReceiptModalProps {
  receipt: PaymentReceipt;
  onClose: () => void;
}

export const PrintableReceiptModal: React.FC<PrintableReceiptModalProps> = ({
  receipt,
  onClose,
}) => {
  const { companyConfig } = useApp();
  const receiptPaperRef = useRef<HTMLDivElement>(null);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isProcessingWhatsApp, setIsProcessingWhatsApp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const isParcelado = receipt.paymentMethod === 'PARCELADO';
  const installmentCount = receipt.installmentCount || 2;
  const installmentNumber = receipt.installmentNumber || 1;
  const totalInstallmentAmount = receipt.totalInstallmentAmount || receipt.amount * installmentCount;
  const methodLabel = formatPaymentMethodLabel(
    receipt.paymentMethod,
    installmentNumber,
    installmentCount,
    totalInstallmentAmount
  );
  const paymentClause = formatReceiptPaymentClause(receipt);

  const fullAddress = formatReceiptAddress(receipt.customerAddress);
  const longDateStr = formatReceiptLongDate(
    receipt.paymentDate,
    companyConfig.city,
    companyConfig.state
  );

  const generateWhatsAppMessage = () => {
    return (
      `📄 *COMPROVANTE DE PAGAMENTO & RECIBO OFICIAL*\n` +
      `*${companyConfig.name}*\n` +
      `-----------------------------------------\n` +
      `*Recibo Nº:* ${receipt.receiptNumber}\n` +
      `*Cliente / Pagador:* ${receipt.customerName}\n` +
      `*CNPJ / CPF:* ${formatCNPJ(receipt.customerDocument)}\n` +
      `*Endereço:* ${fullAddress}\n\n` +
      `💰 *Valor Recebido:* ${formatBRL(receipt.amount)}\n` +
      (isParcelado
        ? `*Parcela:* ${installmentNumber}ª de ${installmentCount} (${installmentCount}x de ${formatBRL(receipt.amount)})\n` +
          `*Valor Total a Ser Recebido:* ${formatBRL(totalInstallmentAmount)}\n`
        : '') +
      `*Valor por Extenso:* ${receipt.amountInWords}\n` +
      `*Forma de Pagamento:* ${methodLabel}\n` +
      `*Data da Quitação:* ${formatDateBR(receipt.paymentDate)}\n\n` +
      `*Referente a:*\n${receipt.description}\n` +
      `-----------------------------------------\n` +
      `✅ *Status:* ${isParcelado ? `QUITADO (Parcela ${installmentNumber}/${installmentCount})` : 'QUITADO / PAGO'}\n` +
      `Emitido por: ${companyConfig.name} (CNPJ: ${formatCNPJ(companyConfig.cnpj)})\n` +
      `Plantão WhatsApp: ${companyConfig.whatsapp} | ${companyConfig.city} - ${companyConfig.state}`
    );
  };

  // 1. Download Real Vector PDF (Always succeeds, pure jsPDF)
  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    setStatusMessage(null);

    try {
      downloadReceiptVectorPdf(receipt, companyConfig);
      const safeCustomer = receipt.customerName.replace(/[^a-zA-Z0-9]/g, '_');
      setStatusMessage({
        type: 'success',
        text: `Arquivo "Recibo-${receipt.receiptNumber}-${safeCustomer}.pdf" gerado e baixado com sucesso!`,
      });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setStatusMessage({
        type: 'error',
        text: 'Não foi possível salvar o arquivo PDF. Tente a opção "Imprimir" e selecione "Salvar como PDF".',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // 2. Print via Isolated Standalone Frame (No CSS / OKLCH conflicts)
  const handlePrint = () => {
    setIsPrinting(true);
    setStatusMessage(null);
    try {
      printReceiptHtml(receipt, companyConfig);
      setStatusMessage({
        type: 'info',
        text: 'Janela de impressão A4 iniciada! Selecione sua impressora ou "Salvar como PDF".',
      });
    } catch (err) {
      console.error('Erro ao imprimir:', err);
      window.print();
    } finally {
      setTimeout(() => setIsPrinting(false), 500);
    }
  };

  // 3. Send via WhatsApp with PDF attached
  const handleSendWhatsApp = async () => {
    setIsProcessingWhatsApp(true);
    setStatusMessage(null);

    const cleanPhone = (receipt.customerPhone || companyConfig.whatsapp).replace(/\D/g, '');
    const message = generateWhatsAppMessage();
    const safeCustomer = receipt.customerName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Recibo-${receipt.receiptNumber}-${safeCustomer}.pdf`;

    try {
      // 1. Generate the Vector PDF Blob
      const blob = getReceiptPdfBlob(receipt, companyConfig);
      const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

      // 2. If mobile / browser supports native Web Share with files
      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [pdfFile] })
      ) {
        try {
          await navigator.share({
            title: `Recibo de Pagamento ${receipt.receiptNumber}`,
            text: message,
            files: [pdfFile],
          });
          setStatusMessage({
            type: 'success',
            text: 'Recibo compartilhado com sucesso no WhatsApp!',
          });
          setIsProcessingWhatsApp(false);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setIsProcessingWhatsApp(false);
            return;
          }
          console.warn('Web Share cancelado ou não suportado, usando fluxo WhatsApp Web:', shareErr);
        }
      }

      // 3. Desktop / Web standard workflow:
      // A. Save the PDF to user's device Downloads
      downloadReceiptVectorPdf(receipt, companyConfig);

      // B. Copy text to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(message);
      }

      // C. Open WhatsApp conversation safely
      const encoded = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encoded}`;
      const a = document.createElement('a');
      a.href = whatsappUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setStatusMessage({
        type: 'info',
        text: `📎 O arquivo PDF "${fileName}" foi salvo no seu dispositivo e o WhatsApp foi aberto! Basta clicar no ícone de clipe 📎 no WhatsApp e anexar o arquivo baixado.`,
      });
    } catch (err) {
      console.error('Erro no fluxo de WhatsApp:', err);
      // Fallback simple link
      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, '_blank');
      setStatusMessage({
        type: 'info',
        text: 'Conversa do WhatsApp aberta com os dados do recibo.',
      });
    } finally {
      setIsProcessingWhatsApp(false);
    }
  };

  const handleCopyText = async () => {
    const text = generateWhatsAppMessage();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setStatusMessage({
        type: 'success',
        text: 'Texto formal do recibo copiado para a área de transferência!',
      });
    } catch {
      setStatusMessage({
        type: 'info',
        text: 'Texto pronto para cópia!',
      });
    }
  };

  return (
    <div
      id="printable-receipt-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs select-none print:p-0 print:bg-white print:fixed print:inset-0"
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:border-none print:shadow-none print:rounded-none print:w-full print:bg-white">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-800/95 border-b border-slate-700 gap-3 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Recibo Oficial de Pagamento</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                  {receipt.receiptNumber}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pronto para impressão em folha A4 com logotipo da CONTEC e validade jurídica
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Salvar PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer"
              title="Salvar arquivo PDF diretamente no seu computador ou celular"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Salvar PDF</span>
                </>
              )}
            </button>

            {/* Imprimir */}
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer"
              title="Imprimir Recibo em Folha A4"
            >
              {isPrinting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Preparando...</span>
                </>
              ) : (
                <>
                  <Printer size={14} />
                  <span>Imprimir</span>
                </>
              )}
            </button>

            {/* WhatsApp com anexo de PDF */}
            <button
              onClick={handleSendWhatsApp}
              disabled={isProcessingWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer"
              title="Enviar Recibo pelo WhatsApp do Cliente com PDF anexo"
            >
              {isProcessingWhatsApp ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Preparando PDF...</span>
                </>
              ) : (
                <>
                  <Phone size={14} />
                  <span>WhatsApp</span>
                  <Paperclip size={11} className="opacity-80" />
                </>
              )}
            </button>

            {/* Copiar Texto */}
            <button
              onClick={handleCopyText}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Copiar texto formal do recibo"
            >
              <Copy size={13} />
              <span>Copiar Texto</span>
            </button>

            {/* Fechar */}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors ml-1 cursor-pointer"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Informative Status Banner */}
        {statusMessage && (
          <div
            className={`px-4 py-2.5 text-xs font-medium flex items-center justify-between gap-2 no-print border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
                : statusMessage.type === 'info'
                ? 'bg-blue-950/90 text-blue-200 border-blue-800'
                : 'bg-red-950/90 text-red-200 border-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              ) : statusMessage.type === 'info' ? (
                <Paperclip size={15} className="text-blue-400 shrink-0" />
              ) : (
                <AlertCircle size={15} className="text-red-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white cursor-pointer px-1 text-sm font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Scrollable Printable Paper Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200 print:p-0 print:bg-white print:overflow-visible">
          {/* Printable Element Captured for visual preview and print */}
          <div
            ref={receiptPaperRef}
            className="max-w-[780px] mx-auto bg-white text-slate-900 shadow-xl border border-slate-300 p-6 sm:p-10 rounded-lg font-sans text-xs print:p-6 print:border-none print:shadow-none print:max-w-none print:rounded-none"
          >
            {/* 1. Header with CONTEC Official Logo & Issuer Info */}
            <div className="border-b-2 border-red-600 pb-5 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3.5">
                {/* Logo da CONTEC */}
                {companyConfig.logoUrl ? (
                  <img
                    src={companyConfig.logoUrl}
                    alt={companyConfig.name}
                    className="w-14 h-14 object-contain rounded-lg border border-slate-200 p-1 bg-white shrink-0"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center text-white shadow-md shadow-red-900/20 shrink-0 border border-red-500">
                    <div className="relative flex items-center justify-center">
                      <ShieldAlert size={32} className="stroke-[2.2]" />
                      <Flame size={14} className="absolute text-amber-300 -bottom-1 -right-1" />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-none uppercase">
                      {companyConfig.name}
                    </h1>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                      B2B
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-red-600 mt-1 uppercase tracking-wide">
                    Comércio, Manutenção e Recarga de Extintores de Incêndio
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    <strong>CNPJ:</strong> {formatCNPJ(companyConfig.cnpj)} · <strong>IE:</strong> {companyConfig.stateRegistration}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {companyConfig.address}, {companyConfig.neighborhood} · CEP: {companyConfig.zipCode} · {companyConfig.city}-{companyConfig.state}
                  </p>
                </div>
              </div>

              {/* Contact Info Header */}
              <div className="text-left sm:text-right text-[10px] sm:text-[11px] text-slate-600 space-y-0.5 shrink-0 bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-lg border sm:border-none border-slate-200 w-full sm:w-auto">
                <div>WhatsApp: <strong className="text-slate-900">{companyConfig.whatsapp}</strong></div>
                <div>Telefone: <strong className="text-slate-900">{companyConfig.phone}</strong></div>
                <div>Email: <strong className="text-slate-900">{companyConfig.email}</strong></div>
                <div className="text-[10px] text-red-700 font-bold mt-1 bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-block">
                  {companyConfig.inmetroAccreditation}
                </div>
              </div>
            </div>

            {/* 2. Receipt Identification Title & Amount Box */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 sm:p-5 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    Documento de Quitação Financeira
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Via Única
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">
                  Recibo de Pagamento
                </h2>
                <div className="text-xs font-mono font-bold text-slate-700 mt-0.5">
                  Nº {receipt.receiptNumber}
                </div>
              </div>

              {/* Valor em Destaque */}
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl px-5 py-3 text-left sm:text-right w-full sm:w-auto shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                  {isParcelado ? `Valor Recebido (Parcela ${installmentNumber}/${installmentCount})` : 'Valor Pago (Quitação)'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight block">
                  {formatBRL(receipt.amount)}
                </span>
                <span className="text-[10px] font-bold text-emerald-900 block mt-0.5 uppercase tracking-wide">
                  Forma: {methodLabel}
                </span>
                {isParcelado && (
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded bg-emerald-200/80 text-emerald-950 font-bold text-[10px]">
                    Total da Venda: {formatBRL(totalInstallmentAmount)} ({installmentCount}x de {formatBRL(receipt.amount)})
                  </span>
                )}
              </div>
            </div>

            {/* 3. Corpo Formal do Recibo */}
            <div className="space-y-4 text-slate-800 leading-relaxed text-xs sm:text-sm">
              {/* Declaração de Recebimento */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
                <p className="text-justify text-slate-900">
                  Recebemos de <strong className="font-black text-slate-950 uppercase">{receipt.customerName}</strong>, 
                  inscrito no CNPJ/CPF sob o nº <strong className="font-mono text-slate-950">{formatCNPJ(receipt.customerDocument)}</strong>, 
                  estabelecido(a) no endereço <strong className="text-slate-950">{fullAddress}</strong>, 
                  a quantia líquida e certa de <strong className="font-mono text-emerald-700 font-bold">{formatBRL(receipt.amount)}</strong>{' '}
                  <span className="italic font-semibold text-slate-900">({receipt.amountInWords})</span>
                  {paymentClause}
                  , liquidado na data de <strong>{formatDateBR(receipt.paymentDate)}</strong>.
                </p>

                {/* Discriminação / Referente a */}
                <div className="border-t border-slate-200 pt-3">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                    Referente aos seguintes serviços / fornecimento:
                  </span>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-900 font-medium whitespace-pre-wrap">
                    {receipt.description}
                  </div>
                </div>

                {/* Detalhes de Referência OS ou Pedido */}
                {(receipt.orderNumber || receipt.workOrderCode) && (
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                    {receipt.orderNumber && (
                      <span className="px-2 py-0.5 rounded bg-slate-200/80 font-mono text-[11px] font-semibold text-slate-800">
                        Pedido de Venda: #{receipt.orderNumber}
                      </span>
                    )}
                    {receipt.workOrderCode && (
                      <span className="px-2 py-0.5 rounded bg-slate-200/80 font-mono text-[11px] font-semibold text-slate-800">
                        Ordem de Serviço (OS): #{receipt.workOrderCode}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Status Stamp & Discharge Box */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block uppercase">
                      {isParcelado ? `Quitação da Parcela ${installmentNumber} de ${installmentCount}` : 'Quitação Concluída & Efetivada'}
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      {isParcelado
                        ? `Recebimento da ${installmentNumber}ª parcela de ${installmentCount} (${formatBRL(receipt.amount)}) compensado em ${formatDateBR(receipt.paymentDate)}. Valor total a ser recebido: ${formatBRL(totalInstallmentAmount)}.`
                        : `Pagamento compensado e quitado na data de ${formatDateBR(receipt.paymentDate)}.`}
                    </span>
                  </div>
                </div>

                <div className="rotate-[-3deg] border-2 border-dashed border-emerald-600 text-emerald-800 px-4 py-1.5 rounded-lg font-black text-xs uppercase tracking-widest bg-white shadow-2xs">
                  {isParcelado ? `★ PARCELA ${installmentNumber}/${installmentCount} QUITADA ★` : '★ QUITADO / PAGO ★'}
                </div>
              </div>

              {/* Observações / Notas */}
              {receipt.notes && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-950">
                  <strong className="block text-[10px] uppercase tracking-wider text-amber-900 mb-0.5">
                    Observações:
                  </strong>
                  <span>{receipt.notes}</span>
                </div>
              )}

              {/* Termo de Quitação Formal */}
              <p className="text-[11px] text-slate-600 text-justify pt-1 italic">
                E, por ser verdade e ter recebido o valor citado, firmamos o presente recibo dando plena, geral e irrevogável quitação da quantia paga, para nada mais exigir em relação ao objeto e serviços descritos acima.
              </p>
            </div>

            {/* 4. Local e Data por Extenso */}
            <div className="mt-6 text-right font-medium text-xs sm:text-sm text-slate-800">
              {longDateStr}
            </div>

            {/* 5. Signature Blocks */}
            <div className="mt-10 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center">
              {/* Emitente Signature */}
              <div className="space-y-1">
                <div className="w-56 sm:w-64 mx-auto border-b-2 border-slate-900 pb-1"></div>
                <div className="font-black text-slate-950 uppercase text-xs">
                  {companyConfig.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  CNPJ: {formatCNPJ(companyConfig.cnpj)} · Emitente
                </div>
                <div className="text-[9px] text-slate-400">
                  Departamento Financeiro & Tesouraria
                </div>
              </div>

              {/* Pagador / Cliente Signature */}
              <div className="space-y-1">
                <div className="w-56 sm:w-64 mx-auto border-b-2 border-slate-900 pb-1"></div>
                <div className="font-black text-slate-950 uppercase text-xs truncate max-w-xs mx-auto">
                  {receipt.customerName}
                </div>
                <div className="text-[10px] text-slate-500">
                  CNPJ/CPF: {formatCNPJ(receipt.customerDocument)}
                </div>
                <div className="text-[9px] text-slate-400">
                  Responsável / Pagador
                </div>
              </div>
            </div>

            {/* 6. Footer Legal Authenticity Seal */}
            <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
              <span className="font-mono">
                Autenticação: CONTEC-REC-{receipt.id.toUpperCase()}
              </span>
              <span>
                Documento emitido eletronicamente via Sistema Operacional CONTEC B2B
              </span>
              <span>
                {companyConfig.city} - {companyConfig.state}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
