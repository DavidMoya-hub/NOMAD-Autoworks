import { useState, useEffect, FormEvent, useCallback } from 'react';
import { Plus, Search, Package, AlertTriangle, Trash2, Edit2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { apiFetch } from '../utils/api';

interface InventoryItem {
  id: number;
  nombre: string;
  sku: string;
  stock: number;
  precio_venta: number;
  costo: number;
  alerta_min: number;
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
    i.sku?.toLowerCase().includes(search.toLowerCase())
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
            <div className="text-xl font-bold">{items.filter(i => i.stock <= i.alerta_min).length}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
            <ArrowUpRight size={20} />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase font-bold">Valor Venta</div>
            <div className="text-xl font-bold">${items.reduce((acc, i) => acc + (i.precio_venta * i.stock), 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/5 text-white/40">
            <ArrowDownRight size={20} />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase font-bold">Costo Total</div>
            <div className="text-xl font-bold">${items.reduce((acc, i) => acc + (i.costo * i.stock), 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">SKU</th>
                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Nombre</th>
                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider text-center">Stock</th>
                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider text-right">Costo</th>
                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider text-right">Precio</th>
                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 text-sm font-mono text-white/40">{item.sku}</td>
                  <td className="p-4">
                    <div className="text-sm font-medium">{item.nombre}</div>
                    {item.stock <= item.alerta_min && (
                      <div className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
                        <AlertTriangle size={10} /> Stock Crítico
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.stock <= item.alerta_min ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-right text-white/40">${item.costo.toLocaleString()}</td>
                  <td className="p-4 text-sm font-bold text-right">${item.precio_venta.toLocaleString()}</td>
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
    sku: item?.sku || '',
    stock: item?.stock || 0,
    precio_venta: item?.precio_venta || 0,
    costo: item?.costo || 0,
    alerta_min: item?.alerta_min || 5,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const result = await apiFetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
          <h2 className="text-xl font-display font-bold">Agregar Repuesto</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Plus className="rotate-45" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Nombre del Repuesto</label>
              <input required className="input-field w-full" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">SKU / Código</label>
              <input required className="input-field w-full" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Stock Inicial</label>
              <input type="number" required className="input-field w-full" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Costo</label>
              <input type="number" required className="input-field w-full" value={formData.costo} onChange={e => setFormData({...formData, costo: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Precio Venta</label>
              <input type="number" required className="input-field w-full" value={formData.precio_venta} onChange={e => setFormData({...formData, precio_venta: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Alerta Stock Bajo</label>
              <input type="number" required className="input-field w-full" value={formData.alerta_min} onChange={e => setFormData({...formData, alerta_min: Number(e.target.value)})} />
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
