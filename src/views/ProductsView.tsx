import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Flame,
  Shield,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Package,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, ProductCategory, FireClass, ExtinguisherAgent } from '../types';
import { formatBRL } from '../utils/formatters';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const ProductsView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [onlyContecCommercialized, setOnlyContecCommercialized] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    internalCode: '',
    sku: '',
    name: '',
    description: '',
    category: 'EXTINTORES' as ProductCategory,
    subcategory: 'Portátil',
    brand: 'Extinpel / CONTEC',
    manufacturer: 'Extinpel',
    model: 'ABC-04',
    capacity: '4 kg',
    agent: 'Pó Químico ABC' as ExtinguisherAgent,
    fireClasses: ['A', 'B', 'C'] as FireClass[],
    unit: 'UN',
    stockUnit: 'UN',
    ncm: '8424.10.00',
    origin: '0 - Nacional',
    costPrice: 80,
    salePrice: 160,
    wholesalePrice: 135,
    minPrice: 120,
    targetMargin: 50,
    currentStock: 50,
    minStock: 15,
    maxStock: 200,
    stockLocation: 'Corredor A',
    isContecCommercialized: true,
    isActive: true,
    photoUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80',
    standards: 'ABNT NBR 15808 / Selo INMETRO',
  });

  const handleOpenNew = () => {
    setEditingProduct(null);
    setFormData({
      internalCode: `PRD-${products.length + 101}`,
      sku: `CONTEC-SKU-${products.length + 1}`,
      name: '',
      description: '',
      category: 'EXTINTORES',
      subcategory: 'Portátil',
      brand: 'CONTEC',
      manufacturer: 'Extinpel',
      model: 'ABC-04',
      capacity: '4 kg',
      agent: 'Pó Químico ABC',
      fireClasses: ['A', 'B', 'C'],
      unit: 'UN',
      stockUnit: 'UN',
      ncm: '8424.10.00',
      origin: '0 - Nacional',
      costPrice: 80,
      salePrice: 160,
      wholesalePrice: 135,
      minPrice: 120,
      targetMargin: 50,
      currentStock: 10,
      minStock: 5,
      maxStock: 100,
      stockLocation: 'Depósito Matriz - Dirceu II',
      isContecCommercialized: true,
      isActive: true,
      photoUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80',
      standards: 'ABNT NBR 15808 / Selo INMETRO',
    });
    setIsModalOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      internalCode: prod.internalCode || '',
      sku: prod.sku || '',
      name: prod.name || '',
      description: prod.description || '',
      category: prod.category || 'EXTINTORES',
      subcategory: prod.subcategory || 'Geral',
      brand: prod.brand || 'CONTEC',
      manufacturer: prod.manufacturer || '',
      model: prod.model || '',
      capacity: prod.capacity || '',
      agent: prod.agent || 'Pó Químico ABC',
      fireClasses: prod.fireClasses || ['A', 'B', 'C'],
      unit: prod.unit || 'UN',
      stockUnit: prod.stockUnit || 'UN',
      ncm: prod.ncm || '8424.10.00',
      origin: prod.origin || '0 - Nacional',
      costPrice: prod.costPrice || 0,
      salePrice: prod.salePrice || 0,
      wholesalePrice: prod.wholesalePrice || 0,
      minPrice: prod.minPrice || 0,
      targetMargin: prod.targetMargin || 40,
      currentStock: prod.currentStock || 0,
      minStock: prod.minStock || 5,
      maxStock: prod.maxStock || 100,
      stockLocation: prod.stockLocation || 'Depósito Matriz',
      isContecCommercialized: prod.isContecCommercialized !== false,
      isActive: prod.isActive !== false,
      photoUrl: prod.photoUrl || '',
      standards: prod.standards || 'Norma ABNT',
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (prod: Product) => {
    setProductToDelete(prod);
  };

  const filteredProducts = products.filter((p) => {
    if (onlyContecCommercialized && !p.isContecCommercialized) return false;
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.internalCode.toLowerCase().includes(q) ||
        (p.agent && p.agent.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
      if (selectedProduct?.id === editingProduct.id) {
        setSelectedProduct({ ...selectedProduct, ...formData });
      }
    } else {
      addProduct(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Boxes size={20} className="text-red-600" />
              <span>Catálogo Técnico & Produtos de Segurança Contra Incêndio</span>
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {filteredProducts.length} itens cadastrados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Base técnica com extintores (NBR 15808), sinalização fotoluminescente, suportes, mangueiras e serviços de recarga credenciados pelo INMETRO.
          </p>
        </div>

        {currentUser.role !== 'CLIENTE_B2B' && (
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus size={15} />
            <span>Cadastrar Novo Produto</span>
          </button>
        )}
      </div>

      {/* Filter and Mode Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, SKU, agente..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
          >
            <option value="ALL">Todas as Categorias</option>
            <option value="EXTINTORES">Extintores de Incêndio</option>
            <option value="ACESSORIOS">Acessórios & Suportes</option>
            <option value="SINALIZACAO">Sinalização Fotoluminescente</option>
            <option value="HIDRANTES_EQUIPAMENTOS">Hidrantes & Mangueiras</option>
            <option value="SERVICOS">Serviços de Recarga / Vistoria</option>
          </select>
        </div>

        {/* Catalog Scope Toggle */}
        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 whitespace-nowrap">
          <input
            type="checkbox"
            checked={onlyContecCommercialized}
            onChange={(e) => setOnlyContecCommercialized(e.target.checked)}
            className="rounded text-red-600 focus:ring-red-500"
          />
          <span>Exibir apenas produtos comercializados pela CONTEC</span>
        </label>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            onClick={() => setSelectedProduct(prod)}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer group relative"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <span className="font-mono text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                  {prod.sku}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      prod.currentStock > prod.minStock
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {prod.currentStock} {prod.unit} em estoque
                  </span>

                  {currentUser.role !== 'CLIENTE_B2B' && (
                    <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEditProduct(prod)}
                        title="Editar Produto"
                        className="p-1 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod)}
                        title="Excluir Produto"
                        className="p-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2">
                {prod.name}
              </h3>

              <p className="text-[11px] text-slate-500 line-clamp-2">
                {prod.description}
              </p>

              {prod.agent && (
                <div className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                  <span>Agente: <strong>{prod.agent}</strong> ({prod.capacity})</span>
                  {prod.fireClasses && (
                    <span className="block text-red-600 font-semibold">Classes {prod.fireClasses.join(', ')}</span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Preço B2B Varejo:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatBRL(prod.salePrice)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Atacado:</span>
                <span className="font-mono font-semibold text-emerald-700 text-xs">
                  {formatBRL(prod.wholesalePrice)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
            <Boxes size={36} className="mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">Nenhum produto encontrado</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {products.length === 0
                ? 'O catálogo de produtos está vazio no momento. Clique em "Cadastrar Novo Produto" para alimentar seus produtos!'
                : 'Nenhum produto corresponde aos filtros da pesquisa.'}
            </p>
            {currentUser.role !== 'CLIENTE_B2B' && (
              <button
                onClick={handleOpenNew}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus size={14} />
                <span>Cadastrar Primeiro Item</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Package size={18} className="text-red-400" />
                <span>Ficha Técnica do Produto</span>
              </h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-300 max-h-[80vh] overflow-y-auto">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-[10px] text-red-400 font-mono uppercase font-bold">{selectedProduct.category} · {selectedProduct.subcategory}</span>
                <h4 className="text-base font-bold text-white mt-1">{selectedProduct.name}</h4>
                <p className="text-slate-400 mt-1">{selectedProduct.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Código / SKU</span>
                  <span className="text-white font-mono">{selectedProduct.sku}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">NCM Fiscal</span>
                  <span className="text-white font-mono">{selectedProduct.ncm}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Fabricante / Marca</span>
                  <span className="text-white">{selectedProduct.manufacturer} ({selectedProduct.brand})</span>
                </div>
                <div className="p-2.5 rounded bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Normas Regulamentadoras</span>
                  <span className="text-white">{selectedProduct.standards || 'Norma ABNT'}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Preço de Varejo B2B</span>
                  <span className="text-white font-mono font-bold">{formatBRL(selectedProduct.salePrice)}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Preço de Atacado</span>
                  <span className="text-emerald-400 font-mono font-bold">{formatBRL(selectedProduct.wholesalePrice)}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/80 rounded border border-slate-700 text-xs">
                <span className="text-slate-400 font-semibold block mb-1">Localização no Depósito da Matriz:</span>
                <span className="text-white font-medium">{selectedProduct.stockLocation}</span>
                <span className="text-slate-400 block text-[11px] mt-0.5">Estoque de segurança mínimo: {selectedProduct.minStock} un</span>
              </div>

              <div className="pt-3 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                {currentUser.role !== 'CLIENTE_B2B' && (
                  <button
                    onClick={() => handleDeleteProduct(selectedProduct)}
                    className="w-full sm:w-auto px-3.5 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-800/60 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>Excluir Produto</span>
                  </button>
                )}

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {currentUser.role !== 'CLIENTE_B2B' && (
                    <button
                      onClick={() => {
                        const p = selectedProduct;
                        setSelectedProduct(null);
                        handleEditProduct(p);
                      }}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Edit2 size={14} />
                      <span>Editar Produto</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Package size={18} className="text-red-400" />
                <span>{editingProduct ? `Editar Produto: ${editingProduct.name}` : 'Cadastrar Item no Catálogo'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Nome Comercial do Produto *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Nome comercial do produto ou serviço"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Categoria *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="EXTINTORES">Extintores de Incêndio</option>
                    <option value="ACESSORIOS">Acessórios & Suportes</option>
                    <option value="SINALIZACAO">Sinalização Fotoluminescente</option>
                    <option value="HIDRANTES_EQUIPAMENTOS">Hidrantes & Mangueiras</option>
                    <option value="SERVICOS">Serviços de Recarga</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Código SKU *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Preço de Varejo B2B (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Preço de Atacado (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.wholesalePrice}
                    onChange={(e) => setFormData({ ...formData, wholesalePrice: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Estoque Inicial (unidades)</label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Estoque Mínimo (Alerta)</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
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
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold shadow transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle size={15} />
                  <span>{editingProduct ? 'Salvar Alterações' : 'Salvar Produto no Catálogo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete Product Modal */}
      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={() => {
          if (productToDelete) {
            deleteProduct(productToDelete.id);
            if (selectedProduct?.id === productToDelete.id) {
              setSelectedProduct(null);
            }
            setProductToDelete(null);
          }
        }}
        title="Excluir Produto do Catálogo"
        message={`Tem certeza que deseja excluir o produto "${productToDelete?.name}" (SKU: ${productToDelete?.sku})?\n\nEsta operação removerá o item do catálogo de produtos e serviços.`}
        confirmLabel="Sim, Excluir Produto"
        variant="danger"
      />
    </div>
  );
};
