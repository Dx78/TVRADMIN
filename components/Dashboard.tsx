
import React, { useMemo } from 'react';
import { Sale, SalesChannel, SalesType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { TrendingUp, DollarSign, CreditCard, Hotel } from 'lucide-react';

interface DashboardProps {
  sales: Sale[];
}

// Resort Palette (Deep Blue, Teal, Gold, Coral, Slate)
const COLORS = ['#0f172a', '#0ea5e9', '#eab308', '#f43f5e', '#64748b', '#8b5cf6', '#14b8a6', '#6366f1'];

const Dashboard: React.FC<DashboardProps> = ({ sales }) => {

  // Calculate Metrics
  const totalRevenue = useMemo(() => sales.reduce((acc, curr) => acc + curr.amount, 0), [sales]);
  const averageTicket = useMemo(() => sales.length ? totalRevenue / sales.length : 0, [sales, totalRevenue]);
  
  const cashVsDigital = useMemo(() => {
    const cash = sales.filter(s => s.paymentMethod === 'Efectivo').reduce((acc, curr) => acc + curr.amount, 0);
    const digital = totalRevenue - cash;
    return { cash, digital };
  }, [sales, totalRevenue]);

  const channelData = useMemo(() => {
    const data: Record<string, number> = {};
    Object.values(SalesChannel).forEach(c => data[c] = 0);
    sales.forEach(s => data[s.channel] += s.amount);
    return Object.keys(data).map(key => ({ name: key, value: data[key] })).filter(d => d.value > 0);
  }, [sales]);

  const typeData = useMemo(() => {
    const data: Record<string, number> = {};
    Object.values(SalesType).forEach(t => data[t] = 0);
    sales.forEach(s => data[s.type] += s.amount);
    return Object.keys(data).map(key => ({ name: key, value: data[key] })).filter(d => d.value > 0);
  }, [sales]);

  const StatCard = ({ title, value, icon, colorClass, subtext, borderClass }: any) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${borderClass} border-y border-r border-slate-100 flex flex-col justify-between h-full transition-all hover:shadow-md group print:shadow-none print:border print:border-slate-300 print:p-4`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 group-hover:scale-110 transition-transform duration-300 print:bg-transparent print:p-0`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
        {subtext && <p className="text-sm text-slate-500 mt-2 font-medium">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12 print:pb-4 print:space-y-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
        <StatCard 
          title="Venta Total" 
          value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={<DollarSign className="w-6 h-6 text-blue-900" />}
          colorClass="bg-blue-100"
          borderClass="border-blue-900"
          subtext="Ingresos Brutos"
        />
        <StatCard 
          title="Transacciones" 
          value={sales.length}
          icon={<Hotel className="w-6 h-6 text-teal-600" />}
          colorClass="bg-teal-100"
          borderClass="border-teal-500"
          subtext="Registros procesados"
        />
        <StatCard 
          title="Ticket Promedio" 
          value={`$${averageTicket.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp className="w-6 h-6 text-amber-600" />}
          colorClass="bg-amber-100"
          borderClass="border-amber-500"
        />
        <StatCard 
          title="Flujo Efectivo" 
          value={`$${cashVsDigital.cash.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          icon={<CreditCard className="w-6 h-6 text-slate-600" />}
          colorClass="bg-slate-200"
          borderClass="border-slate-500"
          subtext={`${((cashVsDigital.cash / (totalRevenue || 1)) * 100).toFixed(0)}% del total`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full print:block">
        {/* Sales by Type */}
        <div className="lg:col-span-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200 print:mb-4 print:p-4 print:border-slate-300 print:shadow-none">
          <div className="flex justify-between items-center mb-8">
             <div>
                <h3 className="text-lg font-bold text-slate-800">Rendimiento por Área</h3>
                <p className="text-sm text-slate-500">Comparativa de ingresos Restaurante vs Hotel vs Otros</p>
             </div>
          </div>
          <div className="h-[400px] w-full print:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ingresos']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={50}>
                   {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Channel */}
        <div className="lg:col-span-4 bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col print:p-4 print:border-slate-300 print:shadow-none print:break-inside-avoid">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Canales de Venta</h3>
          <p className="text-sm text-slate-500 mb-6">Origen de las reservaciones</p>
          <div className="flex-1 min-h-[300px] print:min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-slate-600 text-sm font-medium ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
