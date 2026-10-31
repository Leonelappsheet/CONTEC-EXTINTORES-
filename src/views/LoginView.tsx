import React, { useState } from 'react';
import {
  ShieldAlert,
  Flame,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  Building,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginView: React.FC = () => {
  const { login } = useApp();

  const [username, setUsername] = useState('Luciano');
  const [password, setPassword] = useState('Protec');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Credenciais inválidas.');
        setIsLoading(false);
      }
    }, 400);
  };

  const handleQuickMasterLogin = () => {
    setUsername('Luciano');
    setPassword('Protec');
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      login('Luciano', 'Protec');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 flex flex-col justify-between text-slate-100 selection:bg-red-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with INMETRO & Company Tag */}
      <div className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider">
            <img src="/assets/aistudio/image_3829201b.png" alt="CONTEC" className="w-6 h-6 object-contain" />
            <span>CONTEC EXTINTORES</span>
          </div>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">Dirceu II · Teresina - PI</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <Award size={15} />
          <span className="hidden md:inline">Portaria INMETRO nº 005481/2022</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Credenciamento Ativo
          </span>
        </div>
      </div>

      {/* Center Content: Login Box & Fire Safety Badges */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md">
          {/* Brand Header Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 p-1 shadow-2xl shadow-red-600/40 mb-3 ring-4 ring-red-500/20">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1.5 overflow-hidden">
                <img
                  src="/assets/aistudio/image_3829201b.png"
                  alt="CONTEC Extintores"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              CONTEC <span className="text-red-500">EXTINTORES</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto font-medium">
              Plataforma B2B de Gestão, Vistorias NBR 12962/15808, Vendas e Ordens de Serviço
            </p>
          </div>

          {/* Master Admin Notice Card */}
          <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 mb-5 backdrop-blur-xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-600/20 text-red-400 shrink-0 mt-0.5">
              <ShieldCheck size={18} />
            </div>
            <div className="flex-1 text-xs">
              <div className="font-bold text-red-300 flex items-center gap-1.5">
                <span>Administrador Master: Luciano Lopes</span>
                <span className="text-[10px] px-1 rounded bg-red-600 text-white font-bold">100% CONTROLE</span>
              </div>
              <p className="text-slate-300 mt-0.5 leading-relaxed text-[11px]">
                Acesso total com permissão irrestrita para gerenciar clientes, funcionários, vendedores externos, ordens de serviço e financeiro.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-md">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Lock size={16} className="text-red-500" />
                <span>Autenticação no Sistema</span>
              </span>
              <span className="text-[11px] text-slate-400">Teresina-PI</span>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-lg bg-red-900/40 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200 animate-shake">
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div className="leading-snug">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Usuário / Login
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite seu login (ex: Luciano)"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Senha de Acesso</span>
                  <span className="text-[11px] text-slate-400 font-normal">Padrão Master: Protec</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-slate-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white focus:outline-none"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-700/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Entrar no Sistema CONTEC</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Master Button */}
            <div className="mt-5 pt-4 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={handleQuickMasterLogin}
                className="w-full py-2 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-red-500/50 rounded-xl text-xs text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all"
              >
                <ShieldCheck size={15} className="text-red-400" />
                <span>Acesso Direto como <strong>Luciano Lopes (Admin)</strong></span>
              </button>
            </div>
          </div>

          {/* Standards & Technical Norms Footer Strip */}
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400">
            <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded-lg">
              <span className="block font-bold text-slate-300">NBR 12962</span>
              <span>Inspeção & Manutenção</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded-lg">
              <span className="block font-bold text-slate-300">NBR 15808</span>
              <span>Extintores Portáteis</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded-lg">
              <span className="block font-bold text-slate-300">CBMEPI</span>
              <span>Bombeiros Militar PI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-3 text-center text-xs text-slate-400">
        <p>
          CONTEC EXTINTORES LTDA · CNPJ 47.727.069/0001-85 · QD 288 CS 04, Dirceu II, Teresina - PI · Tel: (86) 98134-2832
        </p>
      </footer>
    </div>
  );
};
