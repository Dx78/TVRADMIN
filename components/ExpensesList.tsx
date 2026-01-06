
import React from 'react';
import { Expense, PaymentMethod } from '../types';
import { FileText, Calendar, Hash, Truck, DollarSign, CreditCard, Trash2, Plus, Search } from 'lucide-react';

interface ExpensesListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onOpenModal: () => void;
}

const ExpensesList: React.FC<ExpensesListProps> = ({ expenses, onDelete, onOpenModal }) => {
  
  const formatDate = (isoDate: string) => {
    if (!isoDate) return '-';
    // Fix timezone offset for display only if needed, or just standard slice
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  const getMonthName = (isoDate: string) => {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    // Ajuste por timezone para obtener el mes correcto visualmente
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); 
    return date.toLocaleDateString('es-MX', { month: 'long' }).toUpperCase();
  };

  const formatCurrency = (val: number) => {
    return val ? `$ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$ 0.00';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-6 h-6 text-orange-600" />
            Proveedores y Gastos
          </h2>
          <p className="text-slate-500 text-sm mt-1">Registro detallado de compras, CCF y recibos.</p>
        </div>
        <button
          onClick={onOpenModal}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" /> Registrar Compra
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-900 text-white uppercase tracking-wider font-bold">
                <th className="px-4 py-4 text-left">Mes</th>
                <th className="px-4 py-4 text-left">Fecha Doc.</th>
                <th className="px-4 py-4 text-left">Documento</th>
                <th className="px-4 py-4 text-left">Número</th>
                <th className="px-4 py-4 text-left w-1/5">Proveedor</th>
                <th className="px-4 py-4 text-left w-1/4">Descripción</th>
                <th className="px-4 py-4 text-right">Sub Total</th>
                <th className="px-4 py-4 text-right">IVA</th>
                <th className="px-4 py-4 text-right bg-slate-800">Total</th>
                <th className="px-4 py-4 text-left">Forma de Pago</th>
                <th className="px-4 py-4 text-center">ID</th>
                <th className="px-2 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-slate-400">
                    <Truck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    No hay registros de proveedores aún.
                  </td>
                </tr>
              ) : (
                expenses.slice().reverse().map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 font-bold text-slate-500">{getMonthName(expense.date)}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono">{formatDate(expense.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        expense.documentType === 'CCF' ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                        expense.documentType === 'RECIBO' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {expense.documentType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{expense.documentNumber || '-'}</td>
                    <td className="px-4 py-3 font-bold text-slate-800 uppercase text-xs">{expense.provider}</td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]" title={expense.description}>{expense.description}</td>
                    
                    {/* Financials */}
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(expense.subtotal)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500 text-xs">{expense.iva > 0 ? formatCurrency(expense.iva) : '-'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 bg-slate-50">{formatCurrency(expense.amount)}</td>
                    
                    <td className="px-4 py-3 text-slate-700 text-xs uppercase">{expense.paymentMethod}</td>
                    <td className="px-4 py-3 text-center">
                       <span className="text-[10px] font-mono text-slate-300 bg-slate-50 px-1 rounded">
                         {expense.id.slice(0, 6)}
                       </span>
                    </td>
                    <td className="px-2 py-3 text-right">
                       <button 
                         onClick={() => onDelete(expense.id)}
                         className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {expenses.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
                    <tr>
                        <td colSpan={6} className="px-4 py-3 text-right uppercase text-xs tracking-wider">Totales Generales</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                            {formatCurrency(expenses.reduce((acc, e) => acc + e.subtotal, 0))}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                            {formatCurrency(expenses.reduce((acc, e) => acc + e.iva, 0))}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-lg bg-slate-200">
                            {formatCurrency(expenses.reduce((acc, e) => acc + e.amount, 0))}
                        </td>
                        <td colSpan={3}></td>
                    </tr>
                </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpensesList;
