import React, { useState, useMemo } from 'react';
import {
  Flame,
  Plus,
  Search,
  Filter,
  QrCode,
  Calendar,
  Building2,
  Printer,
  Download,
  AlertTriangle,
  History,
  FileCheck2,
  CheckCircle2,
  X,
  Phone,
  ArrowRight,
  Shield,
  Edit2,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InstalledEquipment, Customer, ExtinguisherAgent, FireClass, EquipmentStatus } from '../types';
import {
  calculateDaysRemaining,
  getExpirationBadge,
  formatDateBR,
  formatBRL,
} from '../utils/formatters';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface EquipmentsViewProps {
  onOpenWorkOrderForEquipment: (eq: InstalledEquipment) => void;
  onOpenPrintModal: (type: 'EQUIPMENT_TAG' | 'INVENTORY_REPORT', data: any) => void;
  onOpenQrScanner: () => void;
}

export const EquipmentsView: React.FC<EquipmentsViewProps> = ({
  onOpenWorkOrderForEquipment,
  onOpenPrintModal,
  onOpenQrScanner,
}) => {
  const { equipments, customers, addEquipment, updateEquipment, deleteEquipment, currentUser, getWhatsAppRenewalUrl } = useApp();

  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedAlertLevel, setSelectedAlertLevel] = useState<string>('ALL'); // ALL, VERMELHO, LARANJA, AMARELO, VERDE
  const [searchFilter, setSearchFilter] = useState('');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<InstalledEquipment | null>(null);
  const [selectedEquipmentForDetails, setSelectedEquipmentForDetails] = useState<InstalledEquipment | null>(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState<InstalledEquipment | null>(null);

  // Form state for Equipment (New / Edit)
  const [newFormData, setNewFormData] = useState({
    patrimonyNumber: '',
    internalCode: '',
    customerId: customers[0]?.id || '',
    customerName: customers[0]?.name || '',
    location: '',
    environment: '',
    type: 'Extintor Portátil Pressurizado',
    agent: 'Pó Químico ABC' as ExtinguisherAgent,
    capacity: '4 kg',
    fireClasses: ['A', 'B', 'C'] as FireClass[],
    manufacturer: 'Extinpel',
    model: 'ABC-04-P',
    serialNumber: '',
    inmetroSealNumber: '',
    manufactureDate: '2024-01',
    installDate: new Date().toISOString().split('T')[0],
    lastInspectionDate: new Date().toISOString().split('T')[0],
    lastMaintenanceDate: new Date().toISOString().split('T')[0],
    nextMaintenanceDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextHydrostaticTestDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextInspectionDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'ATIVO' as EquipmentStatus,
    notes: '',
  });

  const handleOpenNew = () => {
    setEditingEquipment(null);
    setNewFormData({
      patrimonyNumber: `EXT-${equipments.length + 101}`,
      internalCode: `COD-${equipments.length + 1}`,
      customerId: customers[0]?.id || '',
      customerName: customers[0]?.name || '',
      location: 'Sede Principal',
      environment: 'Recepção / Hall de Entrada',
      type: 'Extintor Portátil Pressurizado',
      agent: 'Pó Químico ABC',
      capacity: '4 kg',
      fireClasses: ['A', 'B', 'C'],
      manufacturer: 'Extinpel',
      model: 'ABC-04-P',
      serialNumber: '',
      inmetroSealNumber: '',
      manufactureDate: '2024-01',
      installDate: new Date().toISOString().split('T')[0],
      lastInspectionDate: new Date().toISOString().split('T')[0],
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      nextMaintenanceDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextHydrostaticTestDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextInspectionDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'ATIVO',
      notes: '',
    });
    setIsNewModalOpen(true);
  };

  const handleEditEquipment = (eq: InstalledEquipment) => {
    setEditingEquipment(eq);
    setNewFormData({
      patrimonyNumber: eq.patrimonyNumber || '',
      internalCode: eq.internalCode || '',
      customerId: eq.customerId || '',
      customerName: eq.customerName || '',
      location: eq.location || '',
      environment: eq.environment || '',
      type: eq.type || 'Extintor Portátil Pressurizado',
      agent: eq.agent || 'Pó Químico ABC',
      capacity: eq.capacity || '4 kg',
      fireClasses: eq.fireClasses || ['A', 'B', 'C'],
      manufacturer: eq.manufacturer || 'Extinpel',
      model: eq.model || '',
      serialNumber: eq.serialNumber || '',
      inmetroSealNumber: eq.inmetroSealNumber || '',
      manufactureDate: eq.manufactureDate || '',
      installDate: eq.installDate || '',
      lastInspectionDate: eq.lastInspectionDate || '',
      lastMaintenanceDate: eq.lastMaintenanceDate || '',
      nextMaintenanceDate: eq.nextMaintenanceDate || '',
      nextHydrostaticTestDate: eq.nextHydrostaticTestDate || '',
      nextInspectionDate: eq.nextInspectionDate || '',
      status: eq.status || 'ATIVO',
      notes: eq.notes || '',
    });
    setIsNewModalOpen(true);
  };

  const handleDeleteEquipment = (eq: InstalledEquipment) => {
    setEquipmentToDelete(eq);
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === newFormData.customerId);
    const resolvedCustomerName = cust ? cust.name : newFormData.customerName;

    if (editingEquipment) {
      updateEquipment(editingEquipment.id, {
        ...newFormData,
        customerName: resolvedCustomerName,
      });
      if (selectedEquipmentForDetails?.id === editingEquipment.id) {
        setSelectedEquipmentForDetails({
          ...selectedEquipmentForDetails,
          ...newFormData,
          customerName: resolvedCustomerName,
        });
      }
    } else {
      await addEquipment({
        ...newFormData,
        customerName: resolvedCustomerName,
      });
    }
    setIsNewModalOpen(false);
  };

  // Client B2B filtering: if logged in as client, only show his equipment
  const effectiveEquipments = currentUser.role === 'CLIENTE_B2B' && currentUser.customerId
    ? equipments.filter((e) => e.customerId === currentUser.customerId)
    : equipments;

  // Filtered List
  const filteredEquipments = effectiveEquipments.filter((eq) => {
    if (selectedCustomerFilter !== 'ALL' && eq.customerId !== selectedCustomerFilter) return false;
    if (selectedStatusFilter !== 'ALL' && eq.status !== selectedStatusFilter) return false;

    const days = calculateDaysRemaining(eq.nextMaintenanceDate);
    const badge = getExpirationBadge(days);
    if (selectedAlertLevel !== 'ALL' && badge.level !== selectedAlertLevel) return false;

    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const match =
        eq.patrimonyNumber.toLowerCase().includes(q) ||
        eq.internalCode.toLowerCase().includes(q) ||
        eq.customerName.toLowerCase().includes(q) ||
        eq.environment.toLowerCase().includes(q) ||
        eq.serialNumber.toLowerCase().includes(q) ||
        eq.agent.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Table Column Interactive Sorting
  type EquipmentSortField =
    | 'patrimonyNumber'
    | 'customerName'
    | 'agent'
    | 'serialNumber'
    | 'lastMaintenanceDate'
    | 'nextMaintenanceDate'
    | 'alertLevel';

  type SortDirection = 'asc' | 'desc';

  const [sortField, setSortField] = useState<EquipmentSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: EquipmentSortField) => {
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

  const sortedEquipments = useMemo(() => {
    if (!sortField) return filteredEquipments;

    return [...filteredEquipments].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'patrimonyNumber':
          comparison = a.patrimonyNumber.localeCompare(b.patrimonyNumber, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
          break;
        case 'customerName':
          comparison = a.customerName.localeCompare(b.customerName, undefined, {
            sensitivity: 'base',
          });
          break;
        case 'agent': {
          const agentA = `${a.agent} ${a.capacity}`;
          const agentB = `${b.agent} ${b.capacity}`;
          comparison = agentA.localeCompare(agentB, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
          break;
        }
        case 'serialNumber': {
          const snA = a.serialNumber || '';
          const snB = b.serialNumber || '';
          comparison = snA.localeCompare(snB, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
          break;
        }
        case 'lastMaintenanceDate': {
          const dateA = a.lastMaintenanceDate ? new Date(a.lastMaintenanceDate).getTime() : 0;
          const dateB = b.lastMaintenanceDate ? new Date(b.lastMaintenanceDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
        case 'nextMaintenanceDate': {
          const dateA = new Date(a.nextMaintenanceDate).getTime();
          const dateB = new Date(b.nextMaintenanceDate).getTime();
          comparison = dateA - dateB;
          break;
        }
        case 'alertLevel': {
          const daysA = calculateDaysRemaining(a.nextMaintenanceDate);
          const daysB = calculateDaysRemaining(b.nextMaintenanceDate);
          comparison = daysA - daysB;
          break;
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredEquipments, sortField, sortDirection]);

  const handleExportCSV = () => {
    const headers = [
      'Patrimonio',
      'Cliente',
      'Localizacao',
      'Ambiente',
      'Tipo',
      'Agente',
      'Capacidade',
      'Classes',
      'NumSerie',
      'SeloINMETRO',
      'UltimaManutencao',
      'VencimentoRecarga',
      'DiasRestantes',
      'Status',
    ];

    const rows = filteredEquipments.map((eq) => {
      const days = calculateDaysRemaining(eq.nextMaintenanceDate);
      return [
        `"${eq.patrimonyNumber}"`,
        `"${eq.customerName}"`,
        `"${eq.location}"`,
        `"${eq.environment}"`,
        `"${eq.type}"`,
        `"${eq.agent}"`,
        `"${eq.capacity}"`,
        `"${eq.fireClasses.join('/')}"`,
        `"${eq.serialNumber}"`,
        `"${eq.inmetroSealNumber || ''}"`,
        `"${formatDateBR(eq.lastMaintenanceDate)}"`,
        `"${formatDateBR(eq.nextMaintenanceDate)}"`,
        days,
        `"${eq.status}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CONTEC_Inventario_Extintores_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Flame size={20} className="text-red-600" />
              <span>Gestão de Extintores & Equipamentos Instalados</span>
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {filteredEquipments.length} extintores
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle patrimonial individual com QR Code, localização por ambiente e monitoramento contínuo de vencimentos de recarga e teste hidrostático.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenQrScanner}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <QrCode size={15} className="text-emerald-400" />
            <span>Leitor QR</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>

          {currentUser.role !== 'CLIENTE_B2B' && (
            <button
              onClick={handleOpenNew}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus size={15} />
              <span>Cadastrar Novo Extintor</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar patrimônio, série, ambiente..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white"
            />
          </div>

          {/* Customer Filter */}
          {currentUser.role !== 'CLIENTE_B2B' && (
            <select
              value={selectedCustomerFilter}
              onChange={(e) => setSelectedCustomerFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
            >
              <option value="ALL">Todos os Clientes / Empresas</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Expiration Urgency Filter */}
          <select
            value={selectedAlertLevel}
            onChange={(e) => setSelectedAlertLevel(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-medium"
          >
            <option value="ALL">Todos os Níveis de Vencimento</option>
            <option value="VERMELHO" className="text-red-700 font-bold">🔴 Vermelho: Vencidos</option>
            <option value="LARANJA" className="text-orange-700 font-bold">🟠 Laranja: Crítico (&le; 30 dias)</option>
            <option value="AMARELO" className="text-amber-700 font-bold">🟡 Amarelo: Atenção (31 a 90 dias)</option>
            <option value="VERDE" className="text-emerald-700 font-bold">🟢 Verde: Regular (&gt; 90 dias)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
          >
            <option value="ALL">Todos os Status Operacionais</option>
            <option value="ATIVO">Ativo</option>
            <option value="EM_MANUTENCAO">Em Manutenção / Oficina</option>
            <option value="CONDENADO">Condenado (Baixa Técnica)</option>
            <option value="RESERVA">Reserva Técnica</option>
          </select>
        </div>
      </div>

      {/* Sorting Status indicator bar */}
      {sortField && (
        <div className="flex items-center justify-between bg-slate-100/80 border border-slate-200/90 px-3.5 py-1.5 rounded-lg text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-semibold text-slate-900">Ordenação ativa:</span>
            <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded-md font-mono text-[11px]">
              {sortField === 'patrimonyNumber' && 'Patrimônio / QR'}
              {sortField === 'customerName' && 'Cliente & Local'}
              {sortField === 'agent' && 'Tipo & Agente'}
              {sortField === 'serialNumber' && 'Nº de Série'}
              {sortField === 'lastMaintenanceDate' && 'Última Recarga'}
              {sortField === 'nextMaintenanceDate' && 'Próx. Recarga (Validade)'}
              {sortField === 'alertLevel' && 'Nível de Alerta / Vencimento'}
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

      {/* Main Table / Grid View of Equipments */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider select-none">
              <tr>
                {/* 1. Patrimônio / QR */}
                <th
                  onClick={() => handleSort('patrimonyNumber')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'patrimonyNumber'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Patrimônio (Alfanumérico: 1-9 ou 9-1)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Patrimônio / QR</span>
                    {sortField === 'patrimonyNumber' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? '1-9' : '9-1'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 2. Cliente & Local */}
                <th
                  onClick={() => handleSort('customerName')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'customerName'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Cliente (Alfabética: A-Z ou Z-A)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Cliente & Local</span>
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

                {/* 3. Tipo & Agente */}
                <th
                  onClick={() => handleSort('agent')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'agent'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Tipo e Carga de Agente (A-Z ou Z-A)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tipo & Agente</span>
                    {sortField === 'agent' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 4. Nº de Série */}
                <th
                  onClick={() => handleSort('serialNumber')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'serialNumber'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Nº de Série (Alfanumérico: 1-9 ou 9-1)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nº de Série</span>
                    {sortField === 'serialNumber' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? '1-9' : '9-1'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 5. Última Recarga */}
                <th
                  onClick={() => handleSort('lastMaintenanceDate')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'lastMaintenanceDate'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Data da Última Recarga (Cronológica)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Última Recarga</span>
                    {sortField === 'lastMaintenanceDate' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? 'Antigos' : 'Recentes'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 6. Próx. Recarga (Validade) */}
                <th
                  onClick={() => handleSort('nextMaintenanceDate')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'nextMaintenanceDate'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Próximo Vencimento (Dias restantes / Data)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Próx. Recarga (Validade)</span>
                    {sortField === 'nextMaintenanceDate' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? 'Mais Próximos' : 'Mais Distantes'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 7. Nível Alerta */}
                <th
                  onClick={() => handleSort('alertLevel')}
                  className={`py-3 px-4 text-center cursor-pointer transition-colors group ${
                    sortField === 'alertLevel'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Nível de Alerta (Vencidos primeiro ou Regulares primeiro)"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Nível Alerta</span>
                    {sortField === 'alertLevel' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? 'Vencidos' : 'Regulares'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 8. Ações */}
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedEquipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Nenhum extintor encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                sortedEquipments.map((eq) => {
                  const days = calculateDaysRemaining(eq.nextMaintenanceDate);
                  const badge = getExpirationBadge(days);

                  return (
                    <tr
                      key={eq.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedEquipmentForDetails(eq)}
                    >
                      {/* Patrimony & QR Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {eq.qrCodeUrl ? (
                            <img
                              src={eq.qrCodeUrl}
                              alt="QR"
                              className="w-8 h-8 rounded border border-slate-200 p-0.5 bg-white shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                              <QrCode size={16} />
                            </div>
                          )}
                          <div>
                            <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded text-xs shadow-2xs">
                              {eq.patrimonyNumber}
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Cód: {eq.internalCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer & Location */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 truncate max-w-[200px]">
                          {eq.customerName}
                        </div>
                        <div className="text-[10px] text-slate-700 bg-slate-100 border border-slate-200/90 px-1.5 py-0.5 rounded inline-block mt-0.5 truncate max-w-[200px]">
                          {eq.location} · <strong>{eq.environment}</strong>
                        </div>
                      </td>

                      {/* Model & Agent */}
                      <td className="py-3 px-4">
                        <span className="inline-block bg-red-50 text-red-700 border border-red-200 font-bold px-2 py-0.5 rounded text-xs">
                          {eq.agent} {eq.capacity}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Classes: {eq.fireClasses.join(', ')} · {eq.manufacturer}
                        </div>
                      </td>

                      {/* Serial Number & Seal */}
                      <td className="py-3 px-4 font-mono text-slate-700 text-xs">
                        <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                          {eq.serialNumber}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {eq.inmetroSealNumber ? `Selo: ${eq.inmetroSealNumber}` : 'Selo Conforme'}
                        </div>
                      </td>

                      {/* Last Maintenance */}
                      <td className="py-3 px-4 text-slate-600 text-xs font-mono">
                        {formatDateBR(eq.lastMaintenanceDate)}
                      </td>

                      {/* Next Expiration */}
                      <td className="py-3 px-4 font-mono">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold shadow-2xs ${
                          days < 0 
                            ? 'bg-red-600 text-white' 
                            : days <= 30 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {formatDateBR(eq.nextMaintenanceDate)}
                        </span>
                        <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                          {days < 0 ? `Vencido há ${Math.abs(days)}d` : `${days}d restantes`}
                        </div>
                      </td>

                      {/* Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-2xs border ${badge.colorClass}`}>
                          <span className={`w-2 h-2 rounded-full ${badge.dotClass}`}></span>
                          <span>{days < 0 ? 'VENCIDO' : `${days} dias`}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditEquipment(eq)}
                            title="Editar Extintor"
                            className="px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Edit2 size={13} />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => handleDeleteEquipment(eq)}
                            title="Excluir Extintor"
                            className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>

                          <button
                            onClick={() => onOpenPrintModal('EQUIPMENT_TAG', eq)}
                            title="Imprimir Etiqueta QR Code"
                            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
                          >
                            <Printer size={15} />
                          </button>

                          <button
                            onClick={() => onOpenWorkOrderForEquipment(eq)}
                            title="Abrir Ordem de Serviço"
                            className="p-1.5 text-red-600 hover:text-red-700 rounded-md hover:bg-red-50 transition-colors"
                          >
                            <Shield size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {filteredEquipments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <Flame size={32} className="mx-auto text-slate-300" />
                      <p className="text-sm font-bold text-slate-700">Nenhum extintor cadastrado</p>
                      <p className="text-xs text-slate-500">
                        {equipments.length === 0
                          ? 'O sistema está zerado. Clique em "Cadastrar Novo Extintor" para adicionar o primeiro equipamento com QR Code!'
                          : 'Nenhum equipamento corresponde aos filtros aplicados.'}
                      </p>
                      {equipments.length === 0 && currentUser.role !== 'CLIENTE_B2B' && (
                        <button
                          onClick={handleOpenNew}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Plus size={14} />
                          <span>Cadastrar Primeiro Extintor</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Equipment Detail Modal with Timeline */}
      {selectedEquipmentForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
                  <Flame size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Ficha Técnica Individual · {selectedEquipmentForDetails.patrimonyNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedEquipmentForDetails.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEquipmentForDetails(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Top Summary Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-800 border border-slate-700">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                    {selectedEquipmentForDetails.type}
                  </span>
                  <h4 className="text-base font-extrabold text-white">
                    {selectedEquipmentForDetails.agent} {selectedEquipmentForDetails.capacity}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Ambiente: <strong>{selectedEquipmentForDetails.environment}</strong> ({selectedEquipmentForDetails.location})
                  </p>
                </div>

                {selectedEquipmentForDetails.qrCodeUrl && (
                  <div className="text-center">
                    <img
                      src={selectedEquipmentForDetails.qrCodeUrl}
                      alt="QR Code"
                      className="w-20 h-20 rounded-lg p-1 bg-white mx-auto shadow"
                    />
                    <button
                      onClick={() => onOpenPrintModal('EQUIPMENT_TAG', selectedEquipmentForDetails)}
                      className="mt-1.5 text-[10px] text-red-400 hover:underline flex items-center justify-center gap-1"
                    >
                      <Printer size={11} /> Imprimir Etiqueta
                    </button>
                  </div>
                )}
              </div>

              {/* Technical Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Classes de Fogo</span>
                  <span className="text-slate-200 font-bold">Classes {selectedEquipmentForDetails.fireClasses.join(', ')}</span>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Nº de Série</span>
                  <span className="text-slate-200 font-mono font-medium">{selectedEquipmentForDetails.serialNumber}</span>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Selo INMETRO</span>
                  <span className="text-slate-200 font-mono">{selectedEquipmentForDetails.inmetroSealNumber || 'Conforme'}</span>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Fabricação</span>
                  <span className="text-slate-200">{selectedEquipmentForDetails.manufacturer} ({selectedEquipmentForDetails.manufactureDate})</span>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Última Recarga</span>
                  <span className="text-slate-200">{formatDateBR(selectedEquipmentForDetails.lastMaintenanceDate)}</span>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Vencimento Recarga</span>
                  <span className="text-red-400 font-mono font-bold">
                    {formatDateBR(selectedEquipmentForDetails.nextMaintenanceDate)}
                  </span>
                </div>
              </div>

              {/* Maintenance History Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <History size={15} className="text-slate-400" />
                  <span>Histórico do Equipamento (Linha do Tempo)</span>
                </h4>

                <div className="border-l-2 border-red-500/60 ml-3 space-y-4 pl-4 text-xs">
                  <div className="relative">
                    <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-red-600 border-2 border-slate-900"></span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {formatDateBR(selectedEquipmentForDetails.lastMaintenanceDate)}
                    </span>
                    <h5 className="font-bold text-slate-200">Manutenção de 2º Grau (Recarga e Lacração)</h5>
                    <p className="text-[11px] text-slate-400">
                      Troca do anel o-ring, pressurização com nitrogênio e selagem INMETRO pela oficina técnica CONTEC.
                    </p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {formatDateBR(selectedEquipmentForDetails.lastInspectionDate)}
                    </span>
                    <h5 className="font-bold text-slate-200">Inspeção Preventiva Periódica</h5>
                    <p className="text-[11px] text-slate-400">
                      Verificação de manômetro, bico, mangueira e sinalização fotoluminescente.
                    </p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-slate-500 border-2 border-slate-900"></span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {formatDateBR(selectedEquipmentForDetails.installDate)}
                    </span>
                    <h5 className="font-bold text-slate-200">Instalação Inicial no Cliente</h5>
                    <p className="text-[11px] text-slate-400">
                      Equipamento novo fornecido pela CONTEC e afixado em suporte de parede normatizado.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => handleDeleteEquipment(selectedEquipmentForDetails)}
                  className="w-full sm:w-auto py-2.5 px-3.5 bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-800/60 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={15} />
                  <span>Excluir Extintor</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      const eq = selectedEquipmentForDetails;
                      setSelectedEquipmentForDetails(null);
                      handleEditEquipment(eq);
                    }}
                    className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 size={15} />
                    <span>Editar Cadastro</span>
                  </button>

                  <button
                    onClick={() => {
                      const eq = selectedEquipmentForDetails;
                      setSelectedEquipmentForDetails(null);
                      onOpenWorkOrderForEquipment(eq);
                    }}
                    className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <Shield size={15} />
                    <span>Abrir OS</span>
                  </button>

                  <button
                    onClick={() => setSelectedEquipmentForDetails(null)}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New / Edit Equipment Registration */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame size={16} className="text-red-500" />
                <span>{editingEquipment ? `Editar Extintor: ${editingEquipment.patrimonyNumber}` : 'Cadastrar Novo Extintor de Incêndio'}</span>
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEquipment} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Cliente / Empresa *</label>
                  <select
                    value={newFormData.customerId}
                    onChange={(e) => {
                      const cust = customers.find((c) => c.id === e.target.value);
                      setNewFormData({
                        ...newFormData,
                        customerId: e.target.value,
                        customerName: cust ? cust.name : '',
                      });
                    }}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nº de Patrimônio (ID Único) *</label>
                  <input
                    type="text"
                    value={newFormData.patrimonyNumber}
                    onChange={(e) => setNewFormData({ ...newFormData, patrimonyNumber: e.target.value })}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Prédio / Bloco / Unidade *</label>
                  <input
                    type="text"
                    value={newFormData.location}
                    onChange={(e) => setNewFormData({ ...newFormData, location: e.target.value })}
                    placeholder="Prédio, bloco ou unidade"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Ambiente / Ponto de Instalação *</label>
                  <input
                    type="text"
                    value={newFormData.environment}
                    onChange={(e) => setNewFormData({ ...newFormData, environment: e.target.value })}
                    placeholder="Ponto ou ambiente de instalação"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Agente Extintor *</label>
                  <select
                    value={newFormData.agent}
                    onChange={(e) => {
                      const ag = e.target.value as ExtinguisherAgent;
                      let classes: FireClass[] = ['A', 'B', 'C'];
                      if (ag === 'CO2' || ag === 'Pó Químico BC') classes = ['B', 'C'];
                      if (ag === 'Água Pressurizada') classes = ['A'];
                      setNewFormData({ ...newFormData, agent: ag, fireClasses: classes });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Pó Químico ABC">Pó Químico ABC</option>
                    <option value="CO2">CO2 (Dióxido de Carbono)</option>
                    <option value="Água Pressurizada">Água Pressurizada</option>
                    <option value="Pó Químico BC">Pó Químico BC</option>
                    <option value="Espuma Mecânica">Espuma Mecânica</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Capacidade *</label>
                  <input
                    type="text"
                    value={newFormData.capacity}
                    onChange={(e) => setNewFormData({ ...newFormData, capacity: e.target.value })}
                    placeholder="Capacidade (ex: 4 kg, 6 kg)"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Status Operacional *</label>
                  <select
                    value={newFormData.status}
                    onChange={(e) => setNewFormData({ ...newFormData, status: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500 font-bold"
                  >
                    <option value="ATIVO">ATIVO (Em Operação Regular)</option>
                    <option value="EM_MANUTENCAO">EM MANUTENÇÃO (Em Oficina / Recarga)</option>
                    <option value="RESERVA">RESERVA (Estoque de Backup)</option>
                    <option value="CONDENADO">CONDENADO (Reprovado para Descarte)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nº de Série do Cilindro</label>
                  <input
                    type="text"
                    value={newFormData.serialNumber}
                    onChange={(e) => setNewFormData({ ...newFormData, serialNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Número do Selo INMETRO</label>
                  <input
                    type="text"
                    value={newFormData.inmetroSealNumber}
                    onChange={(e) => setNewFormData({ ...newFormData, inmetroSealNumber: e.target.value })}
                    placeholder="Número do selo INMETRO"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Data da Última Recarga</label>
                  <input
                    type="date"
                    value={newFormData.lastMaintenanceDate}
                    onChange={(e) => setNewFormData({ ...newFormData, lastMaintenanceDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Próximo Vencimento (Recarga Anual) *</label>
                  <input
                    type="date"
                    value={newFormData.nextMaintenanceDate}
                    onChange={(e) => setNewFormData({ ...newFormData, nextMaintenanceDate: e.target.value })}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Vencimento Teste Hidrostático (5 anos)</label>
                  <input
                    type="date"
                    value={newFormData.nextHydrostaticTestDate}
                    onChange={(e) => setNewFormData({ ...newFormData, nextHydrostaticTestDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Observações Técnicas</label>
                <textarea
                  value={newFormData.notes}
                  onChange={(e) => setNewFormData({ ...newFormData, notes: e.target.value })}
                  rows={2}
                  placeholder="Instalado em suporte tripé inox, sinalização fotoluminescente presente..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold shadow transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>{editingEquipment ? 'Salvar Alterações do Extintor' : 'Salvar Extintor & Gerar QR Code'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Equipment Modal */}
      <ConfirmModal
        isOpen={!!equipmentToDelete}
        onClose={() => setEquipmentToDelete(null)}
        onConfirm={() => {
          if (equipmentToDelete) {
            deleteEquipment(equipmentToDelete.id);
            if (selectedEquipmentForDetails?.id === equipmentToDelete.id) {
              setSelectedEquipmentForDetails(null);
            }
            setEquipmentToDelete(null);
          }
        }}
        title="Excluir Extintor Cadastrado"
        message={`Deseja realmente excluir o extintor patrimônio "${equipmentToDelete?.patrimonyNumber}" (${equipmentToDelete?.agent} ${equipmentToDelete?.capacity}) do cliente ${equipmentToDelete?.customerName}?\n\nEsta operação removerá o histórico e QR Code deste extintor.`}
        confirmLabel="Sim, Excluir Extintor"
        variant="danger"
      />
    </div>
  );
};
