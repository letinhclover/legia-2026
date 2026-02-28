import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Member } from '../types';
import MemberCard from '../components/MemberCard';

interface Props {
  members: Member[];
  onSelectMember: (m: Member) => void;
}

export default function DirectoryTab({ members, onSelectMember }: Props) {
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all'|'Nam'|'Nữ'>('all');
  const [statusFilter, setStatusFilter] = useState<'all'|'alive'|'deceased'>('all');
  const [showFilter, setShowFilter] = useState(false);

  const filtered = members.filter(m => {
    const q = query.toLowerCase();
    const matchName = !q || m.name.toLowerCase().includes(q) || (m.tenHuy||'').toLowerCase().includes(q);
    const matchGender = genderFilter==='all' || m.gender===genderFilter;
    const matchStatus = statusFilter==='all' || (statusFilter==='alive'&&!m.deathDate) || (statusFilter==='deceased'&&!!m.deathDate);
    return matchName && matchGender && matchStatus;
  }).sort((a,b) => a.generation-b.generation || a.name.localeCompare(b.name));

  const hasFilter = genderFilter!=='all' || statusFilter!=='all';

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-shrink-0 px-4 pt-4 pb-3 bg-white border-b border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Danh Sách Thành Viên</h2>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm tên, tên húy..."
              className="w-full pl-9 pr-9 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-opacity-20"/>
            {query && <button onClick={()=>setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={14} className="text-gray-400"/></button>}
          </div>
          <motion.button whileTap={{scale:0.9}} onClick={()=>setShowFilter(!showFilter)}
            className={`px-3 py-2.5 rounded-xl flex items-center gap-1 text-sm font-semibold ${hasFilter?'bg-red-800 text-white':'bg-gray-100 text-gray-600'}`}>
            <SlidersHorizontal size={16}/>
          </motion.button>
        </div>
        <AnimatePresence>
          {showFilter && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
              <div className="pt-3 space-y-2">
                <div className="flex gap-2">
                  {(['all','Nam','Nữ'] as const).map(g=>(
                    <button key={g} onClick={()=>setGenderFilter(g)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${genderFilter===g?'bg-red-800 text-white':'bg-gray-100 text-gray-500'}`}>
                      {g==='all'?'Tất cả':g==='Nam'?'👨 Nam':'👩 Nữ'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {(['all','alive','deceased'] as const).map(s=>(
                    <button key={s} onClick={()=>setStatusFilter(s)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${statusFilter===s?'bg-red-800 text-white':'bg-gray-100 text-gray-500'}`}>
                      {s==='all'?'Tất cả':s==='alive'?'💚 Sống':'🕯️ Đã mất'}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">{filtered.length} thành viên</p>
        {filtered.length===0
          ? <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">🔍</div><p>Không tìm thấy</p></div>
          : filtered.map((m,i)=><MemberCard key={m.id} member={m} onClick={onSelectMember} index={i}/>)
        }
      </div>
    </div>
  );
}
