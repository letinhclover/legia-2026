import { useState } from 'react';
import { m as motion } from 'framer-motion';
import { X, MapPin, Navigation, Map, Search } from 'lucide-react';
import { Member } from '../types';

interface Props {
  members: Member[];
  onClose: () => void;
  onViewMember: (m: Member) => void;
  darkMode?: boolean;
}

export default function GraveMap({ members, onClose, onViewMember, darkMode = false }: Props) {
  const [search, setSearch] = useState('');

  // ── Màu theme ─────────────────────────────────────────────────────────────
  const bg       = darkMode ? '#111214'   : '#f8fafc';
  const cardBg   = darkMode ? '#1d1f21'   : '#ffffff';
  const headerBg = darkMode ? '#1d1f21'   : '#ffffff';
  const textMain = darkMode ? '#f5f5f5'   : '#0b0b0b';
  const textSub  = darkMode ? '#c0c0c0'   : '#3d3d3d';
  const border   = darkMode ? '#2d3748'   : '#e2e8f0';
  const inputBg  = darkMode ? '#0f1a28'   : '#F0EBE1';

  // Lấy thành viên có thông tin mộ
  const withGrave = members.filter(m =>
    m.deathDate && (m.burialAddress || m.burialPlace || m.burialLat || m.burialLng)
  );

  const filtered = withGrave.filter(m =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.burialAddress || m.burialPlace || '').toLowerCase().includes(search.toLowerCase())
  );

  const openGoogleMaps = (m: Member) => {
    // Ưu tiên link Maps trực tiếp nếu có
    if (m.burialMapLink) {
      window.open(m.burialMapLink, '_blank');
    } else if (m.burialLat && m.burialLng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${m.burialLat},${m.burialLng}&travelmode=driving`,
        '_blank'
      );
    } else {
      const addr = m.burialAddress || m.burialPlace || '';
      if (addr) {
        const q = encodeURIComponent(addr);
        window.open(`https://www.google.com/maps/search/${q}`, '_blank');
      }
    }
  };

  const birthYear = (m: Member) => m.birthDate ? new Date(m.birthDate).getFullYear() : '';
  const deathYear = (m: Member) => m.deathDate ? new Date(m.deathDate).getFullYear() : '';
  const burialAddr = (m: Member) => m.burialAddress || m.burialPlace || '';

  return (
    <div className="flex flex-col h-full" style={{ background: bg }}>

      {/* Header */}
      <div
        className="flex-shrink-0 px-4 pt-4 pb-3"
        style={{ background: headerBg, borderBottom: `1px solid ${border}` }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Map size={22} color="#CC0000" />
            <h2 style={{
              fontSize: 20, fontWeight: 900, color: textMain,
              fontFamily: "'Roboto', sans-serif",
            }}>
              Bản Đồ Mộ Phần
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: darkMode ? '#1d1f21' : '#F0EBE1',
              border: `1px solid ${border}`,
              borderRadius: '50%', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} color={textSub} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: textSub, fontFamily: "'Roboto', sans-serif", marginBottom: 10 }}>
          {withGrave.length} mộ có thông tin · Bấm 🧭 để chỉ đường
        </p>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={16} color={textSub}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên hoặc địa chỉ mộ..."
            style={{
              width: '100%',
              padding: '12px 14px 12px 36px',
              borderRadius: 12,
              border: `1.5px solid ${border}`,
              background: inputBg,
              color: textMain,
              fontSize: 15,
              fontFamily: "'Roboto', sans-serif",
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Danh sách mộ */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '12px 16px', gap: 10, display: 'flex', flexDirection: 'column' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🗺️</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: textMain, marginBottom: 6, fontFamily: "'Roboto', sans-serif" }}>
              {withGrave.length === 0 ? 'Chưa có thông tin mộ phần' : 'Không tìm thấy'}
            </p>
            {withGrave.length === 0 && (
              <p style={{ fontSize: 14, color: textSub, maxWidth: 280, margin: '0 auto', lineHeight: 1.6, fontFamily: "'Roboto', sans-serif" }}>
                Thêm địa chỉ mộ phần khi chỉnh sửa thông tin thành viên đã mất
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
              style={{
                background: cardBg,
                borderRadius: 18,
                padding: 14,
                border: `1px solid ${border}`,
                boxShadow: darkMode ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 10px rgba(28,20,16,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>

                {/* Avatar grayscale */}
                <div style={{
                  width: 56, height: 56,
                  borderRadius: 14,
                  overflow: 'hidden', flexShrink: 0,
                  background: darkMode ? '#1d1f21' : '#E8DFCF',
                  border: `2px solid ${border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.photoUrl
                    ? <img src={m.photoUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }} />
                    : <span style={{ fontSize: 24, filter: 'grayscale(100%)' }}>👴</span>
                  }
                </div>

                {/* Thông tin */}
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => onViewMember(m)}>
                  <div style={{
                    fontWeight: 800, color: textMain, fontSize: 16,
                    fontFamily: "'Roboto', sans-serif",
                  }}>
                    {m.name}
                  </div>
                  {m.tenHuy && (
                    <div style={{ fontSize: 13, color: textSub, fontStyle: 'italic', marginTop: 1 }}>
                      Húy: {m.tenHuy}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: textSub, marginTop: 3, fontFamily: "'Roboto', sans-serif" }}>
                    {birthYear(m)} — {deathYear(m)} · Đời {m.generation}
                  </div>
                  {burialAddr(m) && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 6 }}>
                      <MapPin size={13} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 14, color: textMain, lineHeight: 1.5, fontFamily: "'Roboto', sans-serif" }}>
                        {burialAddr(m)}
                      </span>
                    </div>
                  )}
                  {(m.burialMapLink || (m.burialLat && m.burialLng)) && (
                    <div style={{ fontSize: 13, color: '#16A34A', marginTop: 4, fontWeight: 600 }}>
                      📍 Có vị trí · Chỉ đường chính xác
                    </div>
                  )}
                </div>

                {/* Nút chỉ đường — lớn hơn cho người già */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => openGoogleMaps(m)}
                  style={{
                    flexShrink: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4,
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #CC0000, #990000)',
                    border: 'none', cursor: 'pointer',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(128,0,0,0.35)',
                  }}
                >
                  <Navigation size={20} color="white" />
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Roboto', sans-serif" }}>
                    Chỉ đường
                  </span>
                </motion.button>
              </div>
            </motion.div>
          ))
        )}

        {/* Hướng dẫn */}
        {withGrave.length > 0 && (
          <div style={{
            background: darkMode ? '#1a1c1e' : '#EFF6FF',
            borderRadius: 16, padding: 14,
            border: `1px solid ${darkMode ? '#1e3a5f' : '#BFDBFE'}`,
            marginTop: 4,
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: darkMode ? '#93C5FD' : '#1D4ED8', marginBottom: 6, fontFamily: "'Roboto', sans-serif" }}>
              💡 Thêm vị trí chính xác hơn
            </p>
            <p style={{ fontSize: 13, color: darkMode ? '#60A5FA' : '#3B82F6', lineHeight: 1.6, fontFamily: "'Roboto', sans-serif" }}>
              Mở Google Maps → bấm giữ vào vị trí mộ → copy link → dán vào ô "Link Google Maps" khi sửa thông tin thành viên
            </p>
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
