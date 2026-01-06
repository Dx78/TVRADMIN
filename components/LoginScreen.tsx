
import React, { useState } from 'react';
import { Hotel, Lock, ChevronRight, Delete } from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleLoginAttempt = () => {
    const user = users.find(u => u.pin === pin);
    if (user) {
      onLogin(user);
    } else {
      setError('PIN Incorrecto');
      setPin('');
    }
  };

  // Auto-submit when pin reaches 4 digits
  React.useEffect(() => {
    if (pin.length === 4) {
      handleLoginAttempt();
    }
  }, [pin]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
           <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-900/20 mb-4">
              <Hotel className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-xl font-bold text-slate-800 tracking-wider">THE VIEWS</h1>
           <p className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.2em] mt-1">Resort & Hotel Management</p>
        </div>

        {/* PIN Display */}
        <div className="p-8 pb-4">
          <div className="mb-6 text-center">
             <h2 className="text-slate-500 text-sm font-medium mb-4">Ingrese su PIN de acceso</h2>
             <div className="flex justify-center gap-4">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    pin.length > i ? 'bg-blue-600 scale-110' : 'bg-slate-200'
                  }`}></div>
                ))}
             </div>
             {error && <p className="text-red-500 text-xs font-bold mt-4 animate-bounce">{error}</p>}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleNumClick(num.toString())}
                className="h-14 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 text-slate-700 font-bold text-xl transition-all shadow-sm active:scale-95"
              >
                {num}
              </button>
            ))}
            <div className="flex items-center justify-center">
               {/* Spacer */}
            </div>
            <button
                onClick={() => handleNumClick('0')}
                className="h-14 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 text-slate-700 font-bold text-xl transition-all shadow-sm active:scale-95"
              >
                0
            </button>
            <button
                onClick={handleDelete}
                className="h-14 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-500 flex items-center justify-center transition-all shadow-sm active:scale-95"
              >
                <Delete className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Acceso Seguro
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
