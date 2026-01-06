
import React, { useState, useMemo } from 'react';
import { Sale, SalesChannel, PaymentMethod, SalesType } from '../types';
import { Calendar as CalendarIcon, Search, Download, TrendingUp, DollarSign, UserCheck, Calculator } from 'lucide-react';

interface SalesSummaryReportProps {
  sales: Sale[];
}

const SalesSummaryReport: React.FC<SalesSummaryReportProps> = ({ sales }) => {
  // --- STATE: Date Range ---
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]; // Today
  });

  // --- FILTERED DATA ---
  const filteredSales = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return sales.filter(s => {
      const d = new Date(s.date);
      return d >= start && d <= end;
    });
  }, [sales, startDate, endDate]);

  // --- TABLE 1: CHANNEL MATRIX CALCULATION ---
  // Rows: Channels, Cols: Cash, TC, Bitcoin, Transfer, Total
  const channelMatrix = useMemo(() => {
    const matrix: Record<string, { efectivo: number, tc: number, bitcoin: number, transfer: number, total: number }> = {};
    
    // Initialize
    Object.values(SalesChannel).forEach(ch => {
      matrix[ch] = { efectivo: 0, tc: 0, bitcoin: 0, transfer: 0, total: 0 };
    });

    filteredSales.forEach(sale => {
      if (!matrix[sale.channel]) return;

      const amt = sale.amount;
      
      // Categorize Payment Method
      if (sale.paymentMethod === PaymentMethod.EFECTIVO) {
        matrix[sale.channel].efectivo += amt;
      } else if (sale.paymentMethod === PaymentMethod.BAC || sale.paymentMethod === PaymentMethod.PROMERICA) {
        matrix[sale.channel].tc += amt;
      } else if (sale.paymentMethod === PaymentMethod.BITCOIN) {
        matrix[sale.channel].bitcoin += amt;
      } else {
        // Transferencia, Link de Pago, Otros
        matrix[sale.channel].transfer += amt;
      }
      
      matrix[sale.channel].total += amt;
    });

    return matrix;
  }, [filteredSales]);

  // Totals for Table 1
  const matrixTotals = useMemo(() => {
    const t = { efectivo: 0, tc: 0, bitcoin: 0, transfer: 0, total: 0 };
    Object.values(channelMatrix).forEach(row => {
      t.efectivo += row.efectivo;
      t.tc += row.tc;
      t.bitcoin += row.bitcoin;
      t.transfer += row.transfer;
      t.total += row.total;
    });
    return t;
  }, [channelMatrix]);

  // --- TABLE 2: DIRECT SALE DEDUCTION BREAKDOWN (Logic from SaleForm) ---
  // Specifically for "Reserva Directa" or Commissionable Sales
  const deductionBreakdown = useMemo(() => {
    // We only care about sales that are potentially commissionable (Direct Sales usually)
    // Or based on the user prompt: "Venta Directa" table
    const targetSales = filteredSales.filter(s => s.channel === SalesChannel.RESERVA_DIRECTA);

    const summary = {
      efectivo: 0, tc: 0, bitcoin: 0, transfer: 0,
      taxDeduction: 0, // 18% (Only Hotel)
      bankFee: 0,      // 4.5% (Only Cards)
      commissionableBase: 0,
      totalCommission: 0 // The 1% or 2% actually generated
    };

    targetSales.forEach(sale => {
      // 1. Sum Gross by Payment Type
      if (sale.paymentMethod === PaymentMethod.EFECTIVO) summary.efectivo += sale.amount;
      else if (sale.paymentMethod === PaymentMethod.BAC || sale.paymentMethod === PaymentMethod.PROMERICA) summary.tc += sale.amount;
      else if (sale.paymentMethod === PaymentMethod.BITCOIN) summary.bitcoin += sale.amount;
      else summary.transfer += sale.amount;

      // 2. Calculate Deductions (Replicating SaleForm Logic)
      let currentBase = sale.amount;

      // Tax 18% (Hotel only)
      if (sale.type === SalesType.HOTEL) {
        const tax = sale.amount * 0.18;
        summary.taxDeduction += tax;
        currentBase -= tax;
      }

      // Bank Fee 4.5% (Cards only)
      if (sale.paymentMethod === PaymentMethod.BAC || sale.paymentMethod === PaymentMethod.PROMERICA || sale.paymentMethod === PaymentMethod.LINK_DE_PAGO) {
        // Note: Link de Pago is often treated as Card for fees, grouping it with TC/Transfer logic carefully
        const fee = sale.amount * 0.045;
        summary.bankFee += fee;
        currentBase -= fee;
      }

      // 3. Add to Commissionable Base
      // Only add if positive
      if (currentBase > 0) {
        summary.commissionableBase += currentBase;
      }

      // 4. Actual Commission Recorded
      summary.totalCommission += (sale.commissionAmount || 0);
    });

    return summary;
  }, [filteredSales]);

  // --- TABLE 3: RECEPTIONIST PAYOUTS ---
  const receptionistPayouts = useMemo(() => {
    const data: Record<string, { commission: number, rent: number, total: number }> = {
      'Diego': { commission: 0, rent: 0, total: 0 },
      'Helen': { commission: 0, rent: 0, total: 0 },
    };

    filteredSales.forEach(sale => {
      if (sale.receptionist && data[sale.receptionist]) {
        data[sale.receptionist].commission += (sale.commissionAmount || 0);
      }
    });

    // Calculate Renta (10%) and Total
    Object.keys(data).forEach(key => {
      data[key].rent = data[key].commission * 0.10;
      data[key].total = data[key].commission - data[key].rent;
    });

    return data;
  }, [filteredSales]);

  const totalPayouts = {
    commission: receptionistPayouts['Diego'].commission + receptionistPayouts['Helen'].commission,
    rent: receptionistPayouts['Diego'].rent + receptionistPayouts['Helen'].rent,
    total: receptionistPayouts['Diego'].total + receptionistPayouts['Helen'].total
  };

  const formatCurrency = (val: number) => {
    return val ? `$ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Header & Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Reporte General de Ventas
          </h2>
          <p className="text-slate-500 text-sm mt-1">Seleccione el rango de fechas para generar las tablas.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Desde</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none"
              />
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Hasta</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE 1: CANAL DE VENTA MATRIZ */}
      <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
           <h3 className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
             <DollarSign className="w-4 h-4 text-emerald-400" /> Canal de Venta (Total Periodo)
           </h3>
           <span className="text-slate-400 text-xs font-mono">{filteredSales.length} transacciones</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-emerald-50 text-emerald-900 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left w-1/4">Canal</th>
                <th className="px-4 py-3 text-right">Efectivo</th>
                <th className="px-4 py-3 text-right">TC</th>
                <th className="px-4 py-3 text-right">Bitcoin</th>
                <th className="px-4 py-3 text-right">Transferencia</th>
                <th className="px-6 py-3 text-right bg-emerald-100/50">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {Object.entries(channelMatrix).map(([channel, data]) => (
                <tr key={channel} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-bold">{channel}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(data.efectivo)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(data.tc)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(data.bitcoin)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(data.transfer)}</td>
                  <td className="px-6 py-3 text-right font-mono font-bold text-slate-900 bg-slate-50">{formatCurrency(data.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
              <tr>
                <td className="px-6 py-4 uppercase tracking-wider text-xs">Total Venta</td>
                <td className="px-4 py-4 text-right font-mono">{formatCurrency(matrixTotals.efectivo)}</td>
                <td className="px-4 py-4 text-right font-mono">{formatCurrency(matrixTotals.tc)}</td>
                <td className="px-4 py-4 text-right font-mono">{formatCurrency(matrixTotals.bitcoin)}</td>
                <td className="px-4 py-4 text-right font-mono">{formatCurrency(matrixTotals.transfer)}</td>
                <td className="px-6 py-4 text-right font-mono text-lg bg-slate-100">{formatCurrency(matrixTotals.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* TABLE 2: DETALLE DEDUCCIONES (VENTA DIRECTA) */}
        <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden h-fit">
          <div className="bg-teal-900 px-6 py-4">
             <h3 className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
               <Calculator className="w-4 h-4 text-teal-400" /> Detalle Venta Directa
             </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-teal-50 text-teal-900 font-bold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">Concepto</th>
                  <th className="px-4 py-3 text-right">Efectivo</th>
                  <th className="px-4 py-3 text-right">TC</th>
                  <th className="px-4 py-3 text-right">Bitcoin</th>
                  <th className="px-4 py-3 text-right">Transf.</th>
                  <th className="px-4 py-3 text-right bg-teal-100/50">CASH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* SUB (Sales) */}
                <tr className="hover:bg-slate-50 font-bold">
                  <td className="px-6 py-3">SUB (Venta)</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(deductionBreakdown.efectivo)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(deductionBreakdown.tc)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(deductionBreakdown.bitcoin)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(deductionBreakdown.transfer)}</td>
                  <td className="px-4 py-3 bg-slate-50"></td>
                </tr>
                {/* Impuestos */}
                <tr>
                  <td className="px-6 py-3 text-slate-500">(-) Impuestos (18% Hotel)</td>
                  <td colSpan={4}></td>
                  <td className="px-4 py-3 text-right font-mono text-red-600 bg-red-50 font-medium">
                    {formatCurrency(deductionBreakdown.taxDeduction)}
                  </td>
                </tr>
                {/* Comision Banco */}
                <tr>
                  <td className="px-6 py-3 text-slate-500">(-) Comisión Banco (4.5%)</td>
                  <td colSpan={4}></td>
                  <td className="px-4 py-3 text-right font-mono text-red-600 bg-red-50 font-medium">
                    {formatCurrency(deductionBreakdown.bankFee)}
                  </td>
                </tr>
                {/* Comisionable */}
                <tr className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                  <td className="px-6 py-3">BASE COMISIONABLE</td>
                  <td colSpan={4} className="text-right text-xs text-slate-400 font-normal pr-4 italic">
                    (Venta Directa - Impuestos - Com. Banco)
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-base border-l border-slate-200">
                    {formatCurrency(deductionBreakdown.commissionableBase)}
                  </td>
                </tr>
                {/* Comision Total Generada */}
                <tr className="bg-amber-50 text-amber-900 font-bold border-t border-amber-100">
                  <td className="px-6 py-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> Comisiones Generadas
                  </td>
                  <td colSpan={4}></td>
                  <td className="px-4 py-3 text-right font-mono text-base border-l border-amber-100">
                    {formatCurrency(deductionBreakdown.totalCommission)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLE 3: NOMINA COMISIONES */}
        <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden h-fit">
          <div className="bg-blue-900 px-6 py-4">
             <h3 className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
               <UserCheck className="w-4 h-4 text-blue-400" /> Pago a Recepcionistas
             </h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-blue-50 text-blue-900 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-right">Comisión</th>
                <th className="px-4 py-3 text-right">Renta (10%)</th>
                <th className="px-6 py-3 text-right bg-blue-100/50">Total a Pagar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* Diego */}
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-3 font-bold">DIEGO</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(receptionistPayouts.Diego.commission)}</td>
                <td className="px-4 py-3 text-right font-mono text-red-500">{formatCurrency(receptionistPayouts.Diego.rent)}</td>
                <td className="px-6 py-3 text-right font-mono font-bold text-slate-900 bg-slate-50">
                  {formatCurrency(receptionistPayouts.Diego.total)}
                </td>
              </tr>
              {/* Helen */}
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-3 font-bold">HELEN</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(receptionistPayouts.Helen.commission)}</td>
                <td className="px-4 py-3 text-right font-mono text-red-500">{formatCurrency(receptionistPayouts.Helen.rent)}</td>
                <td className="px-6 py-3 text-right font-mono font-bold text-slate-900 bg-slate-50">
                  {formatCurrency(receptionistPayouts.Helen.total)}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-blue-900 text-white font-bold border-t-2 border-blue-800">
              <tr>
                <td className="px-6 py-4 uppercase tracking-wider text-xs">Totales</td>
                <td className="px-4 py-4 text-right font-mono">{formatCurrency(totalPayouts.commission)}</td>
                <td className="px-4 py-4 text-right font-mono text-blue-200">{formatCurrency(totalPayouts.rent)}</td>
                <td className="px-6 py-4 text-right font-mono text-lg bg-blue-800">
                  {formatCurrency(totalPayouts.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>
    </div>
  );
};

export default SalesSummaryReport;
