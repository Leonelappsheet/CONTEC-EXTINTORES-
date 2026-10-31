import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  Phone,
  MessageSquare,
  FileText,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Shield,
  Send,
  Edit3,
  User,
  MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Customer, InstalledEquipment } from '../types';
import {
  calculateDaysRemaining,
  getExpirationBadge,
  formatDateBR,
  formatPhone,
  formatCNPJ,
} from '../utils/formatters';

interface RenewalsAlertViewProps {
  onOpenWorkOrderForEquipment: (eq: InstalledEquipment) => void;
  onSelectModule: (module: string) => void;
}

export const RenewalsAlertView: React.FC<RenewalsAlertViewProps> = ({
  onOpenWorkOrderForEquipment,
  onSelectModule,
}) => {
  const { customers, equipments, companyConfig } = useApp();

  const [customMessageTemplate, setCustomMessageTemplate] = useState(
    'Olá! Aqui é da CONTEC EXTINTORES (Teresina-PI). Identificamos que alguns equipamentos da sua empresa estão no período de renovação de manutenção e recarga. Gostaríamos de verificar a melhor data para atendimento técnico.'
  );
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [selectedCustomerToContact, setSelectedCustomerToContact] = useState<Customer | null>(null);

  // Group and rank clients by urgency
  const rankedClients = customers.map((cust) => {
    const custEquipments = equipments.filter((e) => e.customerId === cust.id);
    const expiredList = custEquipments.filter((e) => calculateDaysRemaining(e.nextMaintenanceDate) < 0);
    const urgentList = custEquipments.filter((e) => {
      const d = calculateDaysRemaining(e.nextMaintenanceDate);
      return d >= 0 && d <= 30;
    });
    const attentionList = custEquipments.filter((e) => {
      const d = calculateDaysRemaining(e.nextMaintenanceDate);
      return d > 30 && d <= 90;
    });

    // Score: Expired has highest weight, then urgent <=30d, then attention <=90d
    let score = 0;
    if (expiredList.length > 0) score += 1000 + expiredList.length * 10;
    if (urgentList.length > 0) score += 100 + urgentList.length * 5;
    if (attentionList.length > 0) score += attentionList.length;

    // Minimum days remaining in fleet
    const allDays = custEquipments.map((e) => calculateDaysRemaining(e.nextMaintenanceDate));
    const minDays = allDays.length > 0 ? Math.min(...allDays) : 999;

    return {
      customer: cust,
      totalEquipments: custEquipments.length,
      expiredList,
      urgentList,
      attentionList,
      score,
      minDays,
    };
  })
  .filter((item) => item.expiredList.length > 0 || item.urgentList.length > 0 || item.attentionList.length > 0)
  .sort((a, b) => b.score - a.score || a.minDays - b.minDays);

  const handleSendWhatsApp = (cust: Customer, minDays: number, totalExpiring: number) => {
    const cleanPhone = cust.whatsapp ? cust.whatsapp.replace(/\D/g, '') : '86981342832';
    const urgency =
      minDays < 0
        ? `constatamos que existem ${totalExpiring} extintor(es) com validade VENCIDA`
        : `identificamos ${totalExpiring} extintor(es) vencendo nos próximos ${minDays} dias`;

    const fullMessage =
      `Olá, ${cust.contactPerson}! Aqui é da *CONTEC EXTINTORES* (Teresina-PI).\n\n` +
      `No controle de segurança da *${cust.name}*, ${urgency}.\n\n` +
      `${customMessageTemplate}\n\n` +
      `*CONTEC EXTINTORES* | CNPJ: ${companyConfig.cnpj}\n` +
      `Dirceu II - Teresina/PI | WhatsApp: (86) 98134-2832`;

    const encoded = encodeURIComponent(fullMessage);
    window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              <span>Painel de Alertas de Renovação & Clientes para Contatar</span>
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {rankedClients.length} empresas com manutenções pendentes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fila inteligente priorizada por criticidade de vencimento. Garante a conformidade legal dos clientes e fomenta a receita recorrente da CONTEC.
          </p>
        </div>

        <button
          onClick={() => setIsEditingTemplate(!isEditingTemplate)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
        >
          <Edit3 size={14} />
          <span>Configurar Mensagem Padrão</span>
        </button>
      </div>

      {/* Customizable Template Card */}
      {isEditingTemplate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <MessageSquare size={14} /> Mensagem Base para Envio via WhatsApp
            </span>
            <button
              onClick={() => setIsEditingTemplate(false)}
              className="text-[11px] text-amber-800 hover:underline"
            >
              Fechar
            </button>
          </div>
          <textarea
            value={customMessageTemplate}
            onChange={(e) => setCustomMessageTemplate(e.target.value)}
            rows={3}
            className="w-full bg-white border border-amber-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-red-500 text-xs"
          />
          <p className="text-[11px] text-amber-700">
            A mensagem é enviada diretamente com o nome do cliente, quantidade de extintores e dados cadastrais da CONTEC EXTINTORES.
          </p>
        </div>
      )}

      {/* Prioritized List of Clients */}
      <div className="space-y-4">
        {rankedClients.map(({ customer, totalEquipments, expiredList, urgentList, attentionList, minDays }) => {
          const totalUrgentOrExpired = expiredList.length + urgentList.length;
          const isCritical = expiredList.length > 0;

          return (
            <div
              key={customer.id}
              className={`bg-white border rounded-xl p-5 shadow-xs space-y-4 transition-all hover:shadow-md ${
                isCritical ? 'border-red-300 bg-red-50/10' : 'border-slate-200'
              }`}
            >
              {/* Client Header Info com Plano de Fundo em Destaque */}
              <div className="bg-slate-100/90 border border-slate-200/90 rounded-xl p-4 shadow-2xs">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3.5">
                  <div className="space-y-2.5">
                    {/* Empresa & CNPJ com plano de fundo em destaque */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 bg-white border border-slate-200/90 px-3 py-1.5 rounded-lg shadow-2xs">
                        <Building2 size={16} className="text-red-600 shrink-0" />
                        <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                          {customer.name}
                        </h3>
                      </div>
                      {customer.document && (
                        <span className="bg-white border border-slate-200/90 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-700 shadow-2xs">
                          CNPJ: {formatCNPJ(customer.document)}
                        </span>
                      )}
                      {customer.tradeName && customer.tradeName !== customer.name && (
                        <span className="bg-slate-200/80 border border-slate-300/80 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-700">
                          {customer.tradeName}
                        </span>
                      )}
                    </div>

                    {/* Contato, WhatsApp e Segmento com planos de fundo dedicados para leitura nítida */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200/90 px-3 py-1.5 rounded-lg text-slate-800 shadow-2xs">
                        <User size={13} className="text-slate-500 shrink-0" />
                        <span className="text-slate-500 font-medium">Contato:</span>
                        <strong className="text-slate-900 font-bold">{customer.contactPerson || 'Responsável'}</strong>
                        {customer.contactRole && (
                          <span className="text-slate-500 font-normal">({customer.contactRole})</span>
                        )}
                      </span>

                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-900 font-mono font-bold shadow-2xs">
                        <Phone size={13} className="text-emerald-600 shrink-0" />
                        <span>{formatPhone(customer.whatsapp || customer.phone)}</span>
                      </span>

                      {customer.segment && (
                        <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200/90 px-3 py-1.5 rounded-lg text-slate-700 shadow-2xs font-medium">
                          <Shield size={13} className="text-blue-500 shrink-0" />
                          <span>Segmento: <strong className="text-slate-900">{customer.segment}</strong></span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Pills com plano de fundo sólido de destaque */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                    {expiredList.length > 0 && (
                      <span className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 animate-pulse">
                        <Flame size={14} className="text-amber-300" />
                        <span>{expiredList.length} Vencido(s)</span>
                      </span>
                    )}
                    {urgentList.length > 0 && (
                      <span className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold shadow-xs flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>{urgentList.length} Vence em até 30d</span>
                      </span>
                    )}
                    {attentionList.length > 0 && (
                      <span className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span>{attentionList.length} Vence em até 90d</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Equipments Highlights for this Customer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-slate-100/90 border border-slate-200/90 px-3.5 py-1.5 rounded-lg">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame size={14} className="text-red-600" />
                    <span>Extintores em Destaque no Cliente</span>
                  </span>
                  <span className="text-[11px] text-slate-600 font-semibold bg-white border border-slate-200/90 px-2 py-0.5 rounded-md shadow-2xs">
                    Manutenções prioritárias
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {[...expiredList, ...urgentList, ...attentionList].slice(0, 3).map((eq) => {
                    const days = calculateDaysRemaining(eq.nextMaintenanceDate);
                    const isExpired = days < 0;
                    const isUrgent = days >= 0 && days <= 30;

                    return (
                      <div
                        key={eq.id}
                        className={`p-3.5 rounded-xl border-2 transition-all space-y-2 shadow-2xs ${
                          isExpired
                            ? 'bg-red-50/70 border-red-300'
                            : isUrgent
                            ? 'bg-amber-50/70 border-amber-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="bg-slate-900 text-white font-mono font-bold px-2.5 py-1 rounded-md text-xs shadow-2xs">
                            {eq.patrimonyNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold shadow-2xs uppercase tracking-wide ${
                              isExpired
                                ? 'bg-red-600 text-white'
                                : isUrgent
                                ? 'bg-amber-500 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {isExpired ? 'VENCIDO' : `${days} dias restantes`}
                          </span>
                        </div>

                        <div className="font-bold text-slate-900 text-sm">
                          {eq.agent} {eq.capacity}
                        </div>

                        <div className="text-[11px] text-slate-700 bg-white/95 border border-slate-200/90 px-2.5 py-1 rounded-md flex items-center gap-1.5 truncate shadow-2xs">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">Local: {eq.environment || eq.location || 'Não especificado'}</span>
                        </div>

                        <div className="text-[11px] font-mono text-slate-700 bg-white/95 border border-slate-200/90 px-2.5 py-1 rounded-md flex items-center justify-between shadow-2xs">
                          <span className="text-slate-500 font-sans">Validade:</span>
                          <strong className={isExpired ? 'text-red-700 font-bold' : 'text-slate-800'}>
                            {formatDateBR(eq.nextMaintenanceDate)}
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contact Actions Footer com Plano de Fundo Destacado */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-slate-200">
                <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-lg text-xs text-slate-800 font-medium">
                  <Flame size={14} className="text-red-600" />
                  <span>Parque do cliente: <strong className="text-slate-950 font-bold">{totalEquipments} extintores cadastrados</strong></span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleSendWhatsApp(customer, minDays, totalUrgentOrExpired)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    <Phone size={14} />
                    <span>Enviar WhatsApp Automático</span>
                  </button>

                  <button
                    onClick={() => onSelectModule('quotes')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <FileText size={14} />
                    <span>Gerar Orçamento de Recarga</span>
                  </button>

                  {expiredList.length > 0 && (
                    <button
                      onClick={() => onOpenWorkOrderForEquipment(expiredList[0])}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Shield size={14} />
                      <span>Agendar OS Imediata</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
