import { useState, useEffect, FormEvent } from 'react';
import { Plus, Trash2, Receipt, Calendar, Tag, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Expense {
  id: number;
  date: string;
  type: string;
  description: string;
  amount: number;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Operativo',
    description: '',
    amount: 0,
  });

  const fetchExpenses = () => {
    fetch('/api/expenses')
      .then(res => res.json())
      .then(data => {
        setExpenses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setExpenses([]);
        setLoading(false);
      });
  };

  useEffect(fetchExpenses, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setShowModal(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'Operativo',
      description: '',
      amount: 0,
    });
    fetchExpenses();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    fetchExpenses();
  };

  const totalExpenses = (Array.isArray(expenses) ? expenses : []).reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="glass-card px-4 md:px-6 py-2 md:py-3 flex items-center gap-3 md:gap-4">
          <div className="p-1.5 md:p-2 rounded-lg bg-red-500/10 text-red-500">
            <DollarSign size={18} className="md:w-5 md:h-5" />
          </div>
          <div>
            <div className="text-[10px] md:text-xs text-white/40 uppercase font-bold">Total Gastos Operativos</div>
            <div className="text-lg md:text-xl font-bold">${totalExpenses.toLocaleString()}</div>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 justify-center text-sm"
        >
          <Plus size={18} />
          Registrar Gasto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {(Array.isArray(expenses) ? expenses : []).map((expense) => (
          <div key={expense.id} className="glass-card p-4 md:p-6 group relative">
            <button 
              onClick={() => handleDelete(expense.id)}
              className="absolute top-3 right-3 md:top-4 md:right-4 p-1.5 md:p-2 text-white/20 hover:text-red-500 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
            >
              <Trash2 size={14} className="md:w-4 md:h-4" />
            </button>
            
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="p-1.5 md:p-2 rounded-lg bg-white/5 text-white/40">
                <Receipt size={18} className="md:w-5 md:h-5" />
              </div>
              <div className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] md:text-[10px] font-bold uppercase border border-white/10">
                {expense.type}
              </div>
            </div>

            <div className="text-base md:text-lg font-bold mb-1">${expense.amount.toLocaleString()}</div>
            <p className="text-xs md:text-sm text-white/60 mb-3 md:mb-4 line-clamp-2">{expense.description}</p>
            
            <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs text-white/30 border-t border-white/5 pt-3 md:pt-4">
              <div className="flex items-center gap-1">
                <Calendar size={10} className="md:w-3 md:h-3" />
                {format(new Date(expense.date), 'dd MMM, yyyy', { locale: es })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-display font-bold">Registrar Gasto</h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white"><Plus className="rotate-45" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase">Fecha</label>
                <input type="date" required className="input-field w-full" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase">Tipo</label>
                <select className="input-field w-full" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="Operativo">Operativo</option>
                  <option value="Servicios">Servicios (Luz, Agua, etc)</option>
                  <option value="Renta">Renta</option>
                  <option value="Sueldos">Sueldos</option>
                  <option value="Herramientas">Herramientas</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase">Descripción</label>
                <input required className="input-field w-full" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase">Monto</label>
                <input type="number" required className="input-field w-full" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-white/40 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="btn-primary">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
