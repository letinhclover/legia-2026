import { useState } from 'react';
import { X, Flame } from 'lucide-react';
import { Member } from '../types';

interface Props {
  members: Member[];
  onClose: () => void;
  onViewMember: (m: Member) => void;
}

export default function MemorialPage({ members, onClose, onViewMember }: Props) {
  const [incense, setIncense] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string[]>>({});

  const deceased = members.filter(m => !!m.deathDate)
    .sort((a, b) => {
      // Sắp xếp theo đời, rồi theo tên
      if (a.generation !== b.generation) return a.generation - b.generation;
      return a.name.localeCompare(b.name);
    });

  const handleIncense = (id: string) => {
    setIncense(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Reset sau 3 giây (animation)
    setTimeout(() => {
      setIncense(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 3000);
  };

  const handleSendMessage = (id: string) => {
    const msg = message[id]?.trim();
    if (!msg) return;
    setMessages(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), msg],
    }));
    setMessage(prev => ({ ...prev, [id]: '' }));
  };

  if (deceased.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
          <div className="text-5xl mb-4">🙏</div>
          <p className="text-gray-600 mb-4">Chưa có thành viên đã mất trong gia phả</p>
          <button onClick={onClose} className="bg-[#800000] text-white px-6 py-2 rounded-xl font-bold">Đóng</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b border-gray-700 flex-shrink-0">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              🕯️ Trang Tưởng Nhớ
            </h3>
            <p className="text-xs text-gray-400">{deceased.length} tiên tổ đã khuất</p>
          </div>
          <button onClick={onClose} className="hover:bg-gray-700 rounded-full p-2">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {deceased.map(m => (
            <div key={m.id} className="bg-gray-800 border border-gray-600 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                {/* Ảnh */}
                <div className="w-14 h-14 rounded-full border-2 border-yellow-600 overflow-hidden flex-shrink-0 bg-gray-700">
                  {m.photoUrl
                    ? <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover grayscale" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>}
                </div>
                {/* Thông tin */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-yellow-400 cursor-pointer hover:underline"
                    onClick={() => { onClose(); onViewMember(m); }}>
                    {m.name}
                    {m.tenHuy && <span className="text-xs text-gray-400 ml-1">(Húy: {m.tenHuy})</span>}
                  </div>
                  <div className="text-xs text-gray-400">
                    {m.birthDate && `Sinh: ${new Date(m.birthDate).getFullYear()}`}
                    {m.birthDate && m.deathDate && ' — '}
                    {m.deathDate && `Mất: ${new Date(m.deathDate).getFullYear()}`}
                  </div>
                  {m.deathDateLunar && (
                    <div className="text-xs text-yellow-600">🗓️ Ngày giỗ: {m.deathDateLunar}</div>
                  )}
                  {m.burialPlace && (
                    <div className="text-xs text-gray-500">📍 {m.burialPlace}</div>
                  )}
                </div>
                {/* Nút thắp hương */}
                <button
                  onClick={() => handleIncense(m.id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    incense.has(m.id)
                      ? 'bg-orange-600 scale-110'
                      : 'bg-gray-700 hover:bg-orange-700'
                  }`}
                >
                  <Flame size={20} className={incense.has(m.id) ? 'animate-bounce' : ''} />
                  <span className="text-xs">Thắp hương</span>
                </button>
              </div>

              {/* Animation thắp hương */}
              {incense.has(m.id) && (
                <div className="bg-orange-900 bg-opacity-30 px-4 py-2 text-center text-sm text-orange-300 animate-pulse">
                  🙏 Đã thắp hương — Cầu cho {m.name} an lành nơi cõi vĩnh hằng 🕯️
                </div>
              )}

              {/* Lời tưởng nhớ */}
              {messages[m.id]?.length > 0 && (
                <div className="px-4 pb-2 space-y-1">
                  {messages[m.id].map((msg, i) => (
                    <div key={i} className="bg-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 italic">
                      💬 "{msg}"
                    </div>
                  ))}
                </div>
              )}

              {/* Ghi lời tưởng nhớ */}
              <div className="flex gap-2 px-4 pb-4">
                <input
                  value={message[m.id] || ''}
                  onChange={e => setMessage(prev => ({ ...prev, [m.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage(m.id)}
                  placeholder="Ghi lời tưởng nhớ..."
                  className="flex-1 bg-gray-700 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-600 placeholder-gray-500"
                />
                <button
                  onClick={() => handleSendMessage(m.id)}
                  className="bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  Gửi
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
