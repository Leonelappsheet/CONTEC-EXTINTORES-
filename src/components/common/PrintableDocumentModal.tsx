import React, { useRef, useState, useEffect } from 'react';
import { X, Printer, ShieldAlert, CheckCircle2, Download, Loader2, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Quote, WorkOrder, InstalledEquipment, Customer } from '../../types';
import { formatBRL, formatDateBR, formatCNPJ, formatPhone } from '../../utils/formatters';
import { downloadPdfFromElement, printIsolatedElement, generateQuoteVectorPdf } from '../../utils/pdfExport';

interface PrintableDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'QUOTE' | 'WORK_ORDER' | 'EQUIPMENT_TAG' | 'INVENTORY_REPORT';
  data: any; // Quote | WorkOrder | InstalledEquipment | { customer: Customer; equipments: InstalledEquipment[] }
}

export const PrintableDocumentModal: React.FC<PrintableDocumentModalProps> = ({
  isOpen,
  onClose,
  type,
  data,
}) => {
  const { companyConfig, updateQuote } = useApp();
  const documentPaperRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [customEmissionDate, setCustomEmissionDate] = useState<string>('');
  const [customValidityDate, setCustomValidityDate] = useState<string>('');

  useEffect(() => {
    if (data && type === 'QUOTE') {
      const em = (data as Quote).createdAt ? (data as Quote).createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
      const val = (data as Quote).validityDate ? (data as Quote).validityDate.split('T')[0] : '';
      setCustomEmissionDate(em);
      setCustomValidityDate(val);
    }
  }, [data, type]);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    if (documentPaperRef.current) {
      printIsolatedElement(documentPaperRef.current, 'Documento CONTEC');
    } else {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      if (type === 'QUOTE' && data) {
        const quoteToExport: Quote = {
          ...(data as Quote),
          createdAt: customEmissionDate || (data as Quote).createdAt,
          validityDate: customValidityDate || (data as Quote).validityDate,
        };
        const doc = generateQuoteVectorPdf(quoteToExport, companyConfig);
        const fileName = `Orcamento_${quoteToExport.code || 'CONTEC'}.pdf`;
        doc.save(fileName);
        return;
      }

      if (!documentPaperRef.current) return;
      const title =
        type === 'WORK_ORDER'
          ? `OS_${data.code || 'CONTEC'}`
          : type === 'EQUIPMENT_TAG'
          ? `Etiqueta_${data.patrimonyNumber || 'CONTEC'}`
          : `Inventario_${data.customer?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'CONTEC'}`;
      await downloadPdfFromElement(documentPaperRef.current, `${title}.pdf`);
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs select-none overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto">
        {/* Modal Controls Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {type === 'QUOTE' && 'Visualização de Impressão / PDF do Orçamento'}
              {type === 'WORK_ORDER' && 'Comprovante Oficial de Ordem de Serviço (OS)'}
              {type === 'EQUIPMENT_TAG' && 'Etiqueta Técnica & QR Code do Extintor'}
              {type === 'INVENTORY_REPORT' && 'Relatório Oficial de Inventário de Extintores'}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer"
              title="Salvar arquivo PDF diretamente no computador"
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
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors ml-1 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Paper Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200">
          <div
            ref={documentPaperRef}
            className="max-w-[800px] mx-auto bg-white text-slate-900 shadow-xl border border-slate-300 p-8 sm:p-12 rounded-lg font-sans text-xs print:p-0 print:border-none print:shadow-none"
          >
            {/* Header: CONTEC Official Letterhead */}
            <div className="border-b-2 border-red-600 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3.5">
                {companyConfig.logoUrl ? (
                  <img
                    src={companyConfig.logoUrl}
                    alt={companyConfig.name}
                    className="w-14 h-14 object-contain rounded-lg border border-slate-200 p-1 bg-white shrink-0 shadow-xs"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
                    <ShieldAlert size={28} />
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                    {companyConfig.name}
                  </h1>
                  <p className="text-[11px] font-semibold text-red-600 mt-1 uppercase">
                    Comércio e Manutenção de Equipamentos de Combate a Incêndio
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    CNPJ: {formatCNPJ(companyConfig.cnpj)} · IE: {companyConfig.stateRegistration}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {companyConfig.address}, {companyConfig.neighborhood} · CEP: {companyConfig.zipCode} · {companyConfig.city}-{companyConfig.state}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-[11px] text-slate-600 space-y-0.5">
                <div>WhatsApp/Plantão: <strong>{companyConfig.whatsapp}</strong></div>
                <div>Telefone: {companyConfig.phone}</div>
                <div>Email: {companyConfig.email}</div>
                <div className="text-[10px] text-red-700 font-semibold mt-1">
                  {companyConfig.inmetroAccreditation}
                </div>
              </div>
            </div>

            {/* Document Specific Content */}
            {type === 'QUOTE' && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded border border-slate-200 flex flex-wrap justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Proposta Comercial</span>
                    <span className="text-base font-bold text-slate-900 font-mono">{(data as Quote).code}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Data de Emissão</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold text-slate-800 font-mono text-sm">
                        {formatDateBR(customEmissionDate || (data as Quote).createdAt)}
                      </span>
                      <input
                        type="date"
                        value={customEmissionDate || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomEmissionDate(val);
                          if (data?.id) {
                            updateQuote(data.id, { createdAt: val });
                          }
                        }}
                        className="no-print bg-white hover:bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-700 font-mono focus:outline-none focus:border-red-500 cursor-pointer shadow-2xs"
                        title="Editar data de emissão desta proposta"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Validade da Proposta</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold text-red-600 font-mono text-sm">
                        {formatDateBR(customValidityDate || (data as Quote).validityDate)}
                      </span>
                      <input
                        type="date"
                        value={customValidityDate || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomValidityDate(val);
                          if (data?.id) {
                            updateQuote(data.id, { validityDate: val });
                          }
                        }}
                        className="no-print bg-white hover:bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-700 font-mono focus:outline-none focus:border-red-500 cursor-pointer shadow-2xs"
                        title="Editar data de validade desta proposta"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Consultor Responsável</span>
                    <span className="font-semibold text-slate-800">{(data as Quote).salespersonName}</span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="border border-slate-200 rounded p-4">
                  <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1 uppercase text-[11px]">
                    Dados do Cliente B2B
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Razão Social: </span>
                      <strong>{(data as Quote).customerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">CNPJ / CPF: </span>
                      <strong className="font-mono">{formatCNPJ((data as Quote).customerDocument)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Condições Comerciais: </span>
                      <span>{(data as Quote).paymentTerms}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Prazo de Entrega: </span>
                      <span>{(data as Quote).deliveryDeadline}</span>
                    </div>
                    {Boolean((data as Quote).customerPhone || (data as Quote).contactPerson) && (
                      <div>
                        <span className="text-slate-500">Contato / Fone: </span>
                        <span>{[(data as Quote).contactPerson, (data as Quote).customerPhone].filter(Boolean).join(' · ')}</span>
                      </div>
                    )}
                    {Boolean((data as Quote).deliveryAddress) && (
                      <div>
                        <span className="text-slate-500">Endereço de Atendimento: </span>
                        <span>{(data as Quote).deliveryAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse border border-slate-200 text-left">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-700">
                      <th className="p-2 border border-slate-200">Item / Descrição</th>
                      <th className="p-2 border border-slate-200 text-center w-16">Unid.</th>
                      <th className="p-2 border border-slate-200 text-center w-16">Qtd.</th>
                      <th className="p-2 border border-slate-200 text-right w-24">Vlr. Unit.</th>
                      <th className="p-2 border border-slate-200 text-center w-20">Desc.</th>
                      <th className="p-2 border border-slate-200 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data as Quote).items.map((it: any, index: number) => (
                      <tr key={it.id || index} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-200">
                          <strong className="text-slate-900">{it.productName}</strong>
                          <div className="text-[10px] text-slate-500 font-mono">SKU: {it.sku}</div>
                        </td>
                        <td className="p-2 border border-slate-200 text-center">{it.unit}</td>
                        <td className="p-2 border border-slate-200 text-center font-bold">{it.quantity}</td>
                        <td className="p-2 border border-slate-200 text-right font-mono">{formatBRL(it.unitPrice)}</td>
                        <td className="p-2 border border-slate-200 text-center text-slate-600">{it.discountPercent}%</td>
                        <td className="p-2 border border-slate-200 text-right font-mono font-bold text-slate-900">
                          {formatBRL(it.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Financial Summary */}
                <div className="flex justify-end">
                  <div className="w-64 border border-slate-200 rounded p-3 bg-slate-50 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal Bruto:</span>
                      <span className="font-mono">{formatBRL((data as Quote).subtotal)}</span>
                    </div>
                    {(data as Quote).totalDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Desconto Comercial:</span>
                        <span className="font-mono">- {formatBRL((data as Quote).totalDiscount)}</span>
                      </div>
                    )}
                    {Number((data as Quote).displacementFee || 0) > 0 && (
                      <div className="flex justify-between text-blue-700 font-medium">
                        <span>Taxa de Deslocamento:</span>
                        <span className="font-mono">+ {formatBRL((data as Quote).displacementFee || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-300 pt-2">
                      <span>VALOR TOTAL:</span>
                      <span className="font-mono text-red-700">{formatBRL((data as Quote).totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes and Signatures */}
                {(data as Quote).notes && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                    <strong>Observações / Condições Especiais: </strong> {(data as Quote).notes}
                  </div>
                )}

                <div className="pt-10 grid grid-cols-2 gap-8 text-center text-[11px] text-slate-600">
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-800">CONTEC EXTINTORES LTDA</p>
                    <p>Departamento Técnico Comercial</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-800">{(data as Quote).customerName}</p>
                    <p>De acordo / Aceite do Orçamento</p>
                  </div>
                </div>
              </div>
            )}

            {type === 'WORK_ORDER' && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded border border-slate-200 flex flex-wrap justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Comprovante de OS</span>
                    <span className="text-base font-bold text-slate-900 font-mono">{(data as WorkOrder).code}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tipo de Serviço</span>
                    <span className="font-bold text-red-600">{(data as WorkOrder).type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Data de Execução</span>
                    <span className="font-semibold text-slate-800">
                      {formatDateBR((data as WorkOrder).scheduledDate)} às {(data as WorkOrder).scheduledTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Técnico N3</span>
                    <span className="font-semibold text-slate-800">{(data as WorkOrder).technicianName}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded p-4 text-xs space-y-1">
                  <h3 className="font-bold text-slate-900 uppercase text-[11px]">Cliente Atendido</h3>
                  <p><strong>{(data as WorkOrder).customerName}</strong></p>
                  <p className="text-slate-600">Endereço: {(data as WorkOrder).customerAddress}</p>
                  <p className="text-slate-600">Responsável no Local: {(data as WorkOrder).contactPerson} ({formatPhone((data as WorkOrder).contactPhone)})</p>
                  <p className="pt-1 text-slate-700"><strong>Escopo:</strong> {(data as WorkOrder).serviceDescription}</p>
                </div>

                {/* Inspection Checklist Table */}
                <div>
                  <h4 className="font-bold uppercase text-[11px] text-slate-800 mb-2">Checklist Técnico de Vistoria Normatizada (NBR 12962)</h4>
                  <table className="w-full border-collapse border border-slate-200 text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-bold text-slate-700">
                        <th className="p-2 border border-slate-200">Item Avaliado</th>
                        <th className="p-2 border border-slate-200 text-center w-28">Status</th>
                        <th className="p-2 border border-slate-200">Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data as WorkOrder).checklist.map((c: any) => (
                        <tr key={c.id} className="border-b border-slate-200">
                          <td className="p-2 border border-slate-200">{c.description}</td>
                          <td className="p-2 border border-slate-200 text-center">
                            {c.status === 'CONFORME' ? (
                              <span className="text-emerald-700 font-bold">✓ Conforme</span>
                            ) : c.status === 'NAO_CONFORME' ? (
                              <span className="text-red-700 font-bold">✕ Não Conforme</span>
                            ) : (
                              <span className="text-slate-500">N/A</span>
                            )}
                          </td>
                          <td className="p-2 border border-slate-200 text-slate-500 text-[11px]">{c.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Signature Block */}
                <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[11px]">
                  <div className="border border-slate-200 p-4 rounded bg-slate-50 flex flex-col justify-end">
                    <p className="font-bold text-slate-800">{(data as WorkOrder).technicianName}</p>
                    <p className="text-slate-500 text-[10px]">Técnico de Manutenção N3 · CONTEC EXTINTORES</p>
                  </div>
                  <div className="border border-slate-200 p-4 rounded bg-slate-50 flex flex-col items-center justify-center">
                    {(data as WorkOrder).digitalSignature ? (
                      <div className="mb-2">
                        <img
                          src={(data as WorkOrder).digitalSignature}
                          alt="Assinatura Digital"
                          className="h-14 max-w-full object-contain mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="h-12 border-b border-slate-400 w-3/4 mb-2"></div>
                    )}
                    <p className="font-bold text-slate-800">{(data as WorkOrder).signeeName || (data as WorkOrder).contactPerson}</p>
                    <p className="text-slate-500 text-[10px]">Assinatura do Responsável no Cliente</p>
                  </div>
                </div>
              </div>
            )}

            {type === 'EQUIPMENT_TAG' && (
              <div className="max-w-md mx-auto border-2 border-red-600 rounded-xl p-6 bg-white text-center space-y-4 shadow-sm">
                <div className="flex items-center justify-center gap-2 text-red-600">
                  {companyConfig.logoUrl ? (
                    <img
                      src={companyConfig.logoUrl}
                      alt={companyConfig.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <ShieldAlert size={24} />
                  )}
                  <span className="font-extrabold text-base tracking-tight text-slate-900">CONTEC EXTINTORES</span>
                </div>
                <div className="text-[10px] font-bold text-slate-500">ETIQUETA DE IDENTIFICAÇÃO E RASTREABILIDADE</div>

                {(data as InstalledEquipment).qrCodeUrl && (
                  <img
                    src={(data as InstalledEquipment).qrCodeUrl}
                    alt="QR Code"
                    className="w-40 h-40 mx-auto p-2 bg-white border border-slate-300 rounded-lg shadow-xs"
                  />
                )}

                <div className="space-y-1">
                  <div className="text-sm font-mono font-bold text-slate-900 bg-slate-100 py-1 rounded">
                    PATRIMÔNIO: {(data as InstalledEquipment).patrimonyNumber}
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {(data as InstalledEquipment).agent} {(data as InstalledEquipment).capacity}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {(data as InstalledEquipment).customerName}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Local: {(data as InstalledEquipment).environment}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs">
                  <div className="text-[10px] font-bold text-red-700 uppercase">Validade da Recarga Anual:</div>
                  <div className="text-base font-bold text-red-800 font-mono">
                    {formatDateBR((data as InstalledEquipment).nextMaintenanceDate)}
                  </div>
                </div>

                <div className="text-[9px] text-slate-400">
                  Aponte a câmera do celular para consultar o histórico ou solicitar atendimento imediato da CONTEC: (86) 98134-2832
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
