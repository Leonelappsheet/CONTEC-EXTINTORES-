import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Shield,
  Clock,
  Users,
  FileText,
  Save,
  CheckCircle2,
  RotateCcw,
  Lock,
  Trash2,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CompanyConfig } from '../types';

export const SettingsView: React.FC = () => {
  const {
    companyConfig,
    updateCompanyConfig,
    auditLogs,
    resetDemoData,
    adminPassword,
    updateAdminPassword,
    wipeAllData,
  } = useApp();

  const [formData, setFormData] = useState<CompanyConfig>(companyConfig);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Reset / Wipe state
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [wipeCatalog, setWipeCatalog] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Change Password state
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [showPasswordChangeFields, setShowPasswordChangeFields] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleWipeData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordInput) {
      setResetMessage({ text: 'Digite a senha master de autorização (padrão: 0000).', isError: true });
      return;
    }

    const res = wipeAllData(resetPasswordInput, wipeCatalog);
    if (res.success) {
      setResetMessage({
        text: 'Sistema zerado com sucesso! Agora você pode começar do zero, cadastrando clientes, orçamentos, vendas e compras reais.',
        isError: false,
      });
      setResetPasswordInput('');
    } else {
      setResetMessage({ text: res.message, isError: true });
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPasswordInput) {
      setPasswordChangeMessage({ text: 'Informe a senha atual.', isError: true });
      return;
    }
    if (currentPasswordInput !== adminPassword) {
      setPasswordChangeMessage({ text: 'Senha atual incorreta.', isError: true });
      return;
    }
    if (!newPasswordInput || newPasswordInput.length < 3) {
      setPasswordChangeMessage({ text: 'A nova senha deve ter no mínimo 3 caracteres.', isError: true });
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeMessage({ text: 'A confirmação de senha não confere.', isError: true });
      return;
    }

    updateAdminPassword(newPasswordInput);
    setPasswordChangeMessage({
      text: 'Senha master alterada com sucesso! Guarde sua nova senha com segurança.',
      isError: false,
    });
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Settings size={20} className="text-red-600" />
              <span>Configurações Corporativas, Alertas & LGPD</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Parâmetros operacionais da CONTEC EXTINTORES, faixas de dias para alertas de vencimento e logs de auditoria e segurança.
          </p>
        </div>

        <button
          onClick={() => {
            resetDemoData();
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>Restaurar Padrão do Sistema</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Parâmetros da CONTEC salvos com sucesso e replicados em tempo real!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Identification Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Building2 size={15} className="text-red-600" />
            <span>Dados Oficiais da Empresa (Emitente de Orçamentos e Laudos)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Razão Social</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Nome Fantasia</label>
              <input
                type="text"
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">CNPJ</label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Inscrição Estadual</label>
              <input
                type="text"
                value={formData.stateRegistration}
                onChange={(e) => setFormData({ ...formData, stateRegistration: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">WhatsApp / Plantão</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Email Comercial</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-600 font-semibold block mb-1">Endereço (Dirceu II)</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Credenciamento INMETRO</label>
              <input
                type="text"
                value={formData.inmetroAccreditation}
                onChange={(e) => setFormData({ ...formData, inmetroAccreditation: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
              />
            </div>

            <div className="sm:col-span-3 border-t border-slate-100 pt-3">
              <label className="text-slate-700 font-bold block mb-1 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-red-600" />
                <span>Logotipo Personalizado da Empresa (Exibido no Recibo de Pagamento e Laudos)</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                  type="text"
                  placeholder="https://exemplo.com/sua-logo.png ou cole uma URL / Carregue um arquivo ao lado"
                  value={formData.logoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 text-xs focus:outline-hidden focus:border-red-500"
                />

                <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0">
                  <Upload size={13} />
                  <span>Selecionar Imagem</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64 = event.target?.result as string;
                          setFormData({ ...formData, logoUrl: base64 });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logoUrl: '/assets/aistudio/image_3829201b.png' })}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0"
                  title="Definir o mascote do extintor animado como logotipo padrão"
                >
                  <img src="/assets/aistudio/image_3829201b.png" alt="Mascote" className="w-4 h-4 object-contain" />
                  <span>Extintor Animado</span>
                </button>

                {formData.logoUrl && (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-lg shrink-0">
                    <img
                      src={formData.logoUrl}
                      alt="Prévia da Logo"
                      className="h-8 max-w-[120px] object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: '' })}
                      className="text-xs text-red-600 hover:text-red-800 font-bold px-1"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                A imagem carregada ou link informado será exibido no topo do recibo oficial de pagamento, orçamentos e etiquetas. Caso não informado, o selo oficial estilizado da CONTEC será utilizado.
              </p>
            </div>
          </div>
        </div>

        {/* Expiration Rules Configuration */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Clock size={15} className="text-amber-600" />
            <span>Parâmetros de Validade & Notificações Automáticas</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-red-200 bg-red-50/50">
              <span className="font-bold text-red-900 block mb-1">Crítico / Vencido</span>
              <div className="text-xs text-red-700 font-mono">0 dias ou menos</div>
              <div className="text-[10px] text-red-600 mt-1">Disparo imediato de alerta</div>
            </div>

            <div className="p-3 rounded-lg border border-orange-200 bg-orange-50/50">
              <span className="font-bold text-orange-900 block mb-1">Muito Próximo (Laranja)</span>
              <div className="text-xs text-orange-700 font-mono">Até 30 dias</div>
              <div className="text-[10px] text-orange-600 mt-1">Fila prioritária de WhatsApp</div>
            </div>

            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
              <span className="font-bold text-amber-900 block mb-1">Atenção (Amarelo)</span>
              <div className="text-xs text-amber-700 font-mono">Até 60 dias</div>
              <div className="text-[10px] text-amber-600 mt-1">Prospecção de recargas</div>
            </div>

            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
              <span className="font-bold text-emerald-900 block mb-1">Regular (Verde)</span>
              <div className="text-xs text-emerald-700 font-mono">Acima de 90 dias</div>
              <div className="text-[10px] text-emerald-600 mt-1">Conformidade total</div>
            </div>
          </div>
        </div>

        {/* Security / Admin Password Management */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
              <KeyRound size={15} className="text-indigo-600" />
              <span>Segurança Master: Senha de Autorização & Reset do Sistema</span>
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              Senha Padrão Inicial: <strong className="text-slate-900">0000</strong>
            </span>
          </div>

          <p className="text-xs text-slate-500">
            A senha master protege operações críticas como zerar o sistema para reiniciar do zero ou exclusões em massa.
            Você pode alterar esta senha a qualquer momento.
          </p>

          {passwordChangeMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                passwordChangeMessage.isError
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {passwordChangeMessage.isError ? (
                <AlertTriangle size={15} className="text-red-600 shrink-0" />
              ) : (
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              )}
              <span>{passwordChangeMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Senha Master Atual
              </label>
              <div className="relative">
                <input
                  type={showPasswordChangeFields ? 'text' : 'password'}
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Ex: 0000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Nova Senha Master
              </label>
              <div className="relative">
                <input
                  type={showPasswordChangeFields ? 'text' : 'password'}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Digite a nova senha..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPasswordChangeFields ? 'text' : 'password'}
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Repita a nova senha..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowPasswordChangeFields(!showPasswordChangeFields)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
            >
              {showPasswordChangeFields ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{showPasswordChangeFields ? 'Ocultar caracteres' : 'Exibir caracteres'}</span>
            </button>

            <button
              type="button"
              onClick={handleChangePassword}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <KeyRound size={13} />
              <span>Salvar Nova Senha Master</span>
            </button>
          </div>
        </div>

        {/* Reset / Wipe Operational Data Card */}
        <div className="bg-red-50/40 border-2 border-red-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-red-200 pb-2">
            <h3 className="text-xs font-bold text-red-900 uppercase flex items-center gap-1.5">
              <Trash2 size={16} className="text-red-600" />
              <span>Zerar Dados do Projeto / Iniciar do Zero</span>
            </h3>
            <span className="text-[10px] bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded font-bold">
              Área de Risco
            </span>
          </div>

          <div className="text-xs text-slate-700 space-y-2">
            <p>
              Esta opção permite <strong>zerar todas as informações</strong> do sistema para que tudo fique
              completamente limpo. Assim, você poderá começar a alimentar o sistema do zero conforme for
              realizando suas <strong>vendas reais, compras de estoque, clientes e ordens de serviço</strong>.
            </p>
            <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
              <li>Clientes e contatos cadastrados serão apagados.</li>
              <li>Histórico de extintores, inspeções e QR Codes serão limpos.</li>
              <li>Orçamentos, pedidos de vendas e ordens de serviço serão excluídos.</li>
              <li>Movimentações de estoque e contas financeiras a receber serão zeradas.</li>
            </ul>
          </div>

          {resetMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                resetMessage.isError
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              {resetMessage.isError ? (
                <AlertTriangle size={15} className="text-red-700 shrink-0" />
              ) : (
                <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
              )}
              <span>{resetMessage.text}</span>
            </div>
          )}

          <div className="bg-white p-4 rounded-xl border border-red-200 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="wipeCatalogCheck"
                checked={wipeCatalog}
                onChange={(e) => setWipeCatalog(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
              />
              <label htmlFor="wipeCatalogCheck" className="text-xs text-slate-700 cursor-pointer">
                <strong>Zerar também o catálogo de produtos e serviços</strong> (se desmarcado, mantém os itens cadastrados com estoque = 0)
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <div className="flex-1 relative">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  placeholder="Digite a Senha Master (Padrão: 0000)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-900 focus:border-red-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showResetPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleWipeData}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Trash2 size={14} />
                <span>Confirmar e Zerar Todo o Sistema</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              * A senha padrão de fábrica é <span className="font-mono font-bold text-slate-800">0000</span>.
              Caso tenha alterado acima, use a nova senha definida.
            </p>
          </div>
        </div>

        {/* Audit Log / LGPD */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Shield size={15} className="text-slate-700" />
            <span>Auditoria de Ações & Conformidade LGPD</span>
          </h3>

          <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase">
                <tr>
                  <th className="py-2 px-3">Data/Hora</th>
                  <th className="py-2 px-3">Usuário</th>
                  <th className="py-2 px-3">Operação</th>
                  <th className="py-2 px-3">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 px-3 font-mono text-slate-500">{log.timestamp}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{log.userName}</td>
                    <td className="py-2 px-3 font-mono text-red-600 font-bold">{log.action}</td>
                    <td className="py-2 px-3 text-slate-600 text-[11px]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            <Save size={15} />
            <span>Salvar Todas as Configurações</span>
          </button>
        </div>
      </form>
    </div>
  );
};
