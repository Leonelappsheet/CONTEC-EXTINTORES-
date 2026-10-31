import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  FileText,
  User,
  Phone,
  RefreshCw,
  X,
  ExternalLink,
  Edit2,
  Trash2,
  Save,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus } from '../types';
import { formatBRL, formatDateBR, formatCNPJ } from '../utils/formatters';
import { ConfirmModal } from '../components/common/ConfirmModal';

const ORDER_STAGES: OrderStatus[] = [
  'APROVADO',
  'PEDIDO',
  'SEPARACAO',
  'FATURAMENTO',
  'EXPEDICAO',
  'ENTREGA',
  'CONCLUIDO',
];

export const OrdersView: React.FC = () => {
  const { orders, updateOrderStatus, updateOrder, deleteOrder, currentUser, getWhatsAppOrderUrl } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Edit fields for selected order
  const [editAddress, setEditAddress] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState<Order['paymentStatus']>('Pendente');
  const [editPaymentMethod, setEditPaymentMethod] = useState<Order['paymentMethod']>('Boleto B2B');
  const [editNotes, setEditNotes] = useState('');
  const [editDriver, setEditDriver] = useState('');
  const [editVehicle, setEditVehicle] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const handleOpenOrder = (ord: Order) => {
    setSelectedOrderDetails(ord);
    setEditAddress(ord.deliveryAddress || '');
    setEditPaymentStatus(ord.paymentStatus || 'Pendente');
    setEditPaymentMethod(ord.paymentMethod || 'Boleto B2B');
    setEditNotes(ord.notes || '');
    setEditDriver(ord.deliveryDriver || 'Equipe de Frota CONTEC');
    setEditVehicle(ord.deliveryVehicle || 'Fiorino Branca (Placa PIX-4021)');
    setIsSavedNotice(false);
  };

  const handleSaveOrderEdits = () => {
    if (!selectedOrderDetails) return;
    updateOrder(selectedOrderDetails.id, {
      deliveryAddress: editAddress,
      paymentStatus: editPaymentStatus,
      paymentMethod: editPaymentMethod,
      notes: editNotes,
      deliveryDriver: editDriver,
      deliveryVehicle: editVehicle,
    });
    setSelectedOrderDetails({
      ...selectedOrderDetails,
      deliveryAddress: editAddress,
      paymentStatus: editPaymentStatus,
      paymentMethod: editPaymentMethod,
      notes: editNotes,
      deliveryDriver: editDriver,
      deliveryVehicle: editVehicle,
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleDeleteOrder = (ord: Order) => {
    setOrderToDelete(ord);
  };

  // Client B2B filtering
  const effectiveOrders =
    currentUser.role === 'CLIENTE_B2B' && currentUser.customerId
      ? orders.filter((o) => o.customerId === currentUser.customerId)
      : orders;

  const filteredOrders = effectiveOrders.filter((o) => {
    if (selectedStatus !== 'ALL' && o.status !== selectedStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.salespersonName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Table Column Interactive Sorting
  type OrderSortField = 'orderNumber' | 'customerName' | 'createdAt' | 'totalAmount' | 'paymentStatus' | 'status';
  type SortDirection = 'asc' | 'desc';

  const [sortField, setSortField] = useState<OrderSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: OrderSortField) => {
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

  const sortedOrders = useMemo(() => {
    if (!sortField) return filteredOrders;

    return [...filteredOrders].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'orderNumber':
          comparison = a.orderNumber.localeCompare(b.orderNumber, undefined, { numeric: true });
          break;
        case 'customerName':
          comparison = a.customerName.localeCompare(b.customerName, undefined, { sensitivity: 'base' });
          break;
        case 'createdAt': {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
        case 'totalAmount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        case 'paymentStatus':
          comparison = (a.paymentStatus || '').localeCompare(b.paymentStatus || '');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredOrders, sortField, sortDirection]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'CONCLUIDO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'EXPEDICAO':
      case 'ENTREGA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FATURAMENTO':
      case 'SEPARACAO':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag size={20} className="text-red-600" />
              <span>Pedidos de Venda B2B & Acompanhamento de Entrega</span>
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {filteredOrders.length} pedidos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fluxo operacional completo da aprovação, separação de estoque, faturamento, logística de frota até a entrega final em Teresina.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número do pedido (PED-...), cliente..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
        >
          <option value="ALL">Todos os Status Operacionais</option>
          <option value="APROVADO">Aprovado</option>
          <option value="SEPARACAO">Separação</option>
          <option value="FATURAMENTO">Faturamento</option>
          <option value="EXPEDICAO">Expedição / Rota</option>
          <option value="ENTREGA">Saiu para Entrega</option>
          <option value="CONCLUIDO">Concluído</option>
        </select>
      </div>

      {/* Sorting Status indicator bar */}
      {sortField && (
        <div className="flex items-center justify-between bg-slate-100/80 border border-slate-200/90 px-3.5 py-1.5 rounded-lg text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-semibold text-slate-900">Ordenação ativa:</span>
            <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded-md font-mono text-[11px]">
              {sortField === 'orderNumber' && 'Nº do Pedido'}
              {sortField === 'customerName' && 'Cliente'}
              {sortField === 'createdAt' && 'Data de Emissão'}
              {sortField === 'totalAmount' && 'Valor Total'}
              {sortField === 'paymentStatus' && 'Status do Pagamento'}
              {sortField === 'status' && 'Status Operacional'}
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

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider select-none">
              <tr>
                {/* 1. Nº do Pedido */}
                <th
                  onClick={() => handleSort('orderNumber')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'orderNumber'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Número do Pedido"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nº do Pedido</span>
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

                {/* 2. Cliente */}
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

                {/* 3. Data Emissão */}
                <th
                  onClick={() => handleSort('createdAt')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'createdAt'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Data de Emissão"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Data Emissão</span>
                    {sortField === 'createdAt' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? 'Antigos' : 'Recentes'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 4. Valor Total */}
                <th
                  onClick={() => handleSort('totalAmount')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'totalAmount'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Valor Total (Numérica)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Valor Total</span>
                    {sortField === 'totalAmount' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? 'Menor' : 'Maior'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 5. Pagamento */}
                <th
                  onClick={() => handleSort('paymentStatus')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'paymentStatus'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Status do Pagamento"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Pagamento</span>
                    {sortField === 'paymentStatus' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 6. Status Atual */}
                <th
                  onClick={() => handleSort('status')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'status'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Status Atual"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status Atual</span>
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

                {/* 7. Ações */}
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedOrders.map((ord) => (
                <tr
                  key={ord.id}
                  onClick={() => setSelectedOrderDetails(ord)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md text-xs shadow-2xs">
                      {ord.orderNumber}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{ord.customerName}</div>
                    <div className="text-[10px] text-slate-600 font-mono inline-block bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded mt-0.5">
                      {formatCNPJ(ord.customerDocument)}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-700 font-mono text-xs">
                    <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                      {formatDateBR(ord.createdAt)}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs shadow-2xs">
                      {formatBRL(ord.totalAmount)}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium">
                      {ord.paymentMethod}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">{ord.paymentStatus}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs border ${getStatusColor(
                        ord.status
                      )}`}
                    >
                      {ord.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={getWhatsAppOrderUrl(ord)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                        title="Enviar Status pelo WhatsApp"
                      >
                        <Phone size={14} />
                      </a>

                      <button
                        onClick={() => handleOpenOrder(ord)}
                        title="Editar Informações do Pedido"
                        className="p-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteOrder(ord)}
                        title="Excluir Pedido"
                        className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>

                      <button
                        onClick={() => handleOpenOrder(ord)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md"
                      >
                        Acompanhar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details and Status Advancement Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-red-400" />
                <h3 className="text-sm font-bold text-white">
                  Pedido {selectedOrderDetails.orderNumber} · {selectedOrderDetails.customerName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
              {/* Status Progression Bar */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Etapa de Atendimento do Pedido
                </span>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {ORDER_STAGES.map((stg) => {
                    const isCurrent = selectedOrderDetails.status === stg;
                    return (
                      <button
                        key={stg}
                        disabled={currentUser.role === 'CLIENTE_B2B'}
                        onClick={() => {
                          updateOrderStatus(selectedOrderDetails.id, stg);
                          setSelectedOrderDetails({ ...selectedOrderDetails, status: stg });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {stg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Item / Produto</th>
                      <th className="py-2.5 px-3 text-center">Qtd</th>
                      <th className="py-2.5 px-3 text-right">Unitário</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {selectedOrderDetails.items.map((item) => (
                      <tr key={item.id} className="text-slate-300">
                        <td className="py-2 px-3">
                          <strong className="text-white">{item.productName}</strong>
                          <div className="text-[10px] text-slate-500 font-mono">SKU: {item.sku}</div>
                        </td>
                        <td className="py-2 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatBRL(item.unitPrice)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-white">
                          {formatBRL(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Editable Logistics & Payment Info */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Editar Informações do Pedido
                  </span>
                  {isSavedNotice && (
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Alterações salvas com sucesso!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">
                      Endereço de Entrega
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">
                      Forma de Pagamento
                    </label>
                    <select
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(e.target.value as Order['paymentMethod'])}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                    >
                      <option value="Boleto B2B">Boleto B2B</option>
                      <option value="PIX">PIX (À Vista)</option>
                      <option value="Cartão PJ">Cartão PJ</option>
                      <option value="Transferência Bancária">Transferência Bancária</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">
                      Status do Pagamento
                    </label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) => setEditPaymentStatus(e.target.value as Order['paymentStatus'])}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                    >
                      <option value="Pendente">Pendente (Aguardando)</option>
                      <option value="Faturado">Faturado (A Prazo)</option>
                      <option value="Pago">Pago (Liquidado)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">
                      Motorista / Transportador
                    </label>
                    <input
                      type="text"
                      value={editDriver}
                      onChange={(e) => setEditDriver(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">
                      Veículo / Placa
                    </label>
                    <input
                      type="text"
                      value={editVehicle}
                      onChange={(e) => setEditVehicle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">
                      Observações Internas
                    </label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Observações internas do pedido..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveOrderEdits}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                  >
                    <Save size={13} />
                    <span>Salvar Alterações do Pedido</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(selectedOrderDetails)}
                  className="w-full sm:w-auto px-3.5 py-2 bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-800/60 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>Excluir Pedido</span>
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <div className="text-sm font-bold text-white font-mono">
                    Total: <span className="text-red-400">{formatBRL(selectedOrderDetails.totalAmount)}</span>
                  </div>

                  <button
                    onClick={() => setSelectedOrderDetails(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-xs font-semibold"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Order Modal */}
      <ConfirmModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={() => {
          if (orderToDelete) {
            deleteOrder(orderToDelete.id);
            if (selectedOrderDetails?.id === orderToDelete.id) {
              setSelectedOrderDetails(null);
            }
            setOrderToDelete(null);
          }
        }}
        title="Excluir Pedido de Venda"
        message={`Tem certeza que deseja excluir o pedido ${orderToDelete?.orderNumber} do cliente ${orderToDelete?.customerName}?\n\nEsta operação removerá o pedido de venda do sistema.`}
        confirmLabel="Sim, Excluir Pedido"
        variant="danger"
      />
    </div>
  );
};
