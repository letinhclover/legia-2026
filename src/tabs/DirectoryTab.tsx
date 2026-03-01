import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Member } from '../types';

interface Props {
  members: Member[];
  onSelectMember: (m: Member) => void;
}

// Gradient màu theo tên (giống Stitch)
function avatarGradient(name: string): string {
  const palettes = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-teal-500 to-emerald-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-green-500 to-teal-600',
  ];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % palettes.length;
  return palettes[h];
}

function initials(name: string) {
  const p = name.trim().split(' ').filter(Boolean);
  if (p.length === 1) return p[0][0].toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export default function DirectoryTab({ members, onSelectMember }: Props) {
  const [query, setQuery]       = useState('');
  const [genFilter, setGenFilter] = useState<number | 'all'>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [genderF, setGenderF]   = useState<'all' | 'Nam' | 'Nữ'>('all');
  const [statusF, setStatusF]   = useState<'all' | 'alive' | 'deceased'>('all');

  const generations = useMemo(() =>
    [...new Set(members.map(m => m.generation))].sort((a, b) => a - b),
    [members]
  );

  const totalM = members.filter(m => m.gender === 'Nam').length;
  const totalF = members.filter(m => m.gender === 'Nữ').length;
  const hasFilter = genderF !== 'all' || statusF !== 'all' || genFilter !== 'all';

  const filtered = useMemo(() => members.filter(m => {
    const q = query.toLowerCase();
    const matchQ   = !q || m.name.toLowerCase().includes(q) || (m.tenHuy||'').toLowerCase().includes(q);
    const matchGen = genFilter === 'all' || m.generation === genFilter;
    const matchG   = genderF === 'all' || m.gender === genderF;
    const matchS   = statusF === 'all'
      || (statusF === 'alive' && !m.deathDate)
      || (statusF === 'deceased' && !!m.deathDate);
    return matchQ && matchGen && matchG && matchS;
  }).sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name)),
  [members, query, genFilter, genderF, statusF]);

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Danh Sách Dòng Họ Lê</h2>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowFilter(v => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                hasFilter ? 'bg-red-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <SlidersHorizontal size={13} />
              {hasFilter ? 'Đang lọc' : 'Lọc'}
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative flex items-center bg-gray-100 rounded-xl mb-3">
            <Search size={15} className="absolute left-3 text-gray-400 pointer-events-none" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Tìm tên, tên húy..."
              className="w-full pl-9 pr-9 py-2.5 bg-transparent text-sm focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 p-1">
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>

          {/* Gen filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {(['all', ...generations] as const).map(g => (
              <button
                key={g}
                onClick={() => setGenFilter(g as any)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: genFilter === g ? '#800000' : '#F3F4F6',
                  color: genFilter === g ? 'white' : '#6B7280',
                }}
              >
                {g === 'all' ? 'Tất cả' : `Đời ${g}`}
              </button>
            ))}
          </div>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-100"
            >
              <div className="px-4 py-3 space-y-2">
                <div className="flex gap-2">
                  {(['all','Nam','Nữ'] as const).map(gv => (
                    <button key={gv} onClick={() => setGenderF(gv)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        genderF === gv ? 'bg-red-800 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                      {gv === 'all' ? 'Tất cả' : gv === 'Nam' ? '👨 Nam' : '👩 Nữ'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {(['all','alive','deceased'] as const).map(sv => (
                    <button key={sv} onClick={() => setStatusF(sv)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        statusF === sv ? 'bg-red-800 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                      {sv === 'all' ? 'Tất cả' : sv === 'alive' ? '💚 Sống' : '🕯️ Đã mất'}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Stats 3 ô ── */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-3 px-4 py-3">
        {[
          { label: 'TỔNG', value: members.length, color: '#111827' },
          { label: 'NAM',  value: totalM,          color: '#1D4ED8' },
          { label: 'NỮ',   value: totalF,          color: '#BE185D' },
        ].map(s => (
          <div key={s.label}
            className="bg-white rounded-2xl p-3 flex flex-col items-center shadow-sm border border-gray-50">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{s.label}</span>
            <span className="text-2xl font-black" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Member list — KHÔNG dùng AnimatePresence để tránh trắng trang khi switch tab ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          {filtered.length} thành viên
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-medium">Không tìm thấy kết quả</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((m, i) => {
              const birthY = m.birthDate ? new Date(m.birthDate).getFullYear() : null;
              const deathY = m.deathDate ? new Date(m.deathDate).getFullYear() : null;
              const isDeceased = !!m.deathDate;
              const grad = avatarGradient(m.name);

              return (
                // Chỉ dùng motion.div với animate vào, KHÔNG exit — tránh crash khi unmount
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.2 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden cursor-pointer"
                  onClick={() => onSelectMember(m)}
                >
                  <div className="flex items-start gap-3 p-3">
                    {/* Avatar gradient */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${grad} overflow-hidden`}
                        style={{ filter: isDeceased ? 'grayscale(50%) brightness(0.85)' : 'none' }}
                      >
                        {m.photoUrl
                          ? <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                          : initials(m.name)
                        }
                      </div>
                      <div
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white font-black border-2 border-white"
                        style={{ fontSize: 8, background: '#800000' }}
                      >
                        {m.generation}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-gray-900 text-sm leading-snug">{m.name}</p>
                        <span className={`flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          isDeceased ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700'
                        }`}>
                          {isDeceased ? '🕯️' : '💚'}
                        </span>
                      </div>
                      {m.tenHuy && <p className="text-xs text-gray-400 italic">Húy: {m.tenHuy}</p>}
                      {m.chucTuoc && <p className="text-xs font-semibold" style={{ color: '#B8860B' }}>{m.chucTuoc}</p>}
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        {birthY && <span>🎂 {birthY}</span>}
                        {deathY  && <span>🕯️ {deathY}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Action row — kiểu Stitch */}
                  <div className="flex border-t border-gray-50 divide-x divide-gray-50">
                    {[
                      { icon: '✏️', label: 'Sửa',     action: () => {} },
                      { icon: '🌳', label: 'Phả hệ',  action: () => onSelectMember(m) },
                      { icon: '👁️', label: 'Chi tiết', action: () => onSelectMember(m) },
                    ].map(a => (
                      <button key={a.label}
                        onClick={e => { e.stopPropagation(); a.action(); }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-gray-400 font-semibold hover:bg-gray-50 transition-colors"
                      >
                        <span>{a.icon}</span> {a.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
