import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, Download, Filter, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function Reports() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiFetch('/api/stats');
      setStats(data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const data = [
    { name: 'Ene', ingresos: 4500, gastos: 3200 },
    { name: 'Feb', ingresos: 5200, gastos: 3800 },
    { name: 'Mar', ingresos: 4800, gastos: 3100 },
    { name: 'Abr', ingresos: 6100, gastos: 4200 },
    { name: 'May', ingresos: 5900, gastos: 3900 },
    { name: 'Jun', ingresos: stats?.monthIncome || 0, gastos: stats?.monthExpenses || 0 },
  ];

  const exportCSV = () => {
    const headers = ['Mes', 'Ingresos', 'Gastos', 'Utilidad'];
    const rows = data.map(d => [d.name, d.ingresos, d.gastos, d.ingresos - d.gastos]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_nomad.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="glass-card px-4 py-2 flex items-center gap-2 text-sm">
            <Calendar size={16} className="text-brand-blue" />
            <span>Últimos 6 meses</span>
          </div>
          <button className="glass-card px-4 py-2 flex items-center gap-2 text-sm hover:bg-white/5 transition-colors">
            <Filter size={16} className="text-brand-blue" />
            <span>Filtros</span>
          </button>
        </div>
        <button 
          onClick={exportCSV}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold">Ingresos vs Gastos</h3>
              <p className="text-xs text-white/40">Comparativa mensual de flujo de caja</p>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-blue" />
                <span>Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <span>Gastos</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff40', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff40', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="ingresos" fill="#0078D2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" fill="#ffffff20" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold">Crecimiento de Utilidad</h3>
              <p className="text-xs text-white/40">Tendencia de ganancias netas</p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorUtilidad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0078D2" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0078D2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff40', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff40', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey={(d) => d.ingresos - d.gastos} 
                  name="Utilidad"
                  stroke="#0078D2" 
                  fillOpacity={1} 
                  fill="url(#colorUtilidad)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider text-white/40">Mejor Mes</span>
          </div>
          <div className="text-2xl font-bold mb-1">Abril 2026</div>
          <div className="text-sm text-green-500">+$6,100 Ingresos</div>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 rounded-lg bg-brand-blue/10 text-brand-blue">
              <DollarSign size={20} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider text-white/40">Utilidad Promedio</span>
          </div>
          <div className="text-2xl font-bold mb-1">$1,650</div>
          <div className="text-sm text-white/40">Por mes</div>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <TrendingDown size={20} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider text-white/40">Gasto Mayor</span>
          </div>
          <div className="text-2xl font-bold mb-1">Nómina</div>
          <div className="text-sm text-red-500">$2,400 Mensual</div>
        </div>
      </div>
    </div>
  );
}
