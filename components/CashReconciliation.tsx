
import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, RefreshCw, Printer, ExternalLink, Info, Layers, FileText, ArrowDown, ArrowRight, CheckCircle, AlertTriangle, Lock, CreditCard, Unlock, Hotel } from 'lucide-react';
import { Sale, PaymentMethod, Expense, User } from '../types';
import Dashboard from './Dashboard';

interface CashReconciliationProps {
  sales?: Sale[];
  expenses: Expense[];
  onOpenExpenseModal: () => void;
  initialFondo: string;
  onCloseDay: (nextFondo: string) => void;
  selectedDate: string;
  isDayClosed: boolean;
  onReopenDay: () => void;
  currentUser: User | null;
  salesTypes: string[]; // Dynamic types
}

const CashReconciliation: React.FC<CashReconciliationProps> = ({ 
  sales = [], 
  expenses = [],
  onOpenExpenseModal,
  initialFondo,
  onCloseDay,
  selectedDate,
  isDayClosed,
  onReopenDay,
  currentUser,
  salesTypes
}) => {
  // --- CASH COUNT STATE ---
  const [bills, setBills] = useState({
    100: '', 50: '', 20: '', 10: '', 5: '', 1: ''
  });
  const [coins, setCoins] = useState({
    0.25: '', 0.10: '', 0.05: '', 0.01: ''
  });
  const [checks, setChecks] = useState<string>('');
  const [others, setOthers] = useState<string>('');
  const [countedTotal, setCountedTotal] = useState<number>(0);

  // --- CORTE DIARIO INPUTS STATE ---
  const [fondoCaja, setFondoCaja] = useState<string>(initialFondo);
  
  // Update fondo if prop changes (e.g. switching days)
  useEffect(() => {
      setFondoCaja(initialFondo);
  }, [initialFondo, selectedDate]);

  // Inputs de Cierre de Lote (Tarjetas)
  const [batchBac, setBatchBac] = useState<string>('');
  const [batchPromerica, setBatchPromerica] = useState<string>('');

  // --- REMITTANCE & CLOSE DAY STATE ---
  const [remittanceDone, setRemittanceDone] = useState(false);
  const [showRemitModal, setShowRemitModal] = useState(false);
  const [nextDayFondo, setNextDayFondo] = useState('200.00');
  
  const [includeSurplusInRemittance, setIncludeSurplusInRemittance] = useState(false);
  const [recordedSurplusRemitted, setRecordedSurplusRemitted] = useState(0);

  // Reset internal states when date changes
  useEffect(() => {
    setRemittanceDone(false);
    setRecordedSurplusRemitted(0);
    setBatchBac('');
    setBatchPromerica('');
    setBills({ 100: '', 50: '', 20: '', 10: '', 5: '', 1: '' });
    setCoins({ 0.25: '', 0.10: '', 0.05: '', 0.01: '' });
    setChecks('');
    setOthers('');
  }, [selectedDate]);


  // --- CALCULATIONS ---
  useEffect(() => {
    let sum = 0;
    Object.entries(bills).forEach(([denom, qty]) => sum += (parseInt(qty as string) || 0) * parseFloat(denom));
    Object.entries(coins).forEach(([denom, qty]) => sum += (parseInt(qty as string) || 0) * parseFloat(denom));
    sum += parseFloat(checks) || 0;
    sum += parseFloat(others) || 0;
    setCountedTotal(sum);
  }, [bills, coins, checks, others]);

  const salesAnalysis = useMemo(() => {
    const totalVentas = sales.reduce((sum, s) => sum + s.amount, 0);
    const ventasBac = sales.filter(s => s.paymentMethod === PaymentMethod.BAC).reduce((sum, s) => sum + s.amount, 0);
    const ventasPromerica = sales.filter(s => s.paymentMethod === PaymentMethod.PROMERICA).reduce((sum, s) => sum + s.amount, 0);
    const ventasTarjetaTotal = ventasBac + ventasPromerica;
    const ventasDeposito = sales
      .filter(s => 
        s.paymentMethod === PaymentMethod.TRANSFERENCIA || 
        s.paymentMethod === PaymentMethod.LINK_DE_PAGO || 
        s.paymentMethod === PaymentMethod.BITCOIN
      )
      .reduce((sum, s) => sum + s.amount, 0);
    return { totalVentas, ventasBac, ventasPromerica, ventasTarjetaTotal, ventasDeposito };
  }, [sales]);

  const breakdownBySection = useMemo(() => {
    // Dynamic grouping based on salesTypes prop
    const groupedData: Record<string, Record<string, number>> = {};
    salesTypes.forEach(type => {
      groupedData[type] = {};
      Object.values(PaymentMethod).forEach(method => {
        groupedData[type][method] = 0;
      });
    });
    
    // Also handle types that might exist in old records but not in current list
    sales.forEach(sale => {
      if (!groupedData[sale.type]) {
          groupedData[sale.type] = {};
          Object.values(PaymentMethod).forEach(method => groupedData[sale.type][method] = 0);
      }
      groupedData[sale.type][sale.paymentMethod] += sale.amount;
    });

    // Sort sections: App configured ones first, then extras
    const sortedSections = Object.keys(groupedData).sort((a, b) => {
        const idxA = salesTypes.indexOf(a);
        const idxB = salesTypes.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    return { targetSections: sortedSections, groupedData };
  }, [sales, salesTypes]);

  const val = (s: string) => parseFloat(s) || 0;
  const totalDetailedExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalEgresos = totalDetailedExpenses;
  const ventasEfectivoBruto = salesAnalysis.totalVentas - salesAnalysis.ventasTarjetaTotal - salesAnalysis.ventasDeposito;
  const efectivoNetoHoy = ventasEfectivoBruto - totalEgresos;
  const totalAcumuladoEnCaja = val(fondoCaja) + efectivoNetoHoy;
  const difference = countedTotal - totalAcumuladoEnCaja;
  const sobranteEfectivo = difference > 0.009 ? difference : 0;
  
  const diffBac = val(batchBac) - salesAnalysis.ventasBac;
  const diffPromerica = val(batchPromerica) - salesAnalysis.ventasPromerica;

  const montoBaseRemesa = Math.max(0, efectivoNetoHoy);
  const montoTotalConSobrante = montoBaseRemesa + sobranteEfectivo;
  const canRemit = montoBaseRemesa > 0 || sobranteEfectivo > 0;

  const handleQuantityChange = (setter: any, denom: number, value: string) => {
    if (isDayClosed) return;
    if (value === '' || /^\d+$/.test(value)) setter((prev: any) => ({ ...prev, [denom]: value }));
  };
  const handleInput = (setter: any, value: string) => {
    if (isDayClosed) return;
    if (value === '' || /^\d*\.?\d*$/.test(value)) setter(value);
  };
  const handleReset = () => {
    if (isDayClosed) return;
    if (window.confirm('¿Limpiar conteo?')) {
      setBills({ 100: '', 50: '', 20: '', 10: '', 5: '', 1: '' });
      setCoins({ 0.25: '', 0.10: '', 0.05: '', 0.01: '' });
      setChecks('');
      setOthers('');
    }
  };

  const handleProcessRemesa = () => {
     if (includeSurplusInRemittance) setRecordedSurplusRemitted(sobranteEfectivo);
     else setRecordedSurplusRemitted(0);
     setRemittanceDone(true);
     setShowRemitModal(false);
  };

  const handleCloseDayAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!window.confirm("¿ESTÁ SEGURO QUE DESEA CERRAR EL DÍA?")) return;
    let finalNextFondo = remittanceDone ? (nextDayFondo || '200.00') : countedTotal.toFixed(2);
    onCloseDay(finalNextFondo);
  };

  const billDenoms = [100, 50, 20, 10, 5, 1];
  const coinDenoms = [0.25, 0.10, 0.05, 0.01];

  const formattedDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', { 
     weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  }).toUpperCase();

  // CSS Class for Inputs to make them look like text in print
  const printInputClass = "print:border-none print:bg-transparent print:p-0 print:text-right print:w-full print:block";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-24 relative print:gap-4 print:pb-0 print:block">
      
      {/* --- PRINT ONLY HEADER --- */}
      <div className="hidden print:flex flex-col items-center justify-center mb-8 pb-6 border-b-2 border-slate-900 w-full col-span-12">
         <div className="flex items-center gap-3 mb-2">
            <Hotel className="w-8 h-8 text-slate-900" />
            <h1 className="text-3xl font-bold text-slate-900 tracking-widest">THE VIEWS</h1>
         </div>
         <p className="text-xs font-bold uppercase tracking-[0.4em] text-slate-500 mb-4">Resort & Hotel Management</p>
         <h2 className="text-xl font-bold uppercase mt-2">Reporte de Cierre de Caja</h2>
         <p className="text-sm font-medium text-slate-600 mt-1 capitalize">{formattedDate}</p>
         <div className="flex gap-8 mt-4 text-xs font-mono text-slate-500">
             <span>Cajero: <strong className="text-slate-900 uppercase">{currentUser?.name}</strong></span>
             <span>Impreso: {new Date().toLocaleTimeString()}</span>
         </div>
      </div>

      {/* --- DASHBOARD IN PRINT ONLY --- */}
      <div className="hidden print:block col-span-12 mb-8 break-inside-avoid">
         <div className="bg-slate-100 p-4 rounded-lg mb-4 text-center">
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Resumen Ejecutivo</h3>
         </div>
         <Dashboard sales={sales} />
         <div className="my-8 border-b-2 border-slate-300 border-dashed"></div>
      </div>

      {/* CLOSED DAY OVERLAY / BANNER */}
      {isDayClosed && (
        <div className="xl:col-span-12 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between shadow-sm animate-fade-in print:hidden">
           <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-full">
                  <Lock className="w-6 h-6 text-red-600" />
              </div>
              <div>
                  <h3 className="text-lg font-bold text-red-900">Este día se encuentra CERRADO</h3>
                  <p className="text-red-700 text-sm">La información es de solo lectura.</p>
              </div>
           </div>
           <button 
             onClick={onReopenDay}
             className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md flex items-center gap-2 transition-all"
           >
              <Unlock className="w-4 h-4" /> REABRIR DÍA
           </button>
        </div>
      )}

      {/* MODAL REMESA */}
      {showRemitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Confirmar Envío de Remesa
            </h3>
            {/* ... Modal content similar to before ... */}
            <div className="space-y-4 mb-6">
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-lg">
                  <span className="font-bold text-slate-900">Total a Remesar</span>
                  <span className="font-mono font-bold text-green-600">
                     ${(includeSurplusInRemittance ? montoTotalConSobrante : montoBaseRemesa).toFixed(2)}
                  </span>
               </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <label className="block text-xs font-bold text-amber-800 uppercase tracking-widest mb-2">
                Saldo Inicial para Mañana
              </label>
              <input 
                  type="number" 
                  value={nextDayFondo} 
                  onChange={(e) => setNextDayFondo(e.target.value)}
                  className="w-full pl-2 pr-2 py-2 bg-white border border-amber-300 rounded font-bold text-slate-800"
                />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowRemitModal(false)} className="flex-1 py-3 px-4 border border-slate-300 rounded-lg font-bold">Cancelar</button>
              <button onClick={handleProcessRemesa} className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-bold">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT COLUMN: CASH COUNT */}
      <div className={`xl:col-span-4 bg-white p-8 rounded-xl shadow-lg border border-slate-200 h-fit ${isDayClosed ? 'opacity-75 pointer-events-none' : ''} print:col-span-12 print:shadow-none print:border print:border-slate-300 print:mb-6 print:break-inside-avoid print:opacity-100`}>
        <div className="flex items-center justify-between mb-8 print:mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
            <Calculator className="w-5 h-5 text-blue-600 print:hidden" />
            Arqueo Físico
          </h2>
          <button onClick={handleReset} className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 font-bold uppercase tracking-wider transition-colors print:hidden">
            <RefreshCw className="w-3 h-3" /> Reiniciar
          </button>
        </div>

        <div className="overflow-hidden border border-slate-200 rounded-lg print:border-none">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-xs print:bg-slate-200 print:text-slate-900">
              <tr>
                <th className="px-4 py-3 text-left">Denominación</th>
                <th className="px-2 py-3 text-center">Cant.</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white print:divide-slate-200">
              {billDenoms.map(d => (
                <tr key={`b-${d}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 text-slate-700 font-medium">Billetes ${d}</td>
                  <td className="px-2 py-2.5">
                    <input type="text" inputMode="numeric" value={bills[d as keyof typeof bills]} 
                      onChange={(e) => handleQuantityChange(setBills, d, e.target.value)}
                      disabled={isDayClosed}
                      className={`w-full px-1 py-1 border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-900 font-medium disabled:bg-slate-100 ${printInputClass}`} placeholder="0" />
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-900 font-bold">${((parseInt(bills[d as keyof typeof bills])||0)*d).toFixed(2)}</td>
                </tr>
              ))}
              {coinDenoms.map(d => (
                <tr key={`c-${d}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 text-slate-700 font-medium">Monedas ${d}</td>
                  <td className="px-2 py-2.5">
                    <input type="text" inputMode="numeric" value={coins[d as keyof typeof coins]} 
                      onChange={(e) => handleQuantityChange(setCoins, d, e.target.value)}
                      disabled={isDayClosed}
                      className={`w-full px-1 py-1 border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-900 font-medium disabled:bg-slate-100 ${printInputClass}`} placeholder="0" />
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-900 font-bold">${((parseInt(coins[d as keyof typeof coins])||0)*d).toFixed(2)}</td>
                </tr>
              ))}
              {/* Added inputs for Check/Others for visual completeness in Print */}
               <tr className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-700 font-medium">Cheques / Otros</td>
                <td className="px-2 py-2.5 text-center text-xs text-slate-400">-</td>
                <td className="px-4 py-2.5">
                   <input type="text" inputMode="decimal" value={checks} onChange={(e) => handleInput(setChecks, e.target.value)}
                      className={`w-full px-1 py-1 border border-slate-300 rounded text-right outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-900 font-bold ${printInputClass}`} placeholder="0.00" />
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-900 text-white font-bold border-t border-slate-900 print:bg-slate-200 print:text-slate-900">
              <tr>
                <td colSpan={2} className="px-4 py-4 text-right text-xs uppercase tracking-wider">TOTAL EN EFECTIVO</td>
                <td className="px-4 py-4 text-right text-lg font-mono">${countedTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* RIGHT COLUMN: CORTE DIARIO */}
      <div className="xl:col-span-8 space-y-6 print:col-span-12 print:space-y-8">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border print:border-slate-300 print:break-inside-avoid">
          <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-8">
            <div>
               <h1 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight">Corte Diario</h1>
               <p className="text-slate-500 mt-1 font-medium text-sm">Conciliación de Ingresos y Egresos</p>
            </div>
            <div className="text-right flex flex-col items-end gap-3">
               <div className="flex items-center gap-3">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Inicial</span>
                 <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-amber-600 text-xs print:hidden">$</span>
                    <input type="number" value={fondoCaja} onChange={(e) => handleInput(setFondoCaja, e.target.value)} 
                    disabled={isDayClosed}
                    className={`w-32 pl-5 py-2 text-right border border-amber-200 bg-white rounded text-sm font-bold text-amber-900 outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-slate-100 disabled:text-slate-500 ${printInputClass} print:pl-0 print:text-lg`} />
                 </div>
               </div>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            {/* Same breakdown logic as before, just relying on calculated vars */}
            <div className="grid grid-cols-12 gap-4 items-center py-4 bg-slate-50 border border-slate-200 rounded px-4 print:bg-slate-100">
              <div className="col-span-8 font-bold text-slate-900 text-base">1. INGRESOS FACTURADOS</div>
              <div className="col-span-4 text-right font-bold text-xl text-slate-900">${salesAnalysis.totalVentas.toFixed(2)}</div>
            </div>
            
            {/* ... Deductions, Expenses, Totals ... */}
             <div className="grid grid-cols-12 gap-4 items-center py-3 mt-6">
              <div className="col-span-8 font-bold text-slate-400 text-xs uppercase tracking-widest pl-2 flex items-center gap-2">
                 (-) Salidas de Efectivo
              </div>
              <div className="col-span-4 text-right font-bold text-red-600">
                 $ {totalEgresos.toFixed(2)}
              </div>
            </div>

            {/* AUDITORIA SALDOS */}
            <div className="mt-8 pt-8 border-t-2 border-slate-900">
               <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Auditoría de Saldos</h3>
                  <div className="h-px bg-slate-200 flex-1"></div>
               </div>

               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 print:bg-white print:border-slate-300">
                  <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6 text-slate-900 font-bold uppercase text-xs tracking-wider flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-600 print:hidden" />
                        Saldo Teórico (Debe Haber)
                      </div>
                      <div className="col-span-6 text-right font-mono text-xl font-bold text-slate-900 bg-white px-3 py-1 rounded border border-slate-200 shadow-sm print:border-none print:shadow-none print:px-0">
                        $ {totalAcumuladoEnCaja.toFixed(2)}
                      </div>
                  </div>
               </div>

               {/* REPORTE DE CONCILIACION */}
               <div className="flex flex-col md:flex-row gap-6 mb-6">
                 <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm print:shadow-none print:border-slate-300">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Conteo Físico Real</div>
                    <div className="text-3xl font-mono font-bold text-slate-800">$ {countedTotal.toFixed(2)}</div>
                 </div>
                 <div className={`flex-1 border rounded-xl p-5 shadow-sm transition-colors ${difference === 0 ? 'bg-slate-50 border-slate-200 print:bg-white' : difference > 0 ? 'bg-emerald-50 border-emerald-200 print:bg-white' : 'bg-red-50 border-red-200 print:bg-white'}`}>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Diferencia Efectivo</div>
                    <div className={`text-3xl font-mono font-bold ${difference === 0 ? 'text-slate-400' : difference > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                       {difference > 0 ? '+' : ''}{difference.toFixed(2)}
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
        
        {/* DESGLOSE VENTA */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border print:border-slate-300 print:break-inside-avoid">
             <h3 className="text-lg font-bold text-slate-800 mb-6 border-b-2 border-slate-100 pb-3 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400 print:hidden" /> Desglose de Venta
             </h3>
             {/* ... Table logic ... */}
             <div className="overflow-x-auto">
             <table className="w-full text-sm">
               <tbody className="divide-y divide-slate-50">
                  {breakdownBySection.targetSections.map((type) => {
                     return (
                       <React.Fragment key={type}>
                         {Object.values(PaymentMethod).map((method) => {
                           const amount = breakdownBySection.groupedData[type][method];
                           if (amount <= 0) return null;
                           return (
                             <tr key={`${type}-${method}`} className="hover:bg-blue-50/30 border-b border-slate-50 last:border-0 transition-colors">
                               <td className="px-4 py-3 text-slate-600 w-2/3 font-medium text-base">
                                 <span className="font-bold text-slate-800">{type}</span> <span className="text-slate-500">{method}</span>
                               </td>
                               <td className={`px-4 py-3 text-right font-mono w-1/3 text-base text-slate-900 font-bold bg-slate-50 rounded-r print:bg-transparent`}>
                                  $ {amount.toFixed(2)}
                               </td>
                             </tr>
                           )
                         })}
                       </React.Fragment>
                     )
                  })}
               </tbody>
             </table>
           </div>
        </div>

        {/* --- SIGNATURES SECTION (PRINT ONLY) --- */}
        <div className="hidden print:flex justify-between items-end pt-20 pb-8 mt-12 break-inside-avoid">
             <div className="text-center w-5/12">
                 <div className="border-b border-slate-800 mb-2"></div>
                 <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Firma Cajero</p>
                 <p className="text-xs text-slate-400 mt-1">{currentUser?.name}</p>
             </div>
             <div className="text-center w-5/12">
                 <div className="border-b border-slate-800 mb-2"></div>
                 <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Visto Bueno (Gerencia)</p>
             </div>
        </div>

        {/* --- ACTION BAR --- */}
        <div className="bg-slate-900 rounded-xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 sticky bottom-6 z-20 print:hidden">
            <div className="flex items-center gap-4">
               <button onClick={() => window.print()} className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-slate-300 rounded-lg font-bold text-sm tracking-wide">
                  <Printer className="w-4 h-4" /> IMPRIMIR
               </button>
            </div>
            
            <div className="flex items-center gap-4">
               {/* HIDE REMESA & CLOSE BUTTONS IF DAY IS ALREADY CLOSED */}
               {!isDayClosed ? (
                   <>
                       {!remittanceDone && (
                           <button 
                             disabled={!canRemit}
                             onClick={() => setShowRemitModal(true)}
                             className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm tracking-wide shadow-lg transition-all ${canRemit ? 'bg-emerald-600 text-white hover:bg-emerald-500 animate-pulse' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                           >
                              <CheckCircle className="w-4 h-4" /> REALIZAR REMESA
                           </button>
                       )}
                       {remittanceDone && (
                           <div className="flex items-center gap-2 px-4 py-2 bg-emerald-900/50 border border-emerald-500/50 rounded text-emerald-400 font-bold text-xs uppercase tracking-wider">
                              <CheckCircle className="w-4 h-4" /> Remesa Procesada
                           </div>
                       )}
                       <button onClick={handleCloseDayAction} className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-all font-bold text-sm tracking-wide shadow-lg shadow-red-900/50">
                          <Lock className="w-4 h-4" /> CERRAR DÍA
                       </button>
                   </>
               ) : (
                   <div className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                       <Lock className="w-4 h-4" /> Cierre Realizado
                   </div>
               )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default CashReconciliation;
