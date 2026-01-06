
import React, { useState, useMemo } from 'react';
import { Sale, PaymentMethod } from '../types';
import { CreditCard, Banknote, Bitcoin, Trash2, Smartphone, ArrowRightLeft, HelpCircle, FileText, User, Pencil, Search, Filter } from 'lucide-react';

interface SalesListProps {
  sales: Sale[];
  onDelete: (id: string) => void;
  onEdit: (sale: Sale) => void;
  salesTypes: string[]; // Dynamic types
}

const SalesList: React.FC<SalesListProps> = ({ sales, onDelete, onEdit, salesTypes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case PaymentMethod.BAC: 
      case PaymentMethod.PROMERICA:
        return <CreditCard className="w-4 h-4 text-sky-600" />;
      case PaymentMethod.BITCOIN: 
        return <Bitcoin className="w-4 h-4 text-orange-500" />;
      case PaymentMethod.LINK_DE_PAGO:
        return <Smartphone className="w-4 h-4 text-purple-500" />;
      case PaymentMethod.TRANSFERENCIA:
        return <ArrowRightLeft className="w-4 h-4 text-indigo-500" />;
      case PaymentMethod.OTROS:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
      default: 
        return <Banknote className="w-4 h-4 text-emerald-600" />;
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  // Filter Logic
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Search Logic: Matches Voucher, Amount, or Command Number
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        (sale.voucherNumber && sale.voucherNumber.toLowerCase().includes(term)) ||
        sale.amount.toString().includes(term) ||
        sale.commandNumber.toLowerCase().includes(term);

      // Filter Type Logic
      const matchesType = filterType === 'ALL' || sale.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [sales, searchTerm, filterType]);

  if (sales.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center h-[50vh]">
        <div className="p-4 bg-slate-50 rounded-full mb-4">
           <FileText className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">Sin Registros</h3>
        <p className="text-slate-500 mt-1">No hay ventas registradas en el sistema aún.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header with Search and Filters */}
      <div className="px-8 py-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h3 className="text-lg font-bold text-slate-800">Historial de Transacciones</h3>
           <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{filteredSales.length} registros encontrados</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           {/* Search Input */}
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar voucher, monto..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64 transition-all hover:border-blue-300"
              />
           </div>

           {/* Filter Dropdown */}
           <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-8 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:border-blue-300 transition-all text-slate-700"
              >
                <option value="ALL">Todas las Áreas</option>
                {salesTypes.map(type => (
                   <option key={type} value={type}>{type}</option>
                ))}
              </select>
           </div>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Comanda</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Servicio</th>
              <th className="px-4 py-4">Pago</th>
              <th className="px-4 py-4">Recepción</th>
              <th className="px-6 py-4 text-right">Comisión</th>
              <th className="px-8 py-4 text-right">Monto Total</th>
              <th className="px-4 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSales.slice().reverse().map((sale) => (
              <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4 font-mono font-medium text-slate-700">{sale.commandNumber}</td>
                <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(sale.date)}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {sale.type}
                  </span>
                  {sale.channel !== 'Reserva Directa' && (
                     <div className="text-[10px] text-slate-400 mt-1">{sale.channel}</div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-slate-100 group-hover:bg-white transition-colors">
                      {getPaymentIcon(sale.paymentMethod)}
                    </div>
                    <div>
                      <span className="block text-slate-700 font-medium text-xs">{sale.paymentMethod}</span>
                      {sale.voucherNumber && (
                        <span className="text-[10px] text-slate-400 font-mono tracking-wide block">#{sale.voucherNumber}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                   {sale.receptionist && sale.receptionist !== 'Ninguno' ? (
                     <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-purple-400" />
                        <span className="text-slate-700 font-medium text-xs">{sale.receptionist}</span>
                     </div>
                   ) : (
                     <span className="text-slate-300">-</span>
                   )}
                </td>
                <td className="px-6 py-4 text-right">
                   {sale.commissionAmount && sale.commissionAmount > 0 ? (
                      <span className="text-emerald-600 font-mono text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded">
                         ${sale.commissionAmount.toFixed(2)}
                      </span>
                   ) : (
                      <span className="text-slate-300 text-xs">-</span>
                   )}
                </td>
                <td className="px-8 py-4 text-right font-bold text-slate-800 text-base">
                  ${sale.amount.toFixed(2)}
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(sale)}
                      className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                      title="Editar registro"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(sale.id)}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
                <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                        No se encontraron resultados para la búsqueda actual.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesList;
