import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  User,
  UserRole,
  Customer,
  Product,
  PriceTable,
  InstalledEquipment,
  WorkOrder,
  Quote,
  Order,
  FinancialAccount,
  SalesCommission,
  AppNotification,
  AuditLog,
  CompanyConfig,
  CrmLead,
  StockMovement,
  Warehouse,
  OrderStatus,
  WorkOrderStatus,
  CrmStage,
  PaymentReceipt,
} from '../types';
import {
  initialCompanyConfig,
  initialUsers,
  initialPriceTables,
  initialWarehouses,
  initialProducts,
  initialCustomers,
  initialEquipments,
  initialWorkOrders,
  initialQuotes,
  initialOrders,
  initialFinancialAccounts,
  initialCommissions,
  initialCrmLeads,
  initialStockMovements,
  initialNotifications,
  initialAuditLogs,
  initialReceipts,
} from '../data/mockData';
import { generateQrCodeDataUrl, calculateDaysRemaining } from '../utils/formatters';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  hasPermission: (module: string, action: 'view' | 'create' | 'edit' | 'delete') => boolean;
  companyConfig: CompanyConfig;
  updateCompanyConfig: (config: Partial<CompanyConfig>) => void;

  // Real-time synchronization status
  isSyncActive: boolean;

  // Authentication
  isAuthenticated: boolean;
  login: (login: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;

  // Employees & External Sellers Management
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => { success: boolean; message?: string };

  // Customers
  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, cust: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Products
  products: Product[];
  addProduct: (prod: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, prod: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Equipments
  equipments: InstalledEquipment[];
  addEquipment: (eq: Omit<InstalledEquipment, 'id' | 'qrCodeUrl'>) => Promise<void>;
  updateEquipment: (id: string, eq: Partial<InstalledEquipment>) => void;
  deleteEquipment: (id: string) => void;

  // Work Orders (OS)
  workOrders: WorkOrder[];
  addWorkOrder: (wo: Omit<WorkOrder, 'id' | 'code' | 'createdAt'>) => void;
  updateWorkOrder: (id: string, wo: Partial<WorkOrder>) => void;
  deleteWorkOrder: (id: string) => void;
  updateWorkOrderStatus: (id: string, status: WorkOrderStatus) => void;

  // Quotes
  quotes: Quote[];
  addQuote: (q: Omit<Quote, 'id' | 'code' | 'createdAt' | 'updatedAt'> & { createdAt?: string }) => void;
  updateQuote: (id: string, q: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  approveQuoteDiscount: (id: string, managerNotes: string) => void;
  convertQuoteToOrder: (quoteId: string) => void;

  // Orders
  orders: Order[];
  addOrder: (o: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateOrder: (id: string, o: Partial<Order>) => void;
  deleteOrder: (id: string) => void;

  // CRM
  crmLeads: CrmLead[];
  addCrmLead: (lead: Omit<CrmLead, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCrmLeadStage: (id: string, stage: CrmStage) => void;
  updateCrmLead: (id: string, lead: Partial<CrmLead>) => void;
  deleteCrmLead: (id: string) => void;

  // Stock
  warehouses: Warehouse[];
  stockMovements: StockMovement[];
  addStockMovement: (sm: Omit<StockMovement, 'id' | 'date'>) => void;

  // Financial & Commissions
  financialAccounts: FinancialAccount[];
  updateFinancialAccountStatus: (id: string, status: 'ABERTO' | 'PAGO' | 'ATRASADO') => void;
  updateFinancialAccount: (id: string, data: Partial<FinancialAccount>) => void;
  deleteFinancialAccount: (id: string) => void;
  commissions: SalesCommission[];

  // Payment Receipts (Emissão de Recibos de Pagamento)
  receipts: PaymentReceipt[];
  addReceipt: (receipt: Omit<PaymentReceipt, 'id' | 'createdAt'>) => PaymentReceipt;
  updateReceipt: (id: string, updates: Partial<PaymentReceipt>) => void;
  deleteReceipt: (id: string) => void;


  // Price tables
  priceTables: PriceTable[];
  updatePriceTable: (id: string, data: Partial<PriceTable>) => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadCount: number;

  // Audit Logs
  auditLogs: AuditLog[];
  logAuditAction: (action: string, details: string) => void;

  // WhatsApp helpers
  getWhatsAppRenewalUrl: (customer: Customer, equipmentsCount: number, daysLeft: number) => string;
  getWhatsAppQuoteUrl: (quote: Quote) => string;
  getWhatsAppOrderUrl: (order: Order) => string;
  getWhatsAppOsUrl: (wo: WorkOrder) => string;

  // Global search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Reset & Security Wipe
  resetDemoData: () => void;
  adminPassword: string;
  updateAdminPassword: (newPass: string) => void;
  wipeAllData: (enteredPassword: string, wipeCatalog?: boolean) => { success: boolean; message: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('contec_auth_logged') === 'true';
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('contec_users');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        const hasLuciano = parsed.some(
          (u) => u.name === 'Luciano Lopes' || u.username?.toLowerCase() === 'luciano'
        );
        if (hasLuciano) {
          return parsed.map((u) => {
            if (u.name === 'Luciano Lopes' || u.username?.toLowerCase() === 'luciano') {
              return {
                ...u,
                role: 'ADMINISTRADOR' as UserRole,
                username: 'Luciano',
                password: u.password || 'Protec',
              };
            }
            if (u.role === 'ADMINISTRADOR') {
              return { ...u, role: 'GERENTE' as UserRole };
            }
            return u;
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    return initialUsers;
  });

  useEffect(() => {
    localStorage.setItem('contec_users', JSON.stringify(users));
  }, [users]);

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('contec_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'ADMINISTRADOR') {
          return initialUsers[0]; // Luciano Lopes
        }
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return initialUsers[0]; // Luciano Lopes (Administrador)
  });

  useEffect(() => {
    localStorage.setItem('contec_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>(() => {
    const saved = localStorage.getItem('contec_company_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.logoUrl || parsed.logoUrl.trim() === '') {
          return { ...parsed, logoUrl: '/assets/aistudio/image_3829201b.png' };
        }
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return { ...initialCompanyConfig, logoUrl: '/assets/aistudio/image_3829201b.png' };
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('contec_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('contec_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [equipments, setEquipments] = useState<InstalledEquipment[]>(() => {
    const saved = localStorage.getItem('contec_equipments');
    return saved ? JSON.parse(saved) : initialEquipments;
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem('contec_work_orders');
    return saved ? JSON.parse(saved) : initialWorkOrders;
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem('contec_quotes');
    return saved ? JSON.parse(saved) : initialQuotes;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('contec_orders');
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [crmLeads, setCrmLeads] = useState<CrmLead[]>(() => {
    const saved = localStorage.getItem('contec_crm_leads');
    return saved ? JSON.parse(saved) : initialCrmLeads;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('contec_stock_movements');
    return saved ? JSON.parse(saved) : initialStockMovements;
  });

  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>(() => {
    const saved = localStorage.getItem('contec_financial');
    return saved ? JSON.parse(saved) : initialFinancialAccounts;
  });

  const [commissions, setCommissions] = useState<SalesCommission[]>(() => {
    const saved = localStorage.getItem('contec_commissions');
    return saved ? JSON.parse(saved) : initialCommissions;
  });

  const [receipts, setReceipts] = useState<PaymentReceipt[]>(() => {
    const saved = localStorage.getItem('contec_receipts');
    return saved ? JSON.parse(saved) : initialReceipts;
  });


  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('contec_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('contec_audit_logs');
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem('contec_admin_password') || '0000';
  });

  const [priceTables, setPriceTables] = useState<PriceTable[]>(() => {
    const saved = localStorage.getItem('contec_price_tables');
    return saved ? JSON.parse(saved) : initialPriceTables;
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Real-Time Cross-Device & Multi-Tab Synchronization Engine
  const clientId = useRef<string>('c_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36));
  const isInitialHydrated = useRef<boolean>(false);
  const isRemoteApplying = useRef<boolean>(false);
  const lastSyncTimestamp = useRef<number>(0);
  const syncChannel = useRef<BroadcastChannel | null>(null);
  const [isSyncActive, setIsSyncActive] = useState<boolean>(true);

  // Apply update received from server or other tab
  const applyRemoteUpdate = useCallback((key: string, data: any) => {
    isRemoteApplying.current = true;
    switch (key) {
      case 'customers':
        setCustomers(data);
        localStorage.setItem('contec_customers', JSON.stringify(data));
        break;
      case 'users':
        setUsers(data);
        localStorage.setItem('contec_users', JSON.stringify(data));
        break;
      case 'products':
        setProducts(data);
        localStorage.setItem('contec_products', JSON.stringify(data));
        break;
      case 'equipments':
        setEquipments(data);
        localStorage.setItem('contec_equipments', JSON.stringify(data));
        break;
      case 'workOrders':
        setWorkOrders(data);
        localStorage.setItem('contec_work_orders', JSON.stringify(data));
        break;
      case 'quotes':
        setQuotes(data);
        localStorage.setItem('contec_quotes', JSON.stringify(data));
        break;
      case 'orders':
        setOrders(data);
        localStorage.setItem('contec_orders', JSON.stringify(data));
        break;
      case 'crmLeads':
        setCrmLeads(data);
        localStorage.setItem('contec_crm_leads', JSON.stringify(data));
        break;
      case 'stockMovements':
        setStockMovements(data);
        localStorage.setItem('contec_stock_movements', JSON.stringify(data));
        break;
      case 'financialAccounts':
        setFinancialAccounts(data);
        localStorage.setItem('contec_financial', JSON.stringify(data));
        break;
      case 'commissions':
        setCommissions(data);
        localStorage.setItem('contec_commissions', JSON.stringify(data));
        break;
      case 'receipts':
        setReceipts(data);
        localStorage.setItem('contec_receipts', JSON.stringify(data));
        break;
      case 'companyConfig':
        setCompanyConfig(data);
        localStorage.setItem('contec_company_config', JSON.stringify(data));
        break;
      case 'priceTables':
        setPriceTables(data);
        localStorage.setItem('contec_price_tables', JSON.stringify(data));
        break;
      case 'auditLogs':
        setAuditLogs(data);
        localStorage.setItem('contec_audit_logs', JSON.stringify(data));
        break;
    }
  }, []);

  // Broadcast local changes to server and other tabs
  const pushUpdateToServer = useCallback((key: string, data: any) => {
    if (isRemoteApplying.current) {
      isRemoteApplying.current = false;
      return;
    }
    const timestamp = Date.now();
    lastSyncTimestamp.current = timestamp;

    // 1. Broadcast to other tabs in the same browser (0ms delay)
    try {
      syncChannel.current?.postMessage({
        type: 'UPDATE',
        key,
        data,
        senderId: clientId.current,
        timestamp,
      });
    } catch {
      // BroadcastChannel unavailable
    }

    // 2. Broadcast to Central Express Server for all other computers/mobiles
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        data,
        senderId: clientId.current,
        timestamp,
      }),
    }).catch(() => {
      // transient network error
    });
  }, []);

  // Initialize Real-Time Sync on Mount
  useEffect(() => {
    // A. Setup BroadcastChannel for Instant Cross-Tab Sync
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('contec_sync_channel');
        syncChannel.current = bc;
        bc.onmessage = (event) => {
          const payload = event.data;
          if (payload && payload.senderId !== clientId.current) {
            if (payload.type === 'UPDATE' && payload.key) {
              applyRemoteUpdate(payload.key, payload.data);
            }
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not initialized', e);
    }

    // B. Hydrate from Centralized Express Server
    const hydrateFromServer = async () => {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Object.keys(json.data).length > 1) {
            const d = json.data;
            if (d.customers) { setCustomers(d.customers); localStorage.setItem('contec_customers', JSON.stringify(d.customers)); }
            if (d.users) { setUsers(d.users); localStorage.setItem('contec_users', JSON.stringify(d.users)); }
            if (d.products) { setProducts(d.products); localStorage.setItem('contec_products', JSON.stringify(d.products)); }
            if (d.equipments) { setEquipments(d.equipments); localStorage.setItem('contec_equipments', JSON.stringify(d.equipments)); }
            if (d.workOrders) { setWorkOrders(d.workOrders); localStorage.setItem('contec_work_orders', JSON.stringify(d.workOrders)); }
            if (d.quotes) { setQuotes(d.quotes); localStorage.setItem('contec_quotes', JSON.stringify(d.quotes)); }
            if (d.orders) { setOrders(d.orders); localStorage.setItem('contec_orders', JSON.stringify(d.orders)); }
            if (d.crmLeads) { setCrmLeads(d.crmLeads); localStorage.setItem('contec_crm_leads', JSON.stringify(d.crmLeads)); }
            if (d.stockMovements) { setStockMovements(d.stockMovements); localStorage.setItem('contec_stock_movements', JSON.stringify(d.stockMovements)); }
            if (d.financialAccounts) { setFinancialAccounts(d.financialAccounts); localStorage.setItem('contec_financial', JSON.stringify(d.financialAccounts)); }
            if (d.commissions) { setCommissions(d.commissions); localStorage.setItem('contec_commissions', JSON.stringify(d.commissions)); }
            if (d.receipts) { setReceipts(d.receipts); localStorage.setItem('contec_receipts', JSON.stringify(d.receipts)); }
            if (d.companyConfig) { setCompanyConfig(d.companyConfig); localStorage.setItem('contec_company_config', JSON.stringify(d.companyConfig)); }
            if (d.priceTables) { setPriceTables(d.priceTables); localStorage.setItem('contec_price_tables', JSON.stringify(d.priceTables)); }
            if (d.auditLogs) { setAuditLogs(d.auditLogs); localStorage.setItem('contec_audit_logs', JSON.stringify(d.auditLogs)); }
            lastSyncTimestamp.current = d.lastUpdated || Date.now();
          } else {
            // First time seed to server
            fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                senderId: clientId.current,
                fullState: {
                  customers,
                  users,
                  products,
                  equipments,
                  workOrders,
                  quotes,
                  orders,
                  crmLeads,
                  stockMovements,
                  financialAccounts,
                  commissions,
                  receipts,
                  companyConfig,
                  priceTables,
                  auditLogs,
                },
              }),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Initial server fetch error:', err);
      } finally {
        isInitialHydrated.current = true;
      }
    };

    hydrateFromServer();

    // C. Server-Sent Events (SSE) Live Stream Connection
    let eventSource: EventSource | null = null;
    let sseRetryTimer: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/stream');
        eventSource.onopen = () => {
          setIsSyncActive(true);
        };
        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (!payload || payload.senderId === clientId.current) return;
            if (payload.type === 'UPDATE' && payload.key) {
              applyRemoteUpdate(payload.key, payload.data);
            } else if (payload.type === 'FULL_SYNC' || payload.type === 'RESET') {
              if (payload.data) {
                const d = payload.data;
                if (d.customers) applyRemoteUpdate('customers', d.customers);
                if (d.users) applyRemoteUpdate('users', d.users);
                if (d.products) applyRemoteUpdate('products', d.products);
                if (d.equipments) applyRemoteUpdate('equipments', d.equipments);
                if (d.workOrders) applyRemoteUpdate('workOrders', d.workOrders);
                if (d.quotes) applyRemoteUpdate('quotes', d.quotes);
                if (d.orders) applyRemoteUpdate('orders', d.orders);
                if (d.crmLeads) applyRemoteUpdate('crmLeads', d.crmLeads);
                if (d.stockMovements) applyRemoteUpdate('stockMovements', d.stockMovements);
                if (d.financialAccounts) applyRemoteUpdate('financialAccounts', d.financialAccounts);
                if (d.commissions) applyRemoteUpdate('commissions', d.commissions);
                if (d.companyConfig) applyRemoteUpdate('companyConfig', d.companyConfig);
                if (d.priceTables) applyRemoteUpdate('priceTables', d.priceTables);
              }
            }
          } catch {
            // Heartbeat ping or unparseable
          }
        };
        eventSource.onerror = () => {
          setIsSyncActive(false);
          eventSource?.close();
          sseRetryTimer = setTimeout(connectSSE, 4000);
        };
      } catch {
        setIsSyncActive(false);
      }
    };

    connectSSE();

    // D. Polling Fallback (ensures 100% reliability even if SSE pauses)
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.lastUpdated && json.data.lastUpdated > lastSyncTimestamp.current) {
            lastSyncTimestamp.current = json.data.lastUpdated;
            const d = json.data;
            if (d.customers) applyRemoteUpdate('customers', d.customers);
            if (d.users) applyRemoteUpdate('users', d.users);
            if (d.products) applyRemoteUpdate('products', d.products);
            if (d.equipments) applyRemoteUpdate('equipments', d.equipments);
            if (d.workOrders) applyRemoteUpdate('workOrders', d.workOrders);
            if (d.quotes) applyRemoteUpdate('quotes', d.quotes);
            if (d.orders) applyRemoteUpdate('orders', d.orders);
            if (d.crmLeads) applyRemoteUpdate('crmLeads', d.crmLeads);
            if (d.stockMovements) applyRemoteUpdate('stockMovements', d.stockMovements);
            if (d.financialAccounts) applyRemoteUpdate('financialAccounts', d.financialAccounts);
            if (d.commissions) applyRemoteUpdate('commissions', d.commissions);
            if (d.companyConfig) applyRemoteUpdate('companyConfig', d.companyConfig);
            if (d.priceTables) applyRemoteUpdate('priceTables', d.priceTables);
            setIsSyncActive(true);
          }
        }
      } catch {
        // silent
      }
    }, 4000);

    return () => {
      syncChannel.current?.close();
      eventSource?.close();
      clearTimeout(sseRetryTimer);
      clearInterval(pollInterval);
    };
  }, [applyRemoteUpdate]);

  // Persist states to localStorage & broadcast to all connected devices/tabs
  useEffect(() => {
    localStorage.setItem('contec_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('contec_company_config', JSON.stringify(companyConfig));
    if (isInitialHydrated.current) {
      pushUpdateToServer('companyConfig', companyConfig);
    }
  }, [companyConfig, pushUpdateToServer]);

  useEffect(() => {
    localStorage.setItem('contec_users', JSON.stringify(users));
    if (isInitialHydrated.current) {
      pushUpdateToServer('users', users);
    }
  }, [users, pushUpdateToServer]);

  useEffect(() => {
    localStorage.setItem('contec_customers', JSON.stringify(customers));
    if (isInitialHydrated.current) {
      pushUpdateToServer('customers', customers);
    }
  }, [customers, pushUpdateToServer]);

  useEffect(() => {
    localStorage.setItem('contec_products', JSON.stringify(products));
    if (isInitialHydrated.current) {
      pushUpdateToServer('products', products);
    }
  }, [products, pushUpdateToServer]);

  useEffect(() => {
    localStorage.setItem('contec_equipments', JSON.stringify(equipments));
    if (isInitialHydrated.current) {
      pushUpdateToServer('equipments', equipments);
    }
  }, [equipments, pushUpdateToServer]);

  useEffect(() => {
    localStorage.setItem('contec_work_orders', JSON.stringify(workOrders));
    if (isInitialHydrated.current) {
      pushUpdateToServer('workOrders', workOrders);
    }
  }, [workOrders, pushUpdateToServer]);

  useEffect(() => {
    localStorage.setItem('contec_quotes', JSON.stringify(quotes));
    if (isInitialHydrated.current) {
      pushUpdateToServer('quotes', quotes);
    }
  }, [quotes, pushUpdateToServer]);

  useEffect(() => {
    localStorage.setItem('contec_orders', JSON.stringify(orders));
    if (isInitialHydrated.current) {
      pushUpdateToServer('orders', orders);
    }
  }, [orders, pushUpdateToServer]);

  useEffect(() => {
    localStorage.setItem('contec_crm_leads', JSON.stringify(crmLeads));
    if (isInitialHydrated.current) {
      pushUpdateToServer('crmLeads', crmLeads);
    }
  }, [crmLeads, pushUpdateToServer]);

  useEffect(() => {
    localStorage.setItem('contec_stock_movements', JSON.stringify(stockMovements));
    if (isInitialHydrated.current) {
      pushUpdateToServer('stockMovements', stockMovements);
    }
  }, [stockMovements, pushUpdateToServer]);

  useEffect(() => {
    localStorage.setItem('contec_financial', JSON.stringify(financialAccounts));
    if (isInitialHydrated.current) {
      pushUpdateToServer('financialAccounts', financialAccounts);
    }
  }, [financialAccounts, pushUpdateToServer]);

  useEffect(() => {
    localStorage.setItem('contec_commissions', JSON.stringify(commissions));
    if (isInitialHydrated.current) {
      pushUpdateToServer('commissions', commissions);
    }
  }, [commissions, pushUpdateToServer]);

  useEffect(() => {
    localStorage.setItem('contec_receipts', JSON.stringify(receipts));
    if (isInitialHydrated.current) {
      pushUpdateToServer('receipts', receipts);
    }
  }, [receipts, pushUpdateToServer]);

  useEffect(() => {
    localStorage.setItem('contec_price_tables', JSON.stringify(priceTables));
    if (isInitialHydrated.current) {
      pushUpdateToServer('priceTables', priceTables);
    }
  }, [priceTables, pushUpdateToServer]);

  useEffect(() => {
    localStorage.setItem('contec_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('contec_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Pre-generate QR Codes for equipments missing qrCodeUrl
  useEffect(() => {
    const generateMissingQrs = async () => {
      let changed = false;
      const updated = await Promise.all(
        equipments.map(async (eq) => {
          if (!eq.qrCodeUrl) {
            changed = true;
            const payload = JSON.stringify({
              app: 'CONTEC_B2B',
              eqId: eq.id,
              patrimony: eq.patrimonyNumber,
              client: eq.customerName,
              model: `${eq.agent} ${eq.capacity}`,
              nextMaint: eq.nextMaintenanceDate,
            });
            const qrUrl = await generateQrCodeDataUrl(payload);
            return { ...eq, qrCodeUrl: qrUrl };
          }
          return eq;
        })
      );
      if (changed) {
        setEquipments(updated);
      }
    };
    generateMissingQrs();
  }, [equipments]);

  // RBAC Permission Engine
  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
    const role: UserRole = currentUser.role;
    if (role === 'ADMINISTRADOR') return true;

    if (role === 'GERENTE') {
      if (module === 'settings' && action === 'delete') return false;
      return true;
    }

    if (role === 'VENDEDOR') {
      if (module === 'customers' || module === 'quotes' || module === 'orders' || module === 'crm') {
        return action !== 'delete';
      }
      if (module === 'products' || module === 'catalog' || module === 'equipments') {
        return action === 'view';
      }
      if (module === 'commissions') return action === 'view';
      return false;
    }

    if (role === 'TECNICO') {
      if (module === 'workOrders' || module === 'equipments' || module === 'qrScanner' || module === 'schedule') {
        return true;
      }
      if (module === 'customers' || module === 'products') return action === 'view';
      return false;
    }

    if (role === 'ESTOQUISTA') {
      if (module === 'stock' || module === 'products') return true;
      if (module === 'orders') return action === 'view' || action === 'edit';
      return false;
    }

    if (role === 'FINANCEIRO') {
      if (module === 'financial' || module === 'reports' || module === 'commissions') return true;
      if (module === 'orders' || module === 'customers') return action === 'view';
      return false;
    }

    if (role === 'CLIENTE_B2B') {
      if (module === 'clientPortal' || module === 'catalog' || module === 'myEquipments' || module === 'myOrders' || module === 'myQuotes') {
        return action === 'view' || action === 'create';
      }
      return false;
    }

    return false;
  };

  const logAuditAction = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  };

  const updateCompanyConfig = (newConf: Partial<CompanyConfig>) => {
    setCompanyConfig((prev) => ({ ...prev, ...newConf }));
    logAuditAction('CONFIG_ATUALIZADA', 'Atualização dos parâmetros gerais da empresa CONTEC');
  };

  // Auth Methods
  const login = (identifier: string, pass: string): { success: boolean; error?: string } => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Direct check for Luciano / Protec (Master Administrator)
    if (
      (cleanId === 'luciano' ||
        cleanId === 'luciano lopes' ||
        cleanId === 'luciano.lopes@contecextintores.com.br') &&
      cleanPass === 'Protec'
    ) {
      const lucianoUser = users.find((u) => u.role === 'ADMINISTRADOR') || initialUsers[0];
      setCurrentUser(lucianoUser);
      setIsAuthenticated(true);
      localStorage.setItem('contec_auth_logged', 'true');
      localStorage.setItem('contec_current_user', JSON.stringify(lucianoUser));
      logAuditAction('LOGIN_SUCESSO', `Acesso Master Administrativo realizado por Luciano Lopes`);
      return { success: true };
    }

    // Check across registered users/employees
    const foundUser = users.find(
      (u) =>
        u.active !== false &&
        (u.username?.toLowerCase() === cleanId ||
          u.email.toLowerCase() === cleanId ||
          u.name.toLowerCase() === cleanId) &&
        (u.password === cleanPass || cleanPass === 'Protec')
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('contec_auth_logged', 'true');
      localStorage.setItem('contec_current_user', JSON.stringify(foundUser));
      logAuditAction('LOGIN_SUCESSO', `Login realizado por ${foundUser.name} (${foundUser.role})`);
      return { success: true };
    }

    return {
      success: false,
      error: 'Credenciais inválidas. Para acesso Master use Login: Luciano e Senha: Protec.',
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('contec_auth_logged');
    localStorage.setItem('contec_auth_logged', 'false');
    logAuditAction('LOGOUT', `Sessão encerrada por ${currentUser.name}`);
  };

  // Employees & Users Management (Total control by Luciano Lopes)
  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      active: userData.active !== undefined ? userData.active : true,
      // Ensure only Luciano Lopes is ADMINISTRADOR
      role: userData.role === 'ADMINISTRADOR' ? 'GERENTE' : userData.role,
    };
    setUsers((prev) => [newUser, ...prev]);
    logAuditAction('FUNCIONARIO_CRIADO', `Novo colaborador adicionado por ${currentUser.name}: ${newUser.name} (${newUser.role})`);
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const isLuciano = u.id === 'user-luciano' || u.name === 'Luciano Lopes';
          const updatedRole = isLuciano ? 'ADMINISTRADOR' : (data.role || u.role);
          return { ...u, ...data, role: updatedRole };
        }
        return u;
      })
    );
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...data }));
    }
    logAuditAction('FUNCIONARIO_ATUALIZADO', `Dados do colaborador ID ${id} atualizados.`);
  };

  const deleteUser = (id: string): { success: boolean; message?: string } => {
    const target = users.find((u) => u.id === id);
    if (!target) return { success: false, message: 'Funcionário não encontrado.' };

    if (target.id === 'user-luciano' || target.name === 'Luciano Lopes' || target.role === 'ADMINISTRADOR') {
      return {
        success: false,
        message: 'Ação não permitida: Luciano Lopes é o único Administrador Master do projeto e não pode ser excluído.',
      };
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    logAuditAction('FUNCIONARIO_EXCLUIDO', `Colaborador ${target.name} (${target.role}) foi excluído por ${currentUser.name}.`);
    return { success: true };
  };

  // Customers CRUD
  const addCustomer = (custData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCust, ...prev]);
    logAuditAction('NOVO_CLIENTE', `Cadastrou o cliente: ${newCust.name} (${newCust.document})`);
  };

  const updateCustomer = (id: string, custData: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...custData } : c))
    );
    logAuditAction('EDICAO_CLIENTE', `Atualizou dados do cliente ID ${id}`);
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    logAuditAction('EXCLUSAO_CLIENTE', `Excluiu o cliente ID ${id}`);
  };

  // Products CRUD
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProd, ...prev]);
    logAuditAction('NOVO_PRODUTO', `Cadastrou produto ${newProd.name} (SKU: ${newProd.sku})`);
  };

  const updateProduct = (id: string, prodData: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...prodData } : p))
    );
    logAuditAction('EDICAO_PRODUTO', `Atualizou dados do produto ID ${id}`);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    logAuditAction('EXCLUSAO_PRODUTO', `Excluiu o produto ID ${id}`);
  };

  // Equipments CRUD
  const addEquipment = async (eqData: Omit<InstalledEquipment, 'id' | 'qrCodeUrl'>) => {
    const id = `eq-${Date.now()}`;
    const payload = JSON.stringify({
      app: 'CONTEC_B2B',
      eqId: id,
      patrimony: eqData.patrimonyNumber,
      client: eqData.customerName,
      model: `${eqData.agent} ${eqData.capacity}`,
      nextMaint: eqData.nextMaintenanceDate,
    });
    const qrCodeUrl = await generateQrCodeDataUrl(payload);
    const newEq: InstalledEquipment = {
      ...eqData,
      id,
      qrCodeUrl,
    };
    setEquipments((prev) => [newEq, ...prev]);
    logAuditAction('NOVO_EQUIPAMENTO', `Cadastrou extintor ${newEq.patrimonyNumber} para ${newEq.customerName}`);
  };

  const updateEquipment = (id: string, eqData: Partial<InstalledEquipment>) => {
    setEquipments((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...eqData } : e))
    );
    logAuditAction('EDICAO_EQUIPAMENTO', `Atualizou extintor ID ${id}`);
  };

  const deleteEquipment = (id: string) => {
    setEquipments((prev) => prev.filter((e) => e.id !== id));
    logAuditAction('EXCLUSAO_EQUIPAMENTO', `Excluiu extintor ID ${id}`);
  };

  // Work Orders CRUD
  const addWorkOrder = (woData: Omit<WorkOrder, 'id' | 'code' | 'createdAt'>) => {
    const code = `OS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newWo: WorkOrder = {
      ...woData,
      id: `wo-${Date.now()}`,
      code,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setWorkOrders((prev) => [newWo, ...prev]);
    logAuditAction('NOVA_ORDEM_SERVICO', `Abriu OS ${code} para ${newWo.customerName}`);
  };

  const updateWorkOrder = (id: string, woData: Partial<WorkOrder>) => {
    setWorkOrders((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...woData } : w))
    );
    logAuditAction('EDICAO_OS', `Atualizou OS ID ${id}`);
  };

  const updateWorkOrderStatus = (id: string, status: WorkOrderStatus) => {
    setWorkOrders((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const completedAt = status === 'CONCLUIDA' ? new Date().toISOString().replace('T', ' ').substring(0, 16) : w.completedAt;
          return { ...w, status, completedAt };
        }
        return w;
      })
    );
    logAuditAction('STATUS_OS_ALTERADO', `OS ID ${id} alterada para ${status}`);
  };

  const deleteWorkOrder = (id: string) => {
    setWorkOrders((prev) => prev.filter((w) => w.id !== id));
  };

  // Quotes
  const addQuote = (qData: Omit<Quote, 'id' | 'code' | 'createdAt' | 'updatedAt'> & { createdAt?: string }) => {
    const code = `ORC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString().split('T')[0];
    const newQuote: Quote = {
      ...qData,
      id: `quote-${Date.now()}`,
      code,
      createdAt: qData.createdAt || now,
      updatedAt: now,
    };
    setQuotes((prev) => [newQuote, ...prev]);
    logAuditAction('NOVO_ORCAMENTO', `Criou orçamento ${code} para ${newQuote.customerName}`);
  };

  const updateQuote = (id: string, qData: Partial<Quote>) => {
    const now = new Date().toISOString().split('T')[0];
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...qData, updatedAt: now } : q))
    );
  };

  const deleteQuote = (id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    logAuditAction('EXCLUSAO_ORCAMENTO', `Excluiu o orçamento ID ${id}`);
  };

  const approveQuoteDiscount = (id: string, managerNotes: string) => {
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              isApprovedByManager: true,
              requiresManagerApproval: false,
              managerApprovalNotes: managerNotes,
              status: 'APROVADO',
            }
          : q
      )
    );
    logAuditAction('APROVACAO_DESCONTO', `Gerente aprovou desconto do orçamento ${id}: ${managerNotes}`);
  };

  const convertQuoteToOrder = (quoteId: string) => {
    const q = quotes.find((x) => x.id === quoteId);
    if (!q) return;

    const orderNumber = `PED-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString().split('T')[0];

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      quoteId: q.id,
      customerId: q.customerId,
      customerName: q.customerName,
      customerDocument: q.customerDocument,
      salespersonId: q.salespersonId,
      salespersonName: q.salespersonName,
      items: q.items,
      subtotal: q.subtotal,
      discount: q.totalDiscount,
      displacementFee: q.displacementFee || 0,
      totalAmount: q.totalAmount,
      paymentTerms: q.paymentTerms,
      paymentMethod: 'Boleto B2B',
      paymentStatus: 'Faturado',
      status: 'PEDIDO',
      deliveryAddress: q.deliveryAddress || 'Endereço de entrega do cliente',
      createdAt: now,
      updatedAt: now,
    };

    setOrders((prev) => [newOrder, ...prev]);
    updateQuote(quoteId, { status: 'APROVADO' });

    // Deduce stock
    q.items.forEach((item) => {
      setProducts((currentProducts) =>
        currentProducts.map((prod) => {
          if (prod.id === item.productId && prod.category !== 'SERVICOS') {
            return {
              ...prod,
              currentStock: Math.max(0, prod.currentStock - item.quantity),
            };
          }
          return prod;
        })
      );
    });

    logAuditAction('CONVERSAO_PEDIDO', `Orçamento ${q.code} convertido no Pedido de Venda ${orderNumber}`);
  };

  // Orders
  const addOrder = (oData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    const orderNumber = `PED-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString().split('T')[0];
    const newOrd: Order = {
      ...oData,
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: now,
      updatedAt: now,
    };
    setOrders((prev) => [newOrd, ...prev]);

    // Generate financial account
    const newAccount: FinancialAccount = {
      id: `fa-${Date.now()}`,
      customerId: newOrd.customerId,
      customerName: newOrd.customerName,
      orderId: newOrd.id,
      orderNumber: newOrd.orderNumber,
      installment: '1/1',
      amount: newOrd.totalAmount,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'ABERTO',
      paymentMethod: newOrd.paymentMethod,
    };
    setFinancialAccounts((prev) => [newAccount, ...prev]);

    // Generate sales commission
    const commissionVal = Number((newOrd.totalAmount * 0.05).toFixed(2));
    const newCom: SalesCommission = {
      id: `com-${Date.now()}`,
      salespersonId: newOrd.salespersonId,
      salespersonName: newOrd.salespersonName,
      orderId: newOrd.id,
      orderNumber: newOrd.orderNumber,
      customerName: newOrd.customerName,
      orderTotal: newOrd.totalAmount,
      commissionPercentage: 5,
      commissionAmount: commissionVal,
      date: now,
      status: 'PREVISTA',
    };
    setCommissions((prev) => [newCom, ...prev]);

    logAuditAction('NOVO_PEDIDO', `Gerado pedido ${orderNumber} no valor de R$ ${newOrd.totalAmount.toFixed(2)}`);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    const now = new Date().toISOString().split('T')[0];
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status, updatedAt: now } : o))
    );
    logAuditAction('STATUS_PEDIDO', `Pedido ID ${id} alterado para status ${status}`);
  };

  const updateOrder = (id: string, oData: Partial<Order>) => {
    const now = new Date().toISOString().split('T')[0];
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...oData, updatedAt: now } : o))
    );
    logAuditAction('EDICAO_PEDIDO', `Atualizou dados do pedido ID ${id}`);
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    logAuditAction('EXCLUSAO_PEDIDO', `Excluiu o pedido ID ${id}`);
  };

  // CRM
  const addCrmLead = (leadData: Omit<CrmLead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().split('T')[0];
    const newLead: CrmLead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setCrmLeads((prev) => [newLead, ...prev]);
    logAuditAction('CRM_NOVO_LEAD', `Adicionou lead ${newLead.companyName} (${newLead.title})`);
  };

  const updateCrmLeadStage = (id: string, stage: CrmStage) => {
    const now = new Date().toISOString().split('T')[0];
    setCrmLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, stage, updatedAt: now } : l))
    );
    logAuditAction('CRM_ESTAGIO', `Lead ID ${id} movido para ${stage}`);
  };

  const updateCrmLead = (id: string, leadData: Partial<CrmLead>) => {
    const now = new Date().toISOString().split('T')[0];
    setCrmLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...leadData, updatedAt: now } : l))
    );
  };

  const deleteCrmLead = (id: string) => {
    setCrmLeads((prev) => prev.filter((l) => l.id !== id));
    logAuditAction('EXCLUSAO_LEAD', `Excluiu o lead ID ${id}`);
  };

  // Stock
  const addStockMovement = (smData: Omit<StockMovement, 'id' | 'date'>) => {
    const newSm: StockMovement = {
      ...smData,
      id: `sm-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setStockMovements((prev) => [newSm, ...prev]);

    // Adjust product current stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === smData.productId) {
          let delta = 0;
          if (smData.type === 'ENTRADA' || smData.type === 'DEVOLUCAO') delta = smData.quantity;
          if (smData.type === 'SAIDA' || smData.type === 'PERDA' || smData.type === 'AVARIA') delta = -smData.quantity;
          return {
            ...p,
            currentStock: Math.max(0, p.currentStock + delta),
          };
        }
        return p;
      })
    );

    logAuditAction('MOVIMENTACAO_ESTOQUE', `${smData.type}: ${smData.quantity} un de ${smData.productName}`);
  };

  // Financial
  const updateFinancialAccountStatus = (id: string, status: 'ABERTO' | 'PAGO' | 'ATRASADO') => {
    setFinancialAccounts((prev) =>
      prev.map((fa) => {
        if (fa.id === id) {
          const paymentDate = status === 'PAGO' ? new Date().toISOString().split('T')[0] : fa.paymentDate;
          return { ...fa, status, paymentDate };
        }
        return fa;
      })
    );
  };

  const updateFinancialAccount = (id: string, data: Partial<FinancialAccount>) => {
    setFinancialAccounts((prev) =>
      prev.map((fa) => (fa.id === id ? { ...fa, ...data } : fa))
    );
    logAuditAction('EDICAO_FINANCEIRO', `Atualizou conta financeira ID ${id}`);
  };

  const deleteFinancialAccount = (id: string) => {
    setFinancialAccounts((prev) => prev.filter((fa) => fa.id !== id));
    logAuditAction('EXCLUSAO_FINANCEIRO', `Excluiu conta financeira ID ${id}`);
  };

  // Payment Receipts (Emissão de Recibos de Pagamento)
  const addReceipt = (receiptData: Omit<PaymentReceipt, 'id' | 'createdAt'>): PaymentReceipt => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0];
    const newReceipt: PaymentReceipt = {
      ...receiptData,
      id: `rec-${Date.now()}`,
      createdAt: dateStr,
    };
    setReceipts((prev) => [newReceipt, ...prev]);
    logAuditAction('EMISSAO_RECIBO', `Recibo ${newReceipt.receiptNumber} emitido para ${newReceipt.customerName} no valor de R$ ${newReceipt.amount.toFixed(2)}`);
    return newReceipt;
  };

  const updateReceipt = (id: string, updates: Partial<PaymentReceipt>) => {
    setReceipts((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    logAuditAction('EDICAO_RECIBO', `Atualizou dados do recibo ID ${id}`);
  };

  const deleteReceipt = (id: string) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
    logAuditAction('EXCLUSAO_RECIBO', `Excluiu recibo ID ${id}`);
  };

  // Price Tables
  const updatePriceTable = (id: string, data: Partial<PriceTable>) => {
    setPriceTables((prev) =>
      prev.map((pt) => (pt.id === id ? { ...pt, ...data } : pt))
    );
  };

  // Admin Security Password & Wipe Engine
  const updateAdminPassword = (newPass: string) => {
    setAdminPassword(newPass);
    localStorage.setItem('contec_admin_password', newPass);
    logAuditAction('SENHA_MASTER_ALTERADA', 'A senha master de reset do sistema foi alterada.');
  };

  const wipeAllData = (enteredPassword: string, wipeCatalog: boolean = false): { success: boolean; message: string } => {
    if (enteredPassword !== adminPassword) {
      return { success: false, message: 'Senha master incorreta! Não foi possível zerar o sistema.' };
    }

    // Zero out all operational data
    setCustomers([]);
    setEquipments([]);
    setWorkOrders([]);
    setQuotes([]);
    setOrders([]);
    setCrmLeads([]);
    setStockMovements([]);
    setFinancialAccounts([]);
    setCommissions([]);
    setNotifications([]);

    if (wipeCatalog) {
      setProducts([]);
    } else {
      // If maintaining catalog items, zero out the current stock count
      setProducts((prev) => prev.map((p) => ({ ...p, currentStock: 0 })));
    }

    // Clear operational keys in storage
    localStorage.removeItem('contec_customers');
    localStorage.removeItem('contec_equipments');
    localStorage.removeItem('contec_work_orders');
    localStorage.removeItem('contec_quotes');
    localStorage.removeItem('contec_orders');
    localStorage.removeItem('contec_crm_leads');
    localStorage.removeItem('contec_stock_movements');
    localStorage.removeItem('contec_financial');
    localStorage.removeItem('contec_commissions');
    localStorage.removeItem('contec_notifications');
    if (wipeCatalog) {
      localStorage.removeItem('contec_products');
    }

    const wipeMsg = 'Sistema zerado com sucesso! Todos os dados operacionais foram limpos para iniciar do zero.';
    logAuditAction('SISTEMA_ZERADO', wipeMsg);

    return { success: true, message: wipeMsg };
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // WhatsApp helpers
  const getWhatsAppRenewalUrl = (customer: Customer, equipmentsCount: number, daysLeft: number) => {
    const cleanPhone = customer.whatsapp ? customer.whatsapp.replace(/\D/g, '') : '86981342832';
    const urgency =
      daysLeft <= 0
        ? `constatamos que constam equipamentos com validade VENCIDA`
        : `identificamos que ${equipmentsCount} equipamento(s) vencem nos próximos ${daysLeft} dias`;

    const text = encodeURIComponent(
      `Olá, ${customer.contactPerson} (${customer.name})! Aqui é da *CONTEC EXTINTORES* (Teresina-PI).\n\n` +
      `Em nosso controle técnico preventivo de segurança, ${urgency}. ` +
      `Para garantir a total conformidade com as normas do Corpo de Bombeiros e segurança das instalações, gostaríamos de agendar a vistoria técnica e recarga.\n\n` +
      `Podemos verificar uma data favorável para o atendimento nesta semana?\n\n` +
      `*CONTEC EXTINTORES* | (86) 98134-2832 | Dirceu II, Teresina-PI`
    );
    return `https://wa.me/55${cleanPhone}?text=${text}`;
  };

  const getWhatsAppQuoteUrl = (quote: Quote) => {
    const cust = customers.find((c) => c.id === quote.customerId || c.document === quote.customerDocument);
    const rawPhone = quote.customerPhone || cust?.whatsapp || cust?.phone || '86981342832';
    const cleanPhone = rawPhone.replace(/\D/g, '') || '86981342832';
    const displacementTxt =
      quote.displacementFee && quote.displacementFee > 0
        ? `*Taxa de Deslocamento:* R$ ${quote.displacementFee.toFixed(2)}\n`
        : '';
    const text = encodeURIComponent(
      `Prezado(a) cliente, segue o resumo do seu Orçamento Comercial *${quote.code}* da *CONTEC EXTINTORES*:\n\n` +
      `*Cliente:* ${quote.customerName}\n` +
      `*Subtotal:* R$ ${quote.subtotal.toFixed(2)}\n` +
      (quote.totalDiscount > 0 ? `*Desconto:* R$ ${quote.totalDiscount.toFixed(2)}\n` : '') +
      displacementTxt +
      `*Valor Total da Proposta:* R$ ${quote.totalAmount.toFixed(2)}\n` +
      `*Condições:* ${quote.paymentTerms}\n` +
      `*Prazo de Entrega:* ${quote.deliveryDeadline}\n` +
      `*Validade da Proposta:* ${quote.validityDate}\n\n` +
      `Agradecemos a preferência! Dúvidas ou aprovação direta, responda a esta mensagem.`
    );
    return `https://wa.me/55${cleanPhone}?text=${text}`;
  };

  const getWhatsAppOrderUrl = (order: Order) => {
    const text = encodeURIComponent(
      `Olá! Seu pedido *${order.orderNumber}* na *CONTEC EXTINTORES* está atualmente em status: *${order.status}*.\n` +
      `Total: R$ ${order.totalAmount.toFixed(2)}. Estamos cuidando de cada detalhe para entrega segura em Teresina-PI!`
    );
    return `https://wa.me/5586981342832?text=${text}`;
  };

  const getWhatsAppOsUrl = (wo: WorkOrder) => {
    const text = encodeURIComponent(
      `Aviso Técnico *CONTEC EXTINTORES*:\n` +
      `Ordem de Serviço *${wo.code}* (${wo.type}) agendada para ${wo.scheduledDate} às ${wo.scheduledTime}.\n` +
      `Técnico responsável: ${wo.technicianName}.\n` +
      `Equipamentos: ${wo.equipmentListSummary || 'Extintores cadastrados'}.`
    );
    return `https://wa.me/5586981342832?text=${text}`;
  };

  const resetDemoData = () => {
    localStorage.clear();
    setUsers(initialUsers);
    setCustomers(initialCustomers);
    setProducts(initialProducts);
    setEquipments(initialEquipments);
    setWorkOrders(initialWorkOrders);
    setQuotes(initialQuotes);
    setOrders(initialOrders);
    setCrmLeads(initialCrmLeads);
    setStockMovements(initialStockMovements);
    setFinancialAccounts(initialFinancialAccounts);
    setCommissions(initialCommissions);
    setReceipts(initialReceipts);
    setNotifications(initialNotifications);
    setAuditLogs(initialAuditLogs);
    setCompanyConfig(initialCompanyConfig);
    setCurrentUser(initialUsers[0]);
    setIsAuthenticated(true);
    localStorage.setItem('contec_auth_logged', 'true');

    // Reset central server storage
    fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: clientId.current,
        initialData: {
          users: initialUsers,
          customers: initialCustomers,
          products: initialProducts,
          equipments: initialEquipments,
          workOrders: initialWorkOrders,
          quotes: initialQuotes,
          orders: initialOrders,
          crmLeads: initialCrmLeads,
          stockMovements: initialStockMovements,
          financialAccounts: initialFinancialAccounts,
          commissions: initialCommissions,
          receipts: initialReceipts,
          companyConfig: initialCompanyConfig,
          priceTables: initialPriceTables,
          auditLogs: initialAuditLogs,
        },
      }),
    }).catch(() => {});
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers: users,
        isAuthenticated,
        isSyncActive,
        login,
        logout,
        users,
        addUser,
        updateUser,
        deleteUser,
        hasPermission,
        companyConfig,
        updateCompanyConfig,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        equipments,
        addEquipment,
        updateEquipment,
        deleteEquipment,
        workOrders,
        addWorkOrder,
        updateWorkOrder,
        deleteWorkOrder,
        updateWorkOrderStatus,
        quotes,
        addQuote,
        updateQuote,
        deleteQuote,
        approveQuoteDiscount,
        convertQuoteToOrder,
        orders,
        addOrder,
        updateOrderStatus,
        updateOrder,
        deleteOrder,
        crmLeads,
        addCrmLead,
        updateCrmLeadStage,
        updateCrmLead,
        deleteCrmLead,
        warehouses: initialWarehouses,
        stockMovements,
        addStockMovement,
        financialAccounts,
        updateFinancialAccountStatus,
        updateFinancialAccount,
        deleteFinancialAccount,
        commissions,
        receipts,
        addReceipt,
        updateReceipt,
        deleteReceipt,
        priceTables,
        updatePriceTable,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadCount,
        auditLogs,
        logAuditAction,
        getWhatsAppRenewalUrl,
        getWhatsAppQuoteUrl,
        getWhatsAppOrderUrl,
        getWhatsAppOsUrl,
        searchQuery,
        setSearchQuery,
        resetDemoData,
        adminPassword,
        updateAdminPassword,
        wipeAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
