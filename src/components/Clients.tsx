import { useState, useEffect, FormEvent, useCallback } from 'react';
import { Plus, Search, User, Phone, MapPin, Trash2, Edit2 } from 'lucide-react';

interface Client {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const fetchClients = useCallback(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        setClients(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setClients([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter(c => 
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.telefono?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o teléfono..." 
            className="input-field w-full pl-10 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingClient(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center text-sm"
        >
          <Plus size={18} />
          Nuevo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="glass-card p-6 group relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                <User size={24} />
              </div>
              <div className="flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white">
                  <Edit2 size={16} />
                </button>
                <button className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold mb-4">{client.nombre}</h3>
            
            <div className="space-y-3 text-sm text-white/60">
              <div className="flex items-center gap-3">
                <Phone size={14} className="text-brand-blue" />
                {client.telefono}
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={14} className="text-brand-blue" />
                <span className="line-clamp-1">{client.direccion}</span>
              </div>
            </div>

            <button className="w-full mt-6 py-2 rounded-xl border border-white/5 text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors">
              Ver Historial
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <ClientModal 
          client={editingClient}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchClients(); }}
        />
      )}
    </div>
  );
}

function ClientModal({ client, onClose, onSave }: { client: Client | null, onClose: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState({
    nombre: client?.nombre || '',
    telefono: client?.telefono || '',
    direccion: client?.direccion || '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-display font-bold">{client ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Plus className="rotate-45" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase">Nombre Completo</label>
            <input required className="input-field w-full" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase">Teléfono</label>
            <input required className="input-field w-full" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase">Dirección</label>
            <textarea className="input-field w-full h-20" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
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
