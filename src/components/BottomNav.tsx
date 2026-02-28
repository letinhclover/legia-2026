import { motion } from 'framer-motion';
import { Network, Users, Calendar, Settings } from 'lucide-react';

export type TabId = 'tree' | 'directory' | 'events' | 'settings';

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const tabs = [
  { id: 'tree' as TabId, label: 'Phả Hệ', icon: Network },
  { id: 'directory' as TabId, label: 'Danh Sách', icon: Users },
  { id: 'events' as TabId, label: 'Sự Kiện', icon: Calendar },
  { id: 'settings' as TabId, label: 'Quản Trị', icon: Settings },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <div className="flex-shrink-0 bg-white border-t border-gray-100 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center h-16 px-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
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
                  style={{ background: '#800000' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                color={isActive ? '#800000' : '#9CA3AF'}
              />
              <span
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: isActive ? '#800000' : '#9CA3AF' }}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
