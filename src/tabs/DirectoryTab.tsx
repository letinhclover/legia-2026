import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Member, MemberType, MEMBER_TYPE_LABEL, MEMBER_TYPE_COLOR } from '../types';

interface Props {
  members: Member[];
  onSelectMember: (m: Member) => void;
  darkMode?: boolean;
}

function avatarGradient(name: string): string {
  const p = [
    'from-blue-500 to-indigo-600', 'from-purple-500 to-pink-600',
    'from-teal-500 to-emerald-600', 'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',   'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600','from-green-500 to-teal-600',
  ];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % p.length;
  return p[h];
}

function initials(name: string) {
  const p = name.trim().split(' ').filter(Boolean);
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length-1][0]).toUpperCase();
}

export default function DirectoryTab({ members, onSelectMember, darkMode }: Props) {
  const [query, setQuery]       = useState('');
  const [genFilter, setGenFilter] = useState<number|'all'>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [genderF, setGenderF]   = useState<'all'|'Nam'|'Nữ'>('all');
  const [statusF, setStatusF]   = useState<'all'|'alive'|'deceased'>('all');
  const [typeF, setTypeF]       = useState<'all'|MemberType>('all');

  // Theme tokens
  const bg       = darkMode ? '#0f1724' : '#F9FAFB';
  const cardBg   = darkMode ? '#1e2a3a' : 'white';
  const headerBg = darkMode ? '#1a2030' : 'white';
  const textMain = darkMode ? '#f1f5f9' : '#111827';
  const textSub  = darkMode ? '#64748b' : '#6B7280';
  const border   = darkMode ? '#2d3d52' : '#F3F4F6';
  const inputBg  = darkMode ? '#253040' : '#F3F4F6';

  const generations = useMemo(() =>
    [...new Set(members.map(m => m.generation))].sort((a,b) => a-b),
    [members]
  );
  const totalM = members.filter(m => m.gender === 'Nam').length;
  const totalF = members.filter(m => m.gender === 'Nữ').length;
  const hasFilter = genderF !== 'all' || statusF !== 'all' || genFilter !== 'all' || typeF !== 'all';

  const filtered = useMemo(() => members.filter(m => {
    const q = query.toLowerCase();
    const matchQ   = !q || m.name.toLowerCase().includes(q) || (m.tenHuy||'').toLowerCase().includes(q);
    const matchGen = genFilter === 'all' || m.generation === genFilter;
    const matchG   = genderF === 'all' || m.gender === genderF;
    const matchT   = typeF === 'all' || (m.memberType || 'chinh') === typeF;
    const matchS   = statusF === 'all'
      || (statusF==='alive' && !m.deathDate)
      || (statusF==='deceased' && !!m.deathDate);
    return matchQ && matchGen && matchG && matchS && matchT;
  }).sort((a,b) => a.generation-b.generation || a.name.localeCompare(b.name)),
  [members, query, genFilter, genderF, statusF, typeF]);

  return (
    <div className="flex flex-col h-full" style={{ background: bg }}>

      {/* Header */}
      <div className="flex-shrink-0 border-b shadow-sm" style={{ background: headerBg, borderColor: border }}>
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: textMain }}>Danh Sách Dòng Họ Lê</h2>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => setShowFilter(v=>!v)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
              style={{ background: hasFilter ? '#800000' : inputBg, color: hasFilter ? 'white' : textSub }}
            >
              <SlidersHorizontal size={13}/> {hasFilter ? 'Đang lọc' : 'Lọc'}
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative flex items-center rounded-xl mb-3" style={{ background: inputBg }}>
            <Search size={15} className="absolute left-3 pointer-events-none" style={{ color: textSub }}/>
            <input value={query} onChange={e=>setQuery(e.target.value)}
              placeholder="Tìm tên, tên húy..."
              className="w-full pl-9 pr-9 py-2.5 bg-transparent text-sm focus:outline-none"
              style={{ color: textMain }}/>
            {query && <button onClick={()=>setQuery('')} className="absolute right-3 p-1"><X size={14} style={{ color: textSub }}/></button>}
          </div>

          {/* Gen chips */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {(['all', ...generations] as const).map(g=>(
              <button key={g} onClick={()=>setGenFilter(g as any)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{ background: genFilter===g ? '#800000' : inputBg, color: genFilter===g ? 'white' : textSub }}>
                {g==='all' ? 'Tất cả' : `Đời ${g}`}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {showFilter && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
              className="overflow-hidden border-t" style={{ borderColor: border }}>
              <div className="px-4 py-3 space-y-2">
                <div className="flex gap-2">
                  {(['all','Nam','Nữ'] as const).map(gv=>(
                    <button key={gv} onClick={()=>setGenderF(gv)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: genderF===gv ? '#800000' : inputBg, color: genderF===gv ? 'white' : textSub }}>
                      {gv==='all'?'Tất cả':gv==='Nam'?'👨 Nam':'👩 Nữ'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {(['all','alive','deceased'] as const).map(sv=>(
                    <button key={sv} onClick={()=>setStatusF(sv)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: statusF===sv ? '#800000' : inputBg, color: statusF===sv ? 'white' : textSub }}>
                      {sv==='all'?'Tất cả':sv==='alive'?'💚 Sống':'🕯️ Đã mất'}
                    </button>
                  ))}
                </div>
                {/* Lọc vai vế */}
                <div>
                  <p className="text-[10px] font-bold uppercase mb-1" style={{ color: textSub }}>Vai vế trong họ</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(['all','chinh','dau','re','chau_ngoai','ngoai_toc'] as const).map(tv=>(
                      <button key={tv} onClick={()=>setTypeF(tv)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                        style={{
                          background: typeF===tv ? '#800000' : inputBg,
                          color: typeF===tv ? 'white' : textSub,
                        }}>
                        {tv==='all' ? '👥 Tất cả' : MEMBER_TYPE_LABEL[tv]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-3 px-4 py-3">
        {[
          { label:'TỔNG', value:members.length, color:'#111827' },
          { label:'NAM',  value:totalM, color:'#1D4ED8' },
          { label:'NỮ',   value:totalF, color:'#BE185D' },
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-3 flex flex-col items-center shadow-sm"
            style={{ background: cardBg, border: `1px solid ${border}` }}>
            <span className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: textSub }}>{s.label}</span>
            <span className="text-2xl font-black" style={{ color: darkMode ? (s.color==='#111827' ? '#f1f5f9' : s.color) : s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ touchAction: 'pan-y' }}>
        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: textSub }}>
          {filtered.length} thành viên
        </p>
        {filtered.length===0 ? (
          <div className="text-center py-16" style={{ color: textSub }}>
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-medium">Không tìm thấy kết quả</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((m,i)=>{
              const birthY = m.birthDate ? new Date(m.birthDate).getFullYear() : null;
              const deathY = m.deathDate ? new Date(m.deathDate).getFullYear() : null;
              const isDeceased = !!m.deathDate;
              const grad = avatarGradient(m.name);
              return (
                <motion.div key={m.id}
                  initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay: Math.min(i*0.02, 0.25), duration:0.2 }}
                  className="rounded-2xl shadow-sm cursor-pointer"
                  style={{ background: cardBg, border: `1px solid ${border}` }}
                  onClick={()=>onSelectMember(m)}
                >
                  <div className="flex items-start gap-3 p-3">
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${grad} overflow-hidden`}
                        style={{ filter: isDeceased ? 'grayscale(50%) brightness(0.8)' : 'none' }}>
                        {m.photoUrl
                          ? <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover"/>
                          : initials(m.name)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white font-black border-2"
                        style={{ fontSize:8, background:'#800000', borderColor: cardBg }}>
                        {m.generation}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-sm leading-snug" style={{ color: textMain }}>{m.name}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {(m.memberType && m.memberType !== 'chinh') && (() => {
                            const col = MEMBER_TYPE_COLOR[m.memberType!];
                            return (
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: col.bg, color: col.text }}>
                                {MEMBER_TYPE_LABEL[m.memberType!].split(' ')[0]}
                              </span>
                            );
                          })()}
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: isDeceased ? (darkMode?'#1e1e1e':'#F3F4F6') : (darkMode?'#0f2010':'#F0FDF4'),
                                     color:      isDeceased ? textSub : '#16a34a' }}>
                            {isDeceased?'🕯️':'💚'}
                          </span>
                        </div>
                      </div>
                      {m.tenHuy && <p className="text-xs italic" style={{ color: textSub }}>Húy: {m.tenHuy}</p>}
                      {m.chucTuoc && <p className="text-xs font-semibold" style={{ color:'#B8860B' }}>{m.chucTuoc}</p>}
                      <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: textSub }}>
                        {birthY && <span>🎂 {birthY}</span>}
                        {deathY  && <span>🕯️ {deathY}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex border-t divide-x" style={{ borderColor: border }}>
                    {[{icon:'✏️',label:'Sửa'},{icon:'🌳',label:'Phả hệ'},{icon:'👁️',label:'Chi tiết'}].map(a=>(
                      <button key={a.label}
                        onClick={e=>{ e.stopPropagation(); if(a.label!=='Sửa') onSelectMember(m); }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold"
                        style={{ color: textSub, borderColor: border }}>
                        <span>{a.icon}</span>{a.label}
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
