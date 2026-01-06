
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, PlusCircle, List, Menu, X, Calculator, Receipt, ChevronRight, Hotel, LogOut, TrendingUp, Truck, UserCircle, Calendar, Lock, Unlock, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import SaleForm from './components/SaleForm';
import SalesList from './components/SalesList';
import Dashboard from './components/Dashboard';
import CashReconciliation from './components/CashReconciliation';
import ExpenseModal from './components/ExpenseModal';
import SalesSummaryReport from './components/SalesSummaryReport';
import ExpensesList from './components/ExpensesList';
import LoginScreen from './components/LoginScreen';
import AdminPanel from './components/AdminPanel';
import { Sale, Expense, PaymentMethod, User, DayState, AppSettings, SalesType } from './types';
import * as DataService from './services/dataService';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // --- GLOBAL DATE STATE ---
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  });

  // --- DATA STATE (From "Firebase") ---
  const [users, setUsers] = useState<User[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [daysState, setDaysState] = useState<Record<string, DayState>>({});
  const [appSettings, setAppSettings] = useState<AppSettings>({
    salesTypes: Object.values(SalesType),
    paymentMethods: Object.values(PaymentMethod)
  });

  // --- UI STATES ---
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<string[]>(['SUPER FRESCO', 'LA CONSTANCIA', 'ANDA', 'DEL SUR']);
  const [expenseModalDefaultMethod, setExpenseModalDefaultMethod] = useState<PaymentMethod | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'form' | 'list' | 'cash' | 'summary' | 'suppliers' | 'admin'>('form');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- LOAD DATA ON MOUNT ---
  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            const [u, s, e, d, set] = await Promise.all([
                DataService.getUsers(),
                DataService.getSales(),
                DataService.getExpenses(),
                DataService.getDailyStates(),
                DataService.getSettings()
            ]);
            setUsers(u);
            setSales(s);
            setExpenses(e);
            setDaysState(d);
            setAppSettings(set);
            
            // Extract unique suppliers from expenses
            const uniqueSuppliers = Array.from(new Set((e as Expense[]).map(ex => ex.provider))).sort();
            if(uniqueSuppliers.length > 0) setSuppliers(uniqueSuppliers);
            
        } catch (err) {
            console.error("Error loading data", err);
            alert("Error conectando con la base de datos.");
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  // --- COMPUTED DATA ---
  const currentDayState = useMemo(() => {
    return daysState[currentDate] || { isOpen: true, initialFund: '200.00' };
  }, [daysState, currentDate]);

  const dailySales = useMemo(() => sales.filter(s => s.date.startsWith(currentDate)), [sales, currentDate]);
  const dailyExpenses = useMemo(() => expenses.filter(e => e.date === currentDate), [expenses, currentDate]);

  // --- HANDLERS ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveTab('form');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMobileMenuOpen(false);
    setEditingSale(null);
  };

  // --- SALES HANDLERS (Async) ---
  const handleAddSale = async (sale: Sale) => {
    if (!currentDayState.isOpen) return alert("Día Cerrado.");
    const saved = await DataService.saveSale(sale);
    setSales(prev => [...prev, saved]);
    if (currentUser?.role === 'admin') setActiveTab('list');
    else alert("Venta registrada.");
  };

  const handleUpdateSale = async (updatedSale: Sale) => {
    if (!currentDayState.isOpen) return alert("Día Cerrado.");
    const saved = await DataService.saveSale(updatedSale);
    setSales(prev => prev.map(s => s.id === saved.id ? saved : s));
    setEditingSale(null);
    alert("Venta actualizada.");
    setActiveTab('list');
  };

  const handleDeleteSale = async (id: string) => {
    if (!currentDayState.isOpen) return alert("Día Cerrado.");
    if (window.confirm('¿Eliminar venta?')) {
        await DataService.deleteSale(id);
        setSales(prev => prev.filter(s => s.id !== id));
    }
  };

  // --- EXPENSE HANDLERS (Async) ---
  const handleAddExpense = async (expense: Expense) => {
    if (!currentDayState.isOpen) return alert("Día Cerrado.");
    const saved = await DataService.saveExpense(expense);
    setExpenses(prev => [...prev, saved]);
    
    if (!suppliers.includes(saved.provider)) {
        setSuppliers(prev => [...prev, saved.provider].sort());
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!currentDayState.isOpen) return alert("Día Cerrado.");
    await DataService.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // --- DAILY STATE HANDLERS ---
  const handleCloseDay = async (nextFondo: string) => {
    const closedState: DayState = {
        ...currentDayState,
        isOpen: false,
        finalFund: nextFondo,
        closedAt: new Date().toISOString(),
        closedBy: currentUser?.name
    };
    
    await DataService.saveDayState(currentDate, closedState);
    
    // Init next day
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    const nextDate = d.toISOString().split('T')[0];
    
    // Check if next day exists, if not create
    if(!daysState[nextDate]) {
        await DataService.saveDayState(nextDate, { isOpen: true, initialFund: nextFondo });
    }

    setDaysState(prev => ({
        ...prev,
        [currentDate]: closedState,
        [nextDate]: prev[nextDate] ? prev[nextDate] : { isOpen: true, initialFund: nextFondo }
    }));
    
    alert(`DÍA ${currentDate} CERRADO.`);
    setActiveTab('dashboard');
  };

  const handleReopenDay = async () => {
      if (currentUser?.role !== 'admin') return alert("Solo Admin.");
      if (window.confirm(`¿Reabrir ${currentDate}?`)) {
          const newState = { ...currentDayState, isOpen: true };
          await DataService.saveDayState(currentDate, newState);
          setDaysState(prev => ({ ...prev, [currentDate]: newState }));
      }
  };

  // --- ADMIN HANDLERS ---
  const handleAddUser = async (u: User) => {
      const saved = await DataService.saveUser(u);
      setUsers(prev => [...prev, saved]);
  };

  const handleDeleteUser = async (id: string) => {
      if(window.confirm("¿Eliminar usuario?")) {
          await DataService.deleteUser(id);
          setUsers(prev => prev.filter(u => u.id !== id));
      }
  };

  const handleUpdateSettings = async (s: AppSettings) => {
      const saved = await DataService.updateSettings(s);
      setAppSettings(saved);
  };

  const handleDownloadReport = () => {
      // Generate CSV for CURRENT MONTH sales
      const now = new Date();
      const currentMonthSales = sales.filter(s => {
          const d = new Date(s.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      if (currentMonthSales.length === 0) return alert("No hay datos este mes.");

      const csvContent = "data:text/csv;charset=utf-8," 
        + "Fecha,Comanda,Tipo,Monto,Metodo,Canal\n"
        + currentMonthSales.map(s => `${s.date},${s.commandNumber},${s.type},${s.amount},${s.paymentMethod},${s.channel}`).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ventas_${now.toISOString().slice(0,7)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- UI EVENT HANDLERS ---
  const handleCancelEdit = () => {
    setEditingSale(null);
  };

  const handleEditClick = (sale: Sale) => {
    setEditingSale(sale);
    setActiveTab('form');
  };

  const openExpenseModal = (method?: PaymentMethod) => {
    setExpenseModalDefaultMethod(method);
    setIsExpenseModalOpen(true);
  };


  // --- NAVIGATION COMPONENT ---
  const NavButton: React.FC<{ tab: typeof activeTab; label: string; icon: React.ReactNode }> = ({ tab, label, icon }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setMobileMenuOpen(false);
        if (tab !== 'form') setEditingSale(null);
      }}
      className={`group flex items-center justify-between px-4 py-3.5 rounded-r-full mr-4 w-full transition-all duration-200 border-l-4 ${
        activeTab === tab
          ? 'bg-slate-800 text-white border-blue-500 shadow-md'
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium tracking-wide text-sm">{label}</span>
      </div>
      {activeTab === tab && <ChevronRight className="w-4 h-4 opacity-75" />}
    </button>
  );

  // --- LOADING SCREEN ---
  if (loading) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-white font-medium animate-pulse">Conectando a Base de Datos...</p>
          </div>
      );
  }

  // --- LOGIN SCREEN ---
  if (!currentUser) return <LoginScreen users={users} onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-inter">
      <ExpenseModal 
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expenses={expenses}
        suppliers={suppliers}
        onAddExpense={handleAddExpense}
        onDeleteExpense={handleDeleteExpense}
        defaultPaymentMethod={expenseModalDefaultMethod}
      />

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
           <Hotel className="w-6 h-6 text-slate-800" />
           <span className="font-bold text-slate-800 text-lg tracking-tight">THE VIEWS</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-20 w-72 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block shadow-2xl print:hidden
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-8 pb-8">
             <div className="flex items-center gap-3 mb-1">
               <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/50">
                 <Hotel className="w-6 h-6 text-white" />
               </div>
               <div>
                 <h1 className="text-xl font-bold text-white tracking-widest leading-none">THE VIEWS</h1>
                 <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-1">Resort & Hotel</p>
               </div>
             </div>
          </div>

          <nav className="space-y-1 flex-1 pr-0">
            <p className="px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 mt-2">Operaciones</p>
            <NavButton tab="dashboard" label="Panel General" icon={<LayoutDashboard className="w-4 h-4" />} />
            <NavButton tab="form" label={editingSale ? "Editando..." : "Registrar Venta"} icon={<PlusCircle className={`w-4 h-4 ${editingSale ? 'text-amber-400' : ''}`} />} />
            
            <p className="px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-8 mb-3">Finanzas & Reportes</p>
            {currentUser.role === 'admin' && <NavButton tab="list" label="Historial de Ventas" icon={<List className="w-4 h-4" />} />}
            {currentUser.role === 'admin' && <NavButton tab="suppliers" label="Proveedores" icon={<Truck className="w-4 h-4" />} />}
            {currentUser.role === 'admin' && <NavButton tab="summary" label="Resumen de Ventas" icon={<TrendingUp className="w-4 h-4" />} />}
            <NavButton tab="cash" label="Corte de Caja" icon={<Calculator className="w-4 h-4" />} />
            
            {currentUser.role === 'admin' && (
                <>
                    <p className="px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-8 mb-3">Sistema</p>
                    <NavButton tab="admin" label="Administración" icon={<SettingsIcon className="w-4 h-4" />} />
                </>
            )}
          </nav>
          
          <div className="p-6 border-t border-slate-800 bg-slate-900">
             <div className="flex items-center gap-3">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md ${currentUser.role === 'admin' ? 'bg-gradient-to-tr from-purple-500 to-pink-500' : 'bg-gradient-to-tr from-blue-500 to-cyan-400'}`}>{currentUser.name.charAt(0)}</div>
               <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                 <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{currentUser.role === 'admin' ? 'Administrador' : 'Recepción'}</p>
               </div>
               <button onClick={handleLogout} title="Cerrar Sesión"><LogOut className="w-4 h-4 text-slate-500 cursor-pointer hover:text-red-400 transition-colors" /></button>
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50 h-screen scroll-smooth print:overflow-visible print:h-auto print:bg-white">
        <div className="max-w-[1920px] mx-auto p-6 md:p-10 lg:p-12 print:p-0 print:max-w-none">
          {/* Header Bar */}
          <header className="mb-8 hidden md:flex items-center justify-between border-b border-slate-200 pb-6 print:hidden">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                    {activeTab === 'dashboard' && 'Resumen Ejecutivo'}
                    {activeTab === 'form' && (editingSale ? 'Editar Transacción' : 'Nueva Transacción')}
                    {activeTab === 'list' && 'Historial de Operaciones'}
                    {activeTab === 'suppliers' && 'Control de Gastos'}
                    {activeTab === 'cash' && 'Conciliación Diaria'}
                    {activeTab === 'summary' && 'Reporte General'}
                    {activeTab === 'admin' && 'Panel de Administración'}
                </h2>
                {/* STATUS BADGE */}
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${currentDayState.isOpen ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {currentDayState.isOpen ? <span className="flex items-center gap-1"><Unlock className="w-3 h-3" /> Día Abierto</span> : <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Día Cerrado</span>}
                </div>
              </div>
              <p className="text-slate-500 mt-1 font-medium text-sm">
                Mostrando información exclusivamente para la fecha seleccionada.
              </p>
            </div>
            
            <div className="text-right">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Fecha de Operación</span>
               <div className="relative group">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors pointer-events-none" />
                  <input 
                    type="date"
                    value={currentDate}
                    onChange={(e) => {
                        setCurrentDate(e.target.value);
                        setEditingSale(null); // Clear editing if changing date
                    }}
                    className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-lg font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:border-blue-300 transition-all font-mono"
                  />
               </div>
            </div>
          </header>

          <div className="animate-fade-in-up print:animate-none">
            {activeTab === 'dashboard' && <Dashboard sales={dailySales} />}
            
            {activeTab === 'form' && (
              currentDayState.isOpen ? (
                <SaleForm 
                    onAddSale={handleAddSale} 
                    onUpdateSale={handleUpdateSale}
                    currentUser={currentUser} 
                    initialData={editingSale}
                    onCancelEdit={handleCancelEdit}
                    operationDate={currentDate} 
                    // Pass dynamic settings
                    salesTypes={appSettings.salesTypes}
                    paymentMethods={appSettings.paymentMethods}
                />
              ) : (
                  <div className="flex flex-col items-center justify-center h-[50vh] bg-white rounded-xl border border-red-200 border-dashed">
                      <Lock className="w-12 h-12 text-red-300 mb-4" />
                      <h3 className="text-xl font-bold text-slate-700">Día Cerrado</h3>
                      <p className="text-slate-500 mt-2">No se pueden registrar nuevas ventas en una fecha cerrada.</p>
                      <button onClick={() => setActiveTab('cash')} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm">Ir a Gestión de Cierre</button>
                  </div>
              )
            )}
            
            {activeTab === 'list' && currentUser.role === 'admin' && (
              <SalesList 
                sales={dailySales} 
                onDelete={handleDeleteSale} 
                onEdit={handleEditClick}
                salesTypes={appSettings.salesTypes}
              />
            )}
            
            {activeTab === 'suppliers' && currentUser.role === 'admin' && (
              <ExpensesList expenses={dailyExpenses} onDelete={handleDeleteExpense} onOpenModal={() => openExpenseModal()} />
            )}
            
            {activeTab === 'summary' && currentUser.role === 'admin' && <SalesSummaryReport sales={sales} />}
            
            {activeTab === 'cash' && (
              <CashReconciliation 
                sales={dailySales} 
                expenses={dailyExpenses} 
                onOpenExpenseModal={() => openExpenseModal(PaymentMethod.EFECTIVO)}
                initialFondo={currentDayState.initialFund}
                onCloseDay={handleCloseDay}
                selectedDate={currentDate}
                isDayClosed={!currentDayState.isOpen}
                onReopenDay={handleReopenDay}
                currentUser={currentUser}
                salesTypes={appSettings.salesTypes}
              />
            )}

            {/* NEW: Admin Panel */}
            {activeTab === 'admin' && currentUser.role === 'admin' && (
                <AdminPanel 
                    currentUser={currentUser}
                    users={users}
                    onAddUser={handleAddUser}
                    onDeleteUser={handleDeleteUser}
                    settings={appSettings}
                    onUpdateSettings={handleUpdateSettings}
                    onDownloadReport={handleDownloadReport}
                />
            )}
          </div>
        </div>
      </main>

      {mobileMenuOpen && <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-10 md:hidden print:hidden" onClick={() => setMobileMenuOpen(false)}></div>}
    </div>
  );
};

export default App;
