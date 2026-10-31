import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Phone,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  Building2,
  MapPin,
  CheckCircle2,
  X,
  CreditCard,
  Loader2,
  Share2,
  AlertCircle,
  Sparkles,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PaymentReceipt, PaymentMethod } from '../types';
import { formatBRL, formatDateBR, formatCNPJ, formatPaymentMethodLabel } from '../utils/formatters';
import { numberToWordsBRL } from '../utils/numberToWords';
import { fetchCnpjData } from '../utils/cnpjApi';
import { PrintableReceiptModal } from '../components/common/PrintableReceiptModal';

interface ReceiptsViewProps {
  initialCustomerId?: string;
  initialOrderNumber?: string;
  initialAmount?: number;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({
  initialCustomerId,
  initialOrderNumber,
  initialAmount,
}) => {
  const { receipts, addReceipt, updateReceipt, deleteReceipt, customers, orders, companyConfig } = useApp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<PaymentReceipt | null>(null);

  // Modal State for New/Edit Receipt
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);

  // Modal State for Deleting Receipt
  const [receiptToDelete, setReceiptToDelete] = useState<PaymentReceipt | null>(null);

  // Form State
  const [receiptNumber, setReceiptNumber] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerTradeName, setCustomerTradeName] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Address Fields
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Teresina');
  const [state, setState] = useState('PI');
  const [zipCode, setZipCode] = useState('');

  // Receipt Content
  const [amount, setAmount] = useState<number>(0);
  const [amountInWords, setAmountInWords] = useState('');
  const [isManualWords, setIsManualWords] = useState(false);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('A_VISTA');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [installmentCount, setInstallmentCount] = useState<number>(2);
  const [installmentNumber, setInstallmentNumber] = useState<number>(1);
  const [totalInstallmentAmount, setTotalInstallmentAmount] = useState<number>(0);
  const [orderNumber, setOrderNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // CNPJ Loading & Feedback
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [cnpjLookupMessage, setCnpjLookupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Generate next receipt number
  const generateNextReceiptNumber = () => {
    const year = new Date().getFullYear();
    const count = receipts.length + 1;
    return `REC-${year}-${count.toString().padStart(4, '0')}`;
  };

  // Open creation modal
  const handleOpenCreateModal = () => {
    setEditingReceiptId(null);
    setReceiptNumber(generateNextReceiptNumber());
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerTradeName('');
    setCustomerDocument('');
    setCustomerPhone('');
    setCustomerEmail('');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('Teresina');
    setState('PI');
    setZipCode('');
    setAmount(0);
    setAmountInWords('');
    setIsManualWords(false);
    setDescription('Serviços de recarga, teste hidrostático e manutenção técnica de extintores de combate a incêndio com emissão de laudo de conformidade NBR 12962.');
    setPaymentMethod('A_VISTA');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setInstallmentCount(2);
    setInstallmentNumber(1);
    setTotalInstallmentAmount(0);
    setOrderNumber('');
    setNotes('');
    setFormValidationError(null);
    setCnpjLookupMessage(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: PaymentReceipt) => {
    setEditingReceiptId(rec.id);
    setReceiptNumber(rec.receiptNumber);
    setSelectedCustomerId(rec.customerId || '');
    setCustomerName(rec.customerName);
    setCustomerTradeName(rec.customerTradeName || '');
    setCustomerDocument(rec.customerDocument);
    setCustomerPhone(rec.customerPhone || '');
    setCustomerEmail(rec.customerEmail || '');
    setStreet(rec.customerAddress?.street || '');
    setNumber(rec.customerAddress?.number || '');
    setComplement(rec.customerAddress?.complement || '');
    setNeighborhood(rec.customerAddress?.neighborhood || '');
    setCity(rec.customerAddress?.city || 'Teresina');
    setState(rec.customerAddress?.state || 'PI');
    setZipCode(rec.customerAddress?.zipCode || '');
    setAmount(rec.amount);
    setAmountInWords(rec.amountInWords);
    setIsManualWords(true);
    setDescription(rec.description);
    setPaymentMethod(rec.paymentMethod || 'A_VISTA');
    setPaymentDate(rec.paymentDate);
    setInstallmentCount(rec.installmentCount || 2);
    setInstallmentNumber(rec.installmentNumber || 1);
    setTotalInstallmentAmount(rec.totalInstallmentAmount || (rec.amount * (rec.installmentCount || 2)));
    setOrderNumber(rec.orderNumber || '');
    setNotes(rec.notes || '');
    setFormValidationError(null);
    setCnpjLookupMessage(null);
    setIsModalOpen(true);
  };

  // When amount changes, update amountInWords unless manually locked
  const handleAmountChange = (val: number) => {
    setAmount(val);
    if (!isManualWords) {
      setAmountInWords(numberToWordsBRL(val));
    }
  };

  // Payment method selector handler
  const handlePaymentMethodChange = (newMethod: PaymentMethod) => {
    setPaymentMethod(newMethod);
    setFormValidationError(null);
    if (newMethod === 'PARCELADO') {
      if (totalInstallmentAmount <= 0) {
        if (amount > 0) {
          setTotalInstallmentAmount(Math.round(amount * installmentCount * 100) / 100);
        }
      } else {
        const portion = Math.round((totalInstallmentAmount / installmentCount) * 100) / 100;
        setAmount(portion);
        if (!isManualWords) setAmountInWords(numberToWordsBRL(portion));
      }
    }
  };

  // Installment count handler (e.g. 2 -> 3)
  const handleInstallmentCountChange = (count: number) => {
    setInstallmentCount(count);
    if (installmentNumber > count) {
      setInstallmentNumber(1);
    }
    if (totalInstallmentAmount > 0) {
      const portion = Math.round((totalInstallmentAmount / count) * 100) / 100;
      setAmount(portion);
      if (!isManualWords) setAmountInWords(numberToWordsBRL(portion));
    } else if (amount > 0) {
      setTotalInstallmentAmount(Math.round(amount * count * 100) / 100);
    }
  };

  // Total Installment amount handler (e.g. typed 500.00)
  const handleTotalInstallmentAmountChange = (newTotal: number) => {
    setTotalInstallmentAmount(newTotal);
    if (newTotal > 0 && installmentCount > 0) {
      const portion = Math.round((newTotal / installmentCount) * 100) / 100;
      setAmount(portion);
      if (!isManualWords) setAmountInWords(numberToWordsBRL(portion));
    }
  };

  // Portion amount handler (e.g. typed 250.00)
  const handlePortionAmountChange = (newPortion: number) => {
    setAmount(newPortion);
    if (!isManualWords) setAmountInWords(numberToWordsBRL(newPortion));
    if (paymentMethod === 'PARCELADO' && installmentCount > 0) {
      setTotalInstallmentAmount(Math.round(newPortion * installmentCount * 100) / 100);
    }
  };

  // Handle Customer Selection from dropdown
  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    setCnpjLookupMessage(null);

    const found = customers.find((c) => c.id === custId);
    if (found) {
      setCustomerName(found.name);
      setCustomerTradeName(found.tradeName || found.name);
      setCustomerDocument(formatCNPJ(found.document));
      setCustomerPhone(found.whatsapp || found.phone || '');
      setCustomerEmail(found.email || '');

      if (found.address) {
        setStreet(found.address.street || '');
        setNumber(found.address.number || '');
        setComplement(found.address.complement || '');
        setNeighborhood(found.address.neighborhood || '');
        setCity(found.address.city || 'Teresina');
        setState(found.address.state || 'PI');
        setZipCode(found.address.zipCode || '');
      }

      setCnpjLookupMessage({
        type: 'success',
        text: `Cliente selecionado: dados e endereço completo carregados com sucesso!`,
      });
    }
  };

  // Format document with CNPJ/CPF mask
  const formatDocumentInput = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length <= 11) {
      // CPF: 000.000.000-00
      return clean
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    // CNPJ: 00.000.000/0000-00
    return clean
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  // CNPJ Typing & Automatic Lookup Engine
  const handleCnpjChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatDocumentInput(rawValue);
    setCustomerDocument(formatted);
    setCnpjLookupMessage(null);

    const clean = rawValue.replace(/\D/g, '');

    // If 14 digits (Complete CNPJ), trigger instant lookup
    if (clean.length === 14) {
      triggerCnpjLookup(clean);
    }
  };

  const triggerCnpjLookup = async (cleanCnpj: string) => {
    // 1. Check local registered customers first
    const localCust = customers.find((c) => c.document.replace(/\D/g, '') === cleanCnpj);
    if (localCust) {
      setSelectedCustomerId(localCust.id);
      setCustomerName(localCust.name);
      setCustomerTradeName(localCust.tradeName || localCust.name);
      setCustomerPhone(localCust.whatsapp || localCust.phone || '');
      setCustomerEmail(localCust.email || '');

      if (localCust.address) {
        setStreet(localCust.address.street || '');
        setNumber(localCust.address.number || '');
        setComplement(localCust.address.complement || '');
        setNeighborhood(localCust.address.neighborhood || '');
        setCity(localCust.address.city || 'Teresina');
        setState(localCust.address.state || 'PI');
        setZipCode(localCust.address.zipCode || '');
      }

      setCnpjLookupMessage({
        type: 'success',
        text: `CNPJ encontrado na base interna! Dados e endereço completo preenchidos.`,
      });
      return;
    }

    // 2. Query official CNPJ API
    setIsLoadingCnpj(true);
    setCnpjLookupMessage(null);

    try {
      const data = await fetchCnpjData(cleanCnpj);
      setCustomerName(data.name);
      setCustomerTradeName(data.tradeName || data.name);
      if (data.phone) setCustomerPhone(data.phone);
      if (data.email) setCustomerEmail(data.email);

      // Complete Address from Receita Federal
      setStreet(data.address.street);
      setNumber(data.address.number);
      setComplement(data.address.complement || '');
      setNeighborhood(data.address.neighborhood);
      setCity(data.address.city || 'Teresina');
      setState(data.address.state || 'PI');
      setZipCode(data.address.zipCode);

      setCnpjLookupMessage({
        type: 'success',
        text: `Dados oficiais da Receita Federal obtidos com sucesso! Razão social e endereço preenchidos.`,
      });
    } catch (err: any) {
      setCnpjLookupMessage({
        type: 'error',
        text: err.message || 'Não foi possível consultar o CNPJ automaticamente. Preencha os campos abaixo.',
      });
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  // Quick Description Presets
  const setPresetDescription = (presetText: string) => {
    setDescription(presetText);
  };

  // Save Receipt Handler
  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setFormValidationError('Por favor, informe a Razão Social ou Nome do Cliente pagador.');
      return;
    }

    if (!customerDocument.trim()) {
      setFormValidationError('Por favor, informe o CNPJ ou CPF do pagador.');
      return;
    }

    if (amount <= 0) {
      setFormValidationError('Por favor, informe um valor monetário válido maior que zero.');
      return;
    }

    setFormValidationError(null);

    const isParcelado = paymentMethod === 'PARCELADO';
    const finalTotal = isParcelado ? (totalInstallmentAmount > 0 ? totalInstallmentAmount : amount * installmentCount) : undefined;

    const receiptPayload: Omit<PaymentReceipt, 'id' | 'createdAt'> = {
      receiptNumber: receiptNumber || generateNextReceiptNumber(),
      customerId: selectedCustomerId || undefined,
      customerName: customerName.trim(),
      customerTradeName: customerTradeName.trim() || undefined,
      customerDocument: customerDocument.trim(),
      customerPhone: customerPhone.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      customerAddress: {
        street: street.trim() || 'Logradouro não informado',
        number: number.trim() || 'S/N',
        complement: complement.trim() || undefined,
        neighborhood: neighborhood.trim() || 'Bairro comercial',
        city: city.trim() || 'Teresina',
        state: state.trim() || 'PI',
        zipCode: zipCode.trim() || '64000-000',
      },
      amount,
      amountInWords: amountInWords.trim() || numberToWordsBRL(amount),
      description: description.trim() || 'Prestação de serviços de segurança contra incêndio.',
      paymentMethod,
      paymentDate,
      installmentCount: isParcelado ? installmentCount : undefined,
      installmentNumber: isParcelado ? installmentNumber : undefined,
      totalInstallmentAmount: isParcelado ? finalTotal : undefined,
      orderNumber: orderNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (editingReceiptId) {
      updateReceipt(editingReceiptId, receiptPayload);
      const updated = {
        ...receiptPayload,
        id: editingReceiptId,
        createdAt: new Date().toISOString(),
      };
      setIsModalOpen(false);
      setSelectedReceiptForPrint(updated as PaymentReceipt);
    } else {
      const created = addReceipt(receiptPayload);
      setIsModalOpen(false);
      // Immediately open print preview so user can view/print right away!
      setSelectedReceiptForPrint(created);
    }
  };

  // Delete Receipt
  const handleDeleteReceipt = (rec: PaymentReceipt) => {
    setReceiptToDelete(rec);
  };

  const confirmDeleteReceipt = () => {
    if (receiptToDelete) {
      deleteReceipt(receiptToDelete.id);
      if (selectedReceiptForPrint?.id === receiptToDelete.id) {
        setSelectedReceiptForPrint(null);
      }
      setReceiptToDelete(null);
    }
  };

  // Filtered Receipts List
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.receiptNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerDocument.includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.orderNumber && r.orderNumber.toLowerCase().includes(q));

      const matchMethod =
        methodFilter === 'ALL' ||
        r.paymentMethod === methodFilter ||
        (methodFilter === 'A_CRITERIO_CLIENTE' && (!r.paymentMethod || r.paymentMethod === 'A_CRITERIO_CLIENTE'));

      return matchSearch && matchMethod;
    });
  }, [receipts, searchQuery, methodFilter]);

  // Total Amount Emitted
  const totalAmountSum = useMemo(() => {
    return receipts.reduce((sum, r) => sum + r.amount, 0);
  }, [receipts]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText size={20} className="text-red-600" />
              <span>Emissão de Recibos de Pagamento & Quitação</span>
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Oficial B2B
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Emita comprovantes legais com logotipo da CONTEC, busca automática por CNPJ, endereço completo e valor por extenso.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>Emitir Novo Recibo</span>
        </button>
      </div>

      {/* 2. KPI Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total de Recibos</span>
            <span className="text-2xl font-black text-slate-900">{receipts.length}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Recibos emitidos no sistema</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
            <FileText size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Quitado</span>
            <span className="text-2xl font-black text-emerald-800 font-mono">{formatBRL(totalAmountSum)}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Valor acumulado comprovado</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Identificação Oficial</span>
            <span className="text-xs font-bold text-slate-900 block mt-1">{companyConfig.name}</span>
            <p className="text-[10px] text-slate-500 font-mono">CNPJ: {formatCNPJ(companyConfig.cnpj)}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
            <Building2 size={20} />
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar & Search */}
      <div className="bg-slate-100/90 border border-slate-200/90 rounded-xl p-3.5 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-600 text-white rounded-lg shadow-2xs">
              <Filter size={14} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Filtros de Recibos
              </h4>
              <p className="text-[11px] text-slate-500">
                Pesquise por cliente, número, CNPJ ou forma de pagamento
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
            {filteredReceipts.length} recibo(s) encontrado(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          {/* Search Input */}
          <div className="sm:col-span-8 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, CNPJ, nº do recibo ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-red-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Payment Method Filter */}
          <div className="sm:col-span-4">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-red-500 shadow-2xs font-medium cursor-pointer"
            >
              <option value="ALL">Todas as Formas de Pagamento</option>
              <option value="A_VISTA">À Vista</option>
              <option value="PARCELADO">Parcelado</option>
              <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              <option value="PIX">PIX</option>
              <option value="A_CRITERIO_CLIENTE">A Critério do Cliente</option>
              <option value="BOLETO">Boleto Bancário</option>
              <option value="DINHEIRO">Dinheiro em Espécie</option>
              <option value="CARTAO_DEBITO">Cartão de Débito</option>
              <option value="TRANSFERENCIA">Transferência Bancária</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Receipts Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-4">Recibo / Data</th>
                <th className="py-3 px-4">Cliente / Pagador & Endereço</th>
                <th className="py-3 px-4">Referente a</th>
                <th className="py-3 px-4 text-right">Valor Quitado</th>
                <th className="py-3 px-4 text-center">Forma Pagto</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">Nenhum recibo de pagamento encontrado</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Clique em "Emitir Novo Recibo" no topo para gerar e imprimir o primeiro comprovante!
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((rec) => {
                  const addr = rec.customerAddress;
                  const addressSnippet = addr
                    ? `${addr.street}, ${addr.number} · ${addr.neighborhood}, ${addr.city}-${addr.state}`
                    : 'Endereço não cadastrado';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Recibo / Data */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md text-xs shadow-2xs">
                          {rec.receiptNumber}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                          <Calendar size={11} className="text-slate-400" />
                          <span>{formatDateBR(rec.paymentDate)}</span>
                        </div>
                      </td>

                      {/* Cliente / Pagador & Endereço Completo */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{rec.customerName}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-700 font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                            {formatCNPJ(rec.customerDocument)}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 truncate max-w-xs sm:max-w-md">
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate">{addressSnippet}</span>
                        </div>
                      </td>

                      {/* Referente a */}
                      <td className="py-3 px-4 text-slate-700 max-w-xs">
                        <p className="line-clamp-2 text-xs">{rec.description}</p>
                        {rec.orderNumber && (
                          <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                            {rec.orderNumber}
                          </span>
                        )}
                      </td>

                      {/* Valor Quitado */}
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs shadow-2xs">
                          {formatBRL(rec.amount)}
                        </span>
                      </td>

                      {/* Forma Pagto */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border shadow-2xs ${
                          rec.paymentMethod === 'PARCELADO'
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : rec.paymentMethod === 'PIX'
                            ? 'bg-teal-50 text-teal-900 border-teal-200'
                            : rec.paymentMethod === 'A_VISTA'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {formatPaymentMethodLabel(rec.paymentMethod, rec.installmentNumber, rec.installmentCount, rec.totalInstallmentAmount)}
                        </span>
                        {rec.paymentMethod === 'PARCELADO' && rec.totalInstallmentAmount && (
                          <div className="text-[9px] text-slate-500 font-medium mt-0.5">
                            Total: {formatBRL(rec.totalInstallmentAmount)}
                          </div>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print / View */}
                          <button
                            onClick={() => setSelectedReceiptForPrint(rec)}
                            className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
                            title="Visualizar e Imprimir Recibo Oficial com Logotipo"
                          >
                            <Printer size={14} />
                          </button>

                          {/* WhatsApp */}
                          <button
                            onClick={() => {
                              const cleanPhone = (rec.customerPhone || companyConfig.whatsapp).replace(/\D/g, '');
                              const msg = encodeURIComponent(
                                `Olá! Aqui é da *CONTEC EXTINTORES*.\n` +
                                `Segue a confirmação do *Recibo Nº ${rec.receiptNumber}* no valor de *${formatBRL(rec.amount)}* referente a: ${rec.description}.\n` +
                                `Data de Quitação: ${formatDateBR(rec.paymentDate)}.\n` +
                                `Muito obrigado pela preferência e parceria!`
                              );
                              window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
                            }}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                            title="Enviar recibo via WhatsApp"
                          >
                            <Phone size={14} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(rec)}
                            className="p-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                            title="Editar informações do recibo"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteReceipt(rec)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Excluir recibo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal de Emissão / Criação de Recibo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-red-500" />
                <h3 className="text-sm font-bold text-white">
                  {editingReceiptId ? 'Editar Recibo de Pagamento' : 'Emitir Novo Recibo de Pagamento Oficial'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReceipt} className="p-6 space-y-5 overflow-y-auto text-xs flex-1 text-slate-200">
              {formValidationError && (
                <div className="p-3 bg-red-950/90 border border-red-500 text-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <span>{formValidationError}</span>
                </div>
              )}

              {/* Top Banner: Número e Data */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block text-[10px] mb-1 uppercase font-bold">Número do Recibo</label>
                  <input
                    type="text"
                    required
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block text-[10px] mb-1 uppercase font-bold">Data do Pagamento</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block text-[10px] mb-1 uppercase font-bold">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => handlePaymentMethodChange(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-semibold cursor-pointer"
                  >
                    <option value="A_VISTA">À Vista</option>
                    <option value="PARCELADO">Parcelado</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="PIX">PIX</option>
                    <option value="A_CRITERIO_CLIENTE">A Critério do Cliente (Livre Escolha)</option>
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="DINHEIRO">Dinheiro em Espécie</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="TRANSFERENCIA">Transferência Bancária / TED</option>
                  </select>
                </div>
              </div>

              {/* Bloco de Busca por CNPJ e Seleção de Cliente */}
              <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                    <Building2 size={14} className="text-red-400" />
                    <span>Identificação do Cliente / Pagador & Consulta por CNPJ</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Puxa endereço completo automaticamente
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Dropdown de Clientes Cadastrados */}
                  <div className="sm:col-span-6">
                    <label className="text-slate-300 block text-[10px] mb-1 font-semibold">
                      Clientes Cadastrados no Sistema (Preenchimento Rápido)
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs cursor-pointer"
                    >
                      <option value="">Selecione um cliente cadastrado ou digite o CNPJ ao lado...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({formatCNPJ(c.document)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Input de CNPJ com Consulta Automática */}
                  <div className="sm:col-span-6">
                    <label className="text-slate-300 block text-[10px] mb-1 font-semibold flex items-center justify-between">
                      <span>Digitar CNPJ do Cliente (Busca Automática)</span>
                      {isLoadingCnpj && (
                        <span className="text-amber-400 flex items-center gap-1 text-[10px] animate-pulse">
                          <Loader2 size={11} className="animate-spin" /> Buscando Receita Federal...
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="00.000.000/0000-00"
                        value={customerDocument}
                        onChange={handleCnpjChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => triggerCnpjLookup(customerDocument.replace(/\D/g, ''))}
                        className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                        title="Buscar dados do CNPJ na base da Receita Federal"
                      >
                        Buscar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Feedback da consulta de CNPJ */}
                {cnpjLookupMessage && (
                  <div
                    className={`p-2.5 rounded-lg text-[11px] flex items-center gap-2 ${
                      cnpjLookupMessage.type === 'success'
                        ? 'bg-emerald-950/60 border border-emerald-600/40 text-emerald-300'
                        : 'bg-red-950/60 border border-red-600/40 text-red-300'
                    }`}
                  >
                    {cnpjLookupMessage.type === 'success' ? (
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle size={14} className="text-red-400 shrink-0" />
                    )}
                    <span>{cnpjLookupMessage.text}</span>
                  </div>
                )}

                {/* Razão Social e Nome Fantasia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-slate-300 block text-[10px] mb-1 font-semibold">
                      Razão Social / Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: POSTO E CONVENIÊNCIA DIRCEU EXPRESS LTDA"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block text-[10px] mb-1 font-semibold">
                      Nome Fantasia (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: POSTO IPIRANGA DIRCEU"
                      value={customerTradeName}
                      onChange={(e) => setCustomerTradeName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    />
                  </div>
                </div>

                {/* Contatos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block text-[10px] mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(86) 98111-2233"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block text-[10px] mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="financeiro@empresa.com.br"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco de Endereço Completo Solicitado */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                    <MapPin size={14} className="text-red-400" />
                    <span>Endereço Completo do Cliente</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Obrigatório no recibo para validade fiscal e comprobatória
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8">
                    <label className="text-slate-300 block text-[10px] mb-1">Logradouro (Rua / Av.)</label>
                    <input
                      type="text"
                      placeholder="Ex: Av. Joaquim Nelson"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-slate-300 block text-[10px] mb-1">Número</label>
                    <input
                      type="text"
                      placeholder="1450 ou S/N"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs text-center"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-slate-300 block text-[10px] mb-1">Complemento</label>
                    <input
                      type="text"
                      placeholder="Sala / Galpão"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="text-slate-300 block text-[10px] mb-1">Bairro</label>
                    <input
                      type="text"
                      placeholder="Ex: Dirceu Arcoverde"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-slate-300 block text-[10px] mb-1">Cidade</label>
                    <input
                      type="text"
                      placeholder="Teresina"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="text-slate-300 block text-[10px] mb-1 text-center">UF</label>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="PI"
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs text-center font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-slate-300 block text-[10px] mb-1">CEP</label>
                    <input
                      type="text"
                      placeholder="64077-000"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco de Valor e Valor por Extenso */}
              <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                    <DollarSign size={14} className="text-emerald-400" />
                    <span>
                      {paymentMethod === 'PARCELADO'
                        ? 'Valores do Parcelamento & Quitação da Parcela'
                        : 'Valor do Recibo & Valor por Extenso Automático'}
                    </span>
                  </h4>
                  {paymentMethod === 'PARCELADO' && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-700/60 px-2 py-0.5 rounded">
                      Parcelamento Ativo ({installmentCount}x)
                    </span>
                  )}
                </div>

                {paymentMethod === 'PARCELADO' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-3">
                        <label className="text-slate-300 block text-[10px] mb-1 font-semibold">
                          Qtd. de Parcelas
                        </label>
                        <select
                          value={installmentCount}
                          onChange={(e) => handleInstallmentCountChange(parseInt(e.target.value) || 2)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold cursor-pointer"
                        >
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((num) => (
                            <option key={num} value={num}>
                              {num} parcelas ({num}x)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-slate-300 block text-[10px] mb-1 font-semibold">
                          Parcela Sendo Paga
                        </label>
                        <select
                          value={installmentNumber}
                          onChange={(e) => setInstallmentNumber(parseInt(e.target.value) || 1)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold cursor-pointer"
                        >
                          {Array.from({ length: installmentCount }, (_, i) => i + 1).map((num) => (
                            <option key={num} value={num}>
                              {num}ª Parcela (de {installmentCount})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-slate-300 block text-[10px] mb-1 font-semibold">
                          Valor Total da Venda (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={totalInstallmentAmount || ''}
                          onChange={(e) => handleTotalInstallmentAmountChange(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-xs"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-emerald-400 block text-[10px] mb-1 font-bold">
                          Valor Desta Parcela (Recibo) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          placeholder="0.00"
                          value={amount || ''}
                          onChange={(e) => handlePortionAmountChange(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-emerald-500 rounded-lg p-2 text-emerald-400 font-mono font-bold text-xs"
                        />
                      </div>
                    </div>

                    {/* Resumo explicativo com badge de confirmação */}
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-[11px] text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
                      <div>
                        <strong>Texto que sairá no recibo:</strong> Recebi <strong className="text-white font-mono font-bold">{formatBRL(amount)}</strong> referente à <strong>{installmentNumber}ª parcela de {installmentCount}</strong> ({installmentCount}x de {formatBRL(amount)}) com <strong>Valor Total de {formatBRL(totalInstallmentAmount || (amount * installmentCount))}</strong> a ser recebido.
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 block text-[10px] font-semibold">
                          Valor por Extenso da Parcela (Gerado Automaticamente)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsManualWords(false);
                            setAmountInWords(numberToWordsBRL(amount));
                          }}
                          className="text-[10px] text-red-400 hover:underline cursor-pointer"
                        >
                          Recalcular Extenso
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={amountInWords}
                        onChange={(e) => {
                          setIsManualWords(true);
                          setAmountInWords(e.target.value);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs italic"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-4">
                      <label className="text-slate-300 block text-[10px] mb-1 font-semibold">Valor em Reais (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="0.00"
                        value={amount || ''}
                        onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="sm:col-span-8">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 block text-[10px] font-semibold">
                          Valor por Extenso (Gerado Automaticamente)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsManualWords(false);
                            setAmountInWords(numberToWordsBRL(amount));
                          }}
                          className="text-[10px] text-red-400 hover:underline cursor-pointer"
                        >
                          Recalcular Extenso
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={amountInWords}
                        onChange={(e) => {
                          setIsManualWords(true);
                          setAmountInWords(e.target.value);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs italic"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bloco de Referência (Descrição do Serviço/Venda) */}
              <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wide">
                    Referente a (Descrição dos Serviços / Venda de Equipamentos) *
                  </h4>
                </div>

                {/* Atalhos Rápidos */}
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="text-slate-400 font-semibold py-0.5">Sugestões rápidas:</span>
                  <button
                    type="button"
                    onClick={() => setPresetDescription('Serviço de recarga e teste hidrostático em extintores de incêndio com emissão de laudo técnico normatizado NBR 12962.')}
                    className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                  >
                    + Recarga e Teste Hidrostático
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDescription('Venda e instalação de extintores novos e sinalização fotoluminescente de rota de fuga.')}
                    className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                  >
                    + Venda de Extintores Novos
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDescription('Manutenção corretiva e substituição de componentes conforme vistoria e exigência do Corpo de Bombeiros Militar do Piauí.')}
                    className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                  >
                    + Manutenção AVCB / Bombeiros
                  </button>
                </div>

                <textarea
                  rows={3}
                  required
                  placeholder="Descreva detalhadamente o que foi prestado ou vendido..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs leading-relaxed focus:outline-none focus:border-red-500"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-slate-300 block text-[10px] mb-1">Vincular a Pedido de Venda (Opcional)</label>
                    <select
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    >
                      <option value="">Nenhum pedido vinculado</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.orderNumber}>
                          {o.orderNumber} - {o.customerName} ({formatBRL(o.totalAmount)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block text-[10px] mb-1">Observações Internas (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: Quitado integralmente pelo cliente."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  <Printer size={15} />
                  <span>{editingReceiptId ? 'Salvar e Gerar Recibo' : 'Emitir e Visualizar Recibo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Printable Receipt Preview & Print Modal */}
      {selectedReceiptForPrint && (
        <PrintableReceiptModal
          receipt={selectedReceiptForPrint}
          onClose={() => setSelectedReceiptForPrint(null)}
        />
      )}

      {/* 7. Modal de Confirmação de Exclusão de Recibo */}
      {receiptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
              <Trash2 size={26} />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              Excluir Recibo de Pagamento?
            </h3>

            <p className="text-slate-300 text-xs leading-relaxed mb-4">
              Você está prestes a excluir o recibo <strong className="text-white">{receiptToDelete.receiptNumber}</strong> emitido para <strong className="text-white">{receiptToDelete.customerName}</strong> no valor de <strong className="text-emerald-400 font-bold">{formatBRL(receiptToDelete.amount)}</strong>.
            </p>

            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl mb-6 text-left flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-300 leading-tight">
                Esta ação é irreversível. O registro do recibo será excluído definitivamente da lista e das consultas de recibos emitidos.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setReceiptToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteReceipt}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-900/30 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
