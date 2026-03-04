import { memo } from 'react';
import { Network, Users, Calendar, Settings } from 'lucide-react';

export type TabId = 'tree' | 'directory' | 'events' | 'settings';

interface Props {
  active: TabId;
  onChange: (t: TabId) => void;
  darkMode: boolean;
}

const BottomNav = memo(function BottomNav({ active, onChange, darkMode }: Props) {
  // Class kính mờ
  const glassClass = darkMode 
    ? 'glass-dark border-t border-gray-800' 
    : 'glass border-t border-white/50 shadow-lg';
  
  const navItems = [
    { id: 'tree', label: 'Gia Phả', icon: Network },
    { id: 'directory', label: 'Danh Sách', icon: Users },
    { id: 'events', label: 'Sự Kiện', icon: Calendar },
    { id: 'settings', label: 'Quản Trị', icon: Settings },
  ];

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[100] pb-safe ${glassClass}`}>
      <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = active === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id as TabId)}
              className="relative flex flex-col items-center justify-center w-1/4 h-full active:scale-95 transition-transform"
            >
              {/* Đèn nền khi Active */}
              {isActive && (
                <div 
                  className="absolute top-1 w-12 h-8 rounded-2xl opacity-20 transition-all duration-300"
                  style={{ background: '#800000' }}
                />
              )}
              
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-all duration-300 mb-1 z-10 ${
                  isActive 
                    ? 'text-[#800000] -translate-y-0.5' 
                    : (darkMode ? 'text-gray-400' : 'text-gray-500')
                }`} 
              />
              
              <span className={`text-[10px] font-semibold transition-colors z-10 ${
                isActive 
                  ? 'text-[#800000]' 
                  : (darkMode ? 'text-gray-500' : 'text-gray-400')
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default BottomNav;
