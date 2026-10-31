import React, { useState, useMemo } from 'react';
import {
  Flame,
  AlertTriangle,
  TrendingUp,
  FileText,
  ShoppingBag,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Calendar,
  Warehouse,
  QrCode,
  DollarSign,
  Phone,
  Search,
  Filter,
  ChevronRight,
  MessageSquare,
  ExternalLink,
  X,
  Building,
  PhoneCall,
  Sparkles,
  RefreshCw,
  Check,
  ArrowRight,
  Eye,
  ShieldAlert,
  Send,
  MapPin,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateDaysRemaining, formatBRL, formatDateBR, getExpirationBadge } from '../utils/formatters';
import { Customer, InstalledEquipment } from '../types';

type HealthZone = 'VERDE' | 'AMARELO' | 'LARANJA' | 'VERMELHO';

interface DashboardViewProps {
  onSelectModule: (module: string) => void;
  onOpenQrScanner: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectModule,
  onOpenQrScanner,
}) => {
  const {
    currentUser,
    equipments,
    workOrders,
    quotes,
    orders,
    customers,
    products,
    financialAccounts,
    crmLeads,
    getWhatsAppRenewalUrl,
  } = useApp();

  // Metrics Calculations
  const expiredEquipments = equipments.filter((eq) => calculateDaysRemaining(eq.nextMaintenanceDate) < 0);
  const urgentEquipments = equipments.filter((eq) => {
    const days = calculateDaysRemaining(eq.nextMaintenanceDate);
    return days >= 0 && days <= 30;
  });
  const attentionEquipments = equipments.filter((eq) => {
    const days = calculateDaysRemaining(eq.nextMaintenanceDate);
    return days > 30 && days <= 90;
  });
  const normalEquipments = equipments.filter((eq) => calculateDaysRemaining(eq.nextMaintenanceDate) > 90);

  const pendingOrders = orders.filter((o) => o.status !== 'CONCLUIDO' && o.status !== 'CANCELADO');
  const openQuotes = quotes.filter((q) => q.status === 'RASCUNHO' || q.status === 'ENVIADO' || q.status === 'EM_NEGOCIACAO');
  const lowStockItems = products.filter((p) => p.currentStock <= p.minStock && p.category !== 'SERVICOS');
  const activeOS = workOrders.filter((w) => w.status === 'EM_EXECUCAO' || w.status === 'AGENDADA' || w.status === 'ABERTA');

  const totalReceivable = financialAccounts
    .filter((fa) => fa.status === 'ABERTO' || fa.status === 'ATRASADO')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalOverdue = financialAccounts
    .filter((fa) => fa.status === 'ATRASADO')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalSalesMonth = orders
    .filter((o) => o.status !== 'CANCELADO')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  // Group expiring customers
  const expiringByCustomer = customers.map((c) => {
    const custEqs = equipments.filter((e) => e.customerId === c.id);
    const expiredCount = custEqs.filter((e) => calculateDaysRemaining(e.nextMaintenanceDate) < 0).length;
    const urgentCount = custEqs.filter((e) => {
      const d = calculateDaysRemaining(e.nextMaintenanceDate);
      return d >= 0 && d <= 30;
    }).length;
    return {
      customer: c,
      total: custEqs.length,
      expiredCount,
      urgentCount,
      priority: expiredCount > 0 ? 3 : urgentCount > 0 ? 2 : 1,
    };
  }).filter((x) => x.expiredCount > 0 || x.urgentCount > 0)
    .sort((a, b) => b.priority - a.priority || (b.expiredCount + b.urgentCount) - (a.expiredCount + a.urgentCount));

  // Interactive Health Zone state & client pull
  const [selectedHealthZone, setSelectedHealthZone] = useState<HealthZone | null>(null);
  const [zoneSearchQuery, setZoneSearchQuery] = useState('');
  const [zoneViewMode, setZoneViewMode] = useState<'CLIENTS' | 'EQUIPMENTS'>('CLIENTS');

  // Preview Table Column Interactive Sorting
  type DashTableSortField = 'patrimonyNumber' | 'customerName' | 'agent' | 'environment' | 'nextMaintenanceDate';
  const [dashSortField, setDashSortField] = useState<DashTableSortField | null>(null);
  const [dashSortDirection, setDashSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleDashSort = (field: DashTableSortField) => {
    if (dashSortField === field) {
      if (dashSortDirection === 'asc') {
        setDashSortDirection('desc');
      } else {
        setDashSortField(null);
        setDashSortDirection('asc');
      }
    } else {
      setDashSortField(field);
      setDashSortDirection('asc');
    }
  };

  const sortedCriticalEquipments = useMemo(() => {
    const list = [...expiredEquipments, ...urgentEquipments];
    if (!dashSortField) return list;

    return [...list].sort((a, b) => {
      let comparison = 0;
      switch (dashSortField) {
        case 'patrimonyNumber':
          comparison = a.patrimonyNumber.localeCompare(b.patrimonyNumber, undefined, { numeric: true });
          break;
        case 'customerName':
          comparison = a.customerName.localeCompare(b.customerName, undefined, { sensitivity: 'base' });
          break;
        case 'agent':
          comparison = `${a.agent} ${a.capacity}`.localeCompare(`${b.agent} ${b.capacity}`, undefined, { numeric: true });
          break;
        case 'environment':
          comparison = (a.environment || '').localeCompare(b.environment || '', undefined, { sensitivity: 'base' });
          break;
        case 'nextMaintenanceDate': {
          const dateA = new Date(a.nextMaintenanceDate).getTime();
          const dateB = new Date(b.nextMaintenanceDate).getTime();
          comparison = dateA - dateB;
          break;
        }
      }
      return dashSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [expiredEquipments, urgentEquipments, dashSortField, dashSortDirection]);

  // Helper to get matching equipment for any zone
  const getZoneEquipments = (zone: HealthZone) => {
    switch (zone) {
      case 'VERDE':
        return normalEquipments;
      case 'AMARELO':
        return attentionEquipments;
      case 'LARANJA':
        return urgentEquipments;
      case 'VERMELHO':
        return expiredEquipments;
    }
  };

  // Pull customers grouped by the selected zone
  const zoneClientsData = useMemo(() => {
    if (!selectedHealthZone) return [];
    const zoneEqs = getZoneEquipments(selectedHealthZone);

    const clientMap = new Map<string, { customer: Customer; equipments: InstalledEquipment[] }>();

    zoneEqs.forEach((eq) => {
      const foundCust = customers.find((c) => c.id === eq.customerId);
      const customerToUse: Customer = foundCust || {
        id: eq.customerId || `cust-${eq.customerName}`,
        name: eq.customerName || 'Cliente CONTEC',
        tradeName: eq.customerName,
        document: 'N/A',
        email: 'contato@contecpi.com.br',
        phone: '(86) 98134-2832',
        whatsapp: '86981342832',
        contactPerson: 'Responsável Técnico',
        contactRole: 'Gerente Operacional',
        segment: 'Comércio / Serviços',
        size: 'Média',
        address: {
          street: eq.location || 'Av. Principal',
          number: '100',
          neighborhood: 'Dirceu Arcoverde',
          city: 'Teresina',
          state: 'PI',
          zipCode: '64078-000',
        },
        contacts: [],
        priceTableId: 'tab-padrao',
        type: 'PJ',
        createdAt: '2026-01-01',
      };

      if (!clientMap.has(customerToUse.id)) {
        clientMap.set(customerToUse.id, { customer: customerToUse, equipments: [] });
      }
      clientMap.get(customerToUse.id)!.equipments.push(eq);
    });

    let result = Array.from(clientMap.values()).sort(
      (a, b) => b.equipments.length - a.equipments.length
    );

    if (zoneSearchQuery.trim()) {
      const q = zoneSearchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.customer.name.toLowerCase().includes(q) ||
          (item.customer.tradeName && item.customer.tradeName.toLowerCase().includes(q)) ||
          item.customer.document?.toLowerCase().includes(q) ||
          item.customer.address?.neighborhood?.toLowerCase().includes(q) ||
          item.customer.address?.city?.toLowerCase().includes(q) ||
          item.customer.phone?.toLowerCase().includes(q) ||
          item.customer.whatsapp?.toLowerCase().includes(q) ||
          item.equipments.some(
            (e) =>
              e.patrimonyNumber.toLowerCase().includes(q) ||
              e.agent.toLowerCase().includes(q) ||
              e.environment.toLowerCase().includes(q)
          )
      );
    }

    return result;
  }, [
    selectedHealthZone,
    normalEquipments,
    attentionEquipments,
    urgentEquipments,
    expiredEquipments,
    customers,
    zoneSearchQuery,
  ]);

  // Generate customized WhatsApp notification for customer and zone
  const getZoneWhatsAppUrl = (
    customer: Customer,
    equipmentsInZone: InstalledEquipment[],
    zone: HealthZone
  ) => {
    const rawPhone = (customer.whatsapp || customer.phone || '86981342832').replace(/\D/g, '');
    const firstEq = equipmentsInZone[0];
    let message = '';

    if (zone === 'VERMELHO') {
      message = `Olá, ${customer.contactPerson || customer.name}! Aqui é da CONTEC Extintores (Teresina-PI). Identificamos em nosso monitoramento técnico que ${equipmentsInZone.length} extintor(es) da sua unidade estão com a recarga VENCIDA (ex: Patrimônio ${firstEq?.patrimonyNumber} - ${firstEq?.agent} ${firstEq?.capacity}). Podemos agendar hoje a coleta e substituição provisória para manter seu alvará do Corpo de Bombeiros regularizado?`;
    } else if (zone === 'LARANJA') {
      message = `Olá, ${customer.contactPerson || customer.name}! Aqui é da CONTEC Extintores. Informamos que ${equipmentsInZone.length} extintor(es) da sua empresa vencem nos próximos 30 dias (ex: Patrimônio ${firstEq?.patrimonyNumber} - ${firstEq?.agent} ${firstEq?.capacity}). Gostaríamos de antecipar a vistoria para evitar qualquer autuação ou risco. Como podemos proceder?`;
    } else if (zone === 'AMARELO') {
      message = `Olá, ${customer.contactPerson || customer.name}! Notificação de planejamento preventivo CONTEC Extintores: ${equipmentsInZone.length} extintor(es) da sua unidade estão no período de atenção (vencimento entre 31 e 90 dias). Já podemos reservar a cota de insumos para a recarga anual da sua empresa?`;
    } else {
      message = `Olá, ${customer.contactPerson || customer.name}! Da CONTEC Extintores. Passando para parabenizar: o parque de extintores da sua empresa está 100% regular e em conformidade com as normas ABNT NBR 12962! Conte sempre com a CONTEC em Teresina.`;
    }

    return `https://wa.me/55${rawPhone.length <= 11 ? rawPhone : rawPhone.substring(rawPhone.length - 11)}?text=${encodeURIComponent(message)}`;
  };

  // Role-Specific Sub-renders if Técnico or Estoquista
  if (currentUser.role === 'TECNICO') {
    return (
      <div className="space-y-6">
        {/* Technician Top Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-xs font-semibold text-red-400 uppercase tracking-wider">
              Painel de Campo · Nível 3
            </div>
            <h2 className="text-xl font-bold mt-1">Olá, {currentUser.name}</h2>
            <p className="text-xs text-slate-300 mt-1">
              Você possui <strong>{activeOS.length} ordens de serviço ativas</strong> para atendimento na Grande Teresina.
            </p>
          </div>
          <button
            onClick={onOpenQrScanner}
            className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-900/40 transition-colors"
          >
            <QrCode size={18} />
            <span>Escanear QR Code de Extintor</span>
          </button>
        </div>

        {/* Technician Active Work Orders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Ordens de Serviço Designadas para Você</h3>
            <button
              onClick={() => onSelectModule('workOrders')}
              className="text-xs text-red-600 font-semibold hover:underline"
            >
              Ver todas as OS
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workOrders.map((wo) => (
              <div
                key={wo.id}
                onClick={() => onSelectModule('workOrders')}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      {wo.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{wo.customerName}</h4>
                    <p className="text-xs text-slate-500">{wo.customerAddress}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      wo.status === 'EM_EXECUCAO'
                        ? 'bg-blue-100 text-blue-800'
                        : wo.status === 'CONCLUIDA'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {wo.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                  <strong className="text-slate-800">{wo.type}:</strong> {wo.serviceDescription}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {formatDateBR(wo.scheduledDate)} às {wo.scheduledTime}
                  </span>
                  <span className="font-semibold text-red-600 hover:text-red-700">Executar Checklist →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Standard Executive & Operational Dashboard (Admin, Gerente, Vendedor, Financeiro)
  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">
              Painel de Controle · CONTEC EXTINTORES
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoramento em tempo real de vendas, ordens de serviço e controle de validade de extintores em clientes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSelectModule('renewals')}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <AlertTriangle size={14} className="text-amber-600" />
            <span>Alertas de Validade ({expiredEquipments.length + urgentEquipments.length})</span>
          </button>

          <button
            onClick={() => onSelectModule('quotes')}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <FileText size={14} />
            <span>Novo Orçamento</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Zero-pill discipline, tabular numerals) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Faturamento Mês */}
        <div
          onClick={() => onSelectModule('orders')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Vendas Faturadas (Mês)</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900 tabular-nums">
            {formatBRL(totalSalesMonth)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">{orders.length} pedidos</span>
            <span>·</span>
            <span>Teresina e Região</span>
          </div>
        </div>

        {/* KPI 2: Extintores Vencidos / Críticos */}
        <div
          onClick={() => onSelectModule('renewals')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-red-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Extintores Vencidos / Críticos</span>
            <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
              <Flame size={16} />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-red-600 tabular-nums flex items-baseline gap-2">
            <span>{expiredEquipments.length} vencidos</span>
            <span className="text-xs font-normal text-amber-600 font-sans">
              +{urgentEquipments.length} em até 30d
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Oportunidade imediata de recarga técnica
          </div>
        </div>

        {/* KPI 3: Orçamentos em Aberto */}
        <div
          onClick={() => onSelectModule('quotes')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Orçamentos em Negociação</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <FileText size={16} />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900 tabular-nums">
            {openQuotes.length} propostas
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Total previsto: {formatBRL(openQuotes.reduce((a, b) => a + b.totalAmount, 0))}
          </div>
        </div>

        {/* KPI 4: Contas a Receber */}
        <div
          onClick={() => onSelectModule('financial')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Contas a Receber</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900 tabular-nums">
            {formatBRL(totalReceivable)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {totalOverdue > 0 ? (
              <span className="text-red-600 font-semibold">{formatBRL(totalOverdue)} em atraso</span>
            ) : (
              <span className="text-emerald-600 font-semibold">Sem atrasos críticos</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Section: Extinguisher Expiration Curve & Priority Follow-up */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Expiration Health Monitor */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Saúde do Parque Instalado de Extintores
              </h3>
              <p className="text-xs text-slate-500">
                Classificação por proximidade do vencimento da recarga anual (Total: {equipments.length} equipamentos)
              </p>
            </div>
            <button
              onClick={() => onSelectModule('equipments')}
              className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <span>Gerenciar Extintores</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          {/* Progress Bar Curve (Clickable & Responsive) */}
          <div className="space-y-2">
            <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner p-0.5 cursor-pointer">
              <button
                type="button"
                onClick={() => setSelectedHealthZone(selectedHealthZone === 'VERDE' ? null : 'VERDE')}
                style={{ width: `${(normalEquipments.length / equipments.length) * 100}%` }}
                className={`h-full transition-all rounded-l-full relative group ${
                  selectedHealthZone === 'VERDE'
                    ? 'bg-emerald-600 ring-2 ring-emerald-300 z-10'
                    : 'bg-emerald-500 hover:brightness-110'
                }`}
                title={`Verde (>90d): ${normalEquipments.length} extintores. Clique para puxar clientes.`}
              />
              <button
                type="button"
                onClick={() => setSelectedHealthZone(selectedHealthZone === 'AMARELO' ? null : 'AMARELO')}
                style={{ width: `${(attentionEquipments.length / equipments.length) * 100}%` }}
                className={`h-full transition-all relative group ${
                  selectedHealthZone === 'AMARELO'
                    ? 'bg-amber-500 ring-2 ring-amber-300 z-10'
                    : 'bg-amber-400 hover:brightness-110'
                }`}
                title={`Amarelo (31 a 90d): ${attentionEquipments.length} extintores. Clique para puxar clientes.`}
              />
              <button
                type="button"
                onClick={() => setSelectedHealthZone(selectedHealthZone === 'LARANJA' ? null : 'LARANJA')}
                style={{ width: `${(urgentEquipments.length / equipments.length) * 100}%` }}
                className={`h-full transition-all relative group ${
                  selectedHealthZone === 'LARANJA'
                    ? 'bg-orange-600 ring-2 ring-orange-300 z-10'
                    : 'bg-orange-500 hover:brightness-110'
                }`}
                title={`Laranja (1 a 30d): ${urgentEquipments.length} extintores. Clique para puxar clientes.`}
              />
              <button
                type="button"
                onClick={() => setSelectedHealthZone(selectedHealthZone === 'VERMELHO' ? null : 'VERMELHO')}
                style={{ width: `${(expiredEquipments.length / equipments.length) * 100}%` }}
                className={`h-full transition-all rounded-r-full relative group ${
                  selectedHealthZone === 'VERMELHO'
                    ? 'bg-red-700 ring-2 ring-red-300 z-10'
                    : 'bg-red-600 hover:brightness-110'
                }`}
                title={`Vermelho (Vencidos): ${expiredEquipments.length} extintores. Clique para puxar clientes.`}
              />
            </div>

            {/* Interactive & Responsive Legend Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
              {/* Verde (>90d) */}
              <button
                type="button"
                onClick={() => setSelectedHealthZone(selectedHealthZone === 'VERDE' ? null : 'VERDE')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedHealthZone === 'VERDE'
                    ? 'bg-emerald-100/90 border-emerald-500 ring-2 ring-emerald-500/50 shadow-md scale-[1.02]'
                    : 'bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-100/60 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-emerald-800 font-semibold text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                    <span className="truncate">Verde (&gt;90d)</span>
                  </div>
                  {selectedHealthZone === 'VERDE' && (
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full shrink-0">
                      ✓ Ativo
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between mt-1.5">
                  <div className="text-xl font-black font-mono text-emerald-950">
                    {normalEquipments.length} <span className="text-xs font-normal text-emerald-700">un</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    {selectedHealthZone === 'VERDE' ? 'Ocultar' : 'Ver clientes'}
                  </span>
                </div>
              </button>

              {/* Amarelo (31-90d) */}
              <button
                type="button"
                onClick={() => setSelectedHealthZone(selectedHealthZone === 'AMARELO' ? null : 'AMARELO')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedHealthZone === 'AMARELO'
                    ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-500/50 shadow-md scale-[1.02]'
                    : 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-100/60 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-amber-800 font-semibold text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="truncate">Amarelo (31-90d)</span>
                  </div>
                  {selectedHealthZone === 'AMARELO' && (
                    <span className="text-[10px] bg-amber-600 text-white font-bold px-1.5 py-0.2 rounded-full shrink-0">
                      ✓ Ativo
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between mt-1.5">
                  <div className="text-xl font-black font-mono text-amber-950">
                    {attentionEquipments.length} <span className="text-xs font-normal text-amber-700">un</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium">
                    {selectedHealthZone === 'AMARELO' ? 'Ocultar' : 'Ver clientes'}
                  </span>
                </div>
              </button>

              {/* Laranja (1-30d) */}
              <button
                type="button"
                onClick={() => setSelectedHealthZone(selectedHealthZone === 'LARANJA' ? null : 'LARANJA')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedHealthZone === 'LARANJA'
                    ? 'bg-orange-100/90 border-orange-500 ring-2 ring-orange-500/50 shadow-md scale-[1.02]'
                    : 'bg-orange-50/60 border-orange-200/80 hover:bg-orange-100/60 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-orange-800 font-semibold text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
                    <span className="truncate">Laranja (1-30d)</span>
                  </div>
                  {selectedHealthZone === 'LARANJA' && (
                    <span className="text-[10px] bg-orange-600 text-white font-bold px-1.5 py-0.2 rounded-full shrink-0">
                      ✓ Ativo
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between mt-1.5">
                  <div className="text-xl font-black font-mono text-orange-950">
                    {urgentEquipments.length} <span className="text-xs font-normal text-orange-700">un</span>
                  </div>
                  <span className="text-[10px] text-orange-700 font-medium">
                    {selectedHealthZone === 'LARANJA' ? 'Ocultar' : 'Ver clientes'}
                  </span>
                </div>
              </button>

              {/* Vermelho (Vencido) */}
              <button
                type="button"
                onClick={() => setSelectedHealthZone(selectedHealthZone === 'VERMELHO' ? null : 'VERMELHO')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedHealthZone === 'VERMELHO'
                    ? 'bg-red-100/90 border-red-500 ring-2 ring-red-500/50 shadow-md scale-[1.02]'
                    : 'bg-red-50/60 border-red-200/80 hover:bg-red-100/60 hover:border-red-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-red-800 font-semibold text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0"></span>
                    <span className="truncate">Vermelho (Vencido)</span>
                  </div>
                  {selectedHealthZone === 'VERMELHO' && (
                    <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded-full shrink-0">
                      ✓ Ativo
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between mt-1.5">
                  <div className="text-xl font-black font-mono text-red-950">
                    {expiredEquipments.length} <span className="text-xs font-normal text-red-700">un</span>
                  </div>
                  <span className="text-[10px] text-red-700 font-medium">
                    {selectedHealthZone === 'VERMELHO' ? 'Ocultar' : 'Ver clientes'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* DYNAMIC SECTION: If a Health Zone is selected, pull all its customers! */}
          {selectedHealthZone ? (
            <div className="pt-2 space-y-3">
              {/* Header of Active Zone */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  selectedHealthZone === 'VERMELHO'
                    ? 'bg-red-50/80 border-red-200 text-red-950'
                    : selectedHealthZone === 'LARANJA'
                    ? 'bg-orange-50/80 border-orange-200 text-orange-950'
                    : selectedHealthZone === 'AMARELO'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      selectedHealthZone === 'VERMELHO'
                        ? 'bg-red-600 animate-ping'
                        : selectedHealthZone === 'LARANJA'
                        ? 'bg-orange-500'
                        : selectedHealthZone === 'AMARELO'
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                  />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span>
                        {selectedHealthZone === 'VERMELHO' && 'Clientes com Extintores Vencidos (Ação Imediata)'}
                        {selectedHealthZone === 'LARANJA' && 'Clientes com Vencimento Próximo (1 a 30 Dias)'}
                        {selectedHealthZone === 'AMARELO' && 'Clientes em Atenção / Planejamento (31 a 90 Dias)'}
                        {selectedHealthZone === 'VERDE' && 'Clientes com Parque Regular (>90 Dias de Validade)'}
                      </span>
                    </h4>
                    <p className="text-[11px] opacity-80">
                      {zoneClientsData.length} cliente(s) · {getZoneEquipments(selectedHealthZone).length} extintor(es) nesta área
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* Search inside pulled customers */}
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar cliente ou extintor..."
                      value={zoneSearchQuery}
                      onChange={(e) => setZoneSearchQuery(e.target.value)}
                      className="pl-7 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 w-40 sm:w-48 text-slate-800 placeholder-slate-400"
                    />
                    {zoneSearchQuery && (
                      <button
                        onClick={() => setZoneSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Clear filter */}
                  <button
                    onClick={() => {
                      setSelectedHealthZone(null);
                      setZoneSearchQuery('');
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="Fechar filtro e ver visão geral"
                  >
                    <X size={13} />
                    <span className="hidden sm:inline">Limpar</span>
                  </button>
                </div>
              </div>

              {/* Pulled Customers List (Responsive Cards) */}
              {zoneClientsData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                  {zoneClientsData.map(({ customer, equipments: clientZoneEqs }) => {
                    const whatsAppUrl = getZoneWhatsAppUrl(customer, clientZoneEqs, selectedHealthZone);

                    return (
                      <div
                        key={customer.id}
                        className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 shadow-2xs transition-all flex flex-col justify-between space-y-3"
                      >
                        <div>
                          {/* Top row: Client info com plano de fundo em destaque e contagem */}
                          <div className="bg-slate-100/90 border border-slate-200/90 rounded-lg p-2.5 flex items-start justify-between gap-2 shadow-2xs">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Building2 size={13} className="text-red-600 shrink-0" />
                                <h5 className="text-xs font-bold text-slate-900 truncate" title={customer.name}>
                                  {customer.name}
                                </h5>
                              </div>
                              {customer.tradeName && customer.tradeName !== customer.name && (
                                <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">{customer.tradeName}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[10px]">
                                <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono font-semibold text-slate-700 shadow-2xs">
                                  {customer.document || 'N/A'}
                                </span>
                                <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shadow-2xs">
                                  <MapPin size={10} className="text-slate-400" />
                                  <span>
                                    {customer.address?.neighborhood
                                      ? `${customer.address.neighborhood}, ${customer.address.city || 'Teresina'}`
                                      : 'Teresina - PI'}
                                  </span>
                                </span>
                              </div>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 shadow-2xs ${
                                selectedHealthZone === 'VERMELHO'
                                  ? 'bg-red-600 text-white'
                                  : selectedHealthZone === 'LARANJA'
                                  ? 'bg-amber-500 text-white'
                                  : selectedHealthZone === 'AMARELO'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {clientZoneEqs.length} extintor(es)
                            </span>
                          </div>

                          {/* Equipments of this customer in this zone */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Extintores nesta faixa:
                            </span>
                            <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
                              {clientZoneEqs.map((eq) => {
                                const days = calculateDaysRemaining(eq.nextMaintenanceDate);
                                return (
                                  <div
                                    key={eq.id}
                                    className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded-md border border-slate-100"
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="font-mono font-bold text-slate-800">{eq.patrimonyNumber}</span>
                                      <span className="text-slate-400">·</span>
                                      <span className="text-slate-600 truncate">{eq.agent} {eq.capacity}</span>
                                      {eq.environment && (
                                        <span className="text-slate-400 hidden sm:inline truncate">
                                          ({eq.environment})
                                        </span>
                                      )}
                                    </div>
                                    <span
                                      className={`font-mono text-[10px] font-semibold shrink-0 ml-1.5 ${
                                        days < 0
                                          ? 'text-red-700'
                                          : days <= 30
                                          ? 'text-orange-700'
                                          : days <= 90
                                          ? 'text-amber-700'
                                          : 'text-emerald-700'
                                      }`}
                                    >
                                      {formatDateBR(eq.nextMaintenanceDate)} ({days < 0 ? `${Math.abs(days)}d atrasado` : `${days}d`})
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Direct Action Buttons for this customer */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                          <a
                            href={whatsAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors"
                          >
                            <Send size={12} />
                            <span>WhatsApp</span>
                          </a>

                          <button
                            onClick={() => onSelectModule('workOrders')}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                            title="Abrir Ordem de Serviço de Recarga para este cliente"
                          >
                            Criar OS
                          </button>

                          <button
                            onClick={() => onSelectModule('quotes')}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                            title="Gerar Orçamento de Renovação"
                          >
                            Orçamento
                          </button>

                          <button
                            onClick={() => onSelectModule('customers')}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Ver Cadastro Completo"
                          >
                            <ExternalLink size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 space-y-2">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
                  <p className="text-xs font-semibold">
                    {zoneSearchQuery
                      ? 'Nenhum cliente encontrado para essa busca.'
                      : 'Nenhum cliente com extintores nesta faixa no momento.'}
                  </p>
                  {zoneSearchQuery && (
                    <button
                      onClick={() => setZoneSearchQuery('')}
                      className="text-xs text-red-600 font-semibold hover:underline"
                    >
                      Limpar termo de busca
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Default Preview when no specific zone is clicked */
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Extintores que Exigem Ação Imediata
                </h4>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Dica: Toque em qualquer cor acima para puxar os clientes
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 select-none">
                    <tr>
                      {/* Patrimônio */}
                      <th
                        onClick={() => handleDashSort('patrimonyNumber')}
                        className={`py-2 px-3 cursor-pointer transition-colors group ${
                          dashSortField === 'patrimonyNumber'
                            ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                            : 'hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        title="Clique para ordenar por Patrimônio (1-9 ou 9-1)"
                      >
                        <div className="flex items-center gap-1">
                          <span>Patrimônio</span>
                          {dashSortField === 'patrimonyNumber' ? (
                            <span className="text-red-600">
                              {dashSortDirection === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                            </span>
                          ) : (
                            <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400" />
                          )}
                        </div>
                      </th>

                      {/* Cliente */}
                      <th
                        onClick={() => handleDashSort('customerName')}
                        className={`py-2 px-3 cursor-pointer transition-colors group ${
                          dashSortField === 'customerName'
                            ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                            : 'hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        title="Clique para ordenar por Cliente (A-Z ou Z-A)"
                      >
                        <div className="flex items-center gap-1">
                          <span>Cliente</span>
                          {dashSortField === 'customerName' ? (
                            <span className="text-red-600">
                              {dashSortDirection === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                            </span>
                          ) : (
                            <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400" />
                          )}
                        </div>
                      </th>

                      {/* Tipo / Agente */}
                      <th
                        onClick={() => handleDashSort('agent')}
                        className={`py-2 px-3 cursor-pointer transition-colors group ${
                          dashSortField === 'agent'
                            ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                            : 'hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        title="Clique para ordenar por Tipo/Agente"
                      >
                        <div className="flex items-center gap-1">
                          <span>Tipo / Agente</span>
                          {dashSortField === 'agent' ? (
                            <span className="text-red-600">
                              {dashSortDirection === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                            </span>
                          ) : (
                            <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400" />
                          )}
                        </div>
                      </th>

                      {/* Localização */}
                      <th
                        onClick={() => handleDashSort('environment')}
                        className={`py-2 px-3 cursor-pointer transition-colors group ${
                          dashSortField === 'environment'
                            ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                            : 'hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        title="Clique para ordenar por Localização / Ambiente"
                      >
                        <div className="flex items-center gap-1">
                          <span>Localização</span>
                          {dashSortField === 'environment' ? (
                            <span className="text-red-600">
                              {dashSortDirection === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                            </span>
                          ) : (
                            <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400" />
                          )}
                        </div>
                      </th>

                      {/* Vencimento */}
                      <th
                        onClick={() => handleDashSort('nextMaintenanceDate')}
                        className={`py-2 px-3 text-right cursor-pointer transition-colors group ${
                          dashSortField === 'nextMaintenanceDate'
                            ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                            : 'hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        title="Clique para ordenar por Vencimento (Dias restantes)"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Vencimento</span>
                          {dashSortField === 'nextMaintenanceDate' ? (
                            <span className="text-red-600">
                              {dashSortDirection === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                            </span>
                          ) : (
                            <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedCriticalEquipments.slice(0, 6).map((eq) => {
                      const days = calculateDaysRemaining(eq.nextMaintenanceDate);
                      const badge = getExpirationBadge(days);
                      return (
                        <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded text-xs shadow-2xs">
                              {eq.patrimonyNumber}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 truncate max-w-[160px]">
                            {eq.customerName}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-xs font-semibold">
                              {eq.agent} {eq.capacity}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 truncate max-w-[140px]">
                            <span className="bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                              {eq.environment}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold shadow-2xs ${badge.colorClass}`}>
                              {formatDateBR(eq.nextMaintenanceDate)} ({days < 0 ? `${Math.abs(days)}d atrás` : `${days}d`})
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: "Clientes para Contatar / WhatsApp" Auto Engine */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Phone size={15} className="text-emerald-600" />
                  <span>Clientes para Contatar</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Prioridade automática por vencimento
                </p>
              </div>
              <button
                onClick={() => onSelectModule('renewals')}
                className="text-xs text-red-600 font-semibold hover:underline"
              >
                Ver todos
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {expiringByCustomer.slice(0, 4).map(({ customer, expiredCount, urgentCount }) => (
                <div key={customer.id} className="p-3 bg-slate-100/90 border border-slate-200/90 rounded-xl space-y-2.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="bg-white border border-slate-200/90 px-2 py-1 rounded-md shadow-2xs flex items-center gap-1.5 truncate">
                        <Building2 size={13} className="text-red-600 shrink-0" />
                        <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">
                          {customer.name}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                          Contato: <strong className="text-slate-900">{customer.contactPerson}</strong>
                        </span>
                        <span className="bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-900 font-mono font-bold flex items-center gap-1">
                          <Phone size={10} className="text-emerald-600" />
                          {customer.whatsapp}
                        </span>
                      </div>
                    </div>
                    {expiredCount > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-600 text-white shadow-2xs shrink-0 flex items-center gap-1 animate-pulse">
                        <Flame size={12} className="text-amber-300" />
                        <span>{expiredCount} Vencido(s)</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500 text-white shadow-2xs shrink-0 flex items-center gap-1">
                        <Clock size={12} />
                        <span>{urgentCount} Vencendo</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/70">
                    <a
                      href={getWhatsAppRenewalUrl(customer, expiredCount + urgentCount, expiredCount > 0 ? 0 : 30)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Phone size={12} />
                      <span>Enviar WhatsApp</span>
                    </a>

                    <button
                      onClick={() => onSelectModule('quotes')}
                      className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                    >
                      Criar Orçamento
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">Automação Comercial: </span>
            A CONTEC monitora o ciclo de vida completo dos extintores para gerar recorrência contínua de vendas e recargas.
          </div>
        </div>
      </div>

      {/* Operational Modules Row: Estoque & Serviços */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Estoque Crítico */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Warehouse size={16} className="text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase">Alertas de Estoque</h3>
            </div>
            <button
              onClick={() => onSelectModule('stock')}
              className="text-xs text-red-600 font-semibold hover:underline"
            >
              Ver estoque
            </button>
          </div>

          <div className="space-y-2">
            {lowStockItems.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                Todos os itens acima do estoque mínimo de segurança.
              </div>
            ) : (
              lowStockItems.map((prod) => (
                <div key={prod.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100 text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-900 truncate">{prod.name}</div>
                    <div className="text-[10px] text-slate-500">Mín: {prod.minStock} un · Local: {prod.stockLocation}</div>
                  </div>
                  <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded shrink-0">
                    {prod.currentStock} un
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ordens de Serviço em Execução */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase">Serviços em Campo</h3>
            </div>
            <button
              onClick={() => onSelectModule('workOrders')}
              className="text-xs text-red-600 font-semibold hover:underline"
            >
              Ver agenda
            </button>
          </div>

          <div className="space-y-2">
            {activeOS.slice(0, 3).map((wo) => (
              <div key={wo.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-slate-900">{wo.code}</span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                    {wo.status}
                  </span>
                </div>
                <div className="font-medium text-slate-800 truncate">{wo.customerName}</div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{wo.technicianName}</span>
                  <span>{formatDateBR(wo.scheduledDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funil Comercial / CRM */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase">Pipeline Comercial</h3>
            </div>
            <button
              onClick={() => onSelectModule('crm')}
              className="text-xs text-red-600 font-semibold hover:underline"
            >
              Ver Kanban
            </button>
          </div>

          <div className="space-y-2">
            {crmLeads.slice(0, 3).map((lead) => (
              <div key={lead.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900 truncate">{lead.companyName}</span>
                  <span className="font-mono font-bold text-emerald-700">{formatBRL(lead.expectedValue)}</span>
                </div>
                <div className="text-[11px] text-slate-600 truncate">{lead.title}</div>
                <div className="text-[10px] text-slate-400">
                  Próxima ação: {lead.nextAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
