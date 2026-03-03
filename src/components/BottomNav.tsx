import { motion } from 'framer-motion';
import { Network, Users, Calendar, Settings } from 'lucide-react';
import VisitorCounter from './VisitorCounter';

export type TabId = 'tree' | 'directory' | 'events' | 'settings';

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
  darkMode?: boolean;
}

const tabs = [
  { id: 'tree'      as TabId, label: 'Gia phả',   icon: Network  },
  { id: 'directory' as TabId, label: 'Danh sách', icon: Users    },
  { id: 'events'    as TabId, label: 'Sự kiện',   icon: Calendar },
  { id: 'settings'  as TabId, label: 'Cài đặt',   icon: Settings },
];

export default function BottomNav({ active, onChange, darkMode = false }: Props) {
  /* ── Màu sắc theo darkMode ── */
  const activeColor  = '#D4AF37';           // Vàng antique — nhất quán 2 theme
  const inactiveColor = darkMode ? '#6B7E96' : '#9C8E82';

  return (
    <div
      className={darkMode ? 'bottom-nav-glass-dark' : 'bottom-nav-glass'}
      style={{
        flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Visitor counter — hiển thị trên thanh nav */}
      <VisitorCounter darkMode={darkMode} compact />

      {/* Tab buttons */}
      <div className="flex items-center h-14 px-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const on   = active === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              whileTap={{ scale: 0.80 }}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative"
            >
              {/* Active indicator — pill trên cùng */}
              {on && (
                <motion.div
                  layoutId="navActivePill"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full"
                  style={{ width: 28, background: activeColor }}
                  transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                />
              )}

              {/* Active background glow */}
              {on && (
                <motion.div
                  layoutId="navActiveGlow"
                  className="absolute inset-x-2 inset-y-1 rounded-xl"
                  style={{
                    background: darkMode
                      ? 'rgba(212,175,55,0.10)'
                      : 'rgba(128,0,0,0.06)',
                  }}
                  transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                />
              )}

              <motion.div
                animate={{ scale: on ? 1.12 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              >
                <Icon
                  size={20}
                  strokeWidth={on ? 2.5 : 1.6}
                  color={on ? activeColor : inactiveColor}
                />
              </motion.div>

              <span
                className="font-semibold tracking-wide relative"
                style={{
                  fontSize: 9,
                  color: on ? activeColor : inactiveColor,
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontWeight: on ? 700 : 500,
                }}
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
