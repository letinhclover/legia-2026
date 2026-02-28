import { motion } from 'framer-motion';
import { Network, Users, Calendar, Settings, Wallet, BookImage } from 'lucide-react';

export type TabId = 'tree' | 'directory' | 'events' | 'fund' | 'library' | 'settings';

interface Props { active: TabId; onChange: (tab: TabId) => void; }

const tabs = [
  { id: 'tree'      as TabId, label: 'Gia phả',  icon: Network    },
  { id: 'directory' as TabId, label: 'Danh sách', icon: Users      },
  { id: 'events'    as TabId, label: 'Sự kiện',   icon: Calendar   },
  { id: 'fund'      as TabId, label: 'Quỹ',       icon: Wallet     },
  { id: 'library'   as TabId, label: 'Thư viện',  icon: BookImage  },
  { id: 'settings'  as TabId, label: 'Cài đặt',   icon: Settings   },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <div
      className="flex-shrink-0 hide-scrollbar"
      style={{
        background: '#192633',
        borderTop: '1px solid #233648',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center h-14 px-1">
        {tabs.map(tab => {
          const Icon  = tab.icon;
          const on    = active === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              whileTap={{ scale: 0.82 }}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative"
            >
              {on && (
                <motion.div
                  layoutId="navActive"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                  style={{ background: '#D4AF37' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <Icon size={20} strokeWidth={on ? 2.5 : 1.6}
                color={on ? '#D4AF37' : '#92adc9'} />
              <span className="font-semibold tracking-wide"
                style={{ fontSize: 9, color: on ? '#D4AF37' : '#92adc9' }}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
