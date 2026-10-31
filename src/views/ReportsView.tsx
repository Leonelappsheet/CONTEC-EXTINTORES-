import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Download,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  Flame,
  ShieldCheck,
  TrendingUp,
  Warehouse,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  CheckCircle2,
  AlertTriangle,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatBRL, formatDateBR, calculateDaysRemaining, formatCNPJ } from '../utils/formatters';

type ReportType = 'EQUIPMENTS' | 'SALES' | 'STOCK' | 'OS' | 'COMMISSIONS';

export const ReportsView: React.FC = () => {
  const { orders, equipments, products, workOrders, commissions, customers } = useApp();
  const [reportType, setReportType] = useState<ReportType>('EQUIPMENTS');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Handle Sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField('');
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Reset filters when switching report type
  const handleSelectReportType = (type: ReportType) => {
    setReportType(type);
    setSearchQuery('');
    setStatusFilter('ALL');
    setCustomerFilter('ALL');
    setSortField('');
    setSortDirection('asc');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCustomerFilter('ALL');
    setSortField('');
    setSortDirection('asc');
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || customerFilter !== 'ALL' || sortField !== '';

  // 1. Filtered & Sorted Equipments
  const filteredEquipments = useMemo(() => {
    let list = [...equipments];

    if (customerFilter !== 'ALL') {
      list = list.filter((e) => e.customerName.toLowerCase() === customerFilter.toLowerCase());
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((e) => {
        const days = calculateDaysRemaining(e.nextMaintenanceDate);
        if (statusFilter === 'VENCIDOS') return days < 0;
        if (statusFilter === 'CRITICOS') return days >= 0 && days <= 30;
        if (statusFilter === 'ATENCAO') return days > 30 && days <= 90;
        if (statusFilter === 'REGULARES') return days > 90;
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.patrimonyNumber.toLowerCase().includes(q) ||
          e.customerName.toLowerCase().includes(q) ||
          e.agent.toLowerCase().includes(q) ||
          e.environment.toLowerCase().includes(q) ||
          e.internalCode.toLowerCase().includes(q) ||
          e.serialNumber.toLowerCase().includes(q)
      );
    }

    if (sortField) {
      list.sort((a, b) => {
        let valA: any = (a as any)[sortField];
        let valB: any = (b as any)[sortField];

        if (sortField === 'daysRemaining') {
          valA = calculateDaysRemaining(a.nextMaintenanceDate);
          valB = calculateDaysRemaining(b.nextMaintenanceDate);
        }

        if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    return list;
  }, [equipments, customerFilter, statusFilter, searchQuery, sortField, sortDirection]);

  // 2. Filtered & Sorted Sales
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (customerFilter !== 'ALL') {
      list = list.filter((o) => o.customerName.toLowerCase() === customerFilter.toLowerCase());
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((o) => o.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.paymentMethod.toLowerCase().includes(q) ||
          o.customerDocument.includes(q)
      );
    }

    if (sortField) {
      list.sort((a, b) => {
        let valA = (a as any)[sortField];
        let valB = (b as any)[sortField];
        if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    return list;
  }, [orders, customerFilter, statusFilter, searchQuery, sortField, sortDirection]);

  // 3. Filtered & Sorted Stock
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (statusFilter !== 'ALL') {
      list = list.filter((p) => {
        const isLow = p.currentStock <= p.minStock;
        if (statusFilter === 'LOW') return isLow;
        if (statusFilter === 'NORMAL') return !isLow;
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.stockLocation.toLowerCase().includes(q)
      );
    }

    if (sortField) {
      list.sort((a, b) => {
        let valA = (a as any)[sortField];
        let valB = (b as any)[sortField];
        if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    return list;
  }, [products, statusFilter, searchQuery, sortField, sortDirection]);

  // 4. Filtered & Sorted Work Orders
  const filteredWorkOrders = useMemo(() => {
    let list = [...workOrders];

    if (customerFilter !== 'ALL') {
      list = list.filter((w) => w.customerName.toLowerCase() === customerFilter.toLowerCase());
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((w) => w.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (w) =>
          w.code.toLowerCase().includes(q) ||
          w.customerName.toLowerCase().includes(q) ||
          w.technicianName.toLowerCase().includes(q) ||
          w.type.toLowerCase().includes(q)
      );
    }

    if (sortField) {
      list.sort((a, b) => {
        let valA = (a as any)[sortField];
        let valB = (b as any)[sortField];
        if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    return list;
  }, [workOrders, customerFilter, statusFilter, searchQuery, sortField, sortDirection]);

  // 5. Filtered & Sorted Commissions
  const filteredCommissions = useMemo(() => {
    let list = [...commissions];

    if (customerFilter !== 'ALL') {
      list = list.filter((c) => c.customerName.toLowerCase() === customerFilter.toLowerCase());
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((c) => c.salespersonName === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.salespersonName.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.orderNumber.toLowerCase().includes(q)
      );
    }

    if (sortField) {
      list.sort((a, b) => {
        let valA = (a as any)[sortField];
        let valB = (b as any)[sortField];
        if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    return list;
  }, [commissions, customerFilter, statusFilter, searchQuery, sortField, sortDirection]);

  // Current filtered count
  const currentFilteredCount = useMemo(() => {
    switch (reportType) {
      case 'EQUIPMENTS':
        return filteredEquipments.length;
      case 'SALES':
        return filteredOrders.length;
      case 'STOCK':
        return filteredProducts.length;
      case 'OS':
        return filteredWorkOrders.length;
      case 'COMMISSIONS':
        return filteredCommissions.length;
    }
  }, [reportType, filteredEquipments, filteredOrders, filteredProducts, filteredWorkOrders, filteredCommissions]);

  const totalRawCount = useMemo(() => {
    switch (reportType) {
      case 'EQUIPMENTS':
        return equipments.length;
      case 'SALES':
        return orders.length;
      case 'STOCK':
        return products.length;
      case 'OS':
        return workOrders.length;
      case 'COMMISSIONS':
        return commissions.length;
    }
  }, [reportType, equipments, orders, products, workOrders, commissions]);

  // Export CSV of currently filtered data
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `CONTEC_Relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

    if (reportType === 'EQUIPMENTS') {
      headers = ['Patrimonio', 'Cliente', 'Agente', 'Capacidade', 'Ambiente', 'VencimentoRecarga', 'DiasRestantes', 'Situacao'];
      rows = filteredEquipments.map((e) => {
        const days = calculateDaysRemaining(e.nextMaintenanceDate);
        const sit = days < 0 ? 'VENCIDO' : days <= 30 ? 'CRITICO' : days <= 90 ? 'ATENCAO' : 'REGULAR';
        return [
          `"${e.patrimonyNumber}"`,
          `"${e.customerName}"`,
          `"${e.agent}"`,
          `"${e.capacity}"`,
          `"${e.environment}"`,
          `"${formatDateBR(e.nextMaintenanceDate)}"`,
          days.toString(),
          `"${sit}"`,
        ];
      });
    } else if (reportType === 'SALES') {
      headers = ['NumeroPedido', 'Cliente', 'Data', 'Total', 'FormaPagamento', 'Status'];
      rows = filteredOrders.map((o) => [
        `"${o.orderNumber}"`,
        `"${o.customerName}"`,
        `"${formatDateBR(o.createdAt)}"`,
        o.totalAmount.toFixed(2),
        `"${o.paymentMethod}"`,
        `"${o.status}"`,
      ]);
    } else if (reportType === 'STOCK') {
      headers = ['SKU', 'Produto', 'Categoria', 'EstoqueAtual', 'EstoqueMinimo', 'Localizacao', 'Situacao'];
      rows = filteredProducts.map((p) => [
        `"${p.sku}"`,
        `"${p.name}"`,
        `"${p.category}"`,
        p.currentStock.toString(),
        p.minStock.toString(),
        `"${p.stockLocation}"`,
        p.currentStock <= p.minStock ? '"ESTOQUE_BAIXO"' : '"NORMAL"',
      ]);
    } else if (reportType === 'OS') {
      headers = ['CodigoOS', 'Cliente', 'Tipo', 'Tecnico', 'Data', 'Status'];
      rows = filteredWorkOrders.map((w) => [
        `"${w.code}"`,
        `"${w.customerName}"`,
        `"${w.type}"`,
        `"${w.technicianName}"`,
        `"${formatDateBR(w.scheduledDate)}"`,
        `"${w.status}"`,
      ]);
    } else {
      headers = ['Vendedor', 'Cliente', 'Pedido', 'Data', 'ValorVenda', 'Comissao'];
      rows = filteredCommissions.map((c) => [
        `"${c.salespersonName}"`,
        `"${c.customerName}"`,
        `"${c.orderNumber}"`,
        `"${formatDateBR(c.date)}"`,
        c.orderTotal.toFixed(2),
        c.commissionAmount.toFixed(2),
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unique salespersons for Commissions report
  const uniqueSalespersons = useMemo(() => {
    return Array.from(new Set(commissions.map((c) => c.salespersonName))).filter(Boolean);
  }, [commissions]);

  const getSearchPlaceholder = () => {
    switch (reportType) {
      case 'EQUIPMENTS':
        return 'Filtrar por patrimônio, cliente, agente ou ambiente...';
      case 'SALES':
        return 'Filtrar por nº do pedido, cliente, documento...';
      case 'STOCK':
        return 'Filtrar por produto, código SKU, localização...';
      case 'OS':
        return 'Filtrar por código da OS, cliente, técnico...';
      case 'COMMISSIONS':
        return 'Filtrar por vendedor, cliente, pedido...';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 size={20} className="text-red-600" />
              <span>Central de Relatórios Executivos & Auditoria</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Geração de relatórios operacionais consolidados com filtros em tempo real, exportação para CSV/Excel e impressão gerencial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer"
            title="Exportar registros filtrados em CSV compatível com Excel"
          >
            <Download size={14} />
            <span>Exportar Filtrados (CSV)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer size={14} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Select Report Type Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => handleSelectReportType('EQUIPMENTS')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            reportType === 'EQUIPMENTS'
              ? 'bg-red-50/50 border-red-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <Flame size={18} className={reportType === 'EQUIPMENTS' ? 'text-red-600' : 'text-slate-400'} />
          <div className="text-xs font-bold text-slate-900 mt-2">Vencimento de Extintores</div>
          <div className="text-[10px] text-slate-500">{equipments.length} monitorados</div>
        </button>

        <button
          onClick={() => handleSelectReportType('SALES')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            reportType === 'SALES'
              ? 'bg-red-50/50 border-red-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <TrendingUp size={18} className={reportType === 'SALES' ? 'text-red-600' : 'text-slate-400'} />
          <div className="text-xs font-bold text-slate-900 mt-2">Vendas & Faturamento</div>
          <div className="text-[10px] text-slate-500">{orders.length} pedidos</div>
        </button>

        <button
          onClick={() => handleSelectReportType('STOCK')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            reportType === 'STOCK'
              ? 'bg-red-50/50 border-red-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <Warehouse size={18} className={reportType === 'STOCK' ? 'text-red-600' : 'text-slate-400'} />
          <div className="text-xs font-bold text-slate-900 mt-2">Posição de Estoque</div>
          <div className="text-[10px] text-slate-500">{products.length} itens</div>
        </button>

        <button
          onClick={() => handleSelectReportType('OS')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            reportType === 'OS'
              ? 'bg-red-50/50 border-red-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <ShieldCheck size={18} className={reportType === 'OS' ? 'text-red-600' : 'text-slate-400'} />
          <div className="text-xs font-bold text-slate-900 mt-2">Ordens de Serviço</div>
          <div className="text-[10px] text-slate-500">{workOrders.length} atendimentos</div>
        </button>

        <button
          onClick={() => handleSelectReportType('COMMISSIONS')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            reportType === 'COMMISSIONS'
              ? 'bg-red-50/50 border-red-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <DollarSign size={18} className={reportType === 'COMMISSIONS' ? 'text-red-600' : 'text-slate-400'} />
          <div className="text-xs font-bold text-slate-900 mt-2">Comissões de Vendas</div>
          <div className="text-[10px] text-slate-500">{commissions.length} registros</div>
        </button>
      </div>

      {/* Report Data Preview Table with Filter Header */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs p-4 sm:p-5 space-y-4">
        {/* Header section with Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <FileCheck2 size={16} className="text-red-600" />
              <span>Pré-visualização do Relatório Selecionado</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Visualize em tempo real os registros correspondentes aos filtros aplicados.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
              Exibindo <strong>{currentFilteredCount}</strong> de <strong>{totalRawCount}</strong> registros
            </span>
          </div>
        </div>

        {/* Dedicated Filter Box */}
        <div className="bg-slate-100/90 border border-slate-200/90 rounded-xl p-3.5 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-600 text-white rounded-lg shadow-2xs">
                <Filter size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Filtros de Relatório
                </h4>
                <p className="text-[11px] text-slate-500">
                  Refine por texto, situação, cliente e ordene colunas clicando no cabeçalho
                </p>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-bold bg-white hover:bg-red-50 border border-red-200 px-3 py-1 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <X size={13} />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
            {/* Search Input */}
            <div className="sm:col-span-5 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-red-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Dynamic Status / Situation Filter */}
            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-red-500 shadow-2xs cursor-pointer font-medium"
              >
                {reportType === 'EQUIPMENTS' && (
                  <>
                    <option value="ALL">Todas as Situações</option>
                    <option value="VENCIDOS">⚠️ Apenas Vencidos (&lt; 0 dias)</option>
                    <option value="CRITICOS">⚡ Vence em até 30d (Crítico)</option>
                    <option value="ATENCAO">📅 Vence em 31 a 90d (Atenção)</option>
                    <option value="REGULARES">✅ Regulares (&gt; 90 dias)</option>
                  </>
                )}

                {reportType === 'SALES' && (
                  <>
                    <option value="ALL">Todos os Status de Pedido</option>
                    <option value="APROVADO">Aprovado</option>
                    <option value="CONCLUIDO">Concluído</option>
                    <option value="ENTREGA">Entrega</option>
                    <option value="EXPEDICAO">Expedição</option>
                    <option value="FATURAMENTO">Faturamento</option>
                    <option value="SEPARACAO">Separação</option>
                    <option value="CANCELADO">Cancelado</option>
                  </>
                )}

                {reportType === 'STOCK' && (
                  <>
                    <option value="ALL">Toda a Situação de Estoque</option>
                    <option value="LOW">⚠️ Apenas Estoque Baixo</option>
                    <option value="NORMAL">✅ Estoque Normal</option>
                  </>
                )}

                {reportType === 'OS' && (
                  <>
                    <option value="ALL">Todos os Status de OS</option>
                    <option value="AGENDADA">Agendada</option>
                    <option value="EM_EXECUCAO">Em Execução</option>
                    <option value="CONCLUIDA">Concluída</option>
                  </>
                )}

                {reportType === 'COMMISSIONS' && (
                  <>
                    <option value="ALL">Todos os Vendedores</option>
                    {uniqueSalespersons.map((seller) => (
                      <option key={seller} value={seller}>
                        {seller}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Customer Filter (Applicable to Equipments, Sales, OS, Commissions) */}
            <div className="sm:col-span-4">
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                disabled={reportType === 'STOCK'}
                className="w-full py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-red-500 shadow-2xs cursor-pointer font-medium disabled:opacity-50 disabled:bg-slate-100"
              >
                <option value="ALL">Todos os Clientes B2B</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          {/* 1. EQUIPMENTS REPORT PREVIEW */}
          {reportType === 'EQUIPMENTS' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200 select-none">
                <tr>
                  <th
                    onClick={() => handleSort('patrimonyNumber')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Patrimônio</span>
                      {sortField === 'patrimonyNumber' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('customerName')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Cliente</span>
                      {sortField === 'customerName' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('agent')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Agente / Cap.</span>
                      {sortField === 'agent' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('environment')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Ambiente</span>
                      {sortField === 'environment' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('nextMaintenanceDate')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Próx. Recarga</span>
                      {sortField === 'nextMaintenanceDate' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('daysRemaining')}
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Dias Restantes</span>
                      {sortField === 'daysRemaining' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEquipments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Nenhum extintor encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredEquipments.map((e) => {
                    const days = calculateDaysRemaining(e.nextMaintenanceDate);
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded text-xs shadow-2xs">
                            {e.patrimonyNumber}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {e.customerName}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-xs font-semibold">
                            {e.agent} {e.capacity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 text-xs">
                          <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                            {e.environment}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 text-xs">
                          <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                            {formatDateBR(e.nextMaintenanceDate)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-xs">
                          <span className={days < 0 ? 'text-red-700' : days <= 30 ? 'text-amber-700' : 'text-slate-800'}>
                            {days}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs uppercase tracking-wide ${
                              days < 0
                                ? 'bg-red-600 text-white animate-pulse'
                                : days <= 30
                                ? 'bg-amber-500 text-white'
                                : days <= 90
                                ? 'bg-blue-600 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {days < 0 ? 'VENCIDO' : days <= 30 ? 'CRÍTICO' : days <= 90 ? 'ATENÇÃO' : 'REGULAR'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* 2. SALES REPORT PREVIEW */}
          {reportType === 'SALES' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200 select-none">
                <tr>
                  <th
                    onClick={() => handleSort('orderNumber')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Pedido</span>
                      {sortField === 'orderNumber' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('customerName')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Cliente</span>
                      {sortField === 'customerName' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Data</span>
                      {sortField === 'createdAt' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('totalAmount')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Valor Total</span>
                      {sortField === 'totalAmount' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3">Forma Pagto</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Nenhum pedido encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md text-xs shadow-2xs">
                          {o.orderNumber}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{o.customerName}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-xs">
                        <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          {formatDateBR(o.createdAt)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs shadow-2xs">
                          {formatBRL(o.totalAmount)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 inline-block font-medium">
                          {o.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs ${
                            o.status === 'CONCLUIDO' || o.status === 'ENTREGA'
                              ? 'bg-emerald-600 text-white'
                              : o.status === 'APROVADO'
                              ? 'bg-blue-600 text-white'
                              : o.status === 'CANCELADO'
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* 3. STOCK REPORT PREVIEW */}
          {reportType === 'STOCK' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200 select-none">
                <tr>
                  <th
                    onClick={() => handleSort('sku')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>SKU</span>
                      {sortField === 'sku' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Produto</span>
                      {sortField === 'name' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3">Categoria</th>
                  <th
                    onClick={() => handleSort('currentStock')}
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Estoque Atual</span>
                      {sortField === 'currentStock' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Mínimo</th>
                  <th className="py-3 px-3">Localização</th>
                  <th className="py-3 px-3 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Nenhum produto encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLow = p.currentStock <= p.minStock;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs font-semibold">
                            {p.sku}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{p.name}</td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-xs">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono font-bold text-xs shadow-2xs">
                            {p.currentStock} {p.unit}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600 text-xs">{p.minStock}</td>
                        <td className="py-2.5 px-3 text-slate-700 text-xs">
                          <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
                            {p.stockLocation}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                              <AlertTriangle size={11} /> Estoque Baixo
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* 4. WORK ORDERS REPORT PREVIEW */}
          {reportType === 'OS' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200 select-none">
                <tr>
                  <th
                    onClick={() => handleSort('code')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Código OS</span>
                      {sortField === 'code' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('customerName')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Cliente</span>
                      {sortField === 'customerName' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Técnico Responsável</th>
                  <th
                    onClick={() => handleSort('scheduledDate')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Data Agendada</span>
                      {sortField === 'scheduledDate' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Nenhuma ordem de serviço encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredWorkOrders.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md text-xs shadow-2xs">
                          {w.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{w.customerName}</td>
                      <td className="py-2.5 px-3">
                        <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase shadow-2xs">
                          {w.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-xs">
                          <User size={11} className="text-slate-400" />
                          <span>{w.technicianName}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono text-xs">
                        <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          {formatDateBR(w.scheduledDate)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs uppercase tracking-wide ${
                            w.status === 'CONCLUIDA'
                              ? 'bg-emerald-600 text-white'
                              : w.status === 'EM_EXECUCAO'
                              ? 'bg-blue-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* 5. COMMISSIONS REPORT PREVIEW */}
          {reportType === 'COMMISSIONS' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200 select-none">
                <tr>
                  <th
                    onClick={() => handleSort('salespersonName')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Vendedor</span>
                      {sortField === 'salespersonName' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('customerName')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Cliente</span>
                      {sortField === 'customerName' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3">Pedido</th>
                  <th
                    onClick={() => handleSort('date')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Data</span>
                      {sortField === 'date' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('orderTotal')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Valor Venda</span>
                      {sortField === 'orderTotal' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('commissionAmount')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Comissão</span>
                      {sortField === 'commissionAmount' ? (
                        sortDirection === 'asc' ? <ArrowUp size={11} className="text-red-600" /> : <ArrowDown size={11} className="text-red-600" />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCommissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Nenhum registro de comissão encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredCommissions.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs">
                          <User size={11} className="text-slate-400" />
                          <span>{c.salespersonName}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{c.customerName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 text-xs">
                        <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                          {c.orderNumber}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-xs">
                        {formatDateBR(c.date)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                        {formatBRL(c.orderTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs shadow-2xs">
                          {formatBRL(c.commissionAmount)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
