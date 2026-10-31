import React from 'react';
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  Users,
  GitPullRequest,
  Boxes,
  Flame,
  ShieldCheck,
  Tag,
  Warehouse,
  ArrowLeftRight,
  ClipboardList,
  Calendar,
  QrCode,
  AlertTriangle,
  BadgeDollarSign,
  Receipt,
  TrendingUp,
  FileCheck2,
  FolderOpen,
  Settings,
  Building2,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateDaysRemaining } from '../../utils/formatters';

interface SidebarProps {
  currentModule: string;
  onSelectModule: (module: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenQrScanner: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  isMobileOpen,
  onCloseMobile,
  onOpenQrScanner,
}) => {
  const { currentUser, equipments, workOrders, products, quotes, resetDemoData, users, logout, receipts } = useApp();

  // Calculate live badge counts
  const expiredOrUrgentCount = equipments.filter((eq) => {
    const days = calculateDaysRemaining(eq.nextMaintenanceDate);
    return days <= 30; // Vencidos ou menos de 30 dias
  }).length;

  const pendingOsCount = workOrders.filter((wo) => wo.status === 'ABERTA' || wo.status === 'AGENDADA' || wo.status === 'EM_EXECUCAO').length;
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock && p.category !== 'SERVICOS').length;
  const openQuotesCount = quotes.filter((q) => q.status === 'RASCUNHO' || q.status === 'ENVIADO' || q.status === 'EM_NEGOCIACAO').length;

  const handleNavClick = (mod: string) => {
    onSelectModule(mod);
    onCloseMobile();
  };

  const isClientRole = currentUser.role === 'CLIENTE_B2B';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 select-none">
          {/* Cliente B2B Specific Mode Notice if active */}
          {isClientRole ? (
            <div className="space-y-1">
              <div className="px-3 text-[11px] font-semibold text-red-400 uppercase tracking-wider">
                Portal do Cliente B2B
              </div>
              <button
                onClick={() => handleNavClick('clientPortal')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  currentModule === 'clientPortal'
                    ? 'bg-red-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard size={16} />
                  <span>Painel do Cliente</span>
                </div>
              </button>

              <button
                onClick={() => handleNavClick('catalog')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  currentModule === 'catalog'
                    ? 'bg-red-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag size={16} />
                  <span>Catálogo de Produtos</span>
                </div>
              </button>

              <button
                onClick={() => handleNavClick('equipments')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  currentModule === 'equipments'
                    ? 'bg-red-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Flame size={16} />
                  <span>Meus Extintores</span>
                </div>
                {expiredOrUrgentCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {expiredOrUrgentCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('orders')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  currentModule === 'orders'
                    ? 'bg-red-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList size={16} />
                  <span>Histórico de Pedidos</span>
                </div>
              </button>
            </div>
          ) : (
            <>
              {/* Main Dashboard */}
              <div>
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'dashboard'
                      ? 'bg-red-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard size={16} />
                    <span>Visão Geral & Métricas</span>
                  </div>
                </button>
              </div>

              {/* GESTÃO DE EQUIPAMENTOS (Módulo Principal) */}
              <div className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                  Equipamentos & Validade
                </div>

                <button
                  onClick={() => handleNavClick('equipments')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'equipments'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Flame size={16} className="text-red-400" />
                    <span>Extintores Instalados</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('renewals')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'renewals'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle size={16} className="text-amber-400" />
                    <span>Alertas de Vencimento</span>
                  </div>
                  {expiredOrUrgentCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white font-bold animate-pulse">
                      {expiredOrUrgentCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={onOpenQrScanner}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <QrCode size={16} className="text-emerald-400" />
                    <span>Escanear QR Code</span>
                  </div>
                </button>
              </div>

              {/* VENDAS & CRM */}
              <div className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Comercial & CRM
                </div>

                <button
                  onClick={() => handleNavClick('quotes')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'quotes'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={16} />
                    <span>Orçamentos B2B</span>
                  </div>
                  {openQuotesCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {openQuotesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('orders')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'orders'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag size={16} />
                    <span>Pedidos de Venda</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('customers')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'customers'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users size={16} />
                    <span>Clientes & Empresas</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('crm')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'crm'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GitPullRequest size={16} />
                    <span>Funil Comercial (Kanban)</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('employees')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'employees'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users size={16} className="text-amber-400" />
                    <span>Equipe & Vendedores</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {users.filter((u) => u.role === 'VENDEDOR').length} ext
                  </span>
                </button>
              </div>

              {/* SERVIÇOS & MANUTENÇÃO */}
              <div className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Serviços & Técnica
                </div>

                <button
                  onClick={() => handleNavClick('workOrders')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'workOrders'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={16} />
                    <span>Ordens de Serviço (OS)</span>
                  </div>
                  {pendingOsCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {pendingOsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('agenda')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'agenda'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar size={16} />
                    <span>Agenda de Técnicos</span>
                  </div>
                </button>
              </div>

              {/* PRODUTOS & CATÁLOGO */}
              <div className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Produtos & Catálogo
                </div>

                <button
                  onClick={() => handleNavClick('catalog')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'catalog'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Boxes size={16} />
                    <span>Catálogo & Fichas Técnicas</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('priceTables')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'priceTables'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Tag size={16} />
                    <span>Tabelas de Preços</span>
                  </div>
                </button>
              </div>

              {/* ESTOQUE & MULTI-DEPÓSITO */}
              <div className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Estoque & Armazéns
                </div>

                <button
                  onClick={() => handleNavClick('stock')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'stock'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Warehouse size={16} />
                    <span>Posição & Multi-Estoque</span>
                  </div>
                  {lowStockCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {lowStockCount} baixo
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('stockMovements')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'stockMovements'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ArrowLeftRight size={16} />
                    <span>Movimentações & Transferências</span>
                  </div>
                </button>
              </div>

              {/* FINANCEIRO & GESTÃO */}
              <div className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Financeiro & Resultados
                </div>

                <button
                  onClick={() => handleNavClick('financial')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'financial'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BadgeDollarSign size={16} />
                    <span>Contas a Receber</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('receipts')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'receipts'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Receipt size={16} className="text-emerald-400" />
                    <span>Recibos de Pagamento</span>
                  </div>
                  {receipts.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      {receipts.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('commissions')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'commissions'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp size={16} />
                    <span>Comissões de Vendas</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('reports')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'reports'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileCheck2 size={16} />
                    <span>Relatórios & Exportações</span>
                  </div>
                </button>
              </div>

              {/* SISTEMA & CONFIG */}
              <div className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Administração
                </div>

                <button
                  onClick={() => handleNavClick('documents')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'documents'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FolderOpen size={16} />
                    <span>Central de Documentos</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('clientPortal')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'clientPortal'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 size={16} className="text-amber-400" />
                    <span>Prévia Portal Cliente B2B</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('settings')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentModule === 'settings'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings size={16} />
                    <span>Configurações & LGPD</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sidebar Footer with Logout, Reset Demo and System Status */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
          <button
            onClick={() => {
              logout();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-red-300 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sair do Sistema (Logout)</span>
          </button>

          <button
            onClick={() => {
              resetDemoData();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-md transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Restaurar Dados Demonstração</span>
          </button>

          <div className="text-[10px] text-slate-400 text-center leading-tight">
            CONTEC B2B · v2.5.0
            <div className="text-slate-400">Dirceu II · Teresina - PI</div>
          </div>
        </div>
      </aside>
    </>
  );
};
