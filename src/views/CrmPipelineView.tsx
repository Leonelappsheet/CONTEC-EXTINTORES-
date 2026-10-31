import React, { useState } from 'react';
import {
  GitPullRequest,
  Plus,
  Phone,
  Calendar,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  X,
  Clock,
  Sparkles,
  User,
  Building2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CrmLead, CrmStage } from '../types';
import { formatBRL, formatDateBR } from '../utils/formatters';

const STAGES: { key: CrmStage; label: string; color: string }[] = [
  { key: 'NOVO_LEAD', label: 'Novo Lead', color: 'border-slate-400' },
  { key: 'CONTATO_REALIZADO', label: 'Contato Feito', color: 'border-blue-400' },
  { key: 'QUALIFICACAO', label: 'Qualificação', color: 'border-indigo-400' },
  { key: 'ORCAMENTO', label: 'Orçamento', color: 'border-amber-400' },
  { key: 'NEGOCIACAO', label: 'Negociação', color: 'border-orange-500' },
  { key: 'APROVADO', label: 'Aprovado', color: 'border-emerald-500' },
  { key: 'PEDIDO', label: 'Pedido', color: 'border-teal-500' },
  { key: 'FATURADO', label: 'Faturado', color: 'border-purple-500' },
  { key: 'POS_VENDA', label: 'Pós-Venda', color: 'border-green-600' },
];

export const CrmPipelineView: React.FC = () => {
  const { crmLeads, updateCrmLeadStage, addCrmLead, currentUser, customers } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    stage: 'NOVO_LEAD' as CrmStage,
    expectedValue: 3500,
    salespersonId: currentUser.id,
    salespersonName: currentUser.name,
    origin: 'Prospecção Ativa' as const,
    nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextAction: 'Ligar para agendar levantamento técnico de extintores',
    notes: '',
  });

  const handleMoveStage = (leadId: string, currentStage: CrmStage, direction: 'prev' | 'next') => {
    const currentIndex = STAGES.findIndex((s) => s.key === currentStage);
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < STAGES.length) {
      updateCrmLeadStage(leadId, STAGES[targetIndex].key);
    }
  };

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    addCrmLead(formData);
    setIsModalOpen(false);
  };

  const totalPipelineValue = crmLeads.reduce((acc, curr) => acc + curr.expectedValue, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GitPullRequest size={20} className="text-red-600" />
              <span>Pipeline Comercial & Funil CRM (9 Etapas)</span>
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Total em negociação: {formatBRL(totalPipelineValue)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de oportunidades comerciais da prospecção ao pós-venda com lembretes de follow-up e histórico.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus size={15} />
          <span>Nova Oportunidade / Lead</span>
        </button>
      </div>

      {/* Horizontal Scrollable Kanban Pipeline */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1400px]">
          {STAGES.map((stg, stgIdx) => {
            const stageLeads = crmLeads.filter((l) => l.stage === stg.key);
            const stageSum = stageLeads.reduce((a, b) => a + b.expectedValue, 0);

            return (
              <div
                key={stg.key}
                className="w-72 bg-slate-100/80 border border-slate-200 rounded-xl p-3 flex flex-col space-y-3 shrink-0 shadow-xs"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full border-2 ${stg.color} bg-white`}></span>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                      {stg.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-500 font-semibold px-1">
                  {formatBRL(stageSum)}
                </div>

                {/* Cards List in Stage */}
                <div className="space-y-2.5 flex-1 min-h-[400px]">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-xs space-y-2.5 text-xs transition-all"
                    >
                      {/* Company Name & Value in highlighted background header */}
                      <div className="bg-slate-100/90 border border-slate-200/90 rounded-lg p-2.5 flex items-start justify-between gap-1.5 shadow-2xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Building2 size={13} className="text-red-600 shrink-0" />
                          <h4 className="font-bold text-slate-900 leading-tight truncate">
                            {lead.companyName}
                          </h4>
                        </div>
                        <span className="font-mono font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] shrink-0 shadow-2xs">
                          {formatBRL(lead.expectedValue)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-700 font-medium px-1">
                        {lead.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1 border-t border-slate-100">
                        <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                          Contato: <strong className="text-slate-900">{lead.contactName}</strong>
                        </span>
                        <span className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-emerald-800 font-mono font-bold flex items-center gap-1">
                          <Phone size={10} className="text-emerald-600" /> {lead.phone}
                        </span>
                      </div>

                      {lead.nextAction && (
                        <div className="bg-amber-100/80 p-2 rounded-lg border border-amber-200 text-[10px] text-amber-950 font-medium">
                          <strong>Ação:</strong> {lead.nextAction}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                          <Calendar size={11} className="text-slate-400" /> {formatDateBR(lead.nextFollowUpDate)}
                        </span>

                        {/* Move Pipeline Buttons */}
                        <div className="flex items-center gap-1">
                          {stgIdx > 0 && (
                            <button
                              onClick={() => handleMoveStage(lead.id, lead.stage, 'prev')}
                              title="Voltar etapa"
                              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                            >
                              <ArrowLeft size={12} />
                            </button>
                          )}
                          {stgIdx < STAGES.length - 1 && (
                            <button
                              onClick={() => handleMoveStage(lead.id, lead.stage, 'next')}
                              title="Avançar etapa"
                              className="p-1 rounded hover:bg-slate-100 text-red-600 hover:text-red-800 font-bold"
                            >
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: New Opportunity / Lead */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-red-500" />
                <span>Nova Oportunidade Comercial</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Empresa / Cliente *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  placeholder="Nome da empresa ou cliente"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Título da Negociação *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Título ou objeto da negociação"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Valor Estimado (R$) *</label>
                  <input
                    type="number"
                    value={formData.expectedValue}
                    onChange={(e) => setFormData({ ...formData, expectedValue: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Etapa Inicial</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as CrmStage })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nome do Contato</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Nome do contato"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Próxima Ação de Follow-up</label>
                <input
                  type="text"
                  value={formData.nextAction}
                  onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                  placeholder="Próxima ação ou lembrete de contato"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold shadow"
                >
                  Adicionar ao Funil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
