import { Building, Calendar, Trophy, BarChart3, User } from 'lucide-react';

interface OwnerNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function OwnerNavigation({ activeTab, onTabChange }: OwnerNavigationProps) {
  const tabs = [
    { id: 'owner-dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'owner-courts', icon: Building, label: 'Canchas' },
    { id: 'tournaments', icon: Trophy, label: 'Torneos' },
    { id: 'owner-profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl z-50">
      <div className="flex justify-around py-3 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'text-[#172c44] bg-[#f4b400] shadow-lg transform scale-105' 
                  : 'text-[#172c44] hover:text-white hover:bg-[#172c44]/20'
              }`}
            >
              <Icon size={22} className={isActive ? 'drop-shadow-sm' : ''} />
              <span className={`text-xs mt-1 font-['Outfit'] font-bold ${isActive ? 'text-[#172c44]' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}