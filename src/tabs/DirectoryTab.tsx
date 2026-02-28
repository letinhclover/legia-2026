import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, UserPlus } from 'lucide-react';
import { Member } from '../types';

interface Props {
  members: Member[];
  onSelectMember: (m: Member) => void;
}

// Tạo màu avatar từ tên (như Stitch design)
function avatarColor(name: string) {
  const colors = ['#6366F1','#8B5CF6','#EC4899','#14B8A6','#F59E0B','#10B981','#3B82F6','#EF4444'];
  let hash = 0;
  for (let c of name) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
  return colors[hash];
}

function initials(name: string) {
  const parts = name.trim().split(' ');
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
}

export default function DirectoryTab({ members, onSelectMember }: Props) {
  const [query, setQuery]     = useState('');
  const [genFilter, setGenFilter] = useState<number | 'all'>('all');

  const generations = [...new Set(members.map(m => m.generation))].sort((a, b) => a - b);
  const alive    = members.filter(m => !m.deathDate).length;
  const deceased = members.filter(m => !!m.deathDate).length;
  const male     = members.filter(m => m.gender === 'Nam').length;
  const female   = members.filter(m => m.gender === 'Nữ').length;

  const filtered = members.filter(m => {
    const q = query.toLowerCase();
    const matchQ   = !q || m.name.toLowerCase().includes(q) || (m.tenHuy || '').toLowerCase().includes(q);
    const matchGen = genFilter === 'all' || m.generation === genFilter;
    return matchQ && matchGen;
  }).sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col h-full hide-scrollbar" style={{ background: '#101922' }}>

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3" style={{ background: '#192633', borderBottom: '1px solid #233648' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white text-lg">Quản Lý Dòng Họ Lê</h2>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#D4AF37' }}>
            <UserPlus size={18} color="#101922" />
          </div>
        </div>

        {/* Search */}
        <div className="relative flex items-center rounded-xl overflow-hidden mb-3" style={{ background: '#233648' }}>
          <Search size={16} className="absolute left-3" color="#92adc9" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Tìm kiếm thành viên..."
            className="w-full pl-10 pr-9 py-3 bg-transparent focus:outline-none text-sm text-white placeholder-[#92adc9]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3">
              <X size={14} color="#92adc9" />
            </button>
          )}
        </div>

        {/* Gen filter chips */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {(['all', ...generations] as const).map(g => (
            <button key={g} onClick={() => setGenFilter(g as any)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: genFilter === g ? '#D4AF37' : '#233648',
                color:      genFilter === g ? '#101922' : '#92adc9',
              }}>
              {g === 'all' ? 'Tất cả' : `Đời ${g}`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-3 p-4">
        {[
          { label: 'TỔNG SỐ', value: members.length, color: '#fff' },
          { label: 'NAM',     value: male,            color: '#60A5FA' },
          { label: 'NỮ',      value: female,          color: '#F472B6' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: '#192633' }}>
            <p className="text-xs font-bold mb-1" style={{ color: '#92adc9' }}>{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-6 hide-scrollbar">
        <p className="text-xs font-bold mb-2" style={{ color: '#92adc9' }}>
          DANH SÁCH THÀNH VIÊN ({filtered.length})
        </p>
        <AnimatePresence>
          {filtered.map((m, idx) => {
            const bg    = avatarColor(m.name);
            const year  = m.birthDate ? new Date(m.birthDate).getFullYear() : '?';
            return (
              <motion.div key={m.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ delay: idx * 0.02 }}
                onClick={() => onSelectMember(m)}
                className="rounded-2xl overflow-hidden cursor-pointer"
                style={{ background: '#192633', border: '1px solid #233648' }}>
                <div className="flex items-center gap-3 p-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white overflow-hidden"
                    style={{ background: m.photoUrl ? 'transparent' : bg, fontSize: 15 }}>
                    {m.photoUrl
                      ? <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                      : initials(m.name)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-white truncate">{m.name}</p>
                      <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: '#233648', color: '#D4AF37' }}>
                        Đời {m.generation}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#92adc9' }}>
                      Sinh năm: {year} · {m.gender}
                    </p>
                    {m.chucTuoc && (
                      <p className="text-xs mt-0.5 font-semibold" style={{ color: '#D4AF37' }}>{m.chucTuoc}</p>
                    )}
                  </div>
                </div>
                {/* Actions row */}
                <div className="flex border-t" style={{ borderColor: '#233648' }}>
                  {[{ icon: '✏️', label: 'Sửa' }, { icon: '🌳', label: 'Cây' }, { icon: '👤+', label: 'Thêm' }].map(a => (
                    <button key={a.label}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors"
                      style={{ color: '#92adc9' }}
                      onClick={e => { e.stopPropagation(); if (a.label === 'Sửa') onSelectMember(m); }}>
                      <span>{a.icon}</span>{a.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
