import { useState, useEffect, FormEvent, useCallback } from 'react';
import { Plus, Trash2, Receipt, Calendar, DollarSign, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiFetch } from '../utils/api';

interface Expense {
  id: number;
  fecha: string;
  categoria: string;
  descripcion: string;
  monto: number;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    categoria: 'Operativo',
    descripcion: '',
    monto: '',
  });

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        fecha: editingExpense.fecha ? new Date(editingExpense.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        categoria: editingExpense.categoria || 'Operativo',
        descripcion: editingExpense.descripcion || '',
        monto: editingExpense.monto?.toString() || '',
      });
    } else {
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        categoria: 'Operativo',
        descripcion: '',
        monto: '',
      });
    }
  }, [editingExpense]);

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await apiFetch('/api/expenses');
      setExpenses(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar gastos:', err);
      setExpenses([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses';
      const method = editingExpense ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        monto: Number(formData.monto) || 0
      };
      const result = await apiFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (result.success) {
        setShowModal(false);
        setEditingExpense(null);
        fetchExpenses();
      } else {
        alert('Error: ' + (result.message || 'No se pudo guardar el gasto'));
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión al servidor');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    try {
      const result = await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (result.success) {
        fetchExpenses();
      } else {
        alert('Error: ' + (result.message || 'No se pudo eliminar el gasto'));
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    }
  };

  const totalExpenses = (Array.isArray(expenses) ? expenses : []).reduce((acc, e) => acc + (Number(e.monto || (e as any).amount) || 0), 0);

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
          onClick={() => { setEditingExpense(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2 justify-center text-sm"
        >
          <Plus size={18} />
          Registrar Gasto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {(Array.isArray(expenses) ? expenses : []).map((expense, index) => (
          <div key={expense.id || `expense-${index}`} className="glass-card p-4 md:p-6 group relative">
            <div className="absolute top-3 right-3 md:top-4 md:right-4 flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
              <button 
                onClick={() => { setEditingExpense(expense); setShowModal(true); }}
                className="p-1.5 md:p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <Edit2 size={14} className="md:w-4 md:h-4" />
              </button>
              <button 
                onClick={() => handleDelete(expense.id)}
                className="p-1.5 md:p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
              >
                <Trash2 size={14} className="md:w-4 md:h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="p-1.5 md:p-2 rounded-lg bg-white/5 text-white/40">
                <Receipt size={18} className="md:w-5 md:h-5" />
              </div>
              <div className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] md:text-[10px] font-bold uppercase border border-white/10">
                {expense.categoria || (expense as any).type || 'Gasto'}
              </div>
            </div>

            <div className="text-base md:text-lg font-bold mb-1">
              ${(Number(expense.monto || (expense as any).amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs md:text-sm text-white/60 mb-3 md:mb-4 line-clamp-2">
              {expense.descripcion || (expense as any).description || 'Sin descripción'}
            </p>
            
            <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs text-white/30 border-t border-white/5 pt-3 md:pt-4">
              <div className="flex items-center gap-1">
                <Calendar size={10} className="md:w-3 md:h-3" />
                {(() => {
                  try {
                    const d = expense.fecha || (expense as any).date;
                    return d ? format(new Date(d), 'dd MMM, yyyy', { locale: es }) : 'N/A';
                  } catch (e) {
                    return 'Fecha Inválida';
                  }
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-display font-bold">{editingExpense ? 'Editar Gasto' : 'Registrar Gasto'}</h2>
              <button onClick={() => { setShowModal(false); setEditingExpense(null); }} className="text-white/40 hover:text-white"><Plus className="rotate-45" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase">Fecha</label>
                <input type="date" required className="input-field w-full" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase">Tipo</label>
                <select className="input-field w-full" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
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
                <input required className="input-field w-full" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase">Monto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">$</span>
                  <input type="number" step="0.01" required className="input-field w-full pl-8" value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingExpense(null); }} className="px-4 py-2 text-white/40 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="btn-primary">{editingExpense ? 'Guardar Cambios' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
