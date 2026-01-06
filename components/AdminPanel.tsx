
import React, { useState } from 'react';
import { User, AppSettings } from '../types';
import { Settings, Users, Download, Trash2, Plus, Eye, EyeOff, Save, ShieldAlert, FileText } from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  users: User[];
  onAddUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  onDownloadReport: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  currentUser, 
  users, 
  onAddUser, 
  onDeleteUser, 
  settings, 
  onUpdateSettings,
  onDownloadReport
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'reports'>('general');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
  // New User Form State
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'receptionist'>('receptionist');

  // New Setting Form State
  const [newItemName, setNewItemName] = useState('');
  const [settingType, setSettingType] = useState<'salesTypes' | 'paymentMethods'>('salesTypes');

  // --- HANDLERS ---

  const handleCreateUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUserName || !newUserPin) return;
      
      const newUser: User = {
          id: crypto.randomUUID(),
          name: newUserName,
          pin: newUserPin,
          role: newUserRole,
          receptionistName: newUserRole === 'receptionist' ? (newUserName as any) : undefined
      };
      
      onAddUser(newUser);
      setNewUserOpen(false);
      setNewUserName('');
      setNewUserPin('');
  };

  const togglePassword = (id: string) => {
      setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddItem = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newItemName) return;

      const updatedList = [...settings[settingType], newItemName];
      onUpdateSettings({
          ...settings,
          [settingType]: updatedList
      });
      setNewItemName('');
  };

  const handleDeleteItem = (type: 'salesTypes' | 'paymentMethods', item: string) => {
      if(window.confirm(`¿Eliminar "${item}" de la lista?`)) {
          const updatedList = settings[type].filter(i => i !== item);
          onUpdateSettings({
              ...settings,
              [type]: updatedList
          });
      }
  };

  const isDiegoAdmin = currentUser.isAdminDiego === true;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-6 h-6 text-slate-600" />
                Panel de Administración
            </h2>
            <p className="text-slate-500 text-sm mt-1">Gestión avanzada del sistema.</p>
            
            <div className="flex gap-2 mt-6 border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Configuración General
                </button>
                {isDiegoAdmin && (
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'users' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users className="w-4 h-4" /> Usuarios
                    </button>
                )}
                <button 
                    onClick={() => setActiveTab('reports')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'reports' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <FileText className="w-4 h-4" /> Reportería
                </button>
            </div>
        </div>

        {/* --- TAB: GENERAL SETTINGS --- */}
        {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CATEGORIES */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                        Categorías / Áreas
                        <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded">Ventas</span>
                    </h3>
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            placeholder="Nueva categoría..." 
                            className="flex-1 px-3 py-2 border rounded text-sm outline-none focus:border-blue-500"
                            value={settingType === 'salesTypes' ? newItemName : ''}
                            onChange={(e) => {
                                setSettingType('salesTypes');
                                setNewItemName(e.target.value);
                            }}
                        />
                        <button 
                             onClick={handleAddItem}
                             disabled={settingType !== 'salesTypes' || !newItemName}
                             className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {settings.salesTypes.map(item => (
                            <li key={item} className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm text-slate-700 border border-slate-100">
                                {item}
                                <button onClick={() => handleDeleteItem('salesTypes', item)} className="text-slate-400 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* PAYMENT METHODS */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                        Métodos de Pago
                        <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded">Finanzas</span>
                    </h3>
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            placeholder="Nuevo método..." 
                            className="flex-1 px-3 py-2 border rounded text-sm outline-none focus:border-blue-500"
                            value={settingType === 'paymentMethods' ? newItemName : ''}
                            onChange={(e) => {
                                setSettingType('paymentMethods');
                                setNewItemName(e.target.value);
                            }}
                        />
                        <button 
                             onClick={handleAddItem}
                             disabled={settingType !== 'paymentMethods' || !newItemName}
                             className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {settings.paymentMethods.map(item => (
                            <li key={item} className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm text-slate-700 border border-slate-100">
                                {item}
                                <button onClick={() => handleDeleteItem('paymentMethods', item)} className="text-slate-400 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        )}

        {/* --- TAB: REPORTS --- */}
        {activeTab === 'reports' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <FileText className="w-8 h-8 text-green-600" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800">Descarga de Datos</h3>
                 <p className="text-slate-500 mb-6">Obtenga un archivo CSV con todas las ventas del mes actual para análisis en Excel.</p>
                 
                 <button 
                    onClick={onDownloadReport}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 mx-auto transition-all transform active:scale-95"
                 >
                     <Download className="w-5 h-5" /> DESCARGAR CSV MES ACTUAL
                 </button>
            </div>
        )}

        {/* --- TAB: USERS (RESTRICTED) --- */}
        {activeTab === 'users' && isDiegoAdmin && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Gestión de Usuarios</h3>
                        <p className="text-xs text-slate-500">Acceso restringido a Super Admin</p>
                    </div>
                    <button 
                        onClick={() => setNewUserOpen(!newUserOpen)}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Usuario
                    </button>
                </div>

                {newUserOpen && (
                    <form onSubmit={handleCreateUser} className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex flex-wrap gap-4 items-end animate-fade-in">
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">Nombre</label>
                             <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="px-3 py-2 border rounded text-sm w-40" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">PIN (4 dígitos)</label>
                             <input type="text" maxLength={4} value={newUserPin} onChange={e => setNewUserPin(e.target.value)} className="px-3 py-2 border rounded text-sm w-24 font-mono" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">Rol</label>
                             <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as any)} className="px-3 py-2 border rounded text-sm">
                                 <option value="receptionist">Recepción</option>
                                 <option value="admin">Administrador</option>
                             </select>
                         </div>
                         <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-1">
                             <Save className="w-4 h-4" /> Guardar
                         </button>
                    </form>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3">Rol</th>
                                <th className="px-4 py-3">PIN</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-700">{u.name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {u.role}
                                        </span>
                                        {u.isAdminDiego && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200">SUPER</span>}
                                    </td>
                                    <td className="px-4 py-3 font-mono">
                                        <div className="flex items-center gap-2">
                                            {showPasswords[u.id] ? (
                                                <span className="text-slate-800 font-bold">{u.pin}</span>
                                            ) : (
                                                <span className="text-slate-400">••••</span>
                                            )}
                                            <button onClick={() => togglePassword(u.id)} className="text-slate-400 hover:text-blue-500">
                                                {showPasswords[u.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {!u.isAdminDiego && (
                                            <button onClick={() => onDeleteUser(u.id)} className="text-slate-400 hover:text-red-500 p-1">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        
        {activeTab === 'users' && !isDiegoAdmin && (
             <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                 <ShieldAlert className="w-12 h-12 text-red-500 mb-2" />
                 <h3 className="text-red-800 font-bold text-lg">Acceso Denegado</h3>
                 <p className="text-red-600 text-sm">Esta sección es exclusiva para Diego (Super Admin).</p>
             </div>
        )}
    </div>
  );
};

export default AdminPanel;
