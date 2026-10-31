import React, { useState } from 'react';
import {
  X,
  QrCode,
  Flame,
  CheckCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Shield,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InstalledEquipment } from '../../types';
import { calculateDaysRemaining, getExpirationBadge, formatDateBR } from '../../utils/formatters';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWorkOrderForEquipment: (eq: InstalledEquipment) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onOpenWorkOrderForEquipment,
}) => {
  const { equipments } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [scannedEquipment, setScannedEquipment] = useState<InstalledEquipment | null>(null);
  const [isScanningSimulated, setIsScanningSimulated] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchTerm.trim().toLowerCase();
    const found = equipments.find(
      (eq) =>
        eq.patrimonyNumber.toLowerCase().includes(clean) ||
        eq.internalCode.toLowerCase().includes(clean) ||
        eq.serialNumber.toLowerCase().includes(clean)
    );
    if (found) {
      setScannedEquipment(found);
    } else {
      alert('Nenhum extintor encontrado com este código ou número de patrimônio.');
    }
  };

  const handleSimulateScan = (eq: InstalledEquipment) => {
    setIsScanningSimulated(true);
    setTimeout(() => {
      setIsScanningSimulated(false);
      setScannedEquipment(eq);
    }, 400);
  };

  const daysRemaining = scannedEquipment ? calculateDaysRemaining(scannedEquipment.nextMaintenanceDate) : 0;
  const badge = getExpirationBadge(daysRemaining);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Leitor de QR Code & Vistoria Mobile</h3>
              <p className="text-[11px] text-slate-400">Identificação instantânea de extintores em campo</p>
            </div>
          </div>
          <button
            onClick={() => {
              setScannedEquipment(null);
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {!scannedEquipment ? (
            <>
              {/* Simulated Camera Viewfinder */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[220px]">
                {/* Viewfinder Grid overlay */}
                <div className="w-48 h-48 border-2 border-red-500/60 rounded-2xl relative flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-400 -mt-1 -ml-1"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-400 -mt-1 -mr-1"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-400 -mb-1 -ml-1"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-400 -mb-1 -mr-1"></div>

                  {isScanningSimulated ? (
                    <div className="text-center animate-pulse text-xs text-red-400 font-medium">
                      Decodificando QR Code...
                    </div>
                  ) : (
                    <div className="text-center text-xs text-slate-400 space-y-1">
                      <QrCode size={36} className="mx-auto text-slate-600 animate-bounce" />
                      <p>Aponte a câmera para a etiqueta do extintor</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Input Search */}
              <form onSubmit={handleSearch} className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Ou digite o Código Patrimonial / Nº de Série
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ex: CONT-EXT-101 ou SN-2023-90812"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Localizar
                  </button>
                </div>
              </form>

              {/* Quick Sample Extinguishers to Test */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" />
                  <span>Exemplos rápidos para teste de campo:</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {equipments.slice(0, 4).map((eq) => {
                    const days = calculateDaysRemaining(eq.nextMaintenanceDate);
                    return (
                      <button
                        key={eq.id}
                        onClick={() => handleSimulateScan(eq)}
                        className="p-2.5 text-left bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-colors group"
                      >
                        <div className="text-xs font-bold text-white group-hover:text-red-400">
                          {eq.patrimonyNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {eq.customerName}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          {eq.agent} {eq.capacity} · {days < 0 ? 'Vencido' : `${days}d`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Scanned Extinguisher Technical Sheet */
            <div className="space-y-4">
              {/* Alert Status Banner */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${badge.colorClass}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${badge.dotClass} animate-ping`}></span>
                  <span className="text-xs font-bold uppercase">{badge.label}</span>
                </div>
                <div className="text-xs font-mono font-semibold">
                  Próx. Recarga: {formatDateBR(scannedEquipment.nextMaintenanceDate)}
                </div>
              </div>

              {/* Equipment Main Specs Card */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-red-400 font-bold bg-red-950/60 border border-red-800/40 px-2 py-0.5 rounded">
                      {scannedEquipment.patrimonyNumber}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5">
                      {scannedEquipment.type} {scannedEquipment.agent} {scannedEquipment.capacity}
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                      <Building2 size={13} className="text-slate-400" />
                      <strong>{scannedEquipment.customerName}</strong>
                    </p>
                  </div>

                  {scannedEquipment.qrCodeUrl && (
                    <img
                      src={scannedEquipment.qrCodeUrl}
                      alt="QR Code"
                      className="w-16 h-16 rounded bg-white p-1 shadow"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700/60">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Local / Ambiente:</span>
                    <span className="text-slate-200 font-medium">{scannedEquipment.environment}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Prédio / Setor:</span>
                    <span className="text-slate-200 font-medium">{scannedEquipment.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Classes de Incêndio:</span>
                    <span className="text-slate-200 font-medium">Classes {scannedEquipment.fireClasses.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Selo INMETRO:</span>
                    <span className="text-slate-200 font-mono font-medium">{scannedEquipment.inmetroSealNumber || 'Em dia'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nº de Série:</span>
                    <span className="text-slate-200 font-mono">{scannedEquipment.serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Fabricante:</span>
                    <span className="text-slate-200">{scannedEquipment.manufacturer} ({scannedEquipment.manufactureDate})</span>
                  </div>
                </div>

                {scannedEquipment.notes && (
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50 text-[11px] text-slate-300">
                    <span className="text-slate-400 font-semibold">Observação Técnica: </span>
                    {scannedEquipment.notes}
                  </div>
                )}
              </div>

              {/* Inspection Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onOpenWorkOrderForEquipment(scannedEquipment);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-900/40 transition-colors"
                >
                  <Shield size={16} />
                  <span>Abrir Ordem de Serviço / Registrar Manutenção</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => setScannedEquipment(null)}
                  className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Escanear Outro Equipamento
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
