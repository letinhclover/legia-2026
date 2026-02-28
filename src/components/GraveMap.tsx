import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Navigation, Map } from 'lucide-react';
import { Member } from '../types';

interface Props {
  members: Member[];
  onClose: () => void;
  onViewMember: (m: Member) => void;
}

export default function GraveMap({ members, onClose, onViewMember }: Props) {
  const [search, setSearch] = useState('');

  // Lấy những người có thông tin mộ phần
  const withGrave = members.filter(m =>
    m.deathDate && (m.burialPlace || m.burialLat || m.burialLng)
  );

  const filtered = withGrave.filter(m =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.burialPlace || '').toLowerCase().includes(search.toLowerCase())
  );

  const openGoogleMaps = (m: Member) => {
    if (m.burialLat && m.burialLng) {
      // Nếu có tọa độ → chỉ đường chính xác
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${m.burialLat},${m.burialLng}&travelmode=driving`,
        '_blank'
      );
    } else if (m.burialPlace) {
      // Không có tọa độ → tìm kiếm theo địa chỉ
      const q = encodeURIComponent(m.burialPlace);
      window.open(`https://www.google.com/maps/search/${q}`, '_blank');
    }
  };

  const birthYear = (m: Member) => m.birthDate ? new Date(m.birthDate).getFullYear() : '';
  const deathYear = (m: Member) => m.deathDate ? new Date(m.deathDate).getFullYear() : '';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Map size={20} style={{ color: '#800000' }} />
            <h2 className="text-lg font-bold text-gray-900">Bản Đồ Mộ Phần</h2>
          </div>
          <button onClick={onClose} className="bg-gray-100 rounded-full p-1.5">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <p className="text-xs text-gray-400">{withGrave.length} mộ có thông tin · Bấm 🧭 để chỉ đường</p>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm tên hoặc địa chỉ mộ..."
          className="mt-3 w-full px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none"
        />
      </div>

      {/* Danh sách */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🗺️</div>
            <p className="font-semibold text-gray-500">
              {withGrave.length === 0
                ? 'Chưa có thông tin mộ phần'
                : 'Không tìm thấy'}
            </p>
            {withGrave.length === 0 && (
              <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">
                Thêm địa chỉ "Nơi chôn cất" khi chỉnh sửa thông tin thành viên đã mất
              </p>
            )}
          </div>
        ) : (
          filtered.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl p-3 shadow-sm border border-gray-50"
            >
              <div className="flex items-start gap-3">
                {/* Avatar grayscale */}
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                  {m.photoUrl
                    ? <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover grayscale" />
                    : <span className="text-xl grayscale">👴</span>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0" onClick={() => onViewMember(m)}>
                  <div className="font-bold text-gray-800 text-sm">{m.name}</div>
                  {m.tenHuy && <div className="text-xs text-gray-400 italic">Húy: {m.tenHuy}</div>}
                  <div className="text-xs text-gray-500 mt-0.5">
                    {birthYear(m)} — {deathYear(m)} · Đời {m.generation}
                  </div>
                  {m.burialPlace && (
                    <div className="flex items-start gap-1 mt-1">
                      <MapPin size={11} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-600 leading-relaxed">{m.burialPlace}</span>
                    </div>
                  )}
                  {m.burialLat && m.burialLng && (
                    <div className="text-xs text-green-600 mt-0.5">
                      📍 Có tọa độ GPS · Chỉ đường chính xác
                    </div>
                  )}
                </div>

                {/* Nút chỉ đường */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => openGoogleMaps(m)}
                  className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl text-white font-bold"
                  style={{ background: 'linear-gradient(135deg, #800000, #6B0000)' }}
                >
                  <Navigation size={18} />
                  <span className="text-[9px]">Chỉ đường</span>
                </motion.button>
              </div>
            </motion.div>
          ))
        )}

        {/* Hướng dẫn thêm tọa độ */}
        {withGrave.length > 0 && (
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 mt-2">
            <p className="text-xs font-bold text-blue-800 mb-1">💡 Thêm tọa độ GPS cho độ chính xác cao hơn</p>
            <p className="text-xs text-blue-600">
              Mở Google Maps → bấm giữ vào vị trí mộ → copy 2 số (vĩ độ, kinh độ) →
              dán vào ô "Vĩ độ mộ" và "Kinh độ mộ" khi sửa thông tin thành viên
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
