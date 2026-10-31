import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Phone,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Trash2,
  X,
  DollarSign,
  ShieldAlert,
  Edit2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Quote, QuoteItem, Customer, Product, QuoteStatus } from '../types';
import { formatBRL, formatDateBR, formatCNPJ } from '../utils/formatters';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface QuotesViewProps {
  onOpenPrintModal: (type: 'QUOTE', data: Quote) => void;
  onSelectModule: (module: string) => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({
  onOpenPrintModal,
  onSelectModule,
}) => {
  const {
    quotes,
    customers,
    products,
    addQuote,
    updateQuote,
    deleteQuote,
    approveQuoteDiscount,
    convertQuoteToOrder,
    currentUser,
    getWhatsAppQuoteUrl,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editFormData, setEditFormData] = useState({
    status: 'ENVIADO' as QuoteStatus,
    customerName: '',
    customerDocument: '',
    contactPerson: '',
    customerPhone: '',
    deliveryAddress: '',
    paymentTerms: '',
    deliveryDeadline: '',
    createdAt: '',
    validityDate: '',
    displacementFee: 0,
    notes: '',
    items: [] as QuoteItem[],
  });

  // Modals confirmation and notifications
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [quoteToApprove, setQuoteToApprove] = useState<Quote | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // New Quote Form State - 100% editable fields with optional customer prefill
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedExistingCustomerId, setSelectedExistingCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState(customers[0]?.name || '');
  const [customerDocument, setCustomerDocument] = useState(customers[0]?.document || '');
  const [contactPerson, setContactPerson] = useState(customers[0]?.contactPerson || '');
  const [customerPhone, setCustomerPhone] = useState(customers[0]?.phone || customers[0]?.whatsapp || '');
  const [deliveryAddress, setDeliveryAddress] = useState(
    customers[0]?.address
      ? `${customers[0].address.street}, ${customers[0].address.number || 'S/N'} - ${customers[0].address.neighborhood || ''}, ${customers[0].address.city}/${customers[0].address.state}`
      : ''
  );
  const [salespersonName, setSalespersonName] = useState(currentUser.name || 'Luciano Lopes');
  const [displacementFee, setDisplacementFee] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState('28/42 dias faturado no Boleto B2B PJ');
  const [deliveryDeadline, setDeliveryDeadline] = useState('3 a 5 dias úteis');
  const [validityDays, setValidityDays] = useState(15);
  const [notes, setNotes] = useState('Incluso frete e entrega técnica no canteiro/sede do cliente.');
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

  // Item addition state: Catalog or Custom
  const [itemMode, setItemMode] = useState<'CATALOG' | 'CUSTOM'>('CATALOG');
  const [productToAddId, setProductToAddId] = useState(products[0]?.id || '');
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [discountToAdd, setDiscountToAdd] = useState(0);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemUnit, setCustomItemUnit] = useState('UN');
  const [customItemPrice, setCustomItemPrice] = useState<number>(0);
  const [customItemCost, setCustomItemCost] = useState<number>(0);

  const handleSelectCustomer = (custId: string) => {
    setSelectedExistingCustomerId(custId);
    if (!custId) return;
    const c = customers.find((x) => x.id === custId);
    if (c) {
      setCustomerName(c.name);
      setCustomerDocument(c.document);
      setContactPerson(c.contactPerson || '');
      setCustomerPhone(c.phone || c.whatsapp || '');
      if (c.address) {
        setDeliveryAddress(
          `${c.address.street}, ${c.address.number || 'S/N'} - ${c.address.neighborhood || ''}, ${c.address.city}/${c.address.state}`
        );
      }
    }
  };

  const filteredQuotes = quotes.filter((q) => {
    if (selectedStatus !== 'ALL' && q.status !== selectedStatus) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        q.code.toLowerCase().includes(s) ||
        q.customerName.toLowerCase().includes(s) ||
        q.salespersonName.toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Table Column Interactive Sorting
  type QuoteSortField = 'code' | 'customerName' | 'itemsCount' | 'totalAmount' | 'overallMarginPercent' | 'validityDate' | 'status';
  type SortDirection = 'asc' | 'desc';

  const [sortField, setSortField] = useState<QuoteSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: QuoteSortField) => {
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

  const sortedQuotes = useMemo(() => {
    if (!sortField) return filteredQuotes;

    return [...filteredQuotes].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'code':
          comparison = a.code.localeCompare(b.code, undefined, { numeric: true });
          break;
        case 'customerName':
          comparison = a.customerName.localeCompare(b.customerName, undefined, { sensitivity: 'base' });
          break;
        case 'itemsCount':
          comparison = a.items.length - b.items.length;
          break;
        case 'totalAmount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        case 'overallMarginPercent':
          comparison = a.overallMarginPercent - b.overallMarginPercent;
          break;
        case 'validityDate': {
          const dateA = a.validityDate ? new Date(a.validityDate).getTime() : 0;
          const dateB = b.validityDate ? new Date(b.validityDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredQuotes, sortField, sortDirection]);

  const handleAddItem = () => {
    if (itemMode === 'CATALOG') {
      const prod = products.find((p) => p.id === productToAddId);
      if (!prod) return;

      const unitPrice = prod.salePrice;
      const finalPricePerUnit = unitPrice * (1 - (discountToAdd || 0) / 100);
      const totalPrice = Number((finalPricePerUnit * (quantityToAdd || 1)).toFixed(2));

      const newItem: QuoteItem = {
        id: `qi-${Date.now()}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unit: prod.unit,
        quantity: Math.max(1, quantityToAdd || 1),
        unitCost: prod.costPrice,
        unitPrice,
        discountPercent: discountToAdd || 0,
        totalPrice,
      };

      setQuoteItems([...quoteItems, newItem]);
      setQuantityToAdd(1);
      setDiscountToAdd(0);
    } else {
      const name = customItemName.trim() || 'Item / Serviço Especial';
      const unitPrice = Number(customItemPrice) || 0;
      const qty = Math.max(1, Number(quantityToAdd) || 1);
      const disc = Math.max(0, Math.min(100, Number(discountToAdd) || 0));
      const finalPricePerUnit = unitPrice * (1 - disc / 100);
      const totalPrice = Number((finalPricePerUnit * qty).toFixed(2));

      const newItem: QuoteItem = {
        id: `qi-custom-${Date.now()}`,
        productId: `prod-custom-${Date.now()}`,
        productName: name,
        sku: 'SRV-ESP',
        unit: customItemUnit.trim() || 'UN',
        quantity: qty,
        unitCost: Number(customItemCost) || 0,
        unitPrice,
        discountPercent: disc,
        totalPrice,
      };

      setQuoteItems([...quoteItems, newItem]);
      setCustomItemName('');
      setCustomItemPrice(0);
      setCustomItemCost(0);
      setQuantityToAdd(1);
      setDiscountToAdd(0);
    }
  };

  // Update any field of an item in the new quote builder (Description, Unit, Quantity, Unit Price, Discount %)
  const handleUpdateItem = (
    id: string,
    field: 'productName' | 'unit' | 'quantity' | 'unitPrice' | 'discountPercent',
    value: string | number
  ) => {
    setQuoteItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let newName = item.productName;
        let newUnit = item.unit;
        let newQty = item.quantity;
        let newPrice = item.unitPrice;
        let newDisc = item.discountPercent;

        if (field === 'productName') {
          newName = String(value);
        } else if (field === 'unit') {
          newUnit = String(value);
        } else if (field === 'quantity') {
          const parsed = Number(value);
          newQty = isNaN(parsed) || parsed < 1 ? 1 : parsed;
        } else if (field === 'unitPrice') {
          const parsed = parseFloat(String(value));
          newPrice = isNaN(parsed) || parsed < 0 ? 0 : parsed;
        } else if (field === 'discountPercent') {
          const parsed = parseFloat(String(value));
          newDisc = isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
        }

        const finalPricePerUnit = newPrice * (1 - newDisc / 100);
        const totalPrice = Number((finalPricePerUnit * newQty).toFixed(2));

        return {
          ...item,
          productName: newName,
          unit: newUnit,
          quantity: newQty,
          unitPrice: newPrice,
          discountPercent: newDisc,
          totalPrice,
        };
      })
    );
  };

  const handleUpdateItemQuantity = (id: string, qty: number) => {
    handleUpdateItem(id, 'quantity', qty);
  };

  const handleRemoveItem = (id: string) => {
    setQuoteItems(quoteItems.filter((i) => i.id !== id));
  };

  // Update any field of an item in the Edit Quote modal
  const handleUpdateEditItem = (
    id: string,
    field: 'productName' | 'unit' | 'quantity' | 'unitPrice' | 'discountPercent',
    value: string | number
  ) => {
    setEditFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;

        let newName = item.productName;
        let newUnit = item.unit;
        let newQty = item.quantity;
        let newPrice = item.unitPrice;
        let newDisc = item.discountPercent;

        if (field === 'productName') {
          newName = String(value);
        } else if (field === 'unit') {
          newUnit = String(value);
        } else if (field === 'quantity') {
          const parsed = Number(value);
          newQty = isNaN(parsed) || parsed < 1 ? 1 : parsed;
        } else if (field === 'unitPrice') {
          const parsed = parseFloat(String(value));
          newPrice = isNaN(parsed) || parsed < 0 ? 0 : parsed;
        } else if (field === 'discountPercent') {
          const parsed = parseFloat(String(value));
          newDisc = isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
        }

        const finalPricePerUnit = newPrice * (1 - newDisc / 100);
        const totalPrice = Number((finalPricePerUnit * newQty).toFixed(2));

        return {
          ...item,
          productName: newName,
          unit: newUnit,
          quantity: newQty,
          unitPrice: newPrice,
          discountPercent: newDisc,
          totalPrice,
        };
      }),
    }));
  };

  const handleRemoveEditItem = (id: string) => {
    setEditFormData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
  };

  // Financial calculations for builder
  const subtotal = quoteItems.reduce((acc, curr) => acc + curr.unitPrice * curr.quantity, 0);
  const itemsTotal = quoteItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalDiscount = Math.max(0, subtotal - itemsTotal);
  const totalCost = quoteItems.reduce((acc, curr) => acc + curr.unitCost * curr.quantity, 0);
  const fee = Math.max(0, Number(displacementFee) || 0);
  const totalAmount = Number((itemsTotal + fee).toFixed(2));
  const overallMarginPercent =
    totalAmount > 0 ? Number((((totalAmount - totalCost) / totalAmount) * 100).toFixed(1)) : 0;

  // Margin rule: If margin is below 35% or discount > 15%, requires manager approval
  const requiresManagerApproval = overallMarginPercent < 35 || (subtotal > 0 && totalDiscount / subtotal > 0.15);

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCustName = customerName.trim() || 'Cliente em Proposta / Avulso';
    const finalCustDoc = customerDocument.trim() || 'Não informado';
    const matchedCustomer = customers.find((c) => c.name === finalCustName || c.document === finalCustDoc);

    const baseDate = issueDate ? new Date(`${issueDate}T12:00:00`) : new Date();
    const validityDate = new Date(baseDate.getTime() + (validityDays || 15) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    addQuote({
      customerId: matchedCustomer?.id || `cust-manual-${Date.now()}`,
      customerName: finalCustName,
      customerDocument: finalCustDoc,
      customerPhone: customerPhone.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
      deliveryAddress: deliveryAddress.trim() || undefined,
      salespersonId: currentUser.id,
      salespersonName: salespersonName.trim() || currentUser.name,
      items: quoteItems,
      subtotal,
      totalDiscount,
      displacementFee: fee,
      totalAmount,
      overallMarginPercent,
      requiresManagerApproval,
      isApprovedByManager: !requiresManagerApproval,
      paymentTerms: paymentTerms.trim() || 'A combinar',
      deliveryDeadline: deliveryDeadline.trim() || 'A combinar',
      createdAt: issueDate || new Date().toISOString().split('T')[0],
      validityDate,
      notes: notes.trim(),
      status: quoteItems.length > 0 ? 'ENVIADO' : 'RASCUNHO',
    });

    setIsBuilderOpen(false);
    setSaveSuccessMsg(`Orçamento para "${finalCustName}" salvo com sucesso!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText size={20} className="text-red-600" />
              <span>Orçamentos & Propostas Comerciais B2B</span>
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {filteredQuotes.length} orçamentos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Elaboração de propostas com produtos, recargas, controle de margem de lucro, validação de descontos, geração de PDF e WhatsApp.
          </p>
        </div>

        <button
          onClick={() => {
            setQuoteItems([]);
            setIssueDate(new Date().toISOString().split('T')[0]);
            setIsBuilderOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus size={15} />
          <span>Criar Novo Orçamento</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar código (ORC-...), cliente ou consultor..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
        >
          <option value="ALL">Todos os Status</option>
          <option value="RASCUNHO">Rascunho</option>
          <option value="ENVIADO">Enviado</option>
          <option value="EM_NEGOCIACAO">Em Negociação</option>
          <option value="APROVADO">Aprovado</option>
          <option value="RECUSADO">Recusado</option>
        </select>
      </div>

      {/* Sorting Status indicator bar */}
      {sortField && (
        <div className="flex items-center justify-between bg-slate-100/80 border border-slate-200/90 px-3.5 py-1.5 rounded-lg text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-semibold text-slate-900">Ordenação ativa:</span>
            <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded-md font-mono text-[11px]">
              {sortField === 'code' && 'Código do Orçamento'}
              {sortField === 'customerName' && 'Cliente'}
              {sortField === 'itemsCount' && 'Quantidade de Itens'}
              {sortField === 'totalAmount' && 'Valor Total'}
              {sortField === 'overallMarginPercent' && 'Margem de Lucro'}
              {sortField === 'validityDate' && 'Data de Validade'}
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

      {/* Quotes Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider select-none">
              <tr>
                {/* 1. Código */}
                <th
                  onClick={() => handleSort('code')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'code'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Código (Alfanumérico)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Código</span>
                    {sortField === 'code' ? (
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

                {/* 3. Itens */}
                <th
                  onClick={() => handleSort('itemsCount')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'itemsCount'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Quantidade de Itens"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Itens</span>
                    {sortField === 'itemsCount' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? 'Menos' : 'Mais'}
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

                {/* 5. Margem */}
                <th
                  onClick={() => handleSort('overallMarginPercent')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'overallMarginPercent'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Margem de Lucro %"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Margem</span>
                    {sortField === 'overallMarginPercent' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? 'Menor' : 'Maior'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 6. Validade */}
                <th
                  onClick={() => handleSort('validityDate')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'validityDate'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Data de Validade"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Validade</span>
                    {sortField === 'validityDate' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? 'Próximas' : 'Distantes'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 7. Status */}
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

                {/* 8. Ações */}
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedQuotes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md text-xs shadow-2xs">
                      {q.code}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{q.customerName}</div>
                    <div className="text-[10px] text-slate-600 font-mono inline-block bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded mt-0.5">
                      {formatCNPJ(q.customerDocument)}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                      {q.items.length} item(s)
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs shadow-2xs">
                      {formatBRL(q.totalAmount)}
                    </span>
                    {Number(q.displacementFee || 0) > 0 && (
                      <div className="text-[10px] text-blue-700 font-semibold mt-0.5 whitespace-nowrap">
                        + {formatBRL(q.displacementFee || 0)} taxa desloc.
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {currentUser.role === 'ADMINISTRADOR' || currentUser.role === 'GERENTE' ? (
                      <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold border ${
                        q.overallMarginPercent < 35 
                          ? 'bg-amber-50 text-amber-800 border-amber-200' 
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {q.overallMarginPercent}%
                      </span>
                    ) : (
                      <span className="text-slate-400">Protegido</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-700 font-mono text-xs">
                    <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                      {formatDateBR(q.validityDate)}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs ${
                        q.status === 'APROVADO'
                          ? 'bg-emerald-600 text-white'
                          : q.status === 'EM_NEGOCIACAO'
                          ? 'bg-blue-600 text-white'
                          : q.status === 'RECUSADO'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Edit Quote */}
                      <button
                        onClick={() => {
                          setEditingQuote(q);
                          setEditFormData({
                            status: q.status,
                            customerName: q.customerName,
                            customerDocument: q.customerDocument,
                            contactPerson: q.contactPerson || '',
                            customerPhone: q.customerPhone || '',
                            deliveryAddress: q.deliveryAddress || '',
                            paymentTerms: q.paymentTerms,
                            deliveryDeadline: q.deliveryDeadline,
                            createdAt: q.createdAt ? q.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
                            validityDate: q.validityDate,
                            displacementFee: q.displacementFee || 0,
                            notes: q.notes,
                            items: (q.items || []).map((it) => ({ ...it })),
                          });
                        }}
                        title="Editar Informações do Orçamento"
                        className="p-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* Delete Quote */}
                      <button
                        onClick={() => {
                          setQuoteToDelete(q);
                        }}
                        title="Excluir Orçamento"
                        className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>

                      {/* Printable PDF */}
                      <button
                        onClick={() => onOpenPrintModal('QUOTE', q)}
                        title="Imprimir / Salvar PDF"
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
                      >
                        <Printer size={15} />
                      </button>

                      {/* WhatsApp */}
                      <a
                        href={getWhatsAppQuoteUrl(q)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Enviar Proposta pelo WhatsApp"
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-md hover:bg-emerald-50 cursor-pointer"
                      >
                        <Phone size={15} />
                      </a>

                      {/* Convert to Order if approved */}
                      {q.status !== 'APROVADO' && (
                        <button
                          onClick={() => {
                            setQuoteToApprove(q);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md cursor-pointer whitespace-nowrap"
                        >
                          Fechar Pedido
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredQuotes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <FileText size={32} className="mx-auto text-slate-300" />
                      <p className="text-sm font-bold text-slate-700">Nenhum orçamento cadastrado</p>
                      <p className="text-xs text-slate-500">
                        {quotes.length === 0
                          ? 'O sistema está zerado. Clique em "Novo Orçamento B2B" no topo para criar sua primeira proposta comercial!'
                          : 'Nenhum orçamento corresponde aos filtros de busca.'}
                      </p>
                      {quotes.length === 0 && (
                        <button
                          onClick={() => setIsBuilderOpen(true)}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Plus size={14} />
                          <span>Elaborar Primeiro Orçamento</span>
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

      {/* Quote Builder Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText size={18} className="text-red-500" />
                <span>Elaborar Novo Orçamento Comercial B2B · CONTEC</span>
              </h3>
              <button
                onClick={() => setIsBuilderOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="p-6 space-y-5 overflow-y-auto text-xs flex-1">
              {/* Optional Quick Pre-fill from Registered Customers */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-slate-300 font-bold block text-[11px]">
                      Preencher com Cliente Cadastrado (Opcional)
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Você pode selecionar um cliente para preencher automaticamente ou digitar livremente nos campos abaixo.
                    </p>
                  </div>
                  <select
                    value={selectedExistingCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full sm:w-72 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-red-500"
                  >
                    <option value="">-- Digitação Livre / Não Cadastrado --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatCNPJ(c.document)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 100% Editable Customer & Project Information */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-3">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wide flex items-center justify-between">
                  <span>Dados do Cliente & Atendimento (Todos os campos editáveis)</span>
                  <span className="text-[10px] text-slate-400 normal-case font-normal">
                    Pode salvar mesmo sem preencher tudo
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-slate-300 font-semibold block mb-1">Empresa / Razão Social / Nome</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: BANCO DO NORDESTE, Mercadinho Silva ou Cliente Balcão"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">CNPJ / CPF</label>
                    <input
                      type="text"
                      value={customerDocument}
                      onChange={(e) => setCustomerDocument(e.target.value)}
                      placeholder="00.000.000/0000-00 ou CPF"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Nome do Contato / Responsável</label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Nome do comprador ou gerente"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(86) 99999-9999"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Consultor / Vendedor</label>
                    <input
                      type="text"
                      value={salespersonName}
                      onChange={(e) => setSalespersonName(e.target.value)}
                      placeholder="Nome do vendedor responsável"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-slate-300 font-semibold block mb-1">Endereço da Obra / Atendimento / Entrega</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Rua, número, bairro, cidade - ponto de referência"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Conditions, Validity, Issue Date & Displacement Fee */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1 flex items-center justify-between">
                    <span>Data de Emissão</span>
                    <span className="text-[10px] text-red-400 font-mono">Emissão</span>
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-red-500"
                    title="Data de emissão da proposta comercial"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Validade da Proposta</label>
                  <select
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-red-500"
                  >
                    <option value={7}>7 dias corridos</option>
                    <option value={15}>15 dias corridos (Padrão)</option>
                    <option value={30}>30 dias corridos</option>
                    <option value={60}>60 dias corridos</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Prazo de Entrega</label>
                  <input
                    type="text"
                    value={deliveryDeadline}
                    onChange={(e) => setDeliveryDeadline(e.target.value)}
                    placeholder="Ex: 3 a 5 dias úteis"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Condições de Pagamento</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Ex: Boleto B2B 28 dias ou PIX"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Displacement Fee Option */}
                <div className="bg-blue-950/40 border border-blue-800/60 p-2 rounded-lg">
                  <label className="text-blue-300 font-bold block mb-1 flex items-center justify-between">
                    <span>Taxa de Deslocamento</span>
                    <span className="text-[10px] text-blue-400 font-mono">R$</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={displacementFee || ''}
                    onChange={(e) => setDisplacementFee(Number(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-blue-700/80 rounded-md p-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-[10px] text-blue-300 block mt-0.5">
                    Frete técnico / visita à sede do cliente
                  </span>
                </div>
              </div>

              {/* Add Item Line (Catalog or Custom Item) */}
              <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wide">
                    Adicionar Produto ou Serviço ao Orçamento
                  </h4>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setItemMode('CATALOG')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                        itemMode === 'CATALOG' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Do Catálogo
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemMode('CUSTOM')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                        itemMode === 'CUSTOM' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Item Especial / Manual
                    </button>
                  </div>
                </div>

                {itemMode === 'CATALOG' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <label className="text-slate-400 block text-[10px] mb-1">Item do Catálogo CONTEC</label>
                      <select
                        value={productToAddId}
                        onChange={(e) => setProductToAddId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} · {formatBRL(p.salePrice)} (Estoque: {p.currentStock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-slate-400 block text-[10px] mb-1">Quantidade</label>
                      <input
                        type="number"
                        min={1}
                        value={quantityToAdd}
                        onChange={(e) => setQuantityToAdd(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs text-center font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-slate-400 block text-[10px] mb-1">Desconto (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={discountToAdd}
                        onChange={(e) => setDiscountToAdd(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs text-center"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer"
                      >
                        + Adicionar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <label className="text-slate-400 block text-[10px] mb-1">Descrição do Serviço / Produto</label>
                      <input
                        type="text"
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        placeholder="Ex: Recarga Nível 3 com Teste Hidrostático"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="text-slate-400 block text-[10px] mb-1">Unid</label>
                      <input
                        type="text"
                        value={customItemUnit}
                        onChange={(e) => setCustomItemUnit(e.target.value)}
                        placeholder="UN"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs text-center"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-slate-400 block text-[10px] mb-1">Valor Unit. (R$)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={customItemPrice || ''}
                        onChange={(e) => setCustomItemPrice(Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs text-center font-bold"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="text-slate-400 block text-[10px] mb-1">Qtd</label>
                      <input
                        type="number"
                        min={1}
                        value={quantityToAdd}
                        onChange={(e) => setQuantityToAdd(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs text-center font-bold"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="text-slate-400 block text-[10px] mb-1">Desc %</label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={discountToAdd}
                        onChange={(e) => setDiscountToAdd(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs text-center"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer"
                      >
                        + Adicionar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Items List in Quote - 100% Editable on the Fly */}
              <div className="border border-slate-700 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-300 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Item / Descrição</th>
                      <th className="py-2.5 px-2 text-center w-24">Qtd</th>
                      <th className="py-2.5 px-3 text-right w-36">Unitário</th>
                      <th className="py-2.5 px-2 text-center w-24">Desc.</th>
                      <th className="py-2.5 px-3 text-right w-32">Total</th>
                      <th className="py-2.5 px-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {quoteItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          <p className="font-semibold text-slate-300">Nenhum item adicionado ainda.</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Você pode salvar o orçamento mesmo sem itens para continuar o preenchimento mais tarde.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      quoteItems.map((item) => (
                        <tr key={item.id} className="text-slate-300 hover:bg-slate-800/40 transition-colors">
                          {/* 1. Item description & unit - 100% editable */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={item.productName}
                              onChange={(e) => handleUpdateItem(item.id, 'productName', e.target.value)}
                              placeholder="Nome do produto ou descrição do serviço..."
                              className="w-full bg-slate-900 border border-slate-700 focus:border-red-500 rounded px-2.5 py-1.5 text-white font-medium text-xs shadow-inner focus:outline-none transition-colors"
                              title="Clique para editar o nome/descrição do item"
                            />
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                              <span className="font-semibold text-slate-300">Un:</span>
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value.toUpperCase())}
                                placeholder="UN"
                                className="w-14 bg-slate-900 border border-slate-700/80 focus:border-red-500 rounded px-1.5 py-0.5 text-slate-200 text-center font-mono text-[10px] uppercase focus:outline-none"
                                title="Editar unidade de medida (UN, KG, M, etc.)"
                              />
                              {item.sku && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  Ref: {item.sku}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. Quantity - 100% editable */}
                          <td className="py-2.5 px-2 text-center align-top pt-3.5">
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={item.quantity || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value === '' ? 1 : Number(e.target.value))}
                              className="w-18 bg-slate-900 border border-slate-700 focus:border-red-500 rounded px-2 py-1.5 text-center font-bold text-white text-xs shadow-inner focus:outline-none"
                              title="Editar quantidade"
                            />
                          </td>

                          {/* 3. Unit Price - 100% editable */}
                          <td className="py-2.5 px-3 text-right align-top pt-3.5">
                            <div className="inline-flex items-center bg-slate-900 border border-slate-700 rounded px-2 py-1.5 focus-within:border-red-500 shadow-inner">
                              <span className="text-slate-400 text-[10px] font-mono mr-1 select-none">R$</span>
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={item.unitPrice === 0 ? '' : item.unitPrice}
                                onChange={(e) => handleUpdateItem(item.id, 'unitPrice', e.target.value === '' ? 0 : Number(e.target.value))}
                                placeholder="0.00"
                                className="w-20 bg-transparent text-right font-mono font-bold text-white text-xs focus:outline-none"
                                title="Editar valor unitário em R$"
                              />
                            </div>
                          </td>

                          {/* 4. Discount % - 100% editable */}
                          <td className="py-2.5 px-2 text-center align-top pt-3.5">
                            <div className="inline-flex items-center justify-center bg-slate-900 border border-slate-700 rounded px-1.5 py-1.5 focus-within:border-red-500 shadow-inner">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                value={item.discountPercent}
                                onChange={(e) => handleUpdateItem(item.id, 'discountPercent', e.target.value === '' ? 0 : Number(e.target.value))}
                                className="w-12 bg-transparent text-center font-mono font-bold text-amber-400 text-xs focus:outline-none"
                                title="Editar desconto % (0 a 100%)"
                              />
                              <span className="text-amber-400 font-bold text-xs select-none">%</span>
                            </div>
                          </td>

                          {/* 5. Total - Auto-calculated */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 text-xs whitespace-nowrap align-top pt-4">
                            {formatBRL(item.totalPrice)}
                          </td>

                          {/* 6. Remove Item */}
                          <td className="py-2.5 px-2 text-center align-top pt-3.5">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-950/40 cursor-pointer transition-colors"
                              title="Remover Item do Orçamento"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary and Margin Control */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Observações Comerciais da Proposta</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Condições especiais, prazos de pagamento, detalhes de entrega técnica..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal dos Itens:</span>
                    <span className="font-mono">{formatBRL(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Desconto Total:</span>
                    <span className="font-mono">- {formatBRL(totalDiscount)}</span>
                  </div>
                  {fee > 0 && (
                    <div className="flex justify-between text-blue-400 font-medium">
                      <span>Taxa de Deslocamento:</span>
                      <span className="font-mono">+ {formatBRL(fee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-white border-t border-slate-700 pt-2">
                    <span>Valor Total da Proposta:</span>
                    <span className="font-mono text-red-400">{formatBRL(totalAmount)}</span>
                  </div>

                  {/* Margin and Approval Indicator */}
                  <div className="pt-2 border-t border-slate-700">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Margem Estimada:</span>
                      <span className={`font-mono font-bold ${overallMarginPercent < 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {overallMarginPercent}%
                      </span>
                    </div>

                    {requiresManagerApproval && (
                      <div className="mt-2 p-2 rounded bg-amber-950/60 border border-amber-800/60 text-[10px] text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="shrink-0" />
                        <span>Desconto superior a 15% ou margem abaixo de 35%. Exige aprovação de Gerência.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle size={15} />
                  <span>Salvar Orçamento (Mesmo Incompleto)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Edit Quote */}
      {editingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-red-400" />
                <h3 className="text-sm font-bold text-white">
                  Editar Orçamento {editingQuote.code} · {editingQuote.customerName}
                </h3>
              </div>
              <button
                onClick={() => setEditingQuote(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const editSubtotal = editFormData.items.reduce((acc, curr) => acc + curr.unitPrice * curr.quantity, 0);
                const editItemsTotal = editFormData.items.reduce((acc, curr) => acc + curr.totalPrice, 0);
                const editTotalDiscount = Math.max(0, editSubtotal - editItemsTotal);
                const editTotalCost = editFormData.items.reduce((acc, curr) => acc + (curr.unitCost || 0) * curr.quantity, 0);
                const displacementVal = Number(editFormData.displacementFee) || 0;
                const newTotal = Number((editItemsTotal + displacementVal).toFixed(2));
                const newMargin = newTotal > 0 ? Number((((newTotal - editTotalCost) / newTotal) * 100).toFixed(1)) : 0;

                updateQuote(editingQuote.id, {
                  ...editFormData,
                  items: editFormData.items,
                  subtotal: editSubtotal,
                  totalDiscount: editTotalDiscount,
                  displacementFee: displacementVal,
                  totalAmount: newTotal,
                  overallMarginPercent: newMargin,
                });
                setEditingQuote(null);
                setSaveSuccessMsg(`Orçamento ${editingQuote.code} atualizado com sucesso!`);
                setTimeout(() => setSaveSuccessMsg(null), 3000);
              }}
              className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto"
            >
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Status do Orçamento</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as QuoteStatus })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-red-500"
                >
                  <option value="ENVIADO">ENVIADO (Aguardando Resposta)</option>
                  <option value="EM_NEGOCIACAO">EM NEGOCIAÇÃO (Ajustes Comerciais)</option>
                  <option value="APROVADO">APROVADO (Liberado para Pedido)</option>
                  <option value="RASCUNHO">RASCUNHO (Interno)</option>
                  <option value="RECUSADO">RECUSADO (Não Fechou)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Razão Social / Cliente</label>
                  <input
                    type="text"
                    value={editFormData.customerName}
                    onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">CNPJ / CPF</label>
                  <input
                    type="text"
                    value={editFormData.customerDocument}
                    onChange={(e) => setEditFormData({ ...editFormData, customerDocument: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Contato</label>
                  <input
                    type="text"
                    value={editFormData.contactPerson}
                    onChange={(e) => setEditFormData({ ...editFormData, contactPerson: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={editFormData.customerPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Endereço de Atendimento / Entrega</label>
                <input
                  type="text"
                  value={editFormData.deliveryAddress}
                  onChange={(e) => setEditFormData({ ...editFormData, deliveryAddress: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Condições de Pagamento</label>
                  <input
                    type="text"
                    value={editFormData.paymentTerms}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentTerms: e.target.value })}
                    placeholder="Condições de pagamento"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-blue-300 font-semibold block mb-1">Taxa de Deslocamento (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={editFormData.displacementFee || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, displacementFee: Number(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-blue-600 rounded-lg p-2 text-white font-mono font-bold focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1 flex items-center justify-between">
                    <span>Data de Emissão</span>
                    <span className="text-[10px] text-red-400 font-mono">Emissão</span>
                  </label>
                  <input
                    type="date"
                    value={editFormData.createdAt}
                    onChange={(e) => setEditFormData({ ...editFormData, createdAt: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500"
                    title="Editar data de emissão do orçamento"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Data de Validade</label>
                  <input
                    type="date"
                    value={editFormData.validityDate}
                    onChange={(e) => setEditFormData({ ...editFormData, validityDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Prazo de Entrega</label>
                  <input
                    type="text"
                    value={editFormData.deliveryDeadline}
                    onChange={(e) => setEditFormData({ ...editFormData, deliveryDeadline: e.target.value })}
                    placeholder="Prazo de entrega ou execução"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Editable Items in Existing Quote */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold block text-xs">
                    Itens do Orçamento ({editFormData.items.length} itens)
                  </label>
                  <span className="text-[11px] text-slate-400">Campos 100% editáveis</span>
                </div>
                <div className="border border-slate-700 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-slate-300 text-[10px] uppercase font-bold tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Item / Descrição</th>
                        <th className="py-2.5 px-2 text-center w-20">Qtd</th>
                        <th className="py-2.5 px-3 text-right w-32">Unitário</th>
                        <th className="py-2.5 px-2 text-center w-20">Desc.</th>
                        <th className="py-2.5 px-3 text-right w-28">Total</th>
                        <th className="py-2.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {editFormData.items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400">
                            Nenhum item adicionado a este orçamento.
                          </td>
                        </tr>
                      ) : (
                        editFormData.items.map((item) => (
                          <tr key={item.id} className="text-slate-300 hover:bg-slate-800/40 transition-colors">
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.productName}
                                onChange={(e) => handleUpdateEditItem(item.id, 'productName', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 focus:border-red-500 rounded px-2 py-1 text-white font-medium text-xs focus:outline-none"
                              />
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                                <span>Un:</span>
                                <input
                                  type="text"
                                  value={item.unit}
                                  onChange={(e) => handleUpdateEditItem(item.id, 'unit', e.target.value.toUpperCase())}
                                  className="w-12 bg-slate-900 border border-slate-700/80 focus:border-red-500 rounded px-1 py-0.5 text-slate-200 text-center font-mono text-[10px] uppercase focus:outline-none"
                                />
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center align-top pt-2.5">
                              <input
                                type="number"
                                min={1}
                                step={1}
                                value={item.quantity || ''}
                                onChange={(e) => handleUpdateEditItem(item.id, 'quantity', e.target.value === '' ? 1 : Number(e.target.value))}
                                className="w-14 bg-slate-900 border border-slate-700 focus:border-red-500 rounded px-1.5 py-1 text-center font-bold text-white text-xs focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-3 text-right align-top pt-2.5">
                              <div className="inline-flex items-center bg-slate-900 border border-slate-700 rounded px-1.5 py-1 focus-within:border-red-500">
                                <span className="text-slate-400 text-[10px] font-mono mr-1">R$</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={item.unitPrice === 0 ? '' : item.unitPrice}
                                  onChange={(e) => handleUpdateEditItem(item.id, 'unitPrice', e.target.value === '' ? 0 : Number(e.target.value))}
                                  placeholder="0.00"
                                  className="w-16 bg-transparent text-right font-mono font-bold text-white text-xs focus:outline-none"
                                />
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center align-top pt-2.5">
                              <div className="inline-flex items-center justify-center bg-slate-900 border border-slate-700 rounded px-1 py-1 focus-within:border-red-500">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={item.discountPercent}
                                  onChange={(e) => handleUpdateEditItem(item.id, 'discountPercent', e.target.value === '' ? 0 : Number(e.target.value))}
                                  className="w-10 bg-transparent text-center font-mono font-bold text-amber-400 text-xs focus:outline-none"
                                />
                                <span className="text-amber-400 font-bold text-[11px]">%</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400 text-xs whitespace-nowrap align-top pt-3">
                              {formatBRL(item.totalPrice)}
                            </td>
                            <td className="py-2 px-2 text-center align-top pt-2.5">
                              <button
                                type="button"
                                onClick={() => handleRemoveEditItem(item.id)}
                                className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950/40 cursor-pointer"
                                title="Remover Item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Observações da Proposta</label>
                <textarea
                  rows={3}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingQuote(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle size={15} />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Quote Modal */}
      <ConfirmModal
        isOpen={!!quoteToDelete}
        onClose={() => setQuoteToDelete(null)}
        onConfirm={() => {
          if (quoteToDelete) {
            deleteQuote(quoteToDelete.id);
            setQuoteToDelete(null);
            setSaveSuccessMsg(`Orçamento ${quoteToDelete.code} excluído com sucesso.`);
            setTimeout(() => setSaveSuccessMsg(null), 3000);
          }
        }}
        title="Excluir Orçamento Comercial"
        message={`Tem certeza que deseja excluir o orçamento ${quoteToDelete?.code} (${quoteToDelete?.customerName})?\n\nEsta operação removerá a proposta comercial do sistema.`}
        confirmLabel="Sim, Excluir Orçamento"
        variant="danger"
      />

      {/* Confirm Convert Quote to Order Modal */}
      <ConfirmModal
        isOpen={!!quoteToApprove}
        onClose={() => setQuoteToApprove(null)}
        onConfirm={() => {
          if (quoteToApprove) {
            convertQuoteToOrder(quoteToApprove.id);
            setQuoteToApprove(null);
            setSaveSuccessMsg(`Orçamento ${quoteToApprove.code} aprovado e convertido em Pedido de Venda!`);
            setTimeout(() => setSaveSuccessMsg(null), 3000);
          }
        }}
        title="Fechar Pedido e Baixar Estoque"
        message={`Deseja aprovar e converter o orçamento ${quoteToApprove?.code} (${quoteToApprove?.customerName}) no valor de ${formatBRL(quoteToApprove?.totalAmount || 0)} em Pedido de Venda oficial com baixa de estoque?`}
        confirmLabel="Aprovar e Fechar Pedido"
        variant="primary"
      />
    </div>
  );
};
