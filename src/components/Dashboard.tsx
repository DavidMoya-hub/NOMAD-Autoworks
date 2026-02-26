import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Car, 
  CheckCircle2, 
  BarChart3,
  PieChart as PieChartIcon,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';

interface Stats {
  totalIncome: number;
  totalExpenses: number;
  monthIncome: number;
  monthExpenses: number;
  netProfit: number;
  statusCounts: Record<string, number>;
  avgTicket: number;
  margin: number;
  ordersCount: number;
  inWorkshop: number;
  lowStockCount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading || !stats) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 glass-card" />)}
    </div>
  </div>;

  const chartData = [
    { name: 'Ingresos', value: stats?.totalIncome || 0, fill: '#0078D2' },
    { name: 'Gastos', value: stats?.totalExpenses || 0, fill: '#333' },
    { name: 'Utilidad', value: stats?.netProfit || 0, fill: '#22c55e' },
  ];

  const pieData = Object.entries(stats?.statusCounts || {}).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#0078D2', '#22c55e', '#3b82f6', '#ef4444'];

  const metricCards = [
    { label: 'Ingresos del Mes', value: `$${(stats?.monthIncome || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-green-500' },
    { label: 'Gastos del Mes', value: `$${(stats?.monthExpenses || 0).toLocaleString()}`, icon: TrendingDown, color: 'text-red-500' },
    { label: 'Ganancia Neta', value: `$${(stats?.netProfit || 0).toLocaleString()}`, icon: DollarSign, color: 'text-brand-blue' },
    { label: 'Trabajo en Proceso', value: `${stats?.inWorkshop || 0}`, icon: Car, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {metricCards.map((card, i) => (
          <div key={i} className="glass-card p-4 md:p-6 group hover:border-brand-blue/30 transition-colors">
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className={`p-2 md:p-3 rounded-xl bg-white/5 ${card.color}`}>
                <card.icon size={20} className="md:w-6 md:h-6" />
              </div>
              <div className="text-[10px] md:text-xs font-bold text-white/20 uppercase tracking-wider">Metric</div>
            </div>
            <div className="text-xl md:text-2xl font-display font-bold mb-1">{card.value}</div>
            <div className="text-xs md:text-sm text-white/40">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-4 md:p-6">
            <h3 className="text-lg font-bold mb-6">Resumen de Estados</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Bell size={20} className="text-brand-blue" />
              Alertas
            </h3>
            <div className="space-y-4">
              {stats?.lowStockCount > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold">Stock Bajo</div>
                    <p className="text-xs text-white/60">{stats.lowStockCount} repuestos necesitan reabastecimiento.</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold">Facturas al día</div>
                  <p className="text-xs text-white/60">No hay facturas vencidas pendientes.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4">Distribución de Órdenes</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-6 md:mb-8">
            <BarChart3 size={18} className="text-brand-blue md:w-5 md:h-5" />
            <h3 className="text-sm md:text-base font-display font-bold">Resumen Financiero</h3>
          </div>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-6 md:mb-8">
            <PieChartIcon size={18} className="text-brand-blue md:w-5 md:h-5" />
            <h3 className="text-sm md:text-base font-display font-bold">Estado de Órdenes</h3>
          </div>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
