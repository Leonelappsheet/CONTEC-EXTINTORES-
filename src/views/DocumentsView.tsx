import React, { useState } from 'react';
import {
  FolderOpen,
  FileText,
  Download,
  ShieldCheck,
  Search,
  Building2,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateBR } from '../utils/formatters';

export const DocumentsView: React.FC = () => {
  const { customers, companyConfig } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const documents = [
    {
      id: 'doc-1',
      title: 'Certificado de Credenciamento INMETRO - CONTEC EXTINTORES',
      category: 'REGULATORIO',
      entity: 'Portaria INMETRO nº 005481/2022',
      date: '2026-01-10',
      fileSize: '1.4 MB',
      type: 'PDF',
    },
    {
      id: 'doc-2',
      title: 'Laudo de Ensaio Hidrostático Nível 3 - Cilindros de Alta Pressão CO2',
      category: 'TECNICO',
      entity: 'Hospital Santa Maria S/A',
      date: '2026-09-18',
      fileSize: '850 KB',
      type: 'PDF',
    },
    {
      id: 'doc-3',
      title: 'Comprovante Oficial de Recarga Nível 2 - Canteiro Residencial Bella Vista',
      category: 'OS',
      entity: 'Construtora Rio Poti Ltda',
      date: '2026-09-20',
      fileSize: '620 KB',
      type: 'PDF',
    },
    {
      id: 'doc-4',
      title: 'Manual Técnico e Ficha de Informação de Segurança (FISPQ) - Pó Químico ABC 55%',
      category: 'CATALOGO',
      entity: 'Extinpel Indústria Química',
      date: '2026-03-05',
      fileSize: '2.1 MB',
      type: 'PDF',
    },
    {
      id: 'doc-5',
      title: 'Atestado de Conformidade com Instrução Técnica do CBMEPI (Corpo de Bombeiros)',
      category: 'REGULATORIO',
      entity: 'Posto Dirceu Express',
      date: '2026-08-12',
      fileSize: '910 KB',
      type: 'PDF',
    },
  ];

  const filtered = documents.filter((d) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return d.title.toLowerCase().includes(q) || d.entity.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FolderOpen size={20} className="text-red-600" />
              <span>Central de Documentos, Laudos & Certificados INMETRO</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Repositório oficial de certificados, alvarás do Corpo de Bombeiros, ordens de serviço digitalizadas e laudos hidrostáticos por cliente.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, cliente ou órgão..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-md transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {doc.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{doc.fileSize}</span>
              </div>

              <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                {doc.title}
              </h3>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Building2 size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{doc.entity}</span>
              </div>

              <div className="text-[10px] text-slate-400">
                Emitido em: {formatDateBR(doc.date)}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <button
                onClick={() => alert(`Iniciando download seguro do arquivo: ${doc.title}`)}
                className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold"
              >
                <Download size={14} />
                <span>Baixar {doc.type}</span>
              </button>

              <span className="text-emerald-700 text-[10px] font-semibold flex items-center gap-1">
                <ShieldCheck size={12} /> Assinado Digitalmente
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
