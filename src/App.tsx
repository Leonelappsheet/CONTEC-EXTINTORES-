import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { QrScannerModal } from './components/common/QrScannerModal';
import { PrintableDocumentModal } from './components/common/PrintableDocumentModal';
import { DashboardView } from './views/DashboardView';
import { EquipmentsView } from './views/EquipmentsView';
import { RenewalsAlertView } from './views/RenewalsAlertView';
import { CustomersView } from './views/CustomersView';
import { CrmPipelineView } from './views/CrmPipelineView';
import { QuotesView } from './views/QuotesView';
import { OrdersView } from './views/OrdersView';
import { ProductsView } from './views/ProductsView';
import { StockView } from './views/StockView';
import { WorkOrdersView } from './views/WorkOrdersView';
import { AgendaView } from './views/AgendaView';
import { FinancialView } from './views/FinancialView';
import { ReceiptsView } from './views/ReceiptsView';
import { ClientPortalView } from './views/ClientPortalView';
import { ReportsView } from './views/ReportsView';
import { DocumentsView } from './views/DocumentsView';
import { PriceTablesView } from './views/PriceTablesView';
import { SettingsView } from './views/SettingsView';
import { EmployeesView } from './views/EmployeesView';
import { LoginView } from './views/LoginView';
import { InstalledEquipment } from './types';

const DashboardLayout: React.FC = () => {
  const { currentUser } = useApp();
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  // Modal for Printable PDF Document
  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    type: 'QUOTE' | 'WORK_ORDER' | 'EQUIPMENT_TAG' | 'INVENTORY_REPORT';
    data: any;
  }>({
    isOpen: false,
    type: 'QUOTE',
    data: null,
  });

  // Pre-selected equipment to carry over directly into a new Work Order
  const [preSelectedEquipmentForOs, setPreSelectedEquipmentForOs] = useState<InstalledEquipment | null>(null);

  const handleOpenPrintModal = (type: 'QUOTE' | 'WORK_ORDER' | 'EQUIPMENT_TAG' | 'INVENTORY_REPORT', data: any) => {
    setPrintModalState({
      isOpen: true,
      type,
      data,
    });
  };

  const handleOpenWorkOrderForEquipment = (eq: InstalledEquipment) => {
    setPreSelectedEquipmentForOs(eq);
    setCurrentModule('workOrders');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Header */}
      <Header
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        onOpenQrScanner={() => setIsQrScannerOpen(true)}
        onSelectModule={(mod) => setCurrentModule(mod)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentModule={currentModule}
          onSelectModule={(mod) => setCurrentModule(mod)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenQrScanner={() => setIsQrScannerOpen(true)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 lg:pl-64 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {currentModule === 'dashboard' && (
              <DashboardView
                onSelectModule={(mod) => setCurrentModule(mod)}
                onOpenQrScanner={() => setIsQrScannerOpen(true)}
              />
            )}

            {currentModule === 'equipments' && (
              <EquipmentsView
                onOpenWorkOrderForEquipment={handleOpenWorkOrderForEquipment}
                onOpenPrintModal={handleOpenPrintModal}
                onOpenQrScanner={() => setIsQrScannerOpen(true)}
              />
            )}

            {currentModule === 'renewals' && (
              <RenewalsAlertView
                onOpenWorkOrderForEquipment={handleOpenWorkOrderForEquipment}
                onSelectModule={(mod) => setCurrentModule(mod)}
              />
            )}

            {currentModule === 'customers' && (
              <CustomersView onSelectModule={(mod) => setCurrentModule(mod)} />
            )}

            {currentModule === 'crm' && <CrmPipelineView />}

            {currentModule === 'quotes' && (
              <QuotesView
                onOpenPrintModal={handleOpenPrintModal}
                onSelectModule={(mod) => setCurrentModule(mod)}
              />
            )}

            {currentModule === 'orders' && <OrdersView />}

            {currentModule === 'catalog' && <ProductsView />}

            {(currentModule === 'stock' || currentModule === 'stockMovements') && <StockView />}

            {currentModule === 'workOrders' && (
              <WorkOrdersView
                onOpenPrintModal={handleOpenPrintModal}
                preSelectedEquipment={preSelectedEquipmentForOs}
                onClearPreSelectedEquipment={() => setPreSelectedEquipmentForOs(null)}
              />
            )}

            {currentModule === 'agenda' && <AgendaView />}

            {currentModule === 'priceTables' && <PriceTablesView />}

            {(currentModule === 'financial' || currentModule === 'commissions') && (
              <FinancialView onSelectModule={(mod) => setCurrentModule(mod)} />
            )}

            {currentModule === 'receipts' && <ReceiptsView />}

            {currentModule === 'clientPortal' && (
              <ClientPortalView
                onSelectModule={(mod) => setCurrentModule(mod)}
                onOpenWorkOrderForEquipment={handleOpenWorkOrderForEquipment}
              />
            )}

            {currentModule === 'reports' && <ReportsView />}

            {currentModule === 'documents' && <DocumentsView />}

            {currentModule === 'employees' && <EmployeesView />}

            {currentModule === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Global Interactive QR Scanner Modal */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onOpenWorkOrderForEquipment={handleOpenWorkOrderForEquipment}
      />

      {/* Global Printable Document Modal (Quote PDF, Work Order PDF, QR Tag) */}
      <PrintableDocumentModal
        isOpen={printModalState.isOpen}
        onClose={() => setPrintModalState({ ...printModalState, isOpen: false })}
        type={printModalState.type}
        data={printModalState.data}
      />
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return <DashboardLayout />;
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
