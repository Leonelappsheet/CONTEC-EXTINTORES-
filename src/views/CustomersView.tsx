import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Flame,
  FileText,
  ShoppingBag,
  ExternalLink,
  X,
  CreditCard,
  Edit2,
  Trash2,
  Globe,
  Loader2,
  CheckCircle2,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Customer, CustomerContact } from '../types';
import { formatCNPJ, formatPhone, formatDateBR, formatBRL } from '../utils/formatters';
import { fetchCompanyDataByCnpj } from '../utils/cnpjService';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface CustomersViewProps {
  onSelectModule: (module: string) => void;
  onFilterCustomerEquipments?: (customerId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onSelectModule,
}) => {
  const { customers, equipments, orders, quotes, addCustomer, updateCustomer, deleteCustomer, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // CNPJ automatic lookup state
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [cnpjSearchSuccess, setCnpjSearchSuccess] = useState<string | null>(null);
  const [cnpjSearchError, setCnpjSearchError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    type: 'PJ' as 'PJ' | 'PF',
    name: '',
    tradeName: '',
    document: '',
    stateRegistration: '',
    municipalRegistration: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    segment: '',
    size: 'Média' as Customer['size'],
    contactPerson: '',
    contactRole: '',
    address: {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
    },
    contacts: [
      { id: '1', name: '', role: 'Compras' as CustomerContact['role'], email: '', phone: '', whatsapp: '' },
    ] as CustomerContact[],
    priceTableId: 'pt-1',
    notes: '',
  });

  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(q)) ||
      c.document.includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  // Table Column Interactive Sorting
  type CustomerSortField = 'name' | 'document' | 'segment' | 'contactPerson' | 'equipmentsCount' | 'lastPurchaseDate';
  type SortDirection = 'asc' | 'desc';

  const [sortField, setSortField] = useState<CustomerSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: CustomerSortField) => {
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

  const sortedCustomers = useMemo(() => {
    if (!sortField) return filteredCustomers;

    return [...filteredCustomers].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          break;
        case 'document':
          comparison = (a.document || '').localeCompare(b.document || '', undefined, { numeric: true });
          break;
        case 'segment':
          comparison = (a.segment || '').localeCompare(b.segment || '', undefined, { sensitivity: 'base' });
          break;
        case 'contactPerson':
          comparison = (a.contactPerson || '').localeCompare(b.contactPerson || '', undefined, { sensitivity: 'base' });
          break;
        case 'equipmentsCount': {
          const countA = equipments.filter((e) => e.customerId === a.id).length;
          const countB = equipments.filter((e) => e.customerId === b.id).length;
          comparison = countA - countB;
          break;
        }
        case 'lastPurchaseDate': {
          const dateA = a.lastPurchaseDate ? new Date(a.lastPurchaseDate).getTime() : 0;
          const dateB = b.lastPurchaseDate ? new Date(b.lastPurchaseDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredCustomers, sortField, sortDirection, equipments]);

  const handleCnpjLookup = async (cnpjToQuery?: string) => {
    const raw = cnpjToQuery || formData.document;
    const clean = raw.replace(/\D/g, '');

    if (clean.length !== 14) {
      setCnpjSearchError('CNPJ precisa ter 14 dígitos para consulta.');
      setCnpjSearchSuccess(null);
      return;
    }

    setIsSearchingCnpj(true);
    setCnpjSearchError(null);
    setCnpjSearchSuccess(null);

    try {
      const data = await fetchCompanyDataByCnpj(clean);

      setFormData((prev) => ({
        ...prev,
        document: data.cnpj,
        name: data.razaoSocial || prev.name,
        tradeName: data.nomeFantasia || prev.tradeName,
        contactPerson: data.contatoResponsavel || prev.contactPerson || 'Administrador Responsável',
        whatsapp: data.telefone || prev.whatsapp,
        phone: data.telefone || prev.phone,
        email: data.email || prev.email,
        segment: data.segmentoSugerido || prev.segment,
        address: {
          ...prev.address,
          street: `${data.endereco.logradouro}, ${data.endereco.numero}${data.endereco.complemento ? ' - ' + data.endereco.complemento : ''}`,
          number: data.endereco.numero,
          neighborhood: data.endereco.bairro || prev.address.neighborhood,
          city: data.endereco.municipio || prev.address.city,
          state: data.endereco.uf || prev.address.state,
          zipCode: data.endereco.cep || prev.address.zipCode,
        },
        contacts: data.contatoResponsavel
          ? [
              {
                id: 'cnt-1',
                name: data.contatoResponsavel,
                role: 'Diretoria',
                email: data.email || '',
                phone: data.telefone || '',
                whatsapp: data.telefone || '',
              },
            ]
          : prev.contacts,
      }));

      setCnpjSearchSuccess(`Empresa localizada na Receita Federal: ${data.razaoSocial} (Situação: ${data.situacaoCadastral})`);
    } catch (err: any) {
      setCnpjSearchError(err?.message || 'Erro ao consultar CNPJ na internet. Verifique o número digitado.');
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  const handleOpenNew = () => {
    setEditingCustomer(null);
    setCnpjSearchSuccess(null);
    setCnpjSearchError(null);
    setFormData({
      type: 'PJ',
      name: '',
      tradeName: '',
      document: '',
      stateRegistration: '',
      municipalRegistration: '',
      email: '',
      phone: '',
      whatsapp: '',
      website: '',
      segment: '',
      size: 'Média',
      contactPerson: '',
      contactRole: '',
      address: {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
      },
      contacts: [
        { id: '1', name: '', role: 'Compras' as CustomerContact['role'], email: '', phone: '', whatsapp: '' },
      ] as CustomerContact[],
      priceTableId: 'pt-1',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleEditCustomer = (cust: Customer) => {
    setEditingCustomer(cust);
    setCnpjSearchSuccess(null);
    setCnpjSearchError(null);
    setFormData({
      type: cust.type || 'PJ',
      name: cust.name || '',
      tradeName: cust.tradeName || '',
      document: cust.document || '',
      stateRegistration: cust.stateRegistration || '',
      municipalRegistration: cust.municipalRegistration || '',
      email: cust.email || '',
      phone: cust.phone || '',
      whatsapp: cust.whatsapp || '',
      website: cust.website || '',
      segment: cust.segment || 'Comércio & Varejo',
      size: cust.size || 'Média',
      contactPerson: cust.contactPerson || '',
      contactRole: cust.contactRole || 'Responsável',
      address: {
        street: cust.address?.street || '',
        number: cust.address?.number || '',
        neighborhood: cust.address?.neighborhood || '',
        city: cust.address?.city || 'Teresina',
        state: cust.address?.state || 'PI',
        zipCode: cust.address?.zipCode || '',
      },
      contacts: cust.contacts && cust.contacts.length > 0 ? cust.contacts : [
        { id: '1', name: cust.contactPerson || '', role: 'Compras', email: cust.email || '', phone: cust.phone || '', whatsapp: cust.whatsapp || '' }
      ],
      priceTableId: cust.priceTableId || 'pt-1',
      notes: cust.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = (cust: Customer) => {
    setCustomerToDelete(cust);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
    } else {
      addCustomer(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users size={20} className="text-red-600" />
              <span>Cadastro & Gestão de Clientes B2B</span>
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {filteredCustomers.length} cadastrados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            CRM completo de contas jurídicas e físicas com múltiplos contatos, parques de extintores instalados e histórico de pedidos.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus size={15} />
          <span>Cadastrar Empresa</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Razão Social, CNPJ, responsável, telefone..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Sorting Status indicator bar */}
      {sortField && (
        <div className="flex items-center justify-between bg-slate-100/80 border border-slate-200/90 px-3.5 py-1.5 rounded-lg text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-semibold text-slate-900">Ordenação ativa:</span>
            <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded-md font-mono text-[11px]">
              {sortField === 'name' && 'Empresa / Razão Social'}
              {sortField === 'document' && 'CNPJ / CPF'}
              {sortField === 'segment' && 'Segmento'}
              {sortField === 'contactPerson' && 'Responsável & Contato'}
              {sortField === 'equipmentsCount' && 'Quantidade de Extintores'}
              {sortField === 'lastPurchaseDate' && 'Última Compra'}
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

      {/* Customers List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider select-none">
              <tr>
                {/* 1. Empresa / Razão Social */}
                <th
                  onClick={() => handleSort('name')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'name'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Razão Social (A-Z ou Z-A)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Empresa / Razão Social</span>
                    {sortField === 'name' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 2. CNPJ / CPF */}
                <th
                  onClick={() => handleSort('document')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'document'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por CNPJ/CPF (Numérica)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>CNPJ / CPF</span>
                    {sortField === 'document' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? '1-9' : '9-1'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 3. Segmento */}
                <th
                  onClick={() => handleSort('segment')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'segment'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Segmento (A-Z ou Z-A)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Segmento</span>
                    {sortField === 'segment' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 4. Responsável & Contato */}
                <th
                  onClick={() => handleSort('contactPerson')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'contactPerson'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Responsável (A-Z ou Z-A)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Responsável & Contato</span>
                    {sortField === 'contactPerson' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 5. Extintores */}
                <th
                  onClick={() => handleSort('equipmentsCount')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'equipmentsCount'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Quantidade de Extintores (Numérica)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Extintores</span>
                    {sortField === 'equipmentsCount' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? 'Menos' : 'Mais'}
                      </span>
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 6. Última Compra */}
                <th
                  onClick={() => handleSort('lastPurchaseDate')}
                  className={`py-3 px-4 cursor-pointer transition-colors group ${
                    sortField === 'lastPurchaseDate'
                      ? 'bg-red-50 text-red-700 font-bold border-b-2 border-red-500'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Clique para ordenar por Data da Última Compra (Cronológica)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Última Compra</span>
                    {sortField === 'lastPurchaseDate' ? (
                      <span className="flex items-center text-red-600 bg-red-100 px-1 py-0.5 rounded text-[9px] font-bold">
                        {sortDirection === 'asc' ? <ArrowUp size={11} className="mr-0.5" /> : <ArrowDown size={11} className="mr-0.5" />}
                        {sortDirection === 'asc' ? 'Antigas' : 'Recentes'}
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
              {sortedCustomers.map((cust) => {
                const customerEquipments = equipments.filter((e) => e.customerId === cust.id);
                const customerOrders = orders.filter((o) => o.customerId === cust.id);

                return (
                  <tr
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                        {cust.name}
                      </div>
                      {cust.tradeName && (
                        <span className="inline-block text-[10px] text-slate-600 font-medium bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded mt-0.5">
                          {cust.tradeName}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">
                      <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200/90 font-mono font-bold text-slate-700 text-xs shadow-2xs">
                        {formatCNPJ(cust.document)}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/80 text-[10px] font-bold shadow-2xs">
                        {cust.segment}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{cust.contactPerson}</div>
                      <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 text-emerald-800 font-mono px-2 py-0.5 rounded text-[10px] font-semibold mt-0.5">
                        <Phone size={10} className="text-emerald-600" />
                        <span>{formatPhone(cust.whatsapp || cust.phone)}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-xs shadow-2xs">
                        <Flame size={13} className="text-red-500" />
                        <span>{customerEquipments.length} extintores</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-xs font-mono">
                      {cust.lastPurchaseDate ? (
                        <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          {formatDateBR(cust.lastPurchaseDate)}
                        </span>
                      ) : (
                        <span className="text-slate-400">Sem compras</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditCustomer(cust)}
                          title="Editar Cadastro do Cliente"
                          className="px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1"
                        >
                          <Edit2 size={13} />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(cust)}
                          title="Excluir Cliente"
                          className="px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors flex items-center gap-1"
                        >
                          <Trash2 size={13} />
                          <span>Excluir</span>
                        </button>
                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          Ver Detalhes
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <Users size={32} className="mx-auto text-slate-300" />
                      <p className="text-sm font-bold text-slate-700">Nenhum cliente encontrado</p>
                      <p className="text-xs text-slate-500">
                        {customers.length === 0
                          ? 'O sistema está zerado. Clique em "Cadastrar Empresa", digite o CNPJ e puxe todos os dados da internet!'
                          : 'Nenhum resultado corresponde à sua busca.'}
                      </p>
                      {customers.length === 0 && (
                        <button
                          onClick={handleOpenNew}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Plus size={14} />
                          <span>Cadastrar Primeiro Cliente</span>
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

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <div className="flex items-center gap-2.5">
                <Building2 size={20} className="text-red-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedCustomer.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    CNPJ: {formatCNPJ(selectedCustomer.document)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
              {/* Addresses and Basic Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Endereço Principal</span>
                  <div className="text-slate-200">
                    {selectedCustomer.address.street}, {selectedCustomer.address.number}
                  </div>
                  <div className="text-slate-400">
                    {selectedCustomer.address.neighborhood} · {selectedCustomer.address.city}-{selectedCustomer.address.state}
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Contato Principal</span>
                  <div className="text-slate-200 font-semibold">{selectedCustomer.contactPerson}</div>
                  <div className="text-slate-400">{selectedCustomer.contactRole}</div>
                  <div className="text-emerald-400 font-mono">{formatPhone(selectedCustomer.whatsapp)}</div>
                </div>
              </div>

              {/* Multiple Contacts */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase text-slate-400">Contatos Autorizados da Empresa</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCustomer.contacts.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 flex justify-between">
                      <div>
                        <div className="font-semibold text-white">{c.name}</div>
                        <div className="text-[10px] text-red-400">{c.role}</div>
                      </div>
                      <div className="text-right text-slate-400 font-mono text-[10px]">
                        <div>{c.phone}</div>
                        <div>{c.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Installed Extinguishers in this Customer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase text-slate-400">
                    Parque de Extintores Instalados ({equipments.filter((e) => e.customerId === selectedCustomer.id).length})
                  </h4>
                  <button
                    onClick={() => {
                      setSelectedCustomer(null);
                      onSelectModule('equipments');
                    }}
                    className="text-red-400 hover:underline text-[11px]"
                  >
                    Gerenciar no Mapa →
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {equipments
                    .filter((e) => e.customerId === selectedCustomer.id)
                    .map((eq) => (
                      <div key={eq.id} className="p-2 rounded bg-slate-800/80 border border-slate-700 flex justify-between items-center">
                        <div>
                          <span className="font-mono font-bold text-red-400">{eq.patrimonyNumber}</span> ·{' '}
                          <span className="text-slate-200">{eq.agent} {eq.capacity}</span>
                          <span className="text-slate-500 block text-[10px]">Local: {eq.environment}</span>
                        </div>
                        <div className="text-right font-mono text-[11px] text-slate-300">
                          Recarga: {formatDateBR(eq.nextMaintenanceDate)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => handleDeleteCustomer(selectedCustomer)}
                  className="w-full sm:w-auto px-3.5 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-red-900/50"
                >
                  <Trash2 size={14} />
                  <span>Excluir Cliente</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      const cust = selectedCustomer;
                      setSelectedCustomer(null);
                      handleEditCustomer(cust);
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Edit2 size={14} />
                    <span>Editar Cadastro</span>
                  </button>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New / Edit Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-red-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingCustomer ? `Editar Cliente: ${editingCustomer.name}` : 'Cadastrar Empresa / Cliente B2B'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
              {/* Highlighted CNPJ Lookup Box at Top */}
              <div className="p-4 rounded-xl bg-slate-800/90 border border-red-500/40 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-white font-bold text-xs flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>CNPJ da Empresa (Busca Automática na Receita Federal / Internet) *</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Ao digitar 14 dígitos, busca em tempo real
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={formData.document}
                      onChange={(e) => {
                        const val = e.target.value;
                        const clean = val.replace(/\D/g, '');
                        const formatted = clean.length <= 14 ? formatCNPJ(val) : val;
                        setFormData({ ...formData, document: formatted });

                        // If user completes 14 digits, automatically query the internet
                        if (clean.length === 14) {
                          handleCnpjLookup(clean);
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData('text');
                        const clean = pasted.replace(/\D/g, '');
                        if (clean.length === 14) {
                          setTimeout(() => handleCnpjLookup(clean), 50);
                        }
                      }}
                      required
                      placeholder="00.000.000/0000-00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm font-semibold placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCnpjLookup()}
                    disabled={isSearchingCnpj}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md transition-colors whitespace-nowrap"
                  >
                    {isSearchingCnpj ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Globe size={15} />
                    )}
                    <span>{isSearchingCnpj ? 'Consultando...' : 'Puxar Dados da Internet'}</span>
                  </button>
                </div>

                {/* Feedback Banners */}
                {isSearchingCnpj && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-950/70 border border-blue-800/80 text-blue-300 text-xs animate-pulse">
                    <Loader2 size={14} className="animate-spin shrink-0" />
                    <span>Consultando base da Receita Federal e dados cadastrais na internet...</span>
                  </div>
                )}

                {cnpjSearchSuccess && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span className="font-medium">{cnpjSearchSuccess}</span>
                  </div>
                )}

                {cnpjSearchError && (
                  <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-800 text-red-300 text-xs">
                    <span>{cnpjSearchError}</span>
                  </div>
                )}
              </div>

              {/* Form Fields Auto-filled and 100% Editable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Razão Social (Nome Oficial) *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Razão Social da empresa"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    placeholder="Nome Fantasia (opcional)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Tipo de Pessoa</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'PJ' | 'PF' })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="PJ">Pessoa Jurídica (PJ / CNPJ)</option>
                    <option value="PF">Pessoa Física (PF / CPF)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Inscrição Estadual</label>
                  <input
                    type="text"
                    value={formData.stateRegistration}
                    onChange={(e) => setFormData({ ...formData, stateRegistration: e.target.value })}
                    placeholder="Inscrição Estadual ou ISENTO"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Inscrição Municipal</label>
                  <input
                    type="text"
                    value={formData.municipalRegistration}
                    onChange={(e) => setFormData({ ...formData, municipalRegistration: e.target.value })}
                    placeholder="Inscrição Municipal"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Segmento de Atuação</label>
                  <select
                    value={formData.segment}
                    onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Selecione o segmento...</option>
                    <option value="Comércio & Varejo">Comércio & Varejo</option>
                    <option value="Construção Civil & Obras">Construção Civil & Obras</option>
                    <option value="Saúde & Hospitalar">Saúde & Hospitalar</option>
                    <option value="Indústria & Fabricação">Indústria & Fabricação</option>
                    <option value="Postos de Combustíveis">Postos de Combustíveis</option>
                    <option value="Condomínios Residenciais">Condomínios Residenciais</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Contato Responsável *</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    required
                    placeholder="Nome do responsável"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Cargo / Função do Contato</label>
                  <input
                    type="text"
                    value={formData.contactRole}
                    onChange={(e) => setFormData({ ...formData, contactRole: e.target.value })}
                    placeholder="Cargo ou função"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">WhatsApp / Celular *</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value, phone: formData.phone || e.target.value })}
                    required
                    placeholder="(00) 00000-0000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Telefone Fixo</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 0000-0000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">E-mail Comercial</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@empresa.com.br"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Detailed Address Grid */}
                <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-slate-800">
                  <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <MapPin size={13} className="text-red-400" />
                    <span>Endereço da Empresa / Instalação</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
                    <div className="sm:col-span-3">
                      <label className="text-slate-400 text-[10px] block mb-0.5">Logradouro / Rua / Avenida</label>
                      <input
                        type="text"
                        value={formData.address.street}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, street: e.target.value },
                          })
                        }
                        placeholder="Logradouro, rua, avenida..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="text-slate-400 text-[10px] block mb-0.5">Número</label>
                      <input
                        type="text"
                        value={formData.address.number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, number: e.target.value },
                          })
                        }
                        placeholder="Número ou S/N"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-slate-400 text-[10px] block mb-0.5">Bairro</label>
                      <input
                        type="text"
                        value={formData.address.neighborhood}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, neighborhood: e.target.value },
                          })
                        }
                        placeholder="Bairro"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-slate-400 text-[10px] block mb-0.5">Cidade</label>
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, city: e.target.value },
                          })
                        }
                        placeholder="Cidade"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="text-slate-400 text-[10px] block mb-0.5">UF</label>
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, state: e.target.value.toUpperCase() },
                          })
                        }
                        placeholder="UF"
                        maxLength={2}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono uppercase text-center focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-slate-400 text-[10px] block mb-0.5">CEP</label>
                      <input
                        type="text"
                        value={formData.address.zipCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, zipCode: e.target.value },
                          })
                        }
                        placeholder="00000-000"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-slate-300 font-semibold block mb-1">Observações Internas / Informações Técnicas</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Instruções para vistoria, ponto de referência no local, etc."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold shadow transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>{editingCustomer ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete Customer Modal */}
      <ConfirmModal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={() => {
          if (customerToDelete) {
            deleteCustomer(customerToDelete.id);
            if (selectedCustomer?.id === customerToDelete.id) {
              setSelectedCustomer(null);
            }
            setCustomerToDelete(null);
          }
        }}
        title="Excluir Empresa / Cliente B2B"
        message={`Tem certeza que deseja excluir o cliente "${customerToDelete?.name}" (${formatCNPJ(customerToDelete?.document || '')})?\n\nEsta operação removerá o cadastro da empresa do sistema.`}
        confirmLabel="Sim, Excluir Cliente"
        variant="danger"
      />
    </div>
  );
};
