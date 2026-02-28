import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, QrCode, X, MapPin, ExternalLink, Heart, Users, Image as ImageIcon } from 'lucide-react';
import { Member } from '../types';

interface Props {
  member: Member | null;
  members: Member[];
  onClose: () => void;
  onEdit: (m: Member) => void;
  isAdmin: boolean;
}

type Tab = 'bio' | 'family' | 'photos';

export default function MemberBottomSheet({ member, members, onClose, onEdit, isAdmin }: Props) {
  const [tab, setTab] = useState<Tab>('family');
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!member) return null;

  const find   = (id?: string | null) => id ? members.find(m => m.id === id) : null;
  const father = find(member.fatherId);
  const mother = find(member.motherId);
  const spouse = find(member.spouseId);
  const children = members
    .filter(m => m.fatherId === member.id || m.motherId === member.id)
    .sort((a, b) => (a.birthDate || '').localeCompare(b.birthDate || ''));
  const grandchildren = members.filter(m =>
    children.some(c => m.fatherId === c.id || m.motherId === c.id)
  );

  const isDeceased = !!member.deathDate;
  const birthY = member.birthDate ? new Date(member.birthDate).getFullYear() : null;
  const deathY = member.deathDate ? new Date(member.deathDate).getFullYear() : null;

  const handleQR = () => {
    const url = encodeURIComponent(`${window.location.origin}?member=${member.id}`);
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`, '_blank');
  };

  const TABS = [
    { id: 'bio'    as Tab, label: 'Tiểu sử', icon: null   },
    { id: 'family' as Tab, label: 'Gia đình', icon: null  },
    { id: 'photos' as Tab, label: 'Hình ảnh', icon: null  },
  ];

  // ── Row thông tin ─────────────────────────────────────────────────────
  const InfoRow = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <div className="flex gap-3 py-3 border-b" style={{ borderColor: '#233648' }}>
        <span className="text-xs font-bold w-28 flex-shrink-0 pt-0.5 uppercase tracking-wide"
          style={{ color: '#92adc9' }}>{label}</span>
        <span className="text-sm flex-1 text-white leading-relaxed">{value}</span>
      </div>
    ) : null;

  // ── Card thành viên (con, vợ/chồng) ─────────────────────────────────
  const MemberRow = ({ m, sub }: { m: Member; sub?: string }) => (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer"
      style={{ background: '#233648' }}>
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xl"
        style={{ background: '#192633', border: '2px solid #8B5A2B' }}>
        {m.photoUrl ? <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                    : (m.gender === 'Nam' ? '👨' : '👩')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white truncate">{m.name}</p>
        <p className="text-xs" style={{ color: '#92adc9' }}>
          {sub || `${m.birthDate ? new Date(m.birthDate).getFullYear() : '?'} ${m.deathDate ? `— ${new Date(m.deathDate).getFullYear()}` : '· Hiện tại'}`}
        </p>
      </div>
      <div style={{ color: '#92adc9' }}>›</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: '#101922' }}>

      {/* ── Avatar + Cover ── */}
      <div className="flex-shrink-0">
        {/* Cover */}
        <div className="relative h-32"
          style={{
            background: isDeceased
              ? 'linear-gradient(135deg, #1F2937 0%, #111827 100%)'
              : 'linear-gradient(135deg, #192633 0%, #233648 100%)',
          }}>
          {/* Ornament */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #D4AF37 0, #D4AF37 1px, transparent 0, transparent 50%)',
            backgroundSize: '12px 12px'
          }} />

          {/* Buttons */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleQR}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
              <QrCode size={13} /> QR
            </motion.button>
            {isAdmin && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => onEdit(member)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
                <Edit2 size={13} /> Sửa
              </motion.button>
            )}
          </div>

          {/* Close */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-10"
            style={{ background: 'rgba(255,255,255,0.1)' }}>
            <X size={16} color="white" />
          </motion.button>
        </div>

        {/* Avatar nổi lên cover */}
        <div className="flex flex-col items-center -mt-12 pb-4 px-4"
          style={{ background: '#101922' }}>
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4"
              style={{
                borderColor: '#D4AF37',
                boxShadow: '0 0 0 4px #101922, 0 8px 32px rgba(0,0,0,0.6)',
                filter: isDeceased ? 'grayscale(60%)' : 'none',
              }}>
              {member.photoUrl
                ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-5xl"
                    style={{ background: '#192633' }}>
                    {member.gender === 'Nam' ? '👨' : '👩'}
                  </div>}
            </div>
            {/* Online dot */}
            {!isDeceased && (
              <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2"
                style={{ background: '#10B981', borderColor: '#101922' }} />
            )}
          </div>

          {/* Tên */}
          <h2 className="text-xl font-black text-white text-center">{member.name}</h2>
          {member.tenHuy && (
            <p className="text-sm mt-0.5" style={{ color: '#92adc9' }}>Húy: {member.tenHuy}</p>
          )}

          {/* Năm + badges */}
          <p className="text-sm mt-1 font-semibold" style={{ color: '#D4AF37' }}>
            {birthY && deathY ? `${birthY} - ${deathY}` : birthY ? `${birthY} - Hiện tại` : ''}
          </p>
          <div className="flex gap-2 mt-2 flex-wrap justify-center">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: '#192633', color: '#D4AF37', border: '1px solid #233648' }}>
              Đời thứ {member.generation}
            </span>
            {member.chucTuoc && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: '#192633', color: '#D4AF37', border: '1px solid #8B5A2B' }}>
                {member.chucTuoc}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: isDeceased ? '#374151' : '#052e16', color: isDeceased ? '#9CA3AF' : '#10B981' }}>
              {isDeceased ? '🕯️ Đã mất' : '💚 Còn sống'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ background: '#101922', borderColor: '#233648' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-3 text-sm font-bold relative transition-colors"
              style={{ color: tab === t.id ? '#D4AF37' : '#92adc9' }}>
              {t.label}
              {tab === t.id && (
                <motion.div layoutId="memberTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: '#D4AF37' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div ref={scrollRef}
        className="flex-1 overflow-y-auto hide-scrollbar"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>

        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

            {/* TAB: Tiểu sử */}
            {tab === 'bio' && (
              <div className="px-4 py-4 space-y-4">
                {/* Thông tin ngày tháng */}
                {(member.birthDate || member.deathDate) && (
                  <div className="rounded-2xl p-4" style={{ background: '#192633' }}>
                    <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: '#D4AF37' }}>📅 Ngày sinh & Mất</p>
                    <InfoRow label="Sinh (DL)"   value={member.birthDate ? new Date(member.birthDate).toLocaleDateString('vi-VN') : ''} />
                    <InfoRow label="Sinh (ÂL)"   value={member.birthDateLunar} />
                    <InfoRow label="Nơi sinh"    value={member.birthPlace} />
                    <InfoRow label="Mất (DL)"    value={member.deathDate ? new Date(member.deathDate).toLocaleDateString('vi-VN') : ''} />
                    <InfoRow label="Ngày giỗ ⭐" value={member.deathDateLunar} />
                    <InfoRow label="Nơi mất"     value={member.deathPlace} />
                    <InfoRow label="Cư trú"      value={member.residence} />
                  </div>
                )}

                {/* Mộ phần */}
                {(member.burialAddress || member.burialPlace) && (
                  <div className="rounded-2xl p-4" style={{ background: '#192633' }}>
                    <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: '#D4AF37' }}>
                      <MapPin size={12} className="inline mr-1" />Mộ phần
                    </p>
                    <p className="text-sm text-white mb-2">{member.burialAddress || member.burialPlace}</p>
                    {member.burialMapLink && (
                      <a href={member.burialMapLink} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold"
                        style={{ background: '#233648', color: '#D4AF37' }}>
                        <ExternalLink size={14} /> Xem trên Google Maps
                      </a>
                    )}
                  </div>
                )}

                {/* Tiểu sử */}
                {member.biography ? (
                  <div className="rounded-2xl p-4" style={{ background: '#192633' }}>
                    <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: '#D4AF37' }}>📝 Tiểu sử</p>
                    <p className="text-sm text-white leading-relaxed whitespace-pre-line">{member.biography}</p>
                  </div>
                ) : (
                  <div className="text-center py-8" style={{ color: '#92adc9' }}>
                    <p className="text-4xl mb-2">📝</p>
                    <p className="text-sm">Chưa có tiểu sử</p>
                  </div>
                )}

                {/* Thông tin thêm */}
                <div className="rounded-2xl overflow-hidden" style={{ background: '#192633' }}>
                  <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #233648' }}>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#D4AF37' }}>THÔNG TIN THÊM</span>
                  </div>
                  {[
                    { icon: '💼', label: 'Nghề nghiệp', value: member.chucTuoc },
                    { icon: '📧', label: 'Email',       value: member.email    },
                  ].filter(r => r.value).map(r => (
                    <div key={r.label} className="flex items-start gap-3 px-4 py-3" style={{ borderBottom: '1px solid #233648' }}>
                      <span className="text-sm">{r.icon}</span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: '#92adc9' }}>{r.label}</p>
                        <p className="text-sm text-white">{r.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Gia đình */}
            {tab === 'family' && (
              <div className="px-4 py-4 space-y-4">
                {/* Vợ/Chồng */}
                {spouse && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Heart size={16} color="#EC4899" />
                      <p className="font-bold text-white">Vợ / Chồng</p>
                    </div>
                    <MemberRow m={spouse}
                      sub={`${spouse.birthDate ? new Date(spouse.birthDate).getFullYear() : '?'} - ${spouse.deathDate ? new Date(spouse.deathDate).getFullYear() : 'Hiện tại'}`} />
                  </div>
                )}

                {/* Cha mẹ */}
                {(father || mother) && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">👴</span>
                      <p className="font-bold text-white">Cha / Mẹ</p>
                    </div>
                    <div className="space-y-2">
                      {father && <MemberRow m={father} />}
                      {mother && <MemberRow m={mother} />}
                    </div>
                  </div>
                )}

                {/* Con cái */}
                {children.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={16} color="#60A5FA" />
                      <p className="font-bold text-white">Các con ({children.length})</p>
                    </div>
                    <div className="space-y-2">
                      {children.map((c, i) => {
                        const order = i === 0 ? 'Trưởng' : i === children.length - 1 ? 'Út' : `Thứ ${i + 1}`;
                        return (
                          <MemberRow key={c.id} m={c}
                            sub={`${order} ${c.gender === 'Nam' ? 'nam' : 'nữ'} • ${c.birthDate ? new Date(c.birthDate).getFullYear() : '?'}`} />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cháu */}
                {grandchildren.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">👶</span>
                      <p className="font-bold text-white">Các cháu ({grandchildren.length})</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {grandchildren.slice(0, 4).map(g => {
                        const parent = children.find(c => g.fatherId === c.id || g.motherId === c.id);
                        return (
                          <div key={g.id} className="flex flex-col items-center rounded-2xl py-3 px-2"
                            style={{ background: '#192633' }}>
                            <div className="w-12 h-12 rounded-full overflow-hidden mb-2 flex items-center justify-center text-2xl"
                              style={{ background: '#233648' }}>
                              {g.photoUrl ? <img src={g.photoUrl} alt={g.name} className="w-full h-full object-cover" /> : (g.gender === 'Nam' ? '👦' : '👧')}
                            </div>
                            <p className="font-bold text-white text-xs text-center truncate w-full">{g.name.split(' ').slice(-2).join(' ')}</p>
                            <p className="text-xs text-center mt-0.5" style={{ color: '#92adc9' }}>
                              CON {parent?.gender === 'Nam' ? 'ÔNG' : 'BÀ'} {parent?.name.split(' ').pop()?.toUpperCase()}
                            </p>
                          </div>
                        );
                      })}
                      {grandchildren.length > 4 && (
                        <div className="flex flex-col items-center justify-center rounded-2xl py-3 px-2"
                          style={{ background: '#192633' }}>
                          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                            style={{ background: '#233648' }}>
                            <span className="font-black text-white">+{grandchildren.length - 4}</span>
                          </div>
                          <button className="text-xs font-semibold" style={{ color: '#D4AF37' }}>Xem tất cả</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!spouse && children.length === 0 && !father && !mother && (
                  <div className="text-center py-10" style={{ color: '#92adc9' }}>
                    <p className="text-4xl mb-2">👪</p>
                    <p className="text-sm">Chưa có thông tin gia đình</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Hình ảnh */}
            {tab === 'photos' && (
              <div className="px-4 py-4">
                {member.photoUrl ? (
                  <div className="columns-2 gap-3">
                    {[member.photoUrl].map((url, i) => (
                      <div key={i} className="break-inside-avoid mb-3 rounded-2xl overflow-hidden">
                        <img src={url} alt={`Ảnh ${i+1}`} className="w-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10" style={{ color: '#92adc9' }}>
                    <ImageIcon size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Chưa có hình ảnh</p>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
