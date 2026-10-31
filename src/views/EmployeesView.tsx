import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Briefcase,
  DollarSign,
  MapPin,
  Lock,
  MessageSquare,
  Key,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const EmployeesView: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'VENDEDOR' as UserRole,
    phone: '',
    document: '',
    commissionPercentage: 5,
    region: 'Grande Teresina',
    active: true,
  });

  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorNotice(msg);
    setTimeout(() => setErrorNotice(null), 4000);
  };

  const handleOpenNew = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '123',
      role: 'VENDEDOR',
      phone: '',
      document: '',
      commissionPercentage: 5,
      region: 'Grande Teresina',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username || user.name.split(' ')[0].toLowerCase(),
      password: user.password || '',
      role: user.role,
      phone: user.phone || '',
      document: user.document || '',
      commissionPercentage: user.commissionPercentage || 5,
      region: user.region || 'Teresina - PI',
      active: user.active !== false,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showError('Nome e E-mail são obrigatórios.');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password: formData.password || editingUser.password,
        role: editingUser.role === 'ADMINISTRADOR' ? 'ADMINISTRADOR' : formData.role,
        phone: formData.phone,
        document: formData.document,
        commissionPercentage: Number(formData.commissionPercentage),
        region: formData.region,
        active: formData.active,
      });
      showFeedback(`Colaborador ${formData.name} atualizado com sucesso!`);
    } else {
      addUser({
        name: formData.name,
        email: formData.email,
        username: formData.username || formData.name.split(' ')[0].toLowerCase(),
        password: formData.password || '123',
        role: formData.role,
        phone: formData.phone,
        document: formData.document,
        commissionPercentage: Number(formData.commissionPercentage),
        region: formData.region,
        active: formData.active,
      });
      showFeedback(`Novo colaborador ${formData.name} cadastrado com sucesso!`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (user: User) => {
    if (user.role === 'ADMINISTRADOR' || user.name === 'Luciano Lopes') {
      showError('Ação negada: Luciano Lopes é o único Administrador Master do projeto e não pode ser excluído.');
      return;
    }

    setUserToDelete(user);
  };

  const handleSendWhatsAppCredentials = (user: User) => {
    const cleanPhone = user.phone ? user.phone.replace(/\D/g, '') : '';
    if (!cleanPhone) {
      showError('Este colaborador não possui telefone cadastrado.');
      return;
    }

    const text = encodeURIComponent(
      `Olá, *${user.name}*!\n\n` +
      `Seu acesso à plataforma de gestão *CONTEC EXTINTORES* foi liberado pelo Administrador *Luciano Lopes*:\n\n` +
      `🔗 *Acesso:* https://ais-pre-hnozeva5dazopymiktgi5z-141290312650.us-west2.run.app\n` +
      `👤 *Usuário:* ${user.username || user.email}\n` +
      `🔑 *Senha Inicial:* ${user.password || 'Protec'}\n` +
      `🛡️ *Função:* ${user.role}\n\n` +
      `Qualquer dúvida entre em contato com a diretoria CONTEC.`
    );

    window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (u.region && u.region.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalSellers = users.filter((u) => u.role === 'VENDEDOR').length;
  const totalTechnicians = users.filter((u) => u.role === 'TECNICO').length;
  const activeCount = users.filter((u) => u.active !== false).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <Users size={22} />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Gestão de Equipe & Vendedores Externos
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Controle total de vendedores externos, técnicos e colaboradores pelo Administrador Master{' '}
            <strong className="text-red-400">Luciano Lopes</strong>.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-900/30 transition-all cursor-pointer shrink-0"
        >
          <UserPlus size={16} />
          <span>Cadastrar Vendedor / Funcionário</span>
        </button>
      </div>

      {/* Notifications */}
      {feedbackNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 shadow-sm animate-shake">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Administrador Master</div>
          <div className="text-base sm:text-lg font-bold text-white mt-1 flex items-center gap-1.5">
            <Shield size={16} className="text-red-500" />
            <span>Luciano Lopes</span>
          </div>
          <div className="text-[10px] text-red-400 mt-1">Controle Total do Sistema</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Vendedores Externos</div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1">
            {totalSellers}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Equipe comercial externa</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Técnicos de Campo</div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-400 mt-1">
            {totalTechnicians}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Vistoria e recargas NBR 12962</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Colaboradores Ativos</div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1">
            {activeCount} / {users.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Acesso liberado no sistema</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, login, fone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
            <Filter size={14} /> Função:
          </span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
          >
            <option value="ALL">Todas as Funções</option>
            <option value="ADMINISTRADOR">Administrador (Luciano)</option>
            <option value="VENDEDOR">Vendedor Externo</option>
            <option value="TECNICO">Técnico de Campo N3</option>
            <option value="GERENTE">Gerente Operacional</option>
            <option value="ESTOQUISTA">Estoquista / Almoxarifado</option>
            <option value="FINANCEIRO">Financeiro / Faturamento</option>
          </select>
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const isLuciano = user.role === 'ADMINISTRADOR' || user.name === 'Luciano Lopes';
          return (
            <div
              key={user.id}
              className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-slate-700 shadow-sm relative overflow-hidden ${
                isLuciano ? 'border-red-500/50 bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/20' : 'border-slate-800'
              }`}
            >
              {isLuciano && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider shadow-md">
                  ADMINISTRADOR MASTER
                </div>
              )}

              <div>
                {/* Header row */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-md ${
                      isLuciano
                        ? 'bg-gradient-to-br from-red-600 to-red-700 ring-2 ring-red-500/40'
                        : user.role === 'VENDEDOR'
                        ? 'bg-gradient-to-br from-amber-600 to-amber-700'
                        : user.role === 'TECNICO'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {user.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0 pr-10">
                    <h3 className="font-bold text-sm text-white truncate">{user.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isLuciano
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : user.role === 'VENDEDOR'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : user.role === 'TECNICO'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {user.role === 'ADMINISTRADOR'
                          ? 'Diretoria / Administrador'
                          : user.role === 'VENDEDOR'
                          ? 'Vendedor Externo'
                          : user.role === 'TECNICO'
                          ? 'Técnico de Campo N3'
                          : user.role}
                      </span>
                      {user.active !== false ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Ativo" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-600" title="Inativo" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-500 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-500 shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}

                  {user.region && (
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-slate-500 shrink-0" />
                      <span className="text-slate-400">{user.region}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Key size={12} className="text-slate-500" />
                      Login: <strong className="text-slate-200 font-mono">{user.username || user.name.split(' ')[0].toLowerCase()}</strong>
                    </span>
                    {user.commissionPercentage !== undefined && user.role === 'VENDEDOR' && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                        Comissão: {user.commissionPercentage}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800 gap-2">
                <button
                  onClick={() => handleSendWhatsAppCredentials(user)}
                  disabled={!user.phone}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/30 text-emerald-400 hover:text-emerald-300 text-xs font-semibold disabled:opacity-40 transition-colors"
                  title="Enviar credenciais pelo WhatsApp"
                >
                  <MessageSquare size={13} />
                  <span>Enviar Acesso</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(user)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Editar informações"
                  >
                    <Edit2 size={14} />
                  </button>

                  {!isLuciano && (
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                      title="Excluir funcionário"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New / Edit Employee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl animate-scaleIn my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-600/20 text-red-400">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingUser ? 'Editar Colaborador / Vendedor' : 'Cadastrar Novo Vendedor / Funcionário'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina dados cadastrais, cargo, comissão e dados de acesso ao sistema
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo do colaborador"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Cargo / Função *</label>
                  <select
                    value={formData.role}
                    disabled={editingUser?.role === 'ADMINISTRADOR'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500 font-medium"
                  >
                    <option value="VENDEDOR">Vendedor Externo (Comercial)</option>
                    <option value="TECNICO">Técnico de Campo N3 (Vistoria/Recarga)</option>
                    <option value="GERENTE">Gerente Operacional</option>
                    <option value="ESTOQUISTA">Estoquista / Almoxarifado</option>
                    <option value="FINANCEIRO">Financeiro / Faturamento</option>
                    {editingUser?.role === 'ADMINISTRADOR' && (
                      <option value="ADMINISTRADOR">Administrador Master</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Comissão de Vendas (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={formData.commissionPercentage}
                    onChange={(e) => setFormData({ ...formData, commissionPercentage: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">E-mail Profissional *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@empresa.com.br"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">CPF / Documento</label>
                  <input
                    type="text"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Região de Atuação</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="Região de atuação"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Login Credentials Sub-Box */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <div className="font-bold text-white flex items-center gap-1.5 text-xs text-slate-300">
                  <Lock size={14} className="text-amber-400" />
                  <span>Credenciais de Acesso ao Sistema</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 text-[11px] block mb-1">Usuário / Login</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="usuario.login"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[11px] block mb-1">Senha de Acesso</label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Senha do usuário"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-red-500 h-4 w-4"
                />
                <label htmlFor="activeToggle" className="text-slate-300 font-semibold cursor-pointer">
                  Acesso Ativo (Permitir login do colaborador no sistema)
                </label>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-md shadow-red-900/30 cursor-pointer"
                >
                  {editingUser ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete User Modal */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => {
          if (userToDelete) {
            const res = deleteUser(userToDelete.id);
            if (res.success) {
              showFeedback(`Colaborador ${userToDelete.name} excluído com sucesso.`);
            } else {
              showError(res.message || 'Erro ao excluir colaborador.');
            }
            setUserToDelete(null);
          }
        }}
        title="Excluir Colaborador / Vendedor"
        message={`Tem certeza que deseja excluir o funcionário/vendedor "${userToDelete?.name}" (${userToDelete?.role})?\n\nEsta operação removerá os acessos do usuário ao sistema.`}
        confirmLabel="Sim, Excluir Colaborador"
        variant="danger"
      />
    </div>
  );
};
