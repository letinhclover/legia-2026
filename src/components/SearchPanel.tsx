import { useState } from 'react';
import { X, Search, Filter } from 'lucide-react';
import { Member } from '../types';

interface Props {
  members: Member[];
  onClose: () => void;
  onSelectMember: (m: Member) => void;
}

export default function SearchPanel({ members, onClose, onSelectMember }: Props) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'all' | 'Nam' | 'Nữ'>('all');
  const [genFrom, setGenFrom] = useState('');
  const [genTo, setGenTo] = useState('');
  const [status, setStatus] = useState<'all' | 'alive' | 'deceased'>('all');
  const [hasPhoto, setHasPhoto] = useState(false);

  const maxGen = Math.max(...members.map(m => m.generation), 1);

  const results = members.filter(m => {
    if (name && !m.name.toLowerCase().includes(name.toLowerCase())
      && !(m.tenHuy || '').toLowerCase().includes(name.toLowerCase())) return false;
    if (gender !== 'all' && m.gender !== gender) return false;
    if (genFrom && m.generation < parseInt(genFrom)) return false;
    if (genTo && m.generation > parseInt(genTo)) return false;
    if (status === 'alive' && m.deathDate) return false;
    if (status === 'deceased' && !m.deathDate) return false;
    if (hasPhoto && !m.photoUrl) return false;
    return true;
  });

  const inp = "w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-[#800000] focus:outline-none text-sm";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-[#800000] to-[#A00000] text-white p-4 rounded-t-3xl sm:rounded-t-2xl flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <Filter size={20} />
            <h3 className="font-bold text-lg">Tìm kiếm nâng cao</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 rounded-full p-2"><X size={20}/></button>
        </div>

        {/* Bộ lọc */}
        <div className="p-4 space-y-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={name} onChange={e => setName(e.target.value)}
              className={`${inp} pl-8`} placeholder="Tên hoặc tên húy..." autoFocus />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Giới tính</label>
              <select value={gender} onChange={e => setGender(e.target.value as any)} className={inp}>
                <option value="all">Tất cả</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Từ đời</label>
              <input value={genFrom} onChange={e => setGenFrom(e.target.value)} className={inp}
                inputMode="numeric" placeholder="1" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Đến đời</label>
              <input value={genTo} onChange={e => setGenTo(e.target.value)} className={inp}
                inputMode="numeric" placeholder={String(maxGen)} />
            </div>
          </div>
          <div className="flex gap-2">
            {(['all','alive','deceased'] as const).map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${status === s ? 'bg-[#800000] text-white' : 'bg-gray-100 text-gray-500'}`}>
                {s === 'all' ? '👥 Tất cả' : s === 'alive' ? '💚 Còn sống' : '🕯️ Đã mất'}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={hasPhoto} onChange={e => setHasPhoto(e.target.checked)}
              className="w-4 h-4 accent-[#800000]" />
            <span className="text-gray-600">Chỉ hiện người có ảnh</span>
          </label>
        </div>

        {/* Kết quả */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase bg-gray-50 sticky top-0">
            {results.length} kết quả
          </div>
          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-4xl mb-2">🔍</div>
              <p>Không tìm thấy thành viên phù hợp</p>
            </div>
          ) : (
            results.map(m => (
              <button key={m.id} onClick={() => { onSelectMember(m); onClose(); }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-50 transition-colors text-left">
                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200">
                  {m.photoUrl ? <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover"/> : <span className="text-lg">👤</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800 text-sm">{m.name}</div>
                  <div className="text-xs text-gray-500">
                    {m.gender} · Đời {m.generation}
                    {m.birthDate && ` · ${new Date(m.birthDate).getFullYear()}`}
                    {m.deathDate && ` — ${new Date(m.deathDate).getFullYear()}`}
                  </div>
                  {m.tenHuy && <div className="text-xs text-gray-400">Húy: {m.tenHuy}</div>}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-bold ${m.deathDate ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-600'}`}>
                  {m.deathDate ? '🕯️' : '💚'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
