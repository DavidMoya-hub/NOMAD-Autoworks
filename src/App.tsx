import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Receipt, 
  Car,
  Menu,
  X,
  Users,
  Package,
  BarChart2
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Expenses from './components/Expenses';
import Clients from './components/Clients';
import Vehicles from './components/Vehicles';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TabType = 'dashboard' | 'orders' | 'expenses' | 'clients' | 'vehicles' | 'inventory' | 'reports';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Órdenes', icon: ClipboardList },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'vehicles', label: 'Vehículos', icon: Car },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'expenses', label: 'Gastos', icon: Receipt },
    { id: 'reports', label: 'Reportes', icon: BarChart2 },
  ];

  // Close mobile menu when tab changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  return (
    <div className="flex min-h-screen bg-brand-dark overflow-hidden relative">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : 80,
          x: isMobileMenuOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -280 : 0)
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed lg:relative z-[70] flex flex-col h-full bg-brand-gray border-r border-white/5 transition-transform lg:translate-x-0",
          !isMobileMenuOpen && "lg:flex"
        )}
      >
        <div className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-blue/20 overflow-hidden border border-white/10">
            <img 
              src="https://lh3.googleusercontent.com/pw/AP1GczOBJ-PlSZP9mUWzG16TDROvo5ewK_WAJ9sIfqtlIySrNr7aj_uMJhaSP_Eb5OfxbzcyfWbqIrse94TgVVNBUX2woJnCjxHh-SFnQmqTechNBsAJScgScd3U5-9vXU9Pd_QvlvhTjvxe9k_KiLvFTD48Sg=w671-h878-s-no-gm?authuser=0" 
              alt="NOMAD Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {(isSidebarOpen || isMobileMenuOpen) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-display font-bold text-xl tracking-tight"
            >
              NOMAD
              <span className="text-brand-blue block text-xs font-medium tracking-[0.2em]">AUTOWORKS</span>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
                activeTab === item.id 
                  ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20" 
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(activeTab === item.id ? "text-white" : "group-hover:text-white")} />
              {(isSidebarOpen || isMobileMenuOpen) && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 hidden lg:block">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-4 px-4 py-3 text-white/50 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            {isSidebarOpen && <span className="font-medium">Contraer</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative h-screen">
        <header className="sticky top-0 z-40 bg-brand-dark/80 backdrop-blur-md border-b border-white/5 p-4 md:p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl md:text-2xl font-display font-bold capitalize">
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">Administrador</div>
              <div className="text-xs text-white/40">Taller NOMAD</div>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-brand-blue to-blue-900 border border-white/10" />
          </div>
        </header>

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'orders' && <Orders />}
              {activeTab === 'clients' && <Clients />}
              {activeTab === 'vehicles' && <Vehicles />}
              {activeTab === 'inventory' && <Inventory />}
              {activeTab === 'expenses' && <Expenses />}
              {activeTab === 'reports' && <Reports />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
