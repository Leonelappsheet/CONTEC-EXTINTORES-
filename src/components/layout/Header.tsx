import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Bell,
  UserCheck,
  Menu,
  X,
  Phone,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  LogOut,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  onOpenQrScanner: () => void;
  onSelectModule: (module: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen,
  onOpenQrScanner,
  onSelectModule,
}) => {
  const {
    currentUser,
    setCurrentUser,
    availableUsers,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadCount,
    searchQuery,
    setSearchQuery,
    companyConfig,
    logout,
    isSyncActive,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const roleNames: Record<UserRole, string> = {
    ADMINISTRADOR: 'Administrador (Geral)',
    GERENTE: 'Gerente Comercial',
    VENDEDOR: 'Vendedor Externo',
    TECNICO: 'Técnico de Campo N3',
    ESTOQUISTA: 'Estoquista / Almoxarifado',
    FINANCEIRO: 'Financeiro / Faturamento',
    CLIENTE_B2B: 'Portal Cliente B2B',
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white select-none">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left Zone: Brand and Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-slate-300 hover:text-white rounded-md hover:bg-slate-800 focus:outline-none"
            aria-label="Abrir menu lateral"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div
            onClick={() => onSelectModule('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {companyConfig.logoUrl ? (
              <img
                src={companyConfig.logoUrl}
                alt={companyConfig.name}
                className="w-10 h-10 object-contain rounded-xl bg-white/10 p-0.5 border border-red-500/40 group-hover:scale-105 transition-transform shrink-0 shadow-md shadow-red-900/30"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-900/30 group-hover:bg-red-500 transition-colors">
                <ShieldAlert size={22} className="stroke-[2.2]" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white leading-none">
                  CONTEC
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 border border-red-500/30">
                  B2B
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5 hidden sm:block">
                SISTEMA OPERACIONAL COMERCIAL & GESTÃO
              </p>
            </div>
          </div>

          <div className="hidden xl:flex items-center ml-4 pl-4 border-l border-slate-800 text-xs text-slate-400 gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Teresina / Dirceu II</span>
            </div>
            <span className="text-slate-700">|</span>
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold transition-all ${
                isSyncActive
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSyncActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
              <span>{isSyncActive ? 'Multi-Acessos Sincronizados' : 'Reconectando sync...'}</span>
            </div>
          </div>
        </div>

        {/* Center Zone: Quick Global Search */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente, CNPJ, extintor, OS, pedido ou SKU..."
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-slate-800 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Zone: Role Switcher, QR Scanner, Notifications & User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Scanner Shortcut */}
          <button
            onClick={onOpenQrScanner}
            title="Escanear QR Code de Extintor"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <QrCode size={16} className="text-red-400" />
            <span className="hidden sm:inline">Leitor QR</span>
          </button>

          {/* Quick WhatsApp Support */}
          <a
            href={`https://wa.me/55${companyConfig.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Suporte WhatsApp CONTEC"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/50 rounded-lg text-xs font-medium transition-colors"
          >
            <Phone size={14} />
            <span>(86) 98134-2832</span>
          </a>

          {/* Notifications Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Notificações do Sistema"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Central de Notificações</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-red-600/40 text-red-300 px-1.5 py-0.2 rounded border border-red-500/40">
                        {unreadCount} novas
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] text-slate-400 hover:text-white transition-colors"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      Nenhuma notificação no momento.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          if (notif.linkModule) {
                            onSelectModule(notif.linkModule);
                            setShowNotifications(false);
                          }
                        }}
                        className={`p-3.5 cursor-pointer hover:bg-slate-800/60 transition-colors ${
                          !notif.isRead ? 'bg-slate-800/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {notif.priority === 'CRITICAL' ? (
                              <AlertTriangle size={15} className="text-red-500" />
                            ) : notif.priority === 'HIGH' ? (
                              <AlertTriangle size={15} className="text-orange-400" />
                            ) : (
                              <CheckCircle2 size={15} className="text-blue-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-medium text-slate-200 truncate">
                                {notif.title}
                              </h4>
                              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                {notif.timestamp.split(' ')[1] || notif.timestamp}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 bg-slate-950/60 border-t border-slate-800 text-center">
                  <button
                    onClick={() => {
                      onSelectModule('renewals');
                      setShowNotifications(false);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 font-medium inline-flex items-center gap-1"
                  >
                    Ver todos os alertas de vencimento <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-left transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-medium text-slate-200 truncate max-w-[130px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-red-400 font-semibold tracking-wider uppercase">
                  {currentUser.role}
                </div>
              </div>
            </button>

            {/* Role Switcher Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <div className="text-xs font-semibold text-white">Alternar Perfil de Acesso</div>
                  <div className="text-[10px] text-slate-400">
                    Teste como cada profissional vivencia a plataforma
                  </div>
                </div>

                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setCurrentUser(user);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                        currentUser.id === user.id
                          ? 'bg-red-600 text-white font-medium'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate font-medium">{user.name}</div>
                        <div
                          className={`text-[10px] ${
                            currentUser.id === user.id ? 'text-red-100' : 'text-slate-400'
                          }`}
                        >
                          {roleNames[user.role]}
                        </div>
                      </div>
                      {currentUser.id === user.id && <UserCheck size={14} className="shrink-0" />}
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-800 space-y-1">
                  <button
                    onClick={() => {
                      onSelectModule('employees');
                      setShowUserDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-300 hover:bg-slate-800 rounded-lg font-medium transition-colors"
                  >
                    <Users size={14} />
                    <span>Gerenciar Equipe & Vendedores</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Sair do Sistema (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Direct Logout Button */}
          <button
            onClick={() => {
              logout();
            }}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors hidden sm:flex items-center justify-center cursor-pointer"
            title="Sair do Sistema (Logout)"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Top Demo Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border-t border-slate-800 px-4 py-1 text-[11px] text-slate-400 flex items-center justify-between overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-red-400">CONTEC EXTINTORES</span>
          <span>·</span>
          <span>QD 288 CS 04, Dirceu II, Teresina-PI</span>
          <span>·</span>
          <span>Portaria INMETRO nº 005481</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span className="text-amber-400 font-medium">Ambiente Operacional B2B</span>
          <span>·</span>
          <span>Perfil Ativo: <strong className="text-slate-200">{currentUser.name} ({currentUser.role})</strong></span>
        </div>
      </div>
    </header>
  );
};
