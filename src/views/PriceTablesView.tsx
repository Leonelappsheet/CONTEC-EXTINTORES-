import React from 'react';
import { Tag, Check, ArrowRight, ShieldCheck, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatBRL } from '../utils/formatters';

export const PriceTablesView: React.FC = () => {
  const { priceTables, customers } = useApp();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Tag size={20} className="text-red-600" />
              <span>Tabelas de Preços B2B & Políticas Comerciais</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Definição de regras de desconto por categoria de cliente, compras corporativas e construtoras conveniadas da CONTEC.
          </p>
        </div>
      </div>

      {/* Price Table Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {priceTables.map((pt) => {
          const associatedClients = customers.filter((c) => c.priceTableId === pt.id);

          return (
            <div
              key={pt.id}
              className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5 transition-all ${
                pt.discountPercentage > 15
                  ? 'border-red-300 ring-1 ring-red-400/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded uppercase">
                    {pt.isDefault ? 'Tabela Padrão' : 'Convênio Especial'}
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-700">
                    {pt.discountPercentage > 0 ? `-${pt.discountPercentage}% OFF` : 'Preço Balcão'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{pt.name}</h3>
                <p className="text-xs text-slate-500">{pt.description}</p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Pedido Mínimo:</span>
                    <strong className="font-mono text-slate-900">{formatBRL(pt.minOrderValue)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Margem Garantida:</span>
                    <strong className="text-emerald-700 font-mono">≥ 35%</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Empresas Vinculadas ({associatedClients.length})
                  </span>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {associatedClients.map((c) => (
                      <div key={c.id} className="text-xs text-slate-600 truncate flex items-center gap-1.5">
                        <Building2 size={12} className="text-slate-400 shrink-0" />
                        <span>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-400">
                  Aplicada automaticamente no cálculo de orçamentos e pedidos
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
