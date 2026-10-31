import React, { useState, useMemo } from 'react';
import {
  BadgeDollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  DollarSign,
  Calendar,
  Building2,
  FileText,
  Edit2,
  Trash2,
  X,
  Save,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Receipt,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FinancialAccount } from '../types';
import { formatBRL, formatDateBR } from '../utils/formatters';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface FinancialViewProps {
  onSelectModule?: (module: string) => void;
}

export const FinancialView: React.FC<FinancialViewProps> = ({ onSelectModule }) => {
  const {
    financialAccounts,
    commissions,
    updateFinancialAccountStatus,
    updateFinancialAccount,
    deleteFinancialAccount,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'RECEIVABLES' | 'COMMISSIONS'>('RECEIVABLES');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<FinancialAccount | null>(null);
  const [editFormData, setEditFormData] = useState({
    amount: 0,
    dueDate: '',
    paymentMethod: '',
    status: 'ABERTO' as FinancialAccount['status'],
    notes: '',
  });

  const handleOpenEdit = (fa: FinancialAccount) => {
    setEditingAccount(fa);
    setEditFormData({
      amount: fa.amount,
      dueDate: fa.dueDate,
      paymentMethod: fa.paymentMethod || 'Boleto B2B',
      status: fa.status,
      notes: fa.notes || '',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    updateFinancialAccount(editingAccount.id, editFormData);
    setEditingAccount(null);
  };

  const handleDeleteAccount = (fa: FinancialAccount) => {
    setAccountToDelete(fa);
  };

  const filteredAccounts = financialAccounts.filter((fa) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        fa.customerName.toLowerCase().includes(q) ||
        (fa.orderNumber && fa.orderNumber.toLowerCase().includes(q)) ||
        (fa.notes && fa.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Table Column Interactive Sorting
  type FinancialSortField = 'customerName' | 'orderNumber' | 'dueDate' | 'amount' | 'paymentMethod' | 'status';
  type SortDirection = 'asc' | 'desc';

  const [sortField, setSortField] = useState<FinancialSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: FinancialSortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAccounts = useMemo(() => {
    if (!sortField) return filteredAccounts;

    return [...filteredAccounts].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'customerName':
          comparison = a.customerName.localeCompare(b.customerName, undefined, { sensitivity: 'base' });
          break;
        case 'orderNumber':
          comparison = (a.orderNumber || '').localeCompare(b.orderNumber || '', undefined, { numeric: true });
          break;
        case 'dueDate': {
          const dateA = new Date(a.dueDate).getTime();
          const dateB = new Date(b.dueDate).getTime();
          comparison = dateA - dateB;
          break;
        }
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'paymentMethod':
          comparison = (a.paymentMethod || '').localeCompare(b.paymentMethod || '');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredAccounts, sortField, sortDirection]);

  // Calculations
  const totalReceivables = filteredAccounts.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = filteredAccounts
    .filter((fa) => fa.status === 'PAGO')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalOverdue = filteredAccounts
    .filter((fa) => fa.status === 'ATRASADO')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = filteredAccounts
    .filter((fa) => fa.status === 'ABERTO')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalCommissions = commissions.reduce((acc, curr) => acc + curr.commissionAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BadgeDollarSign size={20} className="text-red-600" />
              <span>Gestão Financeira & Comissões de Vendas</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de cobranças, títulos a receber de clientes B2B, status de liquidação e comissionamento de consultores externos.
          </p>
        </div>

        {onSelectModule && (
          <button
            onClick={() => onSelectModule('receipts')}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Receipt size={15} />
            <span>Emissão de Recibos de Pagamento</span>
          </button>
        )}

      {/* Tab Toggle & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, pedido ou observação..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('RECEIVABLES')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'RECEIVABLES' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Contas a Receber
          </button>
          <button
            onClick={() => setActiveTab('COMMISSIONS')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'COMMISSIONS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Comissões de Vendedores
          </button>
        </div>
      </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total a Receber (Geral)</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {formatBRL(totalReceivables)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Liquidado / Recebido</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1 tabular-nums">
            {formatBRL(totalPaid)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">A Vencer (Dentro do Prazo)</div>
          <div className="text-xl font-bold font-mono text-blue-600 mt-1 tabular-nums">
            {formatBRL(totalPending)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Títulos em Atraso</div>
          <div className="text-xl font-bold font-mono text-red-600 mt-1 tabular-nums">
            {formatBRL(totalOverdue)}
          </div>
        </div>
      </div>

      {/* Sorting Status indicator bar */}
      {sortField && (
        <div className="flex items-center justify-between bg-slate-100/80 border border-slate-200/90 px-3.5 py-1.5 rounded-lg text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-semibold text-slate-900">Ordenação ativa:</span>
            <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded-md font-mono text-[11px]">
              {sortField === 'customerName' && 'Cliente'}
              {sortField === 'orderNumber' && 'Pedido / Parcela'}
              {sortField === 'dueDate' && 'Data de Vencimento'}
              {sortField === 'amount' && 'Valor do Título'}
              {sortField === 'paymentMethod' && 'Forma de Pagamento'}
              {sortField === 'status' && 'Status'}
            </span>
            <span className="text-slate-500 font-medium">
              ({sortDirection === 'asc' ? 'Crescente: A-Z / 1-9 / Mais antigos' : 'Decrescente: Z-A / 9-1 / Mais recentes'})
            </span>
          </div>
          <button
            onClick={() => setSortField(null)}
            className="text-xs text-red-600 hover:text-red-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <X size={12} />
            <span>Limpar ordenação</span>
          </button>
        </div>
      )}

      {/* Tab 1: Receivables */}
      {activeTab === 'RECEIVABLES' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider select-none">
                <tr>
                  {/* 1. Cliente */}
                  <th
                    onClick={() => handleSort('customerName')}
                    className={`py-3 px-4 cursor-pointer transition-colors group ${
                      sortField === 'customerName'
                        ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                        : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title="Clique para ordenar por Cliente (A-Z ou Z-A)"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Cliente</span>
                      {sortField === 'customerName' ? (
                        <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                          {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                          {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                        </span>
                      ) : (
                        <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* 2. Pedido / Parcela */}
                  <th
                    onClick={() => handleSort('orderNumber')}
                    className={`py-3 px-4 cursor-pointer transition-colors group ${
                      sortField === 'orderNumber'
                        ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                        : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title="Clique para ordenar por Pedido / Parcela"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Pedido / Parcela</span>
                      {sortField === 'orderNumber' ? (
                        <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                          {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                          {sortDirection === 'asc' ? '1-9' : '9-1'}
                        </span>
                      ) : (
                        <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* 3. Vencimento */}
                  <th
                    onClick={() => handleSort('dueDate')}
                    className={`py-3 px-4 cursor-pointer transition-colors group ${
                      sortField === 'dueDate'
                        ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                        : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title="Clique para ordenar por Data de Vencimento"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Vencimento</span>
                      {sortField === 'dueDate' ? (
                        <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                          {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                          {sortDirection === 'asc' ? 'Antigos' : 'Recentes'}
                        </span>
                      ) : (
                        <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* 4. Valor */}
                  <th
                    onClick={() => handleSort('amount')}
                    className={`py-3 px-4 cursor-pointer transition-colors group ${
                      sortField === 'amount'
                        ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                        : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title="Clique para ordenar por Valor (Numérica)"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Valor</span>
                      {sortField === 'amount' ? (
                        <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                          {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                          {sortDirection === 'asc' ? 'Menor' : 'Maior'}
                        </span>
                      ) : (
                        <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* 5. Forma */}
                  <th
                    onClick={() => handleSort('paymentMethod')}
                    className={`py-3 px-4 cursor-pointer transition-colors group ${
                      sortField === 'paymentMethod'
                        ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                        : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title="Clique para ordenar por Forma de Pagamento"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Forma</span>
                      {sortField === 'paymentMethod' ? (
                        <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                          {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                          {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                        </span>
                      ) : (
                        <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* 6. Status */}
                  <th
                    onClick={() => handleSort('status')}
                    className={`py-3 px-4 cursor-pointer transition-colors group ${
                      sortField === 'status'
                        ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                        : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title="Clique para ordenar por Status"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {sortField === 'status' ? (
                        <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                          {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                          {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                        </span>
                      ) : (
                        <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* 7. Ação */}
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedAccounts.map((fa) => (
                  <tr key={fa.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{fa.customerName}</div>
                      {fa.notes && <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded inline-block mt-0.5">{fa.notes}</div>}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 inline-block">
                        {fa.orderNumber || 'Ordem B2B'} (Parc: {fa.installment})
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-xs">
                      <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-semibold">
                        {formatDateBR(fa.dueDate)}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold">
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs shadow-2xs">
                        {formatBRL(fa.amount)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 inline-block font-medium">
                        {fa.paymentMethod || 'Boleto B2B'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs ${
                          fa.status === 'PAGO'
                            ? 'bg-emerald-600 text-white'
                            : fa.status === 'ATRASADO'
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {fa.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(fa)}
                          title="Editar Título Financeiro"
                          className="p-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          onClick={() => handleDeleteAccount(fa)}
                          title="Excluir Título"
                          className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>

                        {fa.status !== 'PAGO' && (
                          <button
                            onClick={() => updateFinancialAccountStatus(fa.id, 'PAGO')}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                          >
                            Baixar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Commissions */}
      {activeTab === 'COMMISSIONS' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-3 p-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase">
              Demonstrativo de Comissões por Venda Fechada
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-700">
              Total acumulado: {formatBRL(totalCommissions)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Vendedor</th>
                  <th className="py-2.5 px-3">Pedido / Cliente</th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3 text-right">Valor Venda</th>
                  <th className="py-2.5 px-3 text-center">Taxa (%)</th>
                  <th className="py-2.5 px-3 text-right">Comissão</th>
                  <th className="py-2.5 px-3 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{c.salespersonName}</td>
                    <td className="py-2.5 px-3">
                      <div className="text-slate-800">{c.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.orderNumber}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{formatDateBR(c.date)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800">{formatBRL(c.orderTotal)}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600">{c.commissionPercentage}%</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">{formatBRL(c.commissionAmount)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'PAGA' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Financial Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <BadgeDollarSign size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Editar Título: {editingAccount.customerName}
                </h3>
              </div>
              <button
                onClick={() => setEditingAccount(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.dueDate}
                    onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Forma de Pagamento
                  </label>
                  <input
                    type="text"
                    value={editFormData.paymentMethod}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                    placeholder="Forma de pagamento"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Status do Título *
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status: e.target.value as FinancialAccount['status'],
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="ABERTO">ABERTO (A Vencer)</option>
                    <option value="PAGO">PAGO (Liquidado)</option>
                    <option value="ATRASADO">ATRASADO</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                  Observações / NF / Histórico
                </label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Informações adicionais da cobrança..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteAccount(editingAccount)}
                  className="px-3 py-2 bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-800/60 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Excluir Título</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow flex items-center gap-1.5"
                  >
                    <Save size={14} />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Financial Account Modal */}
      <ConfirmModal
        isOpen={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={() => {
          if (accountToDelete) {
            deleteFinancialAccount(accountToDelete.id);
            if (editingAccount?.id === accountToDelete.id) {
              setEditingAccount(null);
            }
            setAccountToDelete(null);
          }
        }}
        title="Excluir Título Financeiro"
        message={`Tem certeza que deseja excluir o título financeiro de ${formatBRL(accountToDelete?.amount || 0)} do cliente ${accountToDelete?.customerName}?\n\nEsta operação removerá o lançamento a receber.`}
        confirmLabel="Sim, Excluir Lançamento"
        variant="danger"
      />
    </div>
  );
};
