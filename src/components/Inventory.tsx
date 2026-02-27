import { useState, useEffect, FormEvent, useCallback } from 'react';
import { Plus, Search, Package, AlertTriangle, Trash2, Edit2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { apiFetch } from '../utils/api';

interface InventoryItem {
  id: number;
  nombre: string;
  categoria: string;
  stock_actual: number;
  precio: number;
  costo: number;
  stock_minimo: number;
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      const data = await apiFetch('/api/inventory');
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar inventario:', err);
      setItems([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este repuesto?')) return;
    try {
      const result = await apiFetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (result.success) {
        fetchInventory();
      } else {
        alert('Error: ' + (result.message || 'No se pudo eliminar el repuesto'));
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    }
  };

  const filteredItems = items.filter(i => 
    i.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    i.categoria?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o SKU..." 
            className="input-field w-full pl-10 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingItem(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center text-sm"
        >
          <Plus size={18} />
          Agregar Repuesto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-blue/10 text-brand-blue">
            <Package size={20} />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase font-bold">Total Items</div>
            <div className="text-xl font-bold">{items.length}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase font-bold">Stock Bajo</div>
            <div className="text-xl font-bold">{items.filter(i => (Number(i.stock_actual) || 0) <= (Number(i.stock_minimo) || 0)).length}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
            <ArrowUpRight size={20} />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase font-bold">Valor Venta</div>
            <div className="text-xl font-bold">${items.reduce((acc, i) => acc + ((Number(i.precio) || 0) * (Number(i.stock_actual) || 0)), 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/5 text-white/40">
            <ArrowDownRight size={20} />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase font-bold">Costo Total</div>
            <div className="text-xl font-bold">${items.reduce((acc, i) => acc + ((Number(i.costo) || 0) * (Number(i.stock_actual) || 0)), 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Categoría</th>
                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Nombre</th>
                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider text-center">Stock</th>
                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider text-right">Costo</th>
                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider text-right">Precio</th>
                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map((item, index) => (
                <tr key={item.id || `item-${index}`} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 text-sm font-mono text-white/40">{item.categoria}</td>
                  <td className="p-4">
                    <div className="text-sm font-medium">{item.nombre}</div>
                    {(Number(item.stock_actual) || 0) <= (Number(item.stock_minimo) || 0) && (
                      <div className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
                        <AlertTriangle size={10} /> Stock Crítico
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      (Number(item.stock_actual) || 0) <= (Number(item.stock_minimo) || 0) ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {item.stock_actual}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-right text-white/40">${(Number(item.costo) || 0).toLocaleString()}</td>
                  <td className="p-4 text-sm font-bold text-right">${(Number(item.precio) || 0).toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingItem(item); setShowModal(true); }}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-white/60 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <InventoryModal 
          item={editingItem}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchInventory(); }}
        />
      )}
    </div>
  );
}

function InventoryModal({ item, onClose, onSave }: { item: InventoryItem | null, onClose: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState({
    nombre: item?.nombre || '',
    categoria: item?.categoria || '',
    stock_actual: item?.stock_actual?.toString() || '',
    precio: item?.precio?.toString() || '',
    costo: item?.costo?.toString() || '',
    stock_minimo: item?.stock_minimo?.toString() || '5',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const url = item ? `/api/inventory/${item.id}` : '/api/inventory';
      const method = item ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        stock_actual: Number(formData.stock_actual) || 0,
        precio: Number(formData.precio) || 0,
        costo: Number(formData.costo) || 0,
        stock_minimo: Number(formData.stock_minimo) || 0,
      };

      const result = await apiFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (result.success) {
        onSave();
      } else {
        alert('Error: ' + (result.message || 'No se pudo guardar el repuesto'));
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión al servidor');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-display font-bold">{item ? 'Editar Repuesto' : 'Agregar Repuesto'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Plus className="rotate-45" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Nombre del Repuesto</label>
              <input required className="input-field w-full" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Categoría / Código</label>
              <input required className="input-field w-full" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Stock Inicial</label>
              <input type="number" required className="input-field w-full" value={formData.stock_actual} onChange={e => setFormData({...formData, stock_actual: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Costo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">$</span>
                <input type="number" step="0.01" required className="input-field w-full pl-8" value={formData.costo} onChange={e => setFormData({...formData, costo: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Precio Venta</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">$</span>
                <input type="number" step="0.01" required className="input-field w-full pl-8" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Alerta Stock Bajo</label>
              <input type="number" required className="input-field w-full" value={formData.stock_minimo} onChange={e => setFormData({...formData, stock_minimo: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-white/40 hover:text-white transition-colors">Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
