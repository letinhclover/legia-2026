import { motion } from 'framer-motion';
import { Network, Users, Calendar, Settings } from 'lucide-react';

export type TabId = 'tree' | 'directory' | 'events' | 'settings';

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
  darkMode?: boolean;
}

const tabs = [
  { id: 'tree'      as TabId, label: 'Phả Hệ',   icon: Network  },
  { id: 'directory' as TabId, label: 'Danh Sách', icon: Users    },
  { id: 'events'    as TabId, label: 'Sự Kiện',   icon: Calendar },
  { id: 'settings'  as TabId, label: 'Quản Trị',  icon: Settings },
];

export default function BottomNav({ active, onChange, darkMode }: Props) {
  const bg         = darkMode ? '#1a2030' : 'white';
  const border     = darkMode ? '#2d3d52' : '#F3F4F6';
  const activeClr  = '#800000';
  const inactiveClr= darkMode ? '#64748b' : '#9CA3AF';

  return (
    <div className="flex-shrink-0 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ background: bg, borderTop: `1px solid ${border}` }}>
      <div className="flex items-center h-16 px-2">
        {tabs.map(tab => {
          const Icon     = tab.icon;
          const isActive = active === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              whileTap={{ scale: 0.88 }}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: activeClr }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8}
                color={isActive ? activeClr : inactiveClr} />
              <span className="text-[10px] font-semibold tracking-wide"
                style={{ color: isActive ? activeClr : inactiveClr }}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
