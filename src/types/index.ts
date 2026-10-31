export type UserRole =
  | 'ADMINISTRADOR'
  | 'GERENTE'
  | 'VENDEDOR'
  | 'TECNICO'
  | 'ESTOQUISTA'
  | 'FINANCEIRO'
  | 'CLIENTE_B2B';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  customerId?: string; // if role is CLIENTE_B2B
  document?: string; // CPF
  commissionPercentage?: number;
  region?: string;
  active?: boolean;
  createdAt?: string;
}

export type FireClass = 'A' | 'B' | 'C' | 'D' | 'K';
export type ExtinguisherAgent = 'Água Pressurizada' | 'Pó Químico ABC' | 'Pó Químico BC' | 'CO2' | 'Espuma Mecânica' | 'Halogenado';

export interface CustomerContact {
  id: string;
  name: string;
  role: 'Diretoria' | 'Compras' | 'Financeiro' | 'Técnico / Brigada' | 'Outro';
  email: string;
  phone: string;
  whatsapp?: string;
}

export interface Customer {
  id: string;
  type: 'PJ' | 'PF';
  name: string; // Razão Social / Nome
  tradeName?: string; // Nome Fantasia
  document: string; // CNPJ / CPF
  stateRegistration?: string; // Inscrição Estadual
  municipalRegistration?: string; // Inscrição Municipal
  email: string;
  phone: string;
  whatsapp: string;
  website?: string;
  segment: string; // Ex: Construtora, Hospital, Indústria, Condomínio, Posto
  size: 'Micro' | 'Pequena' | 'Média' | 'Grande';
  contactPerson: string;
  contactRole: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    complement?: string;
  };
  billingAddress?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  deliveryAddress?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contacts: CustomerContact[];
  priceTableId: string;
  assignedSalespersonId?: string;
  notes?: string;
  createdAt: string;
  lastPurchaseDate?: string;
}

export type CrmStage =
  | 'NOVO_LEAD'
  | 'CONTATO_REALIZADO'
  | 'QUALIFICACAO'
  | 'ORCAMENTO'
  | 'NEGOCIACAO'
  | 'APROVADO'
  | 'PEDIDO'
  | 'FATURADO'
  | 'POS_VENDA';

export interface CrmLead {
  id: string;
  customerId?: string;
  title: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  stage: CrmStage;
  expectedValue: number;
  salespersonId: string;
  salespersonName: string;
  origin: 'Google / Web' | 'Indicação' | 'Prospecção Ativa' | 'WhatsApp' | 'Feira / Evento' | 'Vencimento Recarga';
  nextFollowUpDate: string;
  nextAction: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory = 'EXTINTORES' | 'ACESSORIOS' | 'SINALIZACAO' | 'HIDRANTES_EQUIPAMENTOS' | 'SERVICOS';

export interface Product {
  id: string;
  internalCode: string;
  sku: string;
  ean?: string;
  name: string;
  description: string;
  category: ProductCategory;
  subcategory: string;
  brand: string;
  manufacturer: string;
  model: string;
  type?: string;
  capacity?: string; // Ex: 4kg, 6kg, 10L
  weight?: string;
  dimensions?: string;
  fireClasses?: FireClass[];
  agent?: ExtinguisherAgent;
  application?: string;
  unit: string; // UN, PC, M, CX
  stockUnit: string;
  ncm: string;
  cest?: string;
  origin: string; // 0 - Nacional
  costPrice: number;
  salePrice: number; // Preço Varejo
  wholesalePrice: number; // Preço Atacado (ex: compras acima de X unidades)
  minPrice: number; // Preço Mínimo com margem de segurança
  targetMargin: number; // %
  currentStock: number;
  minStock: number;
  maxStock: number;
  stockLocation: string; // Corredor A, Prateleira 2
  isContecCommercialized: boolean; // Distingue catálogo geral de produtos vendidos pela CONTEC
  isActive: boolean;
  photoUrl: string;
  manualUrl?: string;
  technicalSheetUrl?: string;
  standards?: string; // Ex: NBR 15808, NBR 12693, Selo INMETRO
  relatedProductIds?: string[]; // Cross-sell / Up-sell (ex: extintor -> suporte e placa)
}

export interface PriceTable {
  id: string;
  name: string;
  description: string;
  discountPercentage: number; // Percentual base sobre o preço de varejo
  minOrderValue: number;
  isDefault?: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  type: 'MATRIZ' | 'OFICINA' | 'VEICULO' | 'FILIAL';
  responsibleUser: string;
}

export type StockMovementType = 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA' | 'AJUSTE' | 'RESERVA' | 'DEVOLUCAO' | 'PERDA' | 'AVARIA';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  targetWarehouseId?: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  referenceId?: string; // ID da OS ou Pedido
  date: string;
  userId: string;
  userName: string;
}

export type QuoteStatus = 'RASCUNHO' | 'ENVIADO' | 'VISUALIZADO' | 'EM_NEGOCIACAO' | 'APROVADO' | 'RECUSADO' | 'EXPIRADO';

export interface QuoteItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  discountPercent: number;
  totalPrice: number;
}

export interface Quote {
  id: string;
  code: string; // Ex: ORC-2026-1042
  customerId: string;
  customerName: string;
  customerDocument: string;
  salespersonId: string;
  salespersonName: string;
  items: QuoteItem[];
  subtotal: number;
  totalDiscount: number;
  displacementFee?: number; // Taxa de deslocamento / frete técnico
  totalAmount: number;
  overallMarginPercent: number;
  requiresManagerApproval: boolean;
  isApprovedByManager: boolean;
  managerApprovalNotes?: string;
  paymentTerms: string; // Ex: 30/60 dias no boleto, PIX 5% desc.
  deliveryDeadline: string; // Ex: 3 a 5 dias úteis
  validityDate: string;
  deliveryAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  contactPerson?: string;
  notes: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'ORCAMENTO'
  | 'APROVADO'
  | 'PEDIDO'
  | 'SEPARACAO'
  | 'FATURAMENTO'
  | 'EXPEDICAO'
  | 'ENTREGA'
  | 'CONCLUIDO'
  | 'CANCELADO';

export interface Order {
  id: string;
  orderNumber: string; // Ex: PED-2026-0812
  quoteId?: string;
  customerId: string;
  customerName: string;
  customerDocument: string;
  salespersonId: string;
  salespersonName: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  displacementFee?: number;
  totalAmount: number;
  paymentTerms: string;
  paymentMethod: 'Boleto B2B' | 'PIX' | 'Cartão PJ' | 'Transferência Bancária';
  paymentStatus: 'Pendente' | 'Faturado' | 'Pago';
  status: OrderStatus;
  deliveryAddress: string;
  deliveryDriver?: string;
  deliveryVehicle?: string;
  deliveryDate?: string;
  deliveryProofUrl?: string;
  isRecurrent?: boolean;
  recurrenceFrequency?: 'Semanal' | 'Quinzenal' | 'Mensal' | 'Trimestral';
  nextRecurrenceDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EquipmentStatus = 'ATIVO' | 'EM_MANUTENCAO' | 'CONDENADO' | 'RESERVA';

export type ExpirationLevel = 'VERDE' | 'AMARELO' | 'LARANJA' | 'VERMELHO';

export interface InstalledEquipment {
  id: string;
  patrimonyNumber: string; // Ex: CONT-EXT-0412
  internalCode: string;
  qrCodeUrl: string;
  customerId: string;
  customerName: string;
  location: string; // Ex: Prédio Administrativo
  environment: string; // Ex: Recepção, 1º Andar próximo ao elevador
  type: string; // Ex: Extintor Portátil
  agent: ExtinguisherAgent;
  capacity: string; // Ex: 4kg, 6kg, 10L
  fireClasses: FireClass[];
  manufacturer: string;
  model: string;
  serialNumber: string;
  inmetroSealNumber?: string;
  manufactureDate: string; // AAAA-MM
  installDate: string; // AAAA-MM-DD
  lastInspectionDate: string;
  lastMaintenanceDate: string; // Data da última recarga (Nível 2)
  lastHydrostaticTestDate?: string; // Data do teste hidrostático (Nível 3, 5 anos)
  nextMaintenanceDate: string; // Vencimento da recarga anual
  nextHydrostaticTestDate: string; // Vencimento do teste de 5 anos
  nextInspectionDate: string; // Vencimento da inspeção visual (semestral ou mensal)
  status: EquipmentStatus;
  notes?: string;
  photoUrl?: string;
}

export interface EquipmentTimelineEvent {
  id: string;
  equipmentId: string;
  date: string;
  type: 'INSTALACAO' | 'INSPECAO' | 'MANUTENCAO_RECARGA' | 'TESTE_HIDROSTATICO' | 'SUBSTITUICAO' | 'BAIXA';
  description: string;
  technicianName: string;
  workOrderId?: string;
  notes?: string;
}

export type WorkOrderType =
  | 'INSPECAO'
  | 'MANUTENCAO'
  | 'RECARGA'
  | 'INSTALACAO'
  | 'SUBSTITUICAO'
  | 'RETIRADA'
  | 'ENTREGA'
  | 'VISITA_TECNICA';

export type WorkOrderStatus = 'ABERTA' | 'AGENDADA' | 'EM_EXECUCAO' | 'AGUARDANDO' | 'CONCLUIDA' | 'CANCELADA';

export interface InspectionChecklistItem {
  id: string;
  description: string;
  checked: boolean;
  status: 'CONFORME' | 'NAO_CONFORME' | 'NAO_APLICAVEL';
  notes?: string;
}

export interface WorkOrder {
  id: string;
  code: string; // Ex: OS-2026-0491
  type: WorkOrderType;
  status: WorkOrderStatus;
  customerId: string;
  customerName: string;
  customerAddress: string;
  contactPerson: string;
  contactPhone: string;
  technicianId: string;
  technicianName: string;
  scheduledDate: string;
  scheduledTime: string;
  completedAt?: string;
  equipmentIds: string[];
  equipmentListSummary?: string;
  serviceDescription: string;
  checklist: InspectionChecklistItem[];
  photos: {
    id: string;
    type: 'ANTES' | 'DEPOIS' | 'EQUIPAMENTO' | 'LOCAL';
    url: string;
    caption: string;
    timestamp: string;
  }[];
  digitalSignature?: string; // Data URL da assinatura em canvas
  signeeName?: string;
  signeeDocument?: string;
  technicianNotes?: string;
  createdAt: string;
}

export interface FinancialAccount {
  id: string;
  customerId: string;
  customerName: string;
  orderId?: string;
  orderNumber?: string;
  installment: string; // Ex: 1/3
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'ABERTO' | 'PAGO' | 'ATRASADO' | 'CANCELADO';
  paymentMethod?: string;
  notes?: string;
}

export interface SalesCommission {
  id: string;
  salespersonId: string;
  salespersonName: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  orderTotal: number;
  commissionPercentage: number;
  commissionAmount: number;
  date: string;
  status: 'PREVISTA' | 'APROVADA' | 'PAGA';
}

export interface AppNotification {
  id: string;
  category: 'VENDAS' | 'ESTOQUE' | 'FINANCEIRO' | 'MANUTENCAO' | 'CLIENTES' | 'ORCAMENTOS' | 'PEDIDOS' | 'SISTEMA';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  linkModule?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

export interface CompanyConfig {
  name: string;
  tradeName: string;
  cnpj: string;
  stateRegistration: string;
  address: string;
  neighborhood: string;
  zipCode: string;
  city: string;
  state: string;
  phone: string;
  whatsapp: string;
  email: string;
  inmetroAccreditation: string;
  logoUrl?: string; // URL ou data-uri da logo da empresa
  criticalAlertDays: number; // Vermelho (vencido <= 0)
  highAlertDays: number; // Laranja (ex: 30 dias)
  mediumAlertDays: number; // Amarelo (ex: 60 dias)
  lowAlertDays: number; // Amarelo claro (ex: 90 dias)
}

export type PaymentMethod =
  | 'A_VISTA'
  | 'PARCELADO'
  | 'CARTAO_CREDITO'
  | 'PIX'
  | 'A_CRITERIO_CLIENTE'
  | 'BOLETO'
  | 'DINHEIRO'
  | 'CARTAO_DEBITO'
  | 'TRANSFERENCIA';

export interface PaymentReceipt {
  id: string;
  receiptNumber: string; // Ex: REC-2026-0001
  customerId?: string;
  customerName: string; // Razão Social / Nome do Pagador
  customerDocument: string; // CNPJ / CPF
  customerTradeName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  amount: number;
  amountInWords: string;
  description: string; // Referente a
  paymentMethod: PaymentMethod;
  paymentDate: string;
  // Campos de Parcelamento
  installmentCount?: number; // Quantidade de parcelas (ex: 2)
  installmentNumber?: number; // Número da parcela atual quitada (ex: 1)
  totalInstallmentAmount?: number; // Valor Total geral a ser recebido (ex: 500.00)
  orderNumber?: string;
  workOrderCode?: string;
  financialAccountId?: string;
  notes?: string;
  createdAt: string;
}

