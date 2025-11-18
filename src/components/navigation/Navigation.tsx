import { Home, Search, Plus, User, Users } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Inicio' },
    { id: 'search', icon: Search, label: 'Buscar' },
    { id: 'create', icon: Plus, label: 'Crear' },
    { id: 'my-teams', icon: Users, label: 'Equipos' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl z-50">
      <div className="flex justify-around py-3 px-2">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 ${
              activeTab === id
                ? 'text-white bg-gradient-to-br from-[#172c44] to-[#00a884] shadow-lg transform scale-105'
                : 'text-[#172c44] hover:text-white hover:bg-[#172c44]/20'
            }`}
          >
            <Icon size={22} className={activeTab === id ? 'drop-shadow-sm' : ''} />
            <span className={`text-xs mt-1 font-['Outfit'] font-bold ${activeTab === id ? 'text-white' : ''}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}