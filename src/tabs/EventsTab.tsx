import { useState, useMemo, useRef, useCallback } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Bell, X, RefreshCw } from 'lucide-react';
import { Member } from '../types';

interface Props {
  members: Member[];
  onSelectMember: (m: Member) => void;
  darkMode?: boolean;
}

const MONTHS_VN = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                   'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const DAYS_VN = ['CN','T2','T3','T4','T5','T6','T7'];
const THIS_YEAR = new Date().getFullYear();

interface Evt {
  member: Member;
  type: 'death' | 'birthday';
  day: number;
  month: number; // 0-based
  year: number;  // năm gốc
  daysLeft: number;
  lunar?: string;
}

function buildEvents(members: Member[], today: Date): Evt[] {
  const list: Evt[] = [];
  members.forEach(m => {
    const add = (dateStr: string, type: 'death' | 'birthday', lunar?: string) => {
      const d  = new Date(dateStr);
      const origYear = d.getFullYear();
      const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      if (next < today) next.setFullYear(today.getFullYear() + 1);
      const diff = Math.ceil((next.getTime() - today.getTime()) / 86400000);
      if (diff <= 60)
        list.push({ member: m, type, day: d.getDate(), month: d.getMonth(), year: origYear, daysLeft: diff, lunar });
    };
    if (m.deathDate)              add(m.deathDate,  'death',    m.deathDateLunar);
    if (m.birthDate && !m.deathDate) add(m.birthDate, 'birthday', m.birthDateLunar);
  });
  return list.sort((a, b) => a.daysLeft - b.daysLeft);
}

// ── Tính tuổi thọ ──────────────────────────────────────────────────────
function calcLifespan(m: Member): number | null {
  if (!m.birthDate || !m.deathDate) return null;
  const by = parseInt(m.birthDate.slice(0, 4));
  const dy = parseInt(m.deathDate.slice(0, 4));
  return isNaN(by) || isNaN(dy) ? null : dy - by;
}

// ── Hưởng thọ / Hưởng dương ────────────────────────────────────────────
function lifespanLabel(lifespan: number | null): string {
  if (lifespan === null) return '';
  return lifespan >= 70 ? `Hưởng thọ ${lifespan} tuổi` : `Hưởng dương ${lifespan} tuổi`;
}

// ── Card sự kiện phong phú ──────────────────────────────────────────────
function EventCard({ ev, onSelect, isDark }: { ev: Evt; onSelect: () => void; isDark: boolean }) {
  const cardBg   = isDark ? '#1e2a3a' : 'white';
  const textMain = isDark ? '#f1f5f9' : '#111827';
  const textSub  = isDark ? '#64748b' : '#9CA3AF';
  const border   = isDark ? '#2d3748' : '#F3F4F6';

  const urgencyColor = ev.daysLeft === 0 ? '#EF4444' : ev.daysLeft <= 3 ? '#F97316' : ev.daysLeft <= 7 ? '#D97706' : '#6B7280';
  const dispDate = `${ev.day}/${ev.month + 1}`;

  let ordinalInfo = '';
  let lifespanInfo = '';

  if (ev.type === 'death') {
    const nth = THIS_YEAR - ev.year;
    if (nth > 0) ordinalInfo = `Giỗ lần thứ ${nth}`;
    const ls = calcLifespan(ev.member);
    lifespanInfo = lifespanLabel(ls);
  } else {
    const nth = THIS_YEAR - ev.year;
    if (nth > 0) ordinalInfo = `Sinh nhật lần thứ ${nth}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onSelect}
      className="rounded-2xl overflow-hidden cursor-pointer shadow-sm"
      style={{ background: cardBg, border: `1px solid ${border}` }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Ngày */}
        <div className="flex-shrink-0 text-center w-10">
          <p className="text-2xl font-black leading-none" style={{ color: urgencyColor }}>{ev.day}</p>
          <p className="text-[9px] font-bold uppercase" style={{ color: textSub }}>Th.{ev.month + 1}</p>
        </div>
        <div className="w-px h-10 flex-shrink-0" style={{ background: border }} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span>{ev.type === 'death' ? '🔥' : '🎂'}</span>
            <span className="text-xs font-bold" style={{ color: ev.type === 'death' ? '#D97706' : '#2563EB' }}>
              {ev.type === 'death' ? 'Ngày Giỗ' : 'Sinh Nhật'}
            </span>
          </div>
          <p className="font-bold text-sm truncate" style={{ color: textMain }}>{ev.member.name}</p>
          {ordinalInfo && <p className="text-xs font-semibold" style={{ color: ev.type === 'death' ? '#D97706' : '#2563EB' }}>{ordinalInfo}</p>}
          {lifespanInfo && <p className="text-xs" style={{ color: textSub }}>{lifespanInfo}</p>}
          {ev.lunar
            ? <p className="text-xs" style={{ color: '#7A5A00' }}>🌙 {ev.lunar} Âm lịch</p>
            : <p className="text-xs" style={{ color: textSub }}>📅 {dispDate} Dương lịch</p>
          }
        </div>

        {/* Countdown */}
        <div className="flex-shrink-0 text-center">
          <div className="px-2.5 py-1.5 rounded-xl"
            style={{
              background: ev.daysLeft === 0 ? '#EF4444' : (isDark ? `${urgencyColor}22` : '#F3F4F6'),
              color: ev.daysLeft === 0 ? 'white' : urgencyColor,
            }}>
            {ev.daysLeft === 0
              ? <><p className="text-base font-black">!</p><p className="text-[9px] font-bold">Hôm nay</p></>
              : <><p className="text-base font-black">{ev.daysLeft}</p><p className="text-[9px] font-bold" style={{ color: textSub }}>ngày</p></>
            }
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function EventsTab({ members, onSelectMember, darkMode }: Props) {
  const today = useMemo(() => new Date(), []);
  const [cal, setCal] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [refreshing, setRefreshing]   = useState(false);
  const [pullDelta, setPullDelta]     = useState(0);
  const pullStartY = useRef(0);
  const pulling    = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    pullStartY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current) return;
    const d = e.touches[0].clientY - pullStartY.current;
    if (d > 0 && d < 100) setPullDelta(d);
  }, []);
  const handleTouchEnd = useCallback(() => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDelta > 60) {
      setRefreshing(true);
      setPullDelta(0);
      setTimeout(() => setRefreshing(false), 900);
    } else setPullDelta(0);
  }, [pullDelta]);

  // Theme
  const bg       = darkMode ? '#111214' : '#F9FAFB';
  const cardBg   = darkMode ? '#1e2a3a' : 'white';
  const textMain = darkMode ? '#f1f5f9' : '#111827';
  const textSub  = darkMode ? '#64748b' : '#6B7280';
  const border   = darkMode ? '#2d3748' : '#F3F4F6';
  const headerBg = darkMode ? '#1a2030' : 'white';

  const events  = useMemo(() => buildEvents(members, today), [members, today]);

  // Tất cả sự kiện của tháng đang xem (bất kể daysLeft)
  const allMonthEvents = useMemo(() => {
    const list: Evt[] = [];
    members.forEach(m => {
      const add = (dateStr: string, type: 'death' | 'birthday', lunar?: string) => {
        const d = new Date(dateStr);
        if (d.getMonth() !== cal.m) return;
        list.push({ member: m, type, day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), daysLeft: 0, lunar });
      };
      if (m.deathDate) add(m.deathDate, 'death', m.deathDateLunar);
      if (m.birthDate && !m.deathDate) add(m.birthDate, 'birthday', m.birthDateLunar);
    });
    return list.sort((a, b) => a.day - b.day);
  }, [members, cal.m]);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, Evt[]>();
    allMonthEvents.forEach(e => {
      if (!map.has(e.day)) map.set(e.day, []);
      map.get(e.day)!.push(e);
    });
    return map;
  }, [allMonthEvents]);

  // Sự kiện của ngày được chọn
  const selectedDayEvents = useMemo(() =>
    selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [],
    [selectedDay, eventsByDay]
  );

  // Tính daysLeft cho selectedDayEvents
  const selectedDayEventsWithCountdown = useMemo(() =>
    selectedDayEvents.map(e => {
      const next = new Date(today.getFullYear(), e.month, e.day);
      if (next < today) next.setFullYear(today.getFullYear() + 1);
      const diff = Math.ceil((next.getTime() - today.getTime()) / 86400000);
      return { ...e, daysLeft: diff };
    }),
    [selectedDayEvents, today]
  );

  // Build lưới calendar
  const firstDow    = new Date(cal.y, cal.m, 1).getDay();
  const daysInMonth = new Date(cal.y, cal.m + 1, 0).getDate();
  const prevDays    = new Date(cal.y, cal.m, 0).getDate();
  type Cell = { d: number; cur: boolean };
  const cells: Cell[] = [];
  for (let i = firstDow - 1; i >= 0; i--) cells.push({ d: prevDays - i, cur: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ d: i, cur: true });
  while (cells.length % 7 !== 0) cells.push({ d: cells.length - daysInMonth - firstDow + 1, cur: false });

  const prevMonth = () => { setSelectedDay(null); setCal(c => c.m === 0 ? { y: c.y-1, m: 11 } : { y: c.y, m: c.m-1 }); };
  const nextMonth = () => { setSelectedDay(null); setCal(c => c.m === 11 ? { y: c.y+1, m: 0 } : { y: c.y, m: c.m+1 }); };

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: bg }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh */}
      <AnimatePresence>
        {(pullDelta > 10 || refreshing) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: Math.min(pullDelta * 0.5 + 4, 44), opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-center gap-2 overflow-hidden flex-shrink-0"
            style={{ background: darkMode ? '#1a2030' : 'white' }}
          >
            <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 0.7, linear: true }}>
              <RefreshCw size={14} color="#CC0000" />
            </motion.div>
            <span style={{ fontSize: 12, color: '#CC0000', fontWeight: 700 }}>
              {refreshing ? 'Đang tải lại...' : pullDelta > 60 ? 'Thả để tải lại' : 'Kéo xuống để tải lại'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b shadow-sm" style={{ background: headerBg, borderColor: border }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: textMain }}>Lịch Dòng Họ Lê</h2>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl" style={{ background: darkMode ? '#2d1a1a' : '#FEF3C7' }}>
            <Bell size={13} style={{ color: '#CC0000' }} />
            <span className="text-xs font-bold" style={{ color: '#CC0000' }}>{events.length} sự kiện</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ touchAction: 'pan-y' }}>

        {/* Calendar card */}
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-sm" style={{ background: cardBg, border: `1px solid ${border}` }}>
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: border }}>
            <motion.button whileTap={{ scale: 0.85 }} onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: darkMode ? '#2d3748' : '#F3F4F6' }}>
              <ChevronLeft size={17} style={{ color: textMain }} />
            </motion.button>
            <p className="font-bold" style={{ color: textMain }}>{MONTHS_VN[cal.m]}, {cal.y}</p>
            <motion.button whileTap={{ scale: 0.85 }} onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: darkMode ? '#2d3748' : '#F3F4F6' }}>
              <ChevronRight size={17} style={{ color: textMain }} />
            </motion.button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pt-2">
            {DAYS_VN.map(d => (
              <div key={d} className="text-center text-[10px] font-bold py-1" style={{ color: textSub }}>{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-y-1 px-3 pb-3">
            {cells.map((cell, i) => {
              const isToday = cell.cur && cell.d === today.getDate() && cal.m === today.getMonth() && cal.y === today.getFullYear();
              const hasEvt  = cell.cur && eventsByDay.has(cell.d);
              const isSelected = cell.cur && selectedDay === cell.d;
              const evtCount   = cell.cur ? (eventsByDay.get(cell.d)?.length ?? 0) : 0;

              return (
                <div key={i} className="h-11 flex flex-col items-center justify-center relative"
                  onClick={() => cell.cur && setSelectedDay(selectedDay === cell.d ? null : cell.d)}
                >
                  <div
                    className="w-8 h-8 flex items-center justify-center rounded-full font-semibold text-sm transition-all"
                    style={{
                      background: isSelected ? '#CC0000' : isToday ? `${darkMode ? '#ff3333' : '#CC0000'}22` : 'transparent',
                      color: isSelected ? 'white' : cell.cur ? textMain : (darkMode ? '#334155' : '#D1D5DB'),
                      cursor: cell.cur ? 'pointer' : 'default',
                    }}
                  >
                    {cell.d}
                  </div>
                  {/* Chấm event — tối đa 2 chấm */}
                  {hasEvt && (
                    <div className="flex gap-0.5 absolute bottom-0.5">
                      {Array(Math.min(evtCount, 2)).fill(0).map((_, di) => (
                        <div key={di} className="w-1.5 h-1.5 rounded-full" style={{ background: '#7A5A00' }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Panel ngày được chọn ── */}
          <AnimatePresence>
            {selectedDay !== null && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t"
                style={{ borderColor: border }}
              >
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-sm" style={{ color: textMain }}>
                      Ngày {selectedDay}/{cal.m + 1}
                    </p>
                    <button onClick={() => setSelectedDay(null)}>
                      <X size={14} style={{ color: textSub }} />
                    </button>
                  </div>

                  {selectedDayEventsWithCountdown.length === 0 ? (
                    <p className="text-xs py-2" style={{ color: textSub }}>Không có sự kiện ngày này</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayEventsWithCountdown.map((ev, i) => {
                        const nth = ev.type === 'death'
                          ? THIS_YEAR - ev.year
                          : THIS_YEAR - ev.year;
                        const ordinal = ev.type === 'death' ? `Giỗ lần thứ ${nth}` : `Sinh nhật lần thứ ${nth}`;
                        const ls = ev.type === 'death' ? calcLifespan(ev.member) : null;

                        return (
                          <div key={i}
                            onClick={() => onSelectMember(ev.member)}
                            className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer"
                            style={{ background: darkMode ? '#253040' : '#F8FAFC' }}
                          >
                            <span className="text-xl">{ev.type === 'death' ? '🔥' : '🎂'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs truncate" style={{ color: textMain }}>{ev.member.name}</p>
                              <p className="text-[10px]" style={{ color: ev.type === 'death' ? '#D97706' : '#2563EB' }}>{ordinal}</p>
                              {ls !== null && <p className="text-[10px]" style={{ color: textSub }}>{lifespanLabel(ls)}</p>}
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-black" style={{ color: ev.daysLeft === 0 ? '#EF4444' : '#6B7280' }}>
                                {ev.daysLeft === 0 ? 'Hôm nay' : `${ev.daysLeft}d`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Upcoming events list */}
        <div className="px-4 mt-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold" style={{ color: textMain }}>Sắp diễn ra</p>
            <p className="text-xs" style={{ color: textSub }}>60 ngày tới</p>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12" style={{ color: textSub }}>
              <div className="text-5xl mb-3">🌸</div>
              <p className="font-medium">Không có sự kiện trong 60 ngày tới</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev, i) => (
                <EventCard
                  key={`${ev.member.id}-${ev.type}`}
                  ev={ev}
                  onSelect={() => onSelectMember(ev.member)}
                  isDark={darkMode ?? false}
                />
              ))}
            </div>
          )}

          {members.filter(m => m.deathDate).length === 0 && (
            <div className="mt-4 rounded-2xl p-4 border" style={{ background: darkMode ? '#1a1500' : '#FFFBEB', borderColor: '#B8860B33' }}>
              <div className="flex items-start gap-3">
                <Bell size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold" style={{ color: '#92400E' }}>Bật nhắc ngày giỗ</p>
                  <p className="text-xs mt-1" style={{ color: '#B45309' }}>
                    Thêm ngày mất để nhận nhắc nhở ngày giỗ tự động
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
