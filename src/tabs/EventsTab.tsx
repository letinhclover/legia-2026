import { motion } from 'framer-motion';
import { Calendar, Bell } from 'lucide-react';
import { Member } from '../types';

interface Props {
  members: Member[];
  onSelectMember: (m: Member) => void;
}

interface Event {
  member: Member;
  type: 'birthday' | 'death';
  daysLeft: number;
  dateStr: string;
  label: string;
}

export default function EventsTab({ members, onSelectMember }: Props) {
  const today = new Date();

  const events: Event[] = [];
  members.forEach(m => {
    if (m.birthDate) {
      const bd = new Date(m.birthDate);
      const thisYear = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
      const diff = Math.ceil((thisYear.getTime() - today.getTime()) / 86400000);
      if (diff <= 30) events.push({
        member: m, type: 'birthday', daysLeft: diff,
        dateStr: `${bd.getDate()}/${bd.getMonth()+1}`,
        label: `Sinh nhật ${m.name.split(' ').pop()}`,
      });
    }
    if (m.deathDate) {
      const dd = new Date(m.deathDate);
      const thisYear = new Date(today.getFullYear(), dd.getMonth(), dd.getDate());
      if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
      const diff = Math.ceil((thisYear.getTime() - today.getTime()) / 86400000);
      if (diff <= 30) events.push({
        member: m, type: 'death', daysLeft: diff,
        dateStr: `${dd.getDate()}/${dd.getMonth()+1}`,
        label: `Giỗ ${m.name.split(' ').pop()}`,
      });
    }
  });

  events.sort((a,b) => a.daysLeft - b.daysLeft);
  const today30 = events.filter(e => e.daysLeft <= 30);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-shrink-0 px-4 pt-4 pb-3 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={22} style={{color:'#800000'}}/>
          <h2 className="text-lg font-bold text-gray-900">Sự Kiện Sắp Tới</h2>
        </div>
        <p className="text-xs text-gray-400">Trong 30 ngày tới · {today30.length} sự kiện</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {today30.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">🎉</div>
            <p className="font-bold text-gray-600">Không có sự kiện nào</p>
            <p className="text-sm mt-1">trong 30 ngày tới</p>
          </div>
        ) : (
          today30.map((ev, i) => (
            <motion.button
              key={`${ev.member.id}-${ev.type}`}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectMember(ev.member)}
              className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-50 text-left"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
                ev.daysLeft === 0 ? 'bg-red-100' : ev.type==='death' ? 'bg-amber-50' : 'bg-blue-50'
              }`}>
                {ev.type === 'birthday' ? '🎂' : '🕯️'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800 text-sm">{ev.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {ev.type === 'death' ? 'Ngày giỗ: ' : 'Sinh nhật: '}
                  <span className="font-semibold text-gray-600">{ev.dateStr}</span>
                  {ev.member.deathDateLunar && ev.type === 'death' && (
                    <span className="ml-1 text-amber-600">· Âm: {ev.member.deathDateLunar}</span>
                  )}
                </div>
                {ev.member.chucTuoc && <div className="text-xs text-amber-600">{ev.member.chucTuoc}</div>}
              </div>

              {/* Countdown */}
              <div className={`flex-shrink-0 text-center px-3 py-2 rounded-xl ${
                ev.daysLeft === 0
                  ? 'bg-red-600 text-white'
                  : ev.daysLeft <= 3
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {ev.daysLeft === 0 ? (
                  <><div className="text-lg font-black">!</div><div className="text-[9px] font-bold">Hôm nay</div></>
                ) : (
                  <><div className="text-lg font-black">{ev.daysLeft}</div><div className="text-[9px] font-bold">ngày</div></>
                )}
              </div>
            </motion.button>
          ))
        )}

        {/* Gợi ý thêm ngày mất */}
        {members.filter(m => m.deathDate).length === 0 && (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <div className="flex items-start gap-3">
              <Bell size={18} className="text-amber-600 flex-shrink-0 mt-0.5"/>
              <div>
                <p className="text-sm font-bold text-amber-800">Bật nhắc ngày giỗ</p>
                <p className="text-xs text-amber-600 mt-1">Thêm ngày mất cho các cụ đã khuất để nhận nhắc nhở tự động</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
