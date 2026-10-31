import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Camera,
  Edit2,
  Edit3,
  FileCheck,
  Printer,
  X,
  Shield,
  Trash2,
  Building2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkOrder, WorkOrderStatus, WorkOrderType, InspectionChecklistItem, InstalledEquipment } from '../types';
import { formatDateBR, formatPhone } from '../utils/formatters';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface WorkOrdersViewProps {
  onOpenPrintModal: (type: 'WORK_ORDER', data: WorkOrder) => void;
  preSelectedEquipment?: InstalledEquipment | null;
  onClearPreSelectedEquipment?: () => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  onOpenPrintModal,
  preSelectedEquipment,
  onClearPreSelectedEquipment,
}) => {
  const {
    workOrders,
    customers,
    equipments,
    addWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    updateWorkOrderStatus,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [workOrderToDelete, setWorkOrderToDelete] = useState<WorkOrder | null>(null);

  // Digital Signature Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Handle preSelectedEquipment from QR Code or Equipment Table
  useEffect(() => {
    if (preSelectedEquipment) {
      setNewFormData((prev) => ({
        ...prev,
        customerId: preSelectedEquipment.customerId,
        customerName: preSelectedEquipment.customerName,
        equipmentIds: [preSelectedEquipment.id],
        equipmentListSummary: `${preSelectedEquipment.patrimonyNumber} - ${preSelectedEquipment.agent} ${preSelectedEquipment.capacity} (${preSelectedEquipment.environment})`,
        serviceDescription: `Vistoria e recarga preventiva do extintor ${preSelectedEquipment.patrimonyNumber}.`,
      }));
      setIsNewModalOpen(true);
      if (onClearPreSelectedEquipment) onClearPreSelectedEquipment();
    }
  }, [preSelectedEquipment]);

  // Form State for New OS
  const [newFormData, setNewFormData] = useState({
    type: 'MANUTENCAO' as WorkOrderType,
    status: 'AGENDADA' as WorkOrderStatus,
    customerId: customers[0]?.id || '',
    customerName: customers[0]?.name || '',
    customerAddress: customers[0]?.address.street || 'Teresina - PI',
    contactPerson: customers[0]?.contactPerson || '',
    contactPhone: customers[0]?.whatsapp || '',
    technicianId: 'user-4',
    technicianName: 'Marcos Silva (Técnico N3)',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00',
    equipmentIds: [] as string[],
    equipmentListSummary: '',
    serviceDescription: 'Vistoria, recarga e inspeção semestral de extintores.',
    checklist: [
      { id: 'c1', description: 'Equipamento desobstruído e de fácil acesso', checked: true, status: 'CONFORME' },
      { id: 'c2', description: 'Lacre de segurança inviolável e pino de trava posicionados', checked: true, status: 'CONFORME' },
      { id: 'c3', description: 'Manômetro de pressão com ponteiro na faixa verde (para pressurizados)', checked: true, status: 'CONFORME' },
      { id: 'c4', description: 'Mangueira e bico difusor livres de rachaduras ou entupimento', checked: true, status: 'CONFORME' },
      { id: 'c5', description: 'Placa de sinalização fotoluminescente afixada a 1,80m de altura', checked: true, status: 'CONFORME' },
      { id: 'c6', description: 'Cilindro sem sinais graves de corrosão, amassamento ou deformação', checked: true, status: 'CONFORME' },
      { id: 'c7', description: 'Selo INMETRO e etiqueta CONTEC com QR Code devidamente afixados', checked: true, status: 'CONFORME' },
    ] as InspectionChecklistItem[],
    photos: [] as WorkOrder['photos'],
    technicianNotes: '',
  });

  const filteredWorkOrders = workOrders.filter((wo) => {
    if (statusFilter !== 'ALL' && wo.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        wo.code.toLowerCase().includes(q) ||
        wo.customerName.toLowerCase().includes(q) ||
        wo.technicianName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSaveSignature = () => {
    if (!selectedWorkOrder) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    updateWorkOrder(selectedWorkOrder.id, {
      digitalSignature: dataUrl,
      status: 'CONCLUIDA',
      signeeName: selectedWorkOrder.contactPerson,
      completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });
    setSelectedWorkOrder({
      ...selectedWorkOrder,
      digitalSignature: dataUrl,
      status: 'CONCLUIDA',
    });
    alert('Ordem de Serviço concluída com sucesso com assinatura digital registrada!');
  };

  const handleOpenNewWorkOrder = () => {
    setEditingWorkOrder(null);
    setNewFormData({
      type: 'MANUTENCAO',
      status: 'AGENDADA',
      customerId: customers[0]?.id || '',
      customerName: customers[0]?.name || '',
      customerAddress: customers[0]?.address.street || 'Teresina - PI',
      contactPerson: customers[0]?.contactPerson || '',
      contactPhone: customers[0]?.whatsapp || '',
      technicianId: 'user-4',
      technicianName: 'Marcos Silva (Técnico N3)',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '09:00',
      equipmentIds: [],
      equipmentListSummary: '',
      serviceDescription: 'Vistoria, recarga e inspeção semestral de extintores.',
      checklist: [
        { id: 'c1', description: 'Equipamento desobstruído e de fácil acesso', checked: true, status: 'CONFORME' as const },
        { id: 'c2', description: 'Lacre de segurança inviolável e pino de trava posicionados', checked: true, status: 'CONFORME' as const },
        { id: 'c3', description: 'Manômetro de pressão com ponteiro na faixa verde (para pressurizados)', checked: true, status: 'CONFORME' as const },
        { id: 'c4', description: 'Mangueira e bico difusor livres de rachaduras ou entupimento', checked: true, status: 'CONFORME' as const },
        { id: 'c5', description: 'Placa de sinalização fotoluminescente afixada a 1,80m de altura', checked: true, status: 'CONFORME' as const },
        { id: 'c6', description: 'Cilindro sem sinais graves de corrosão, amassamento ou deformação', checked: true, status: 'CONFORME' as const },
        { id: 'c7', description: 'Selo INMETRO e etiqueta CONTEC com QR Code devidamente afixados', checked: true, status: 'CONFORME' as const },
      ],
      photos: [],
      technicianNotes: '',
    });
    setIsNewModalOpen(true);
  };

  const handleOpenEditWorkOrder = (wo: WorkOrder) => {
    setEditingWorkOrder(wo);
    setNewFormData({
      type: wo.type,
      status: wo.status,
      customerId: wo.customerId,
      customerName: wo.customerName,
      customerAddress: wo.customerAddress || '',
      contactPerson: wo.contactPerson || '',
      contactPhone: wo.contactPhone || '',
      technicianId: wo.technicianId || 'user-4',
      technicianName: wo.technicianName || '',
      scheduledDate: wo.scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: wo.scheduledTime || '09:00',
      equipmentIds: wo.equipmentIds || [],
      equipmentListSummary: wo.equipmentListSummary || '',
      serviceDescription: wo.serviceDescription || '',
      checklist: wo.checklist || [],
      photos: wo.photos || [],
      technicianNotes: wo.technicianNotes || '',
    });
    setIsNewModalOpen(true);
  };

  const handleDeleteWorkOrder = (wo: WorkOrder) => {
    setWorkOrderToDelete(wo);
  };

  const handleSaveWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === newFormData.customerId);
    const resolvedName = cust ? cust.name : newFormData.customerName;
    const resolvedAddress = cust ? `${cust.address.street}, ${cust.address.number}` : newFormData.customerAddress;
    const resolvedContact = cust ? cust.contactPerson : newFormData.contactPerson;
    const resolvedPhone = cust ? cust.whatsapp : newFormData.contactPhone;

    if (editingWorkOrder) {
      updateWorkOrder(editingWorkOrder.id, {
        ...newFormData,
        customerName: resolvedName,
        customerAddress: resolvedAddress,
        contactPerson: resolvedContact,
        contactPhone: resolvedPhone,
      });
      if (selectedWorkOrder?.id === editingWorkOrder.id) {
        setSelectedWorkOrder({
          ...selectedWorkOrder,
          ...newFormData,
          customerName: resolvedName,
          customerAddress: resolvedAddress,
          contactPerson: resolvedContact,
          contactPhone: resolvedPhone,
        });
      }
    } else {
      addWorkOrder({
        ...newFormData,
        customerName: resolvedName,
        customerAddress: resolvedAddress,
        contactPerson: resolvedContact,
        contactPhone: resolvedPhone,
      });
    }
    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={20} className="text-red-600" />
              <span>Ordens de Serviço (OS) & Manutenções em Campo</span>
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {filteredWorkOrders.length} ordens
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de serviços técnicos, inspeções normatizadas (NBR 12962), checklist de conformidade e coleta de assinatura digital pelo celular ou tablet.
          </p>
        </div>

        <button
          onClick={handleOpenNewWorkOrder}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus size={15} />
          <span>Abrir Nova OS</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por OS-..., cliente ou técnico..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
        >
          <option value="ALL">Todos os Status</option>
          <option value="ABERTA">Aberta</option>
          <option value="AGENDADA">Agendada</option>
          <option value="EM_EXECUCAO">Em Execução</option>
          <option value="CONCLUIDA">Concluída</option>
        </select>
      </div>

      {/* Work Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkOrders.map((wo) => (
          <div
            key={wo.id}
            onClick={() => setSelectedWorkOrder(wo)}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
          >
            {/* Header com plano de fundo em destaque */}
            <div className="bg-slate-100/90 border border-slate-200/90 rounded-xl p-3 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-bold text-red-700 bg-white border border-red-200 px-2 py-0.5 rounded-md text-[11px] shadow-2xs">
                    {wo.code}
                  </span>
                  <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shadow-2xs">
                    {wo.type}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-2xs uppercase tracking-wide ${
                    wo.status === 'CONCLUIDA'
                      ? 'bg-emerald-600 text-white'
                      : wo.status === 'EM_EXECUCAO'
                      ? 'bg-blue-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {wo.status}
                </span>
              </div>

              <div className="bg-white border border-slate-200/90 p-2 rounded-lg shadow-2xs flex items-center gap-2">
                <Building2 size={15} className="text-red-600 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate" title={wo.customerName}>
                  {wo.customerName}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2 px-1">
              {wo.serviceDescription}
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-md text-slate-700">
                <Calendar size={12} className="text-slate-500 shrink-0" />
                <span className="truncate">{formatDateBR(wo.scheduledDate)} {wo.scheduledTime}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-md text-slate-700">
                <User size={12} className="text-slate-500 shrink-0" />
                <span className="truncate font-medium">{wo.technicianName}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold">
              <span className="text-slate-500">
                {wo.checklist.filter((c) => c.status === 'CONFORME').length}/{wo.checklist.length} itens checados
              </span>

              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => handleOpenEditWorkOrder(wo)}
                  title="Editar Ordem de Serviço"
                  className="p-1 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                >
                  <Edit2 size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteWorkOrder(wo)}
                  title="Excluir Ordem de Serviço"
                  className="p-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors"
                >
                  <Trash2 size={13} />
                </button>

                <span
                  onClick={() => setSelectedWorkOrder(wo)}
                  className="text-red-600 hover:underline cursor-pointer pl-1"
                >
                  Abrir OS →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Work Order Execution Modal (Checklist, Canvas Signature, Report) */}
      {selectedWorkOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={20} className="text-red-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {selectedWorkOrder.code} · {selectedWorkOrder.customerName}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Tipo: {selectedWorkOrder.type} · Técnico: {selectedWorkOrder.technicianName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const wo = selectedWorkOrder;
                    handleOpenEditWorkOrder(wo);
                  }}
                  className="p-1.5 bg-blue-900/60 hover:bg-blue-800/60 text-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 border border-blue-700/60"
                  title="Editar Dados da OS"
                >
                  <Edit2 size={14} /> Editar OS
                </button>

                <button
                  onClick={() => handleDeleteWorkOrder(selectedWorkOrder)}
                  className="p-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-red-800/60"
                  title="Excluir OS"
                >
                  <Trash2 size={14} /> Excluir
                </button>

                <button
                  onClick={() => onOpenPrintModal('WORK_ORDER', selectedWorkOrder)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
                >
                  <Printer size={14} /> Imprimir Comprovante
                </button>
                <button
                  onClick={() => setSelectedWorkOrder(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto text-xs flex-1">
              {/* Status Action Switcher */}
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-300 font-semibold">Alterar Status da Ordem de Serviço:</span>
                <div className="flex gap-1.5">
                  {(['AGENDADA', 'EM_EXECUCAO', 'CONCLUIDA'] as WorkOrderStatus[]).map((stg) => (
                    <button
                      key={stg}
                      onClick={() => {
                        updateWorkOrderStatus(selectedWorkOrder.id, stg);
                        setSelectedWorkOrder({ ...selectedWorkOrder, status: stg });
                      }}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        selectedWorkOrder.status === stg
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {stg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inspection Checklist Table (Interactive) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
                  <FileCheck size={14} className="text-emerald-400" />
                  <span>Checklist Técnico de Vistoria Normatizada (NBR 12962 / Portaria INMETRO)</span>
                </h4>

                <div className="border border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-slate-400 text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Item Avaliado</th>
                        <th className="py-2.5 px-3 text-center w-40">Status de Conformidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {selectedWorkOrder.checklist.map((item, idx) => (
                        <tr key={item.id} className="text-slate-200">
                          <td className="py-2 px-3">{item.description}</td>
                          <td className="py-2 px-3 text-center">
                            <div className="inline-flex rounded-lg p-0.5 bg-slate-800 border border-slate-700 text-[10px]">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...selectedWorkOrder.checklist];
                                  updated[idx] = { ...item, status: 'CONFORME' };
                                  setSelectedWorkOrder({ ...selectedWorkOrder, checklist: updated });
                                  updateWorkOrder(selectedWorkOrder.id, { checklist: updated });
                                }}
                                className={`px-2 py-1 rounded font-bold ${
                                  item.status === 'CONFORME' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                                }`}
                              >
                                Conforme
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...selectedWorkOrder.checklist];
                                  updated[idx] = { ...item, status: 'NAO_CONFORME' };
                                  setSelectedWorkOrder({ ...selectedWorkOrder, checklist: updated });
                                  updateWorkOrder(selectedWorkOrder.id, { checklist: updated });
                                }}
                                className={`px-2 py-1 rounded font-bold ${
                                  item.status === 'NAO_CONFORME' ? 'bg-red-600 text-white' : 'text-slate-400'
                                }`}
                              >
                                Não Conforme
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Digital Signature Canvas Block */}
              <div className="space-y-2 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
                    <Edit3 size={14} className="text-amber-400" />
                    <span>Assinatura Digital do Responsável no Cliente</span>
                  </h4>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[11px] text-red-400 hover:underline"
                  >
                    Limpar Assinatura
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  O cliente assina diretamente na tela do tablet ou celular para validar o recebimento do serviço técnico da CONTEC.
                </p>

                {selectedWorkOrder.digitalSignature ? (
                  <div className="p-3 bg-white rounded-lg text-center border border-slate-300">
                    <img
                      src={selectedWorkOrder.digitalSignature}
                      alt="Assinatura Coletada"
                      className="h-16 mx-auto object-contain"
                    />
                    <div className="text-[10px] text-slate-600 mt-1 font-semibold">
                      Assinado por: {selectedWorkOrder.signeeName || selectedWorkOrder.contactPerson} · Concluído
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="border-2 border-dashed border-slate-600 rounded-lg overflow-hidden bg-white">
                      <canvas
                        ref={canvasRef}
                        width={500}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full touch-none cursor-crosshair bg-white"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={!hasSignature}
                      onClick={handleSaveSignature}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow transition-colors"
                    >
                      Salvar Assinatura e Concluir OS
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New OS */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <h3 className="text-sm font-bold text-white">
                {editingWorkOrder ? `Editar Ordem de Serviço: ${editingWorkOrder.code}` : 'Abrir Nova Ordem de Serviço (OS)'}
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveWorkOrder} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Cliente / Local *</label>
                <select
                  value={newFormData.customerId}
                  onChange={(e) => {
                    const cust = customers.find((c) => c.id === e.target.value);
                    setNewFormData({
                      ...newFormData,
                      customerId: e.target.value,
                      customerName: cust ? cust.name : '',
                      customerAddress: cust ? `${cust.address.street}, ${cust.address.number}` : '',
                      contactPerson: cust ? cust.contactPerson : '',
                      contactPhone: cust ? cust.whatsapp : '',
                    });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Tipo de Serviço</label>
                  <select
                    value={newFormData.type}
                    onChange={(e) => setNewFormData({ ...newFormData, type: e.target.value as WorkOrderType })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="INSPECAO">Inspeção Periódica</option>
                    <option value="MANUTENCAO">Manutenção Geral</option>
                    <option value="RECARGA">Recarga Anual (2º Grau)</option>
                    <option value="INSTALACAO">Instalação Inicial</option>
                    <option value="SUBSTITUICAO">Substituição Temporária</option>
                    <option value="VISITA_TECNICA">Visita Técnica</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Técnico Designado</label>
                  <input
                    type="text"
                    value={newFormData.technicianName}
                    onChange={(e) => setNewFormData({ ...newFormData, technicianName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Data Agendada</label>
                  <input
                    type="date"
                    value={newFormData.scheduledDate}
                    onChange={(e) => setNewFormData({ ...newFormData, scheduledDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Horário Previsto</label>
                  <input
                    type="time"
                    value={newFormData.scheduledTime}
                    onChange={(e) => setNewFormData({ ...newFormData, scheduledTime: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Equipamentos Envolvidos</label>
                <input
                  type="text"
                  value={newFormData.equipmentListSummary}
                  onChange={(e) => setNewFormData({ ...newFormData, equipmentListSummary: e.target.value })}
                  placeholder="Resumo dos equipamentos ou serviços"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Descrição do Atendimento</label>
                <textarea
                  value={newFormData.serviceDescription}
                  onChange={(e) => setNewFormData({ ...newFormData, serviceDescription: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold shadow"
                >
                  {editingWorkOrder ? 'Salvar Alterações da OS' : 'Criar Ordem de Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Work Order Modal */}
      <ConfirmModal
        isOpen={!!workOrderToDelete}
        onClose={() => setWorkOrderToDelete(null)}
        onConfirm={() => {
          if (workOrderToDelete) {
            deleteWorkOrder(workOrderToDelete.id);
            if (selectedWorkOrder?.id === workOrderToDelete.id) {
              setSelectedWorkOrder(null);
            }
            setWorkOrderToDelete(null);
          }
        }}
        title="Excluir Ordem de Serviço"
        message={`Tem certeza que deseja excluir a Ordem de Serviço ${workOrderToDelete?.code} (${workOrderToDelete?.customerName})?\n\nEsta operação removerá o registro técnico da OS.`}
        confirmLabel="Sim, Excluir OS"
        variant="danger"
      />
    </div>
  );
};
