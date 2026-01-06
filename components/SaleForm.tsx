
import React, { useState, useEffect } from 'react';
import { SalesChannel, SalesType, PaymentMethod, Sale, Receptionist, User } from '../types';
import { Save, DollarSign, Tag, UserCheck, Hotel, AlignLeft, RefreshCw, XCircle } from 'lucide-react';

interface SaleFormProps {
  onAddSale: (sale: Sale) => void;
  onUpdateSale?: (sale: Sale) => void;
  initialData?: Sale | null;
  onCancelEdit?: () => void;
  currentUser: User | null;
  operationDate?: string; 
  // Dynamic Settings Props
  salesTypes: string[];
  paymentMethods: string[];
}

const SaleForm: React.FC<SaleFormProps> = ({ 
  onAddSale, 
  onUpdateSale, 
  initialData, 
  onCancelEdit, 
  currentUser, 
  operationDate,
  salesTypes,
  paymentMethods
}) => {
  
  const [amount, setAmount] = useState<string>('');
  const [commandNumber, setCommandNumber] = useState<string>('');
  const [channel, setChannel] = useState<SalesChannel>(SalesChannel.RESERVA_DIRECTA);
  
  // Initialize with first available option or default
  const [type, setType] = useState<string>(salesTypes[0] || SalesType.RESTAURANTE);
  const [paymentMethod, setPaymentMethod] = useState<string>(paymentMethods[0] || PaymentMethod.EFECTIVO);
  
  const [voucherNumber, setVoucherNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receptionist, setReceptionist] = useState<Receptionist>(currentUser?.receptionistName || 'Helen');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setCommandNumber(initialData.commandNumber);
      setChannel(initialData.channel);
      setType(initialData.type);
      setPaymentMethod(initialData.paymentMethod);
      setVoucherNumber(initialData.voucherNumber || '');
      setNotes(initialData.notes || '');
      setReceptionist(initialData.receptionist || 'Ninguno');
    } else {
      resetForm();
    }
  }, [initialData, currentUser]);

  const resetForm = () => {
    setAmount('');
    setCommandNumber('');
    setChannel(SalesChannel.RESERVA_DIRECTA);
    setType(salesTypes[0] || SalesType.RESTAURANTE);
    setPaymentMethod(paymentMethods[0] || PaymentMethod.EFECTIVO);
    setVoucherNumber('');
    setNotes('');
    setReceptionist(currentUser?.receptionistName || 'Helen');
    setError('');
  };

  const directServices = [
    SalesType.MASAJES,
    SalesType.TRANSPORTES,
    SalesType.CLASE_SURF,
    SalesType.BOUTIQUE,
    SalesType.DAYPASS,
    SalesType.TOURS,
    SalesType.RESTAURANTE 
  ];

  useEffect(() => {
    // Basic check: if type is standard direct service, force channel.
    // For custom types, default behavior applies.
    if (!initialData && directServices.includes(type as SalesType)) {
      setChannel(SalesChannel.RESERVA_DIRECTA);
    }
  }, [type, initialData]);

  const isCommissionable = type !== SalesType.RESTAURANTE && channel === SalesChannel.RESERVA_DIRECTA;

  useEffect(() => {
    if (!isCommissionable) {
       setReceptionist('Ninguno');
    } else if (isCommissionable && receptionist === 'Ninguno' && !initialData) {
       if (currentUser?.receptionistName) {
         setReceptionist(currentUser.receptionistName);
       }
    }
  }, [isCommissionable, currentUser, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!commandNumber.trim()) {
      setError('El número de comanda es obligatorio.');
      return;
    }
    const numericAmount = parseFloat(amount);
    if (!amount || numericAmount <= 0) {
      setError('El monto debe ser mayor a 0.');
      return;
    }
    
    // Check dynamic payment method string against known bank types for validation
    const needsVoucher = [
      PaymentMethod.BAC, 
      PaymentMethod.PROMERICA, 
      PaymentMethod.LINK_DE_PAGO, 
      PaymentMethod.TRANSFERENCIA
    ].includes(paymentMethod as PaymentMethod);

    if (needsVoucher && !voucherNumber.trim()) {
      setError('El número de voucher/referencia es obligatorio para este método de pago.');
      return;
    }

    // --- CÁLCULO DE COMISIONES ---
    let commissionAmount = 0;

    if (isCommissionable) {
        let commissionableBase = numericAmount;

        if (type === SalesType.HOTEL) {
          const taxDeduction = numericAmount * 0.18;
          commissionableBase -= taxDeduction;
        }

        const isCardPayment = [PaymentMethod.BAC, PaymentMethod.PROMERICA, PaymentMethod.LINK_DE_PAGO].includes(paymentMethod as PaymentMethod);
        if (isCardPayment) {
          const bankFee = numericAmount * 0.045;
          commissionableBase -= bankFee;
        }

        let commissionRate = 0;
        if (receptionist === 'Helen') commissionRate = 0.01; 
        if (receptionist === 'Diego') commissionRate = 0.02; 

        commissionAmount = commissionableBase > 0 ? commissionableBase * commissionRate : 0;
    }

    let finalDateISO = '';
    
    if (initialData) {
      finalDateISO = initialData.date; 
    } else {
       const now = new Date();
       const timePart = now.toTimeString().split(' ')[0];
       const datePart = operationDate || now.toISOString().split('T')[0];
       finalDateISO = `${datePart}T${timePart}`;
    }

    const saleData: Sale = {
      id: initialData ? initialData.id : crypto.randomUUID(),
      date: finalDateISO,
      amount: numericAmount,
      commandNumber,
      channel,
      type,
      paymentMethod,
      voucherNumber: needsVoucher ? voucherNumber : undefined,
      notes,
      receptionist: isCommissionable ? receptionist : 'Ninguno',
      commissionAmount: parseFloat(commissionAmount.toFixed(2))
    };

    if (initialData && onUpdateSale) {
        onUpdateSale(saleData);
    } else {
        onAddSale(saleData);
        resetForm();
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border overflow-hidden ${initialData ? 'border-amber-200 shadow-amber-100' : 'border-slate-200 shadow-slate-200/50'}`}>
      <div className={`px-10 py-6 border-b flex justify-between items-center ${initialData ? 'bg-amber-50 border-amber-100' : 'bg-slate-50/50 border-slate-100'}`}>
        <div>
           <h2 className={`text-xl font-bold flex items-center gap-2 uppercase tracking-wide ${initialData ? 'text-amber-800' : 'text-slate-800'}`}>
            <Hotel className={`w-5 h-5 ${initialData ? 'text-amber-600' : 'text-blue-600'}`} />
            {initialData ? 'Editando Transacción' : 'Registro de Transacción'}
          </h2>
        </div>
        <div className="text-right">
           <div className="text-sm text-slate-400 font-medium">Agente</div>
           <div className="text-slate-700 font-bold">{currentUser?.name || 'Invitado'}</div>
        </div>
      </div>

      {error && (
        <div className="mx-10 mt-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-10 space-y-10">
        <div>
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
             <div className="w-6 h-px bg-slate-300"></div> 
             Detalles del Servicio
             <div className="flex-1 h-px bg-slate-100"></div>
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Área / Servicio</label>
                <div className="relative">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none font-medium text-slate-900 shadow-sm hover:border-blue-300 transition-colors"
                  >
                    {salesTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                   <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <Tag className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">No. Comanda / Hab.</label>
                <div className="relative">
                  <input
                    type="text"
                    value={commandNumber}
                    onChange={(e) => setCommandNumber(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400 shadow-sm hover:border-blue-300"
                    placeholder="CMD-000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Monto Total (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 text-lg shadow-sm hover:border-blue-300"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
           </div>
        </div>

        <div>
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
             <div className="w-6 h-px bg-slate-300"></div> 
             Método de Pago
             <div className="flex-1 h-px bg-slate-100"></div>
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Canal de Origen</label>
                 
                 {type === SalesType.RESTAURANTE ? (
                   <input 
                     type="text" 
                     disabled 
                     value="N/A (No Aplica)"
                     className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-400 font-medium cursor-not-allowed italic"
                   />
                 ) : (
                   <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as SalesChannel)}
                      disabled={directServices.includes(type as SalesType)}
                      className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-slate-900 ${
                          directServices.includes(type as SalesType) 
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed' 
                          : 'bg-white'
                      }`}
                    >
                      {Object.values(SalesChannel).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                 )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Forma de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm hover:border-blue-300 transition-colors text-slate-900"
                >
                  {paymentMethods.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="transition-all duration-300">
                <label className={`block text-sm font-semibold mb-2 ${
                   paymentMethod !== PaymentMethod.EFECTIVO && paymentMethod !== PaymentMethod.OTROS 
                   ? 'text-blue-700' : 'text-slate-400'
                }`}>
                  Referencia / Voucher
                </label>
                <input
                  type="text"
                  value={voucherNumber}
                  onChange={(e) => setVoucherNumber(e.target.value)}
                  disabled={paymentMethod === PaymentMethod.EFECTIVO || paymentMethod === PaymentMethod.OTROS}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm ${
                     paymentMethod !== PaymentMethod.EFECTIVO && paymentMethod !== PaymentMethod.OTROS 
                     ? 'bg-white border-blue-300 text-blue-900 placeholder:text-blue-300 hover:border-blue-400' 
                     : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  placeholder={paymentMethod === PaymentMethod.EFECTIVO ? "N/A" : "0000-0000"}
                />
              </div>
           </div>
        </div>

        <div>
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
             <div className="w-6 h-px bg-slate-300"></div> 
             Personal y Notas
             <div className="flex-1 h-px bg-slate-100"></div>
           </h3>
           
           <div className={`grid grid-cols-1 ${isCommissionable ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-8`}>
               {isCommissionable && (
               <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                     <UserCheck className="w-4 h-4 text-purple-600" />
                     Recepcionista (Comisión)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                     <button type="button" onClick={() => setReceptionist('Helen')} className={`py-3 px-2 rounded-lg border text-sm font-bold transition-all ${receptionist === 'Helen' ? 'bg-purple-100 border-purple-500 text-purple-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Helen</button>
                     <button type="button" onClick={() => setReceptionist('Diego')} className={`py-3 px-2 rounded-lg border text-sm font-bold transition-all ${receptionist === 'Diego' ? 'bg-purple-100 border-purple-500 text-purple-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Diego</button>
                     <button type="button" onClick={() => setReceptionist('Ninguno')} className={`py-3 px-2 rounded-lg border text-sm font-medium transition-all ${receptionist === 'Ninguno' ? 'bg-slate-100 border-slate-400 text-slate-800' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>Ninguno</button>
                  </div>
               </div>
               )}

               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                     <AlignLeft className="w-4 h-4 text-blue-500" />
                     Notas Operativas
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all text-slate-900 shadow-sm"
                    rows={2}
                    placeholder="Detalles adicionales..."
                  ></textarea>
               </div>
           </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-4 border-t border-slate-100 mt-4">
          {initialData && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-6 py-4 bg-white text-slate-600 hover:bg-slate-50 font-bold rounded-lg border border-slate-200 transition-all flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              CANCELAR EDICIÓN
            </button>
          )}
          
          <button
            type="submit"
            className={`px-12 py-4 text-white font-bold rounded-lg shadow-xl transition-all flex items-center justify-center gap-3 transform active:scale-95 tracking-wide ${
              initialData 
              ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/10' 
              : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/10'
            }`}
          >
            {initialData ? <RefreshCw className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {initialData ? 'ACTUALIZAR TRANSACCIÓN' : 'GUARDAR TRANSACCIÓN'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SaleForm;
