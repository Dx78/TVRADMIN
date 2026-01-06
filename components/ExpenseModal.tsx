
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Receipt, User, FileText, Building2, MapPin, Phone, Calendar, DollarSign, Calculator } from 'lucide-react';
import { Expense, ExpenseDocumentType, PaymentMethod } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  suppliers: string[]; // List for autocomplete
  // Optional: If passed, forces payment method (e.g. for Cash Reconciliation)
  defaultPaymentMethod?: PaymentMethod; 
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, expenses, onAddExpense, onDeleteExpense, suppliers, defaultPaymentMethod }) => {
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentType, setDocumentType] = useState<ExpenseDocumentType>('CCF');
  const [documentNumber, setDocumentNumber] = useState('');
  
  const [provider, setProvider] = useState('');
  const [description, setDescription] = useState('');
  
  const [subtotal, setSubtotal] = useState('');
  const [iva, setIva] = useState('0.00');
  const [total, setTotal] = useState('0.00');
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaultPaymentMethod || PaymentMethod.TRANSFERENCIA);
  
  // Specific Fields
  const [taxPayerName, setTaxPayerName] = useState(''); 
  const [taxDui, setTaxDui] = useState('');
  const [taxPhone, setTaxPhone] = useState('');
  const [taxAddress, setTaxAddress] = useState('');

  const [error, setError] = useState('');

  // Auto-Calculation Effect
  useEffect(() => {
    const numSub = parseFloat(subtotal) || 0;
    
    let calcIva = 0;
    // Si es CCF, calcular 13% IVA. Si es Recibo, usualmente es exento o incluido, asumimos 0 para este flujo o manual.
    // La imagen muestra IVA desglosado.
    if (documentType === 'CCF' || documentType === 'CREDITO_FISCAL') {
        calcIva = numSub * 0.13;
    } else {
        calcIva = 0;
    }

    const calcTotal = numSub + calcIva;

    setIva(calcIva.toFixed(2));
    setTotal(calcTotal.toFixed(2));

  }, [subtotal, documentType]);

  // Update payment method if default changes
  useEffect(() => {
    if (defaultPaymentMethod) setPaymentMethod(defaultPaymentMethod);
  }, [defaultPaymentMethod]);


  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!provider || !description || !subtotal || !documentNumber) {
      setError('Complete los campos obligatorios: Proveedor, Descripción, Documento # y Subtotal.');
      return;
    }

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      date,
      documentType,
      documentNumber,
      provider: provider.toUpperCase(),
      description: description.toUpperCase(),
      subtotal: parseFloat(subtotal),
      iva: parseFloat(iva),
      amount: parseFloat(total),
      paymentMethod,
      
      taxPayerName: (documentType === 'CCF' || documentType === 'CREDITO_FISCAL') ? taxPayerName : undefined,
      taxDui: documentType === 'CREDITO_FISCAL' ? taxDui : undefined,
      taxPhone: documentType === 'CREDITO_FISCAL' ? taxPhone : undefined,
      taxAddress: documentType === 'CREDITO_FISCAL' ? taxAddress : undefined,
    };

    onAddExpense(newExpense);
    
    // Reset Form (Keep Date and Method for convenience)
    setDocumentNumber('');
    setProvider('');
    setDescription('');
    setSubtotal('');
    // Keep Document Type logic
  };

  const inputClass = "w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-900 placeholder-gray-400 font-medium";
  const labelClass = "block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-orange-400" />
            Registro de Gasto / Proveedor
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {error && (
                <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 font-bold flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* --- LEFT COLUMN: DETAILS --- */}
                <div className="md:col-span-8 space-y-6">
                    {/* Row 1: Date & Type */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Fecha Documento</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={`${inputClass} pl-9`} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Tipo Documento</label>
                            <select value={documentType} onChange={e => setDocumentType(e.target.value as ExpenseDocumentType)} className={inputClass}>
                                <option value="CCF">CCF</option>
                                <option value="RECIBO">RECIBO</option>
                                <option value="FACTURA">FACTURA</option>
                                <option value="CREDITO_FISCAL">CRÉDITO FISCAL</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Número Doc.</label>
                            <input type="text" value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} className={inputClass} placeholder="00000" />
                        </div>
                    </div>

                    {/* Row 2: Provider (Autocomplete) */}
                    <div>
                        <label className={labelClass}>Proveedor / Acreedor</label>
                        <div className="relative">
                             <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input 
                                type="text" 
                                list="provider-list"
                                value={provider} 
                                onChange={e => setProvider(e.target.value)} 
                                className={`${inputClass} pl-9`} 
                                placeholder="Ej: SUPER FRESCO, ANDA, DEL SUR..." 
                                autoComplete="off"
                             />
                             <datalist id="provider-list">
                                {suppliers.map((sup, index) => (
                                    <option key={index} value={sup} />
                                ))}
                             </datalist>
                        </div>
                    </div>

                    {/* Row 3: Description */}
                    <div>
                        <label className={labelClass}>Descripción del Gasto</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} className={inputClass} placeholder="Detalle de los artículos o servicios..." />
                    </div>

                    {/* Row 4: Extra Tax Info (Conditional) */}
                    {(documentType === 'CCF' || documentType === 'CREDITO_FISCAL') && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                <FileText className="w-3 h-3" /> Datos Fiscales
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs text-slate-500 font-medium">Nombre / Razón Social</label>
                                    <input type="text" value={taxPayerName} onChange={e => setTaxPayerName(e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                                </div>
                                {documentType === 'CREDITO_FISCAL' && (
                                    <>
                                        <div>
                                            <label className="text-xs text-slate-500 font-medium">DUI / NIT</label>
                                            <input type="text" value={taxDui} onChange={e => setTaxDui(e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 font-medium">Teléfono</label>
                                            <input type="text" value={taxPhone} onChange={e => setTaxPhone(e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- RIGHT COLUMN: FINANCIALS --- */}
                <div className="md:col-span-4 bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-200 pb-2 flex items-center gap-2">
                        <Calculator className="w-4 h-4" /> Importes
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Sub Total (Sin IVA)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input type="number" step="0.01" value={subtotal} onChange={e => setSubtotal(e.target.value)} 
                                    className={`${inputClass} pl-8 font-bold text-lg`} placeholder="0.00" />
                            </div>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-slate-200">
                             <span className="text-sm text-slate-500 font-medium">IVA (13%)</span>
                             <span className="font-mono font-bold text-slate-700">${iva}</span>
                        </div>

                        <div className="flex justify-between items-center py-2">
                             <span className="text-base text-slate-900 font-bold">TOTAL</span>
                             <span className="font-mono font-bold text-xl text-slate-900">${total}</span>
                        </div>
                        
                        <div className="pt-4 mt-2 border-t border-slate-200">
                            <label className={labelClass}>Forma de Pago</label>
                            {defaultPaymentMethod ? (
                                <div className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg font-bold text-sm">
                                    {defaultPaymentMethod} (Bloqueado por Corte de Caja)
                                </div>
                            ) : (
                                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className={inputClass}>
                                    {Object.values(PaymentMethod).map(pm => (
                                        <option key={pm} value={pm}>{pm}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <button type="submit" className="w-full mt-6 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-lg shadow-orange-900/20 transition-all flex items-center justify-center gap-2 transform active:scale-95">
                            <Plus className="w-5 h-5" /> AGREGAR GASTO
                        </button>
                    </div>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;
