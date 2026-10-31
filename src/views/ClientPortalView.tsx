import React, { useState } from 'react';
import {
  Building2,
  Flame,
  AlertTriangle,
  RotateCcw,
  ShoppingBag,
  FileText,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateDaysRemaining, getExpirationBadge, formatDateBR, formatBRL } from '../utils/formatters';

interface ClientPortalViewProps {
  onSelectModule: (module: string) => void;
  onOpenWorkOrderForEquipment: (eq: any) => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  onSelectModule,
  onOpenWorkOrderForEquipment,
}) => {
  const { customers, equipments, orders, quotes, products, addOrder, currentUser, companyConfig } = useApp();

  // Find customer associated with user or default to Construtora Rio Poti
  const customer = customers.find((c) => c.id === currentUser.customerId) || customers[0];

  const clientEquipments = equipments.filter((e) => e.customerId === customer.id);
  const clientOrders = orders.filter((o) => o.customerId === customer.id);

  const expiredEquipments = clientEquipments.filter((e) => calculateDaysRemaining(e.nextMaintenanceDate) < 0);
  const urgentEquipments = clientEquipments.filter((e) => {
    const d = calculateDaysRemaining(e.nextMaintenanceDate);
    return d >= 0 && d <= 30;
  });

  const [repurchaseSuccess, setRepurchaseSuccess] = useState(false);

  // Re-purchase items (frequently bought products by this company)
  const repurchaseItems = [
    products.find((p) => p.sku === 'CONTEC-ABC-4KG') || products[0],
    products.find((p) => p.sku === 'CONTEC-SINAL-E5') || products[1],
    products.find((p) => p.sku === 'CONTEC-SUP-CHAO-INOX') || products[2],
  ].filter(Boolean);

  const handleQuickReorder = () => {
    const orderItems = repurchaseItems.map((prod) => ({
      id: `oi-${Date.now()}-${Math.random()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      unit: prod.unit,
      quantity: 5,
      unitCost: prod.costPrice,
      unitPrice: prod.salePrice,
      discountPercent: 10,
      totalPrice: Number((prod.salePrice * 0.9 * 5).toFixed(2)),
    }));

    const total = orderItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

    addOrder({
      customerId: customer.id,
      customerName: customer.name,
      customerDocument: customer.document,
      salespersonId: customer.assignedSalespersonId || 'user-3',
      salespersonName: 'Roberto Viana (Consultor CONTEC)',
      items: orderItems,
      subtotal: total * 1.1,
      discount: total * 0.1,
      totalAmount: total,
      paymentTerms: 'Faturado 30 dias Boleto B2B PJ',
      paymentMethod: 'Boleto B2B',
      paymentStatus: 'Pendente',
      status: 'PEDIDO',
      deliveryAddress: `${customer.address.street}, ${customer.address.number} - Teresina/PI`,
      isRecurrent: false,
      notes: 'Pedido gerado via Portal do Cliente B2B (Lista de Recompra Rápida)',
    });

    setRepurchaseSuccess(true);
    setTimeout(() => setRepurchaseSuccess(false), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          {companyConfig.logoUrl && (
            <img
              src={companyConfig.logoUrl}
              alt={companyConfig.name}
              className="w-12 h-12 object-contain bg-white/10 p-1 rounded-xl border border-red-500/30 shrink-0"
            />
          )}
          <div>
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 size={16} /> Portal Corporativo B2B · CONTEC
            </span>
            <h2 className="text-xl font-bold mt-1">Bem-vindo, {customer.name}</h2>
            <p className="text-xs text-slate-300 mt-1">
              CNPJ: {customer.document} · Gestor Responsável: <strong>{customer.contactPerson}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`https://wa.me/55${companyConfig.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
              `Olá CONTEC! Aqui é ${customer.contactPerson} da empresa ${customer.name}. Gostaria de solicitar atendimento técnico para nossos extintores.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition-colors"
          >
            <Phone size={14} />
            <span>Falar com Consultor CONTEC</span>
          </a>
        </div>
      </div>

      {/* Expiration Critical Alert if any */}
      {(expiredEquipments.length > 0 || urgentEquipments.length > 0) && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Atenção: Validade de Extintores da sua Empresa
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Você possui <strong>{expiredEquipments.length} extintor(es) vencido(s)</strong> e{' '}
                <strong>{urgentEquipments.length} vencendo em até 30 dias</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectModule('equipments')}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-xs whitespace-nowrap"
          >
            Solicitar Manutenção Preventiva
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Extintores Cadastrados</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {clientEquipments.length} unidades
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Monitoramento contínuo</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Equipamentos Regulares</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {clientEquipments.length - (expiredEquipments.length + urgentEquipments.length)}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Conformes com Corpo de Bombeiros</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Vencidos / Atenção</div>
          <div className="text-xl font-bold font-mono text-red-600 mt-1">
            {expiredEquipments.length + urgentEquipments.length}
          </div>
          <div className="text-[11px] text-red-700 mt-0.5">Exigem intervenção técnica</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Histórico de Pedidos</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {clientOrders.length} faturados
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tabela VIP Aplicada</div>
        </div>
      </div>

      {/* Main Grid: Re-purchase List & Installed Extinguishers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Re-purchase / Fast Reorder Box */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <RotateCcw size={16} className="text-red-600" />
                <span>Lista de Recompra Rápida</span>
              </h3>
              <p className="text-xs text-slate-500">
                Itens mais adquiridos por sua empresa para canteiros e reposições
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
              Desconto VIP Ativo
            </span>
          </div>

          {repurchaseSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Pedido de reposição enviado à equipe CONTEC com sucesso!</span>
            </div>
          )}

          <div className="space-y-2">
            {repurchaseItems.map((prod) => (
              <div
                key={prod.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{prod.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">SKU: {prod.sku}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900">{formatBRL(prod.salePrice * 0.9)}</div>
                  <div className="text-[10px] text-slate-400 line-through">{formatBRL(prod.salePrice)}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleQuickReorder}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag size={15} />
            <span>Repor Itens com 1 Clique (Gerar Pedido Automático)</span>
          </button>
        </div>

        {/* Installed Equipments at Customer */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Flame size={16} className="text-red-600" />
                <span>Extintores Instalados em suas Unidades</span>
              </h3>
              <p className="text-xs text-slate-500">
                Acompanhamento individual de validade e selo INMETRO
              </p>
            </div>
            <button
              onClick={() => onSelectModule('equipments')}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Ver todos →
            </button>
          </div>

          <div className="space-y-2">
            {clientEquipments.slice(0, 4).map((eq) => {
              const days = calculateDaysRemaining(eq.nextMaintenanceDate);
              const badge = getExpirationBadge(days);

              return (
                <div
                  key={eq.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-slate-900">
                      {eq.patrimonyNumber} · <span className="text-slate-700">{eq.agent} {eq.capacity}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Local: {eq.environment} ({eq.location})
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${badge.colorClass}`}>
                      {days < 0 ? 'VENCIDO' : `${days} dias`}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {formatDateBR(eq.nextMaintenanceDate)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
