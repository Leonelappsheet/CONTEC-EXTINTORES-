import React, { useState } from 'react';
import {
  Warehouse,
  ArrowLeftRight,
  Plus,
  Search,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  RotateCw,
  X,
  Boxes,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StockMovement, StockMovementType } from '../types';
import { formatDateBR } from '../utils/formatters';

export const StockView: React.FC = () => {
  const { products, warehouses, stockMovements, addStockMovement, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  // New Movement Form
  const [formData, setFormData] = useState({
    productId: products[0]?.id || '',
    productName: products[0]?.name || '',
    warehouseId: warehouses[0]?.id || '',
    targetWarehouseId: warehouses[1]?.id || '',
    type: 'ENTRADA' as StockMovementType,
    quantity: 10,
    reason: 'Entrada por compra com Nota Fiscal de Fornecedor',
    userId: currentUser.id,
    userName: currentUser.name,
  });

  const filteredProducts = products.filter((p) => {
    if (p.category === 'SERVICOS') return false; // Serviços não têm estoque físico
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === formData.productId);
    addStockMovement({
      ...formData,
      productName: prod ? prod.name : formData.productName,
    });
    setIsMovementModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Warehouse size={20} className="text-red-600" />
              <span>Controle de Estoque & Multi-Armazéns (CONTEC)</span>
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {warehouses.length} locais operacionais
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão física de cilindros, pós químicos, peças de reposição e transferências entre Matriz, Oficina e Unidades Móveis.
          </p>
        </div>

        <button
          onClick={() => setIsMovementModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <ArrowLeftRight size={15} />
          <span>Registrar Movimentação / Transferência</span>
        </button>
      </div>

      {/* Warehouses Locations Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {warehouses.map((wh) => (
          <div key={wh.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-red-600 uppercase bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                {wh.type}
              </span>
              <Truck size={15} className="text-slate-400" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 mt-1">{wh.name}</h3>
            <p className="text-[11px] text-slate-500">Resp: {wh.responsibleUser}</p>
          </div>
        ))}
      </div>

      {/* Stock Items Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-3 p-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase">Posição de Saldo por Produto</h3>
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar item..."
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-800 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">SKU / Item</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3">Localização</th>
                <th className="py-2.5 px-3 text-center">Saldo Atual</th>
                <th className="py-2.5 px-3 text-center">Mínimo</th>
                <th className="py-2.5 px-3 text-center">Máximo</th>
                <th className="py-2.5 px-3 text-center">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isLow = p.currentStock <= p.minStock;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <span className="text-[10px] text-slate-600 font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded inline-block mt-0.5">
                        SKU: {p.sku}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 text-xs">
                      <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 text-xs">
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
                        {p.stockLocation}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono font-bold text-xs shadow-2xs">
                        {p.currentStock} {p.unit}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600 text-xs">{p.minStock}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600 text-xs">{p.maxStock}</td>
                    <td className="py-2.5 px-3 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                          <AlertTriangle size={11} /> Estoque Baixo
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Movements Log */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase">Histórico Recente de Movimentações</h3>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-semibold">
              <tr>
                <th className="py-2 px-3">Data/Hora</th>
                <th className="py-2 px-3">Tipo</th>
                <th className="py-2 px-3">Produto</th>
                <th className="py-2 px-3 text-center">Qtd</th>
                <th className="py-2 px-3">Motivo / Documento</th>
                <th className="py-2 px-3">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockMovements.map((sm) => (
                <tr key={sm.id}>
                  <td className="py-2 px-3 font-mono text-slate-500">{sm.date}</td>
                  <td className="py-2 px-3 font-bold text-slate-800">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        sm.type === 'ENTRADA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sm.type === 'SAIDA'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {sm.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-900">{sm.productName}</td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">{sm.quantity}</td>
                  <td className="py-2 px-3 text-slate-600 text-[11px]">{sm.reason}</td>
                  <td className="py-2 px-3 text-slate-500">{sm.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Modal */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <h3 className="text-sm font-bold text-white">Registrar Movimentação de Estoque</h3>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Produto / Item *</label>
                <select
                  value={formData.productId}
                  onChange={(e) => {
                    const p = products.find((x) => x.id === e.target.value);
                    setFormData({
                      ...formData,
                      productId: e.target.value,
                      productName: p ? p.name : '',
                    });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Atual: {p.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Tipo de Operação</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as StockMovementType })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="ENTRADA">Entrada (Compra / Devolução)</option>
                    <option value="SAIDA">Saída (Venda / Consumo)</option>
                    <option value="TRANSFERENCIA">Transferência entre Unidades</option>
                    <option value="AJUSTE">Ajuste de Inventário</option>
                    <option value="PERDA">Perda / Avaria</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Quantidade *</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Motivo / Justificativa / NF</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Motivo, NF ou justificativa da movimentação"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold shadow"
                >
                  Confirmar Movimentação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
