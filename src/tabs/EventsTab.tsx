import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { Member } from '../types';

interface Props {
  members: Member[];
  onSelectMember: (m: Member) => void;
}

const MONTHS_VN = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                   'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const DAYS_VN   = ['CN','T2','T3','T4','T5','T6','T7'];

interface Evt {
  member: Member;
  type: 'death' | 'birthday';
  day: number;
  month: number;
  daysLeft: number;
  lunar?: string;
}

export default function EventsTab({ members, onSelectMember }: Props) {
  const today = new Date();
  const [cal, setCal] = useState({ y: today.getFullYear(), m: today.getMonth() });

  // Tính sự kiện 60 ngày tới
  const events = useMemo<Evt[]>(() => {
    const list: Evt[] = [];
    members.forEach(m => {
      const add = (dateStr: string, type: 'death' | 'birthday', lunar?: string) => {
        const d = new Date(dateStr);
        const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
        if (next < today) next.setFullYear(today.getFullYear() + 1);
        const diff = Math.ceil((next.getTime() - today.getTime()) / 86400000);
        if (diff <= 60)
          list.push({ member: m, type, day: d.getDate(), month: d.getMonth(), daysLeft: diff, lunar });
      };
      if (m.deathDate)  add(m.deathDate,  'death',    m.deathDateLunar);
      if (m.birthDate && !m.deathDate) add(m.birthDate, 'birthday', m.birthDateLunar);
    });
    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [members]);

  // Ngày có sự kiện trong tháng đang xem
  const eventDaySet = useMemo(() =>
    new Set(events.filter(e => e.month === cal.m).map(e => e.day)),
    [events, cal.m]
  );

  // Build lưới tháng
  const firstDow    = new Date(cal.y, cal.m, 1).getDay();
  const daysInMonth = new Date(cal.y, cal.m + 1, 0).getDate();
  const prevDays    = new Date(cal.y, cal.m, 0).getDate();
  type Cell = { d: number; cur: boolean };
  const cells: Cell[] = [];
  for (let i = firstDow - 1; i >= 0; i--)  cells.push({ d: prevDays - i, cur: false });
  for (let i = 1; i <= daysInMonth; i++)    cells.push({ d: i, cur: true });
  while (cells.length % 7 !== 0)            cells.push({ d: cells.length - daysInMonth - firstDow + 1, cur: false });

  const prevMonth = () => setCal(c => c.m === 0  ? { y: c.y-1, m: 11 } : { y: c.y, m: c.m-1 });
  const nextMonth = () => setCal(c => c.m === 11 ? { y: c.y+1, m: 0  } : { y: c.y, m: c.m+1 });

  const urgency = (d: number) =>
    d === 0 ? '#EF4444' : d <= 3 ? '#F97316' : d <= 7 ? '#D97706' : '#6B7280';

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Lịch Dòng Họ Lê</h2>
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-xl">
            <Bell size={13} style={{ color: '#800000' }} />
            <span className="text-xs font-bold" style={{ color: '#800000' }}>{events.length} sự kiện</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Calendar card — phong cách Stitch ── */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <motion.button whileTap={{ scale: 0.85 }} onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
              <ChevronLeft size={17} className="text-gray-600" />
            </motion.button>
            <div className="text-center">
              <p className="font-bold text-gray-900">{MONTHS_VN[cal.m]}, {cal.y}</p>
            </div>
            <motion.button whileTap={{ scale: 0.85 }} onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
              <ChevronRight size={17} className="text-gray-600" />
            </motion.button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pt-2">
            {DAYS_VN.map(d => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-y-1 px-3 pb-3">
            {cells.map((cell, i) => {
              const isToday = cell.cur
                && cell.d === today.getDate()
                && cal.m === today.getMonth()
                && cal.y === today.getFullYear();
              const hasEvent = cell.cur && eventDaySet.has(cell.d);
              return (
                <div key={i} className="h-10 flex flex-col items-center justify-center relative">
                  <div
                    className="w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold"
                    style={{
                      background: isToday ? '#800000' : 'transparent',
                      color: isToday ? 'white' : cell.cur ? '#111827' : '#D1D5DB',
                    }}
                  >
                    {cell.d}
                  </div>
                  {hasEvent && !isToday && (
                    <div className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full"
                      style={{ background: '#B8860B' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Events list ── */}
        <div className="px-4 mt-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-800">Sắp diễn ra</p>
            <p className="text-xs text-gray-400">60 ngày tới</p>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-3">🌸</div>
              <p className="font-medium">Không có sự kiện</p>
              <p className="text-sm mt-1">trong 60 ngày tới</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev, i) => {
                const col = urgency(ev.daysLeft);
                const dispDate = `${ev.day}/${ev.month + 1}`;
                return (
                  <motion.div
                    key={`${ev.member.id}-${ev.type}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.5) }}
                    onClick={() => onSelectMember(ev.member)}
                    className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      {/* Ngày */}
                      <div className="flex-shrink-0 text-center w-11">
                        <p className="text-2xl font-black leading-none" style={{ color: col }}>{ev.day}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Th.{ev.month + 1}</p>
                      </div>

                      {/* Divider dọc */}
                      <div className="w-px h-10 bg-gray-100 flex-shrink-0" />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm">{ev.type === 'death' ? '🔥' : '🎂'}</span>
                          <span className="text-xs font-bold"
                            style={{ color: ev.type === 'death' ? '#D97706' : '#2563EB' }}>
                            {ev.type === 'death' ? 'Ngày Giỗ' : 'Sinh Nhật'}
                          </span>
                        </div>
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {ev.type === 'death' ? `Giỗ ` : ''}{ev.member.name}
                        </p>
                        {ev.lunar && (
                          <p className="text-xs text-amber-600 mt-0.5">
                            🌙 {ev.lunar} Âm lịch
                          </p>
                        )}
                        {!ev.lunar && (
                          <p className="text-xs text-gray-400 mt-0.5">📅 {dispDate} Dương lịch</p>
                        )}
                      </div>

                      {/* Countdown badge */}
                      <div className="flex-shrink-0 text-center">
                        <div
                          className="px-2.5 py-1.5 rounded-xl"
                          style={{
                            background: ev.daysLeft === 0 ? '#EF4444' : ev.daysLeft <= 3 ? '#FFF7ED' : '#F3F4F6',
                            color: ev.daysLeft === 0 ? 'white' : col,
                          }}
                        >
                          {ev.daysLeft === 0 ? (
                            <><p className="text-base font-black">!</p><p className="text-[9px] font-bold">Hôm nay</p></>
                          ) : (
                            <><p className="text-base font-black">{ev.daysLeft}</p><p className="text-[9px] font-bold text-gray-500">ngày</p></>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Gợi ý thêm ngày mất */}
          {members.filter(m => m.deathDate).length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="mt-4 bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <div className="flex items-start gap-3">
                <Bell size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Bật nhắc ngày giỗ</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Thêm ngày mất cho các cụ đã khuất để nhận nhắc nhở tự động
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
