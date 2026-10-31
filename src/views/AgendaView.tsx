import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateBR } from '../utils/formatters';

export const AgendaView: React.FC = () => {
  const { workOrders } = useApp();
  const [selectedDay, setSelectedDay] = useState<string>('2026-09-28');

  // Days in week
  const weekDays = [
    { date: '2026-09-26', label: 'Sáb, 26/09' },
    { date: '2026-09-28', label: 'Seg, 28/09' },
    { date: '2026-09-29', label: 'Ter, 29/09' },
    { date: '2026-09-30', label: 'Qua, 30/09' },
    { date: '2026-10-01', label: 'Qui, 01/10' },
  ];

  const dayOrders = workOrders.filter((w) => w.scheduledDate === selectedDay);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon size={20} className="text-red-600" />
              <span>Agenda de Técnicos & Roteiro de Campo</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cronograma operacional diário e semanal para vistorias, recargas no local e coletas de extintores em Teresina e região metropolitana.
          </p>
        </div>
      </div>

      {/* Week Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {weekDays.map((d) => {
          const count = workOrders.filter((w) => w.scheduledDate === d.date).length;
          const isSelected = selectedDay === d.date;

          return (
            <button
              key={d.date}
              onClick={() => setSelectedDay(d.date)}
              className={`px-4 py-3 rounded-xl border text-left min-w-[140px] transition-all ${
                isSelected
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-bold">{d.label}</div>
              <div className={`text-[10px] mt-1 ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>
                {count} visita(s) agendada(s)
              </div>
            </button>
          );
        })}
      </div>

      {/* Day Schedule Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
          Visitas Técnicas Agendadas para {formatDateBR(selectedDay)}
        </h3>

        {dayOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-1">
            <Clock size={28} className="mx-auto text-slate-300" />
            <p>Nenhuma ordem de serviço designada para esta data.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayOrders.map((wo) => (
              <div
                key={wo.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-red-600 bg-red-100/60 px-2 py-0.5 rounded text-[10px]">
                      {wo.scheduledTime}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{wo.customerName}</span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">
                      ({wo.type})
                    </span>
                  </div>
                  <div className="text-slate-600 flex items-center gap-1.5 text-[11px]">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{wo.customerAddress}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    <strong>Escopo:</strong> {wo.serviceDescription}
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-1 shrink-0">
                  <div className="flex items-center gap-1 text-slate-700 font-medium">
                    <User size={13} className="text-slate-400" />
                    <span>{wo.technicianName}</span>
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      wo.status === 'CONCLUIDA'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {wo.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
