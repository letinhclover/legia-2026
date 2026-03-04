/**
 * components/NotificationBanner.tsx
 * Banner hiển thị sự kiện sắp tới (ngày giỗ / sinh nhật)
 * + Nút bật thông báo Push
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, ChevronRight } from 'lucide-react';
import { Member } from '../types';
import {
  getUpcomingEvents,
  UpcomingEvent,
  requestNotificationPermission,
  getNotificationPermission,
  checkAndNotifyToday,
  scheduleUpcomingNotifications,
} from '../utils/notifications';

interface Props {
  members:          Member[];
  darkMode?:        boolean;
  onSelectMember?:  (m: Member) => void;
}

export default function NotificationBanner({ members, darkMode, onSelectMember }: Props) {
  const [events, setEvents]         = useState<UpcomingEvent[]>([]);
  const [dismissed, setDismissed]   = useState(false);
  const [permState, setPermState]   = useState(getNotificationPermission());
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Theme
  const bg     = darkMode ? '#1a2535' : '#FFFDF7';
  const border = darkMode ? '#2d3d52' : '#E2D8CA';
  const textM  = darkMode ? '#E8DDD0' : '#1C1410';
  const textS  = darkMode ? '#8A9BB0' : '#6B5E52';

  useEffect(() => {
    if (members.length === 0) return;
    const upcoming = getUpcomingEvents(members, 7);
    setEvents(upcoming);

    // Gửi thông báo hôm nay nếu đã được cấp quyền
    checkAndNotifyToday(members);
    scheduleUpcomingNotifications(members);

    // Hiện prompt xin quyền nếu chưa hỏi và có sự kiện
    if (upcoming.length > 0 && permState === 'default') {
      setTimeout(() => setShowPrompt(true), 3000);
    }
  }, [members]);

  // Rotate qua các event mỗi 4 giây nếu có nhiều
  useEffect(() => {
    if (events.length <= 1) return;
    const t = setInterval(() => setCurrentIdx(i => (i + 1) % events.length), 4000);
    return () => clearInterval(t);
  }, [events.length]);

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermState(granted ? 'granted' : 'denied');
    setShowPrompt(false);
    if (granted) {
      checkAndNotifyToday(members);
    }
  }, [members]);

  if (dismissed || events.length === 0) return null;

  const evt = events[currentIdx];
  const isToday = evt.daysLeft === 0;
  const isTomorrow = evt.daysLeft === 1;
  const accentColor = evt.type === 'death' ? '#800000' : '#1D4ED8';
  const accentBg    = evt.type === 'death'
    ? (darkMode ? '#2a0808' : '#FEF2F2')
    : (darkMode ? '#0d1f3c' : '#EFF6FF');

  return (
    <>
      {/* ── Banner sự kiện sắp tới ── */}
      <AnimatePresence>
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          style={{
            background: accentBg,
            borderBottom: `1px solid ${accentColor}30`,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          {/* Icon */}
          <div style={{ fontSize: 20, flexShrink: 0 }}>
            {evt.type === 'death' ? '🕯️' : '🎂'}
          </div>

          {/* Nội dung */}
          <div
            style={{ flex: 1, minWidth: 0, cursor: onSelectMember ? 'pointer' : 'default' }}
            onClick={() => onSelectMember?.(evt.member)}
          >
            <div style={{
              fontSize: 12, fontWeight: 800, color: accentColor,
              fontFamily: "'Be Vietnam Pro', sans-serif",
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {evt.eventLabel} — {evt.member.name}
            </div>
            <div style={{
              fontSize: 10, color: textS,
              fontFamily: "'Be Vietnam Pro', sans-serif",
              display: 'flex', gap: 6, alignItems: 'center',
            }}>
              <span style={{ fontWeight: 700, color: isToday ? '#DC2626' : isTomorrow ? '#D97706' : textS }}>
                {evt.dateLabel}
              </span>
              {evt.lunar && <span>· Âm: {evt.lunar}</span>}
              {events.length > 1 && (
                <span style={{ color: textS, opacity: 0.6 }}>
                  · {currentIdx + 1}/{events.length}
                </span>
              )}
            </div>
          </div>

          {/* Nút xem chi tiết */}
          {onSelectMember && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => onSelectMember(evt.member)}
              style={{
                background: accentColor, color: 'white',
                border: 'none', borderRadius: 8,
                padding: '4px 8px',
                fontSize: 10, fontWeight: 700,
                cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 3,
                fontFamily: "'Be Vietnam Pro', sans-serif",
              }}
            >
              Xem <ChevronRight size={10} />
            </motion.button>
          )}

          {/* Nút đóng */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setDismissed(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, flexShrink: 0, color: textS,
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={14} />
          </motion.button>
        </motion.div>
      </AnimatePresence>

      {/* ── Prompt xin quyền Push Notification ── */}
      <AnimatePresence>
        {showPrompt && permState === 'default' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: 'fixed', bottom: 80, left: 16, right: 16,
              background: bg, border: `1.5px solid ${border}`,
              borderRadius: 20, padding: '16px 18px',
              boxShadow: '0 8px 32px rgba(28,20,16,0.18)',
              zIndex: 200,
              fontFamily: "'Be Vietnam Pro', sans-serif",
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>🔔</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: textM, marginBottom: 4 }}>
                  Nhận thông báo ngày giỗ & sinh nhật?
                </div>
                <div style={{ fontSize: 12, color: textS, lineHeight: 1.5, marginBottom: 12 }}>
                  App sẽ nhắc bạn trước <strong>3 ngày</strong> khi có ngày giỗ hoặc sinh nhật trong dòng họ.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={handleRequestPermission}
                    style={{
                      flex: 1, padding: '8px 0',
                      background: 'linear-gradient(135deg, #800000, #5C0000)',
                      color: 'white', border: 'none', borderRadius: 12,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <Bell size={14} /> Bật thông báo
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setShowPrompt(false)}
                    style={{
                      padding: '8px 14px',
                      background: darkMode ? '#253040' : '#F3F4F6',
                      color: textS, border: 'none', borderRadius: 12,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <BellOff size={13} /> Không
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
