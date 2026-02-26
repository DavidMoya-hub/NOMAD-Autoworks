import { useState, useEffect, FormEvent } from 'react';
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, Car, User, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Order {
  id: number;
  fecha: string;
  clienteid: number;
  vehiculoid: number;
  servicio: string;
  estado: string;
  total: number;
  costo_partes: number;
  costo_mano_obra: number;
  ganancia: number;
  comentarios: string;
  itemsjson: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const [ordersRes, clientsRes, vehiclesRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/clients'),
        fetch('/api/vehicles')
      ]);
      
      const [ordersData, clientsData, vehiclesData] = await Promise.all([
        ordersRes.json(),
        clientsRes.json(),
        vehiclesRes.json()
      ]);

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getClientName = (id: number) => clients.find(c => c.id === id)?.nombre || 'Cliente Desconocido';
  const getVehicleInfo = (id: number) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.marca} ${v.modelo} (${v.placas})` : 'Vehículo Desconocido';
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta orden?')) return;
    await fetch(`/api/orders/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(o => 
    getClientName(o.clienteid).toLowerCase().includes(search.toLowerCase()) ||
    getVehicleInfo(o.vehiculoid).toLowerCase().includes(search.toLowerCase()) ||
    o.servicio?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En ingreso': return 'bg-white/5 text-white/60 border-white/10';
      case 'En proceso': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Listo': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Entregado': return 'bg-brand-blue/10 text-brand-blue border-brand-blue/20';
      default: return 'bg-white/5 text-white';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por cliente, vehículo o servicio..." 
            className="input-field w-full pl-10 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingOrder(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center text-sm"
        >
          <Plus size={18} />
          Nueva Orden de Trabajo
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-3 md:p-4 text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-wider">ID</th>
                <th className="p-3 md:p-4 text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-wider">Fecha</th>
                <th className="p-3 md:p-4 text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-wider">Cliente / Vehículo</th>
                <th className="p-3 md:p-4 text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-wider">Servicio</th>
                <th className="p-3 md:p-4 text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-wider">Estado</th>
                <th className="p-3 md:p-4 text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-wider text-right">Total</th>
                <th className="p-3 md:p-4 text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-wider text-right">Ganancia</th>
                <th className="p-3 md:p-4 text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-3 md:p-4 text-xs md:text-sm font-mono text-white/40">#{order.id}</td>
                  <td className="p-3 md:p-4 text-xs md:text-sm">
                    {order.fecha ? format(new Date(order.fecha), 'dd MMM, yyyy', { locale: es }) : 'N/A'}
                  </td>
                  <td className="p-3 md:p-4">
                    <div className="text-sm font-medium">{getClientName(order.clienteid)}</div>
                    <div className="text-[10px] md:text-xs text-white/40 flex items-center gap-1 mt-0.5">
                      <Car size={10} className="md:w-3 md:h-3" /> {getVehicleInfo(order.vehiculoid)}
                    </div>
                  </td>
                  <td className="p-3 md:p-4 text-xs md:text-sm max-w-[200px] truncate">{order.servicio}</td>
                  <td className="p-3 md:p-4">
                    <span className={`px-2 py-0.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase border ${getStatusColor(order.estado)}`}>
                      {order.estado}
                    </span>
                  </td>
                  <td className="p-3 md:p-4 text-xs md:text-sm font-bold text-right">${(order.total || 0).toLocaleString()}</td>
                  <td className="p-3 md:p-4 text-xs md:text-sm font-bold text-right text-green-500">${(order.ganancia || 0).toLocaleString()}</td>
                  <td className="p-3 md:p-4 text-right">
                    <div className="flex justify-end gap-1 md:gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingOrder(order); setShowModal(true); }}
                        className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                      >
                        <Edit2 size={14} className="md:w-4 md:h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(order.id)}
                        className="p-1.5 md:p-2 hover:bg-red-500/10 rounded-lg text-white/60 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} className="md:w-4 md:h-4" />
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
        <OrderModal 
          order={editingOrder} 
          clients={clients}
          vehicles={vehicles}
          onClose={() => setShowModal(false)} 
          onSave={() => { setShowModal(false); fetchData(); }} 
        />
      )}
    </div>
  );
}

function OrderModal({ order, clients, vehicles, onClose, onSave }: { order: Order | null, clients: any[], vehicles: any[], onClose: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState({
    fecha: order?.fecha || new Date().toISOString().split('T')[0],
    clienteid: order?.clienteid || '',
    vehiculoid: order?.vehiculoid || '',
    servicio: order?.servicio || '',
    estado: order?.estado || 'En ingreso',
    total: order?.total || 0,
    costo_partes: order?.costo_partes || 0,
    costo_mano_obra: order?.costo_mano_obra || 0,
    ganancia: order?.ganancia || 0,
    comentarios: order?.comentarios || '',
    itemsjson: order?.itemsjson || '[]',
  });

  const [showQuickClient, setShowQuickClient] = useState(false);
  const [quickClient, setQuickClient] = useState({ nombre: '', telefono: '', direccion: '' });

  useEffect(() => {
    const ganancia = Number(formData.total) - (Number(formData.costo_partes) + Number(formData.costo_mano_obra));
    setFormData(prev => ({ ...prev, ganancia }));
  }, [formData.total, formData.costo_partes, formData.costo_mano_obra]);

  const handleQuickClientSubmit = async () => {
    if (!quickClient.nombre || !quickClient.telefono) return;
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quickClient),
      });
      const result = await res.json();
      if (result.success) {
        // We need the ID. Since GAS appendRow doesn't return the ID easily in this generic setup, 
        // we might need to fetch clients again or assume the last one.
        // For simplicity, let's just refresh the parent and close the quick form.
        alert('Cliente creado. Por favor selecciónalo de la lista.');
        setShowQuickClient(false);
        setQuickClient({ nombre: '', telefono: '', direccion: '' });
        onSave(); // This will refresh the lists in the parent
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-display font-bold">{order ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Plus className="rotate-45" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-white/40 uppercase">Cliente</label>
                <button 
                  type="button" 
                  onClick={() => setShowQuickClient(!showQuickClient)}
                  className="text-[10px] text-brand-blue hover:underline"
                >
                  {showQuickClient ? 'Cancelar' : '+ Nuevo Cliente'}
                </button>
              </div>
              
              {showQuickClient ? (
                <div className="p-3 bg-white/5 rounded-xl space-y-3 border border-brand-blue/20">
                  <input 
                    placeholder="Nombre" 
                    className="input-field w-full text-xs" 
                    value={quickClient.nombre} 
                    onChange={e => setQuickClient({...quickClient, nombre: e.target.value})}
                  />
                  <input 
                    placeholder="Teléfono" 
                    className="input-field w-full text-xs" 
                    value={quickClient.telefono} 
                    onChange={e => setQuickClient({...quickClient, telefono: e.target.value})}
                  />
                  <button 
                    type="button" 
                    onClick={handleQuickClientSubmit}
                    className="w-full py-1.5 bg-brand-blue text-white text-xs font-bold rounded-lg"
                  >
                    Guardar Cliente
                  </button>
                </div>
              ) : (
                <select required className="input-field w-full" value={formData.clienteid} onChange={e => setFormData({...formData, clienteid: Number(e.target.value)})}>
                  <option value="">Seleccionar Cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Vehículo</label>
              <select required className="input-field w-full" value={formData.vehiculoid} onChange={e => setFormData({...formData, vehiculoid: Number(e.target.value)})}>
                <option value="">Seleccionar Vehículo</option>
                {vehicles.filter(v => v.clienteid === formData.clienteid).map(v => (
                  <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.placas})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Fecha</label>
              <input type="date" required className="input-field w-full" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Estado</label>
              <select className="input-field w-full" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})}>
                <option value="En ingreso">En ingreso</option>
                <option value="En proceso">En proceso</option>
                <option value="Listo">Listo</option>
                <option value="Entregado">Entregado</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-white/40 uppercase">Servicio</label>
              <textarea required className="input-field w-full h-24" value={formData.servicio} onChange={e => setFormData({...formData, servicio: e.target.value})} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-white/40 uppercase">Comentarios Adicionales</label>
              <textarea className="input-field w-full h-20" value={formData.comentarios} onChange={e => setFormData({...formData, comentarios: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Total Cobrado</label>
              <input type="number" required className="input-field w-full text-lg font-bold text-brand-blue" value={formData.total} onChange={e => setFormData({...formData, total: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Ganancia Estimada</label>
              <div className="input-field w-full bg-white/5 font-bold text-green-500 text-lg">${formData.ganancia.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Costo Partes</label>
              <input type="number" className="input-field w-full" value={formData.costo_partes} onChange={e => setFormData({...formData, costo_partes: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Costo Mano Obra</label>
              <input type="number" className="input-field w-full" value={formData.costo_mano_obra} onChange={e => setFormData({...formData, costo_mano_obra: Number(e.target.value)})} />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-white/40 hover:text-white transition-colors">Cancelar</button>
            <button type="submit" className="btn-primary">Generar Orden</button>
          </div>
        </form>
      </div>
    </div>
  );
}
