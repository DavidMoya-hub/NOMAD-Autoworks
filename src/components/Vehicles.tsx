import { useState, useEffect, FormEvent, useCallback } from 'react';
import { Plus, Search, Car, User, Hash, Calendar, Trash2, Edit2 } from 'lucide-react';
import { apiFetch } from '../utils/api';

interface Vehicle {
  id: number;
  clienteid: number;
  marca: string;
  modelo: string;
  año: number;
  placas: string;
  vin: string;
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [vData, cData] = await Promise.all([
        apiFetch('/api/vehicles'),
        apiFetch('/api/clients')
      ]);
      setVehicles(Array.isArray(vData) ? vData : []);
      setClients(Array.isArray(cData) ? cData : []);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este vehículo?')) return;
    try {
      const result = await apiFetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      if (result.success) {
        fetchData();
      } else {
        alert('Error: ' + (result.message || 'No se pudo eliminar el vehículo'));
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    }
  };

  const getClientName = (id: number) => clients.find(c => c.id === id)?.nombre || 'Desconocido';

  const filteredVehicles = vehicles.filter(v => 
    v.marca?.toLowerCase().includes(search.toLowerCase()) ||
    v.modelo?.toLowerCase().includes(search.toLowerCase()) ||
    v.placas?.toLowerCase().includes(search.toLowerCase()) ||
    getClientName(v.clienteid).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por marca, modelo, placas o cliente..." 
            className="input-field w-full pl-10 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingVehicle(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center text-sm"
        >
          <Plus size={18} />
          Nuevo Vehículo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.id} className="glass-card p-6 group relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                <Car size={24} />
              </div>
              <div className="flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingVehicle(vehicle); setShowModal(true); }}
                  className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(vehicle.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold mb-1">{vehicle.marca} {vehicle.modelo}</h3>
            <div className="text-xs text-brand-blue font-bold uppercase tracking-widest mb-4">{vehicle.placas}</div>
            
            <div className="space-y-3 text-sm text-white/60">
              <div className="flex items-center gap-3">
                <User size={14} className="text-brand-blue" />
                <span className="font-medium text-white">{getClientName(vehicle.clienteid)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-brand-blue" />
                Año: {vehicle.año}
              </div>
              <div className="flex items-center gap-3">
                <Hash size={14} className="text-brand-blue" />
                VIN: {vehicle.vin || 'N/A'}
              </div>
            </div>

            <button className="w-full mt-6 py-2 rounded-xl border border-white/5 text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors">
              Historial de Servicios
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <VehicleModal 
          vehicle={editingVehicle}
          clients={clients}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}

function VehicleModal({ vehicle, clients, onClose, onSave }: { vehicle: Vehicle | null, clients: any[], onClose: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState({
    clienteid: vehicle?.clienteid.toString() || '',
    marca: vehicle?.marca || '',
    modelo: vehicle?.modelo || '',
    año: vehicle?.año || new Date().getFullYear(),
    placas: vehicle?.placas || '',
    vin: vehicle?.vin || '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const url = vehicle ? `/api/vehicles/${vehicle.id}` : '/api/vehicles';
      const method = vehicle ? 'PUT' : 'POST';

      const result = await apiFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (result.success) {
        onSave();
      } else {
        alert('Error: ' + (result.message || 'No se pudo guardar el vehículo'));
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión al servidor');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-display font-bold">Nuevo Vehículo</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Plus className="rotate-45" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase">Dueño / Cliente</label>
            <select required className="input-field w-full" value={formData.clienteid} onChange={e => setFormData({...formData, clienteid: e.target.value})}>
              <option value="">Seleccionar Cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Marca</label>
              <input required className="input-field w-full" placeholder="Ej: BMW" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Modelo</label>
              <input required className="input-field w-full" placeholder="Ej: M3" value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Año</label>
              <input type="number" required className="input-field w-full" value={formData.año} onChange={e => setFormData({...formData, año: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Placas</label>
              <input required className="input-field w-full" value={formData.placas} onChange={e => setFormData({...formData, placas: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase">VIN (Opcional)</label>
            <input className="input-field w-full" value={formData.vin} onChange={e => setFormData({...formData, vin: e.target.value})} />
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
