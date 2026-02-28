import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Bell, Plus } from 'lucide-react';
import { Member } from '../types';

interface Props { members: Member[]; onSelectMember: (m: Member) => void; }

const MONTHS  = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const DAYS_VN = ['CN','T2','T3','T4','T5','T6','T7'];

interface Evt { member: Member; type: 'death' | 'birthday'; day: number; month: number; daysLeft: number; lunar?: string; }

export default function EventsTab({ members, onSelectMember }: Props) {
  const today = new Date();
  const [cur, setCur] = useState({ y: today.getFullYear(), m: today.getMonth() });

  // Tính sự kiện trong 30 ngày tới
  const events = useMemo<Evt[]>(() => {
    const list: Evt[] = [];
    members.forEach(m => {
      const addEvent = (dateStr: string, type: 'death' | 'birthday', lunar?: string) => {
        const d = new Date(dateStr);
        const evt = new Date(today.getFullYear(), d.getMonth(), d.getDate());
        if (evt < today) evt.setFullYear(today.getFullYear() + 1);
        const daysLeft = Math.ceil((evt.getTime() - today.getTime()) / 86400000);
        if (daysLeft <= 60)
          list.push({ member: m, type, day: d.getDate(), month: d.getMonth(), daysLeft, lunar });
      };
      if (m.deathDate) addEvent(m.deathDate, 'death', m.deathDateLunar);
      if (m.birthDate && !m.deathDate) addEvent(m.birthDate, 'birthday', m.birthDateLunar);
    });
    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [members]);

  // Ngày có event trong tháng hiện tại
  const eventDays = new Set(
    events.filter(e => e.month === cur.m).map(e => e.day)
  );

  // Build calendar grid
  const firstDay = new Date(cur.y, cur.m, 1).getDay();
  const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate();
  const prevDays = new Date(cur.y, cur.m, 0).getDate();
  const cells: Array<{ d: number; cur: boolean }> = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ d: prevDays - i, cur: false });
  for (let i = 1; i <= daysInMonth; i++)
    cells.push({ d: i, cur: true });
  while (cells.length % 7 !== 0)
    cells.push({ d: cells.length - daysInMonth - firstDay + 1, cur: false });

  const prevMonth = () => setCur(p => p.m === 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m: p.m - 1 });
  const nextMonth = () => setCur(p => p.m === 11 ? { y: p.y + 1, m: 0 } : { y: p.y, m: p.m + 1 });

  const urgency = (d: number) => {
    if (d === 0) return '#EF4444';
    if (d <= 3)  return '#F97316';
    if (d <= 7)  return '#D4AF37';
    return '#92adc9';
  };

  return (
    <div className="flex flex-col h-full hide-scrollbar" style={{ background: '#101922' }}>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3"
        style={{ background: '#192633', borderBottom: '1px solid #233648' }}>
        <h2 className="font-bold text-white text-lg">Lịch Dòng Họ Lê</h2>
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#233648' }}>
          <Bell size={18} color="#D4AF37" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">

        {/* Calendar card */}
        <div className="mx-4 mt-4 rounded-2xl p-4" style={{ background: '#192633', border: '1px solid #233648' }}>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#233648' }}>
              <ChevronLeft size={18} color="#D4AF37" />
            </button>
            <div className="text-center">
              <p className="font-bold text-white text-base">{MONTHS[cur.m]}, {cur.y}</p>
            </div>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#233648' }}>
              <ChevronRight size={18} color="#D4AF37" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_VN.map(d => (
              <div key={d} className="text-center text-xs font-bold py-1" style={{ color: '#92adc9' }}>{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((cell, i) => {
              const isToday = cell.cur && cell.d === today.getDate() && cur.m === today.getMonth() && cur.y === today.getFullYear();
              const hasEvent = cell.cur && eventDays.has(cell.d);
              return (
                <div key={i} className="h-10 flex flex-col items-center justify-center relative">
                  <div
                    className="w-9 h-9 flex items-center justify-center rounded-full font-semibold text-sm"
                    style={{
                      background: isToday ? '#D4AF37' : 'transparent',
                      color: isToday ? '#101922' : cell.cur ? '#fff' : '#3a5a7a',
                    }}
                  >
                    {cell.d}
                  </div>
                  {hasEvent && !isToday && (
                    <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full" style={{ background: '#D4AF37' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Events list */}
        <div className="px-4 mt-5 pb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-white">Sự kiện sắp tới</p>
            <button className="text-xs font-semibold" style={{ color: '#D4AF37' }}>Xem tất cả</button>
          </div>

          {events.length === 0 && (
            <div className="text-center py-10" style={{ color: '#92adc9' }}>
              <p className="text-4xl mb-3">🌸</p>
              <p>Không có sự kiện trong 60 ngày tới</p>
            </div>
          )}

          <div className="space-y-3">
            {events.map((evt, i) => {
              const color = urgency(evt.daysLeft);
              const dispDate = `${evt.day}/${evt.month + 1}`;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => onSelectMember(evt.member)}
                  className="flex items-center gap-4 rounded-2xl px-4 py-4 cursor-pointer"
                  style={{ background: '#192633', border: '1px solid #233648' }}>

                  {/* Ngày */}
                  <div className="flex-shrink-0 text-center w-12">
                    <p className="text-xl font-black" style={{ color }}>{evt.day}</p>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#92adc9' }}>
                      Th.{evt.month + 1}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm">{evt.type === 'death' ? '🔥' : '🎂'}</span>
                      <span className="text-xs font-bold" style={{ color: evt.type === 'death' ? '#F97316' : '#60A5FA' }}>
                        {evt.type === 'death' ? 'Ngày Giỗ' : 'Sinh Nhật'}
                      </span>
                    </div>
                    <p className="font-bold text-white truncate">
                      {evt.type === 'death' ? 'Giỗ ' : ''}{evt.member.name.split(' ').slice(-2).join(' ')}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs" style={{ color: '#92adc9' }}>
                        📅 {evt.lunar || dispDate} Âm lịch
                      </span>
                    </div>
                  </div>

                  {/* Đếm ngược */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-black" style={{ color }}>
                      {evt.daysLeft === 0 ? 'Hôm nay' : `Còn ${evt.daysLeft}`}
                    </p>
                    {evt.daysLeft > 0 && <p className="text-xs" style={{ color: '#92adc9' }}>ngày</p>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAB thêm sự kiện */}
      <motion.button
        whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.1 }}
        className="absolute bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-20"
        style={{ background: '#D4AF37' }}>
        <Plus size={26} strokeWidth={3} color="#101922" />
      </motion.button>
    </div>
  );
}
