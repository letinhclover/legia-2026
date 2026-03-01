import { motion } from 'framer-motion';
import { Edit2, QrCode, X, MapPin, ExternalLink } from 'lucide-react';
import { Member } from '../types';

interface Props {
  member: Member | null;
  members: Member[];
  onClose: () => void;
  onEdit: (m: Member) => void;
  isAdmin: boolean;
}

const Row = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-700 flex-1 leading-relaxed">{value}</span>
    </div>
  ) : null;

const Section = ({ title, color = 'gray', children }: {
  title: string; color?: string; children: React.ReactNode
}) => {
  const bg:   Record<string,string> = { blue:'bg-blue-50', green:'bg-green-50', pink:'bg-pink-50', amber:'bg-amber-50', gray:'bg-gray-50' };
  const text: Record<string,string> = { blue:'text-blue-700', green:'text-green-700', pink:'text-pink-700', amber:'text-amber-700', gray:'text-gray-500' };
  return (
    <div className={`${bg[color]} rounded-2xl p-4`}>
      <h4 className={`text-xs font-bold ${text[color]} uppercase tracking-wider mb-2`}>{title}</h4>
      {children}
    </div>
  );
};

export default function MemberBottomSheet({ member, members, onClose, onEdit, isAdmin }: Props) {
  if (!member) return null;

  const find     = (id: string | null | undefined) => id ? members.find(m => m.id === id) : null;
  const father   = find(member.fatherId);
  const mother   = find(member.motherId);
  const spouse   = find(member.spouseId);
  const children = members
    .filter(m => m.fatherId === member.id || m.motherId === member.id)
    .sort((a, b) => (a.birthDate || '').localeCompare(b.birthDate || ''));

  const isDeceased = !!member.deathDate;

  const handleQR = () => {
    const url = encodeURIComponent(`${window.location.origin}?member=${member.id}`);
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`, '_blank');
  };

  /*
    ── FIX SCROLL TRIỆT ĐỂ ────────────────────────────────────────────────
    KHÔNG dùng h-full, KHÔNG dùng overflow-y-auto ở đây.
    Component này chỉ render nội dung dạng PHẲNG (flat).
    Tất cả scroll được quản lý bởi BottomSheet (container ngoài),
    đảm bảo chỉ có 1 scroll context duy nhất.
    ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col bg-white">

      {/* ── Cover + Avatar (sticky top, không thuộc scroll flow) ── */}
      <div className="relative flex-shrink-0">
        <div
          className="h-28 w-full"
          style={{
            background: isDeceased
              ? 'linear-gradient(135deg, #374151 0%, #1F2937 100%)'
              : 'linear-gradient(135deg, #800000 0%, #4a0000 50%, #B8860B 100%)',
          }}
        >
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            className="absolute top-3 right-3 bg-black bg-opacity-30 rounded-full p-1.5 text-white">
            <X size={18} />
          </motion.button>

          <div className="absolute top-3 left-3 flex gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleQR}
              className="bg-black bg-opacity-30 rounded-full px-3 py-1.5 text-white text-xs font-semibold flex items-center gap-1">
              <QrCode size={13} /> QR
            </motion.button>
            {isAdmin && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => onEdit(member)}
                className="bg-black bg-opacity-30 rounded-full px-3 py-1.5 text-white text-xs font-semibold flex items-center gap-1">
                <Edit2 size={13} /> Sửa
              </motion.button>
            )}
          </div>
        </div>

        {/* Avatar chồng lên cover */}
        <div className="absolute -bottom-10 left-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg"
            style={{ filter: isDeceased ? 'grayscale(70%)' : 'none' }}>
            {member.photoUrl
              ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl">
                  {member.gender === 'Nam' ? '👨' : '👩'}
                </div>
            }
          </div>
        </div>

        {isDeceased && (
          <div className="absolute -bottom-3 left-24 bg-gray-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
            🕯️ Đã mất
          </div>
        )}
      </div>

      {/* ── Nội dung — PHẲNG, không overflow riêng ── */}
      {/* pt-14 để tránh avatar chồng lên text */}
      <div className="pt-14 px-5 pb-8 space-y-4">

        {/* Tên & badges */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-snug">{member.name}</h2>
          {member.tenHuy && <p className="text-sm text-gray-500 mt-0.5">Húy: <span className="font-semibold text-gray-700">{member.tenHuy}</span></p>}
          {member.tenTu  && <p className="text-sm text-gray-500">Tự: <span className="font-semibold text-gray-700">{member.tenTu}</span></p>}
          {member.chucTuoc && (
            <div className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: '#FFF3CD', color: '#B8860B' }}>
              {member.chucTuoc}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${member.gender==='Nam' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
              {member.gender === 'Nam' ? '👨 Nam' : '👩 Nữ'}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-red-50 text-red-700">
              Đời {member.generation}
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${isDeceased ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
              {isDeceased ? '🕯️ Đã mất' : '💚 Còn sống'}
            </span>
          </div>
        </div>

        {/* Ngày tháng */}
        {(member.birthDate || member.deathDate || member.birthDateLunar || member.deathDateLunar) && (
          <Section title="📅 Ngày sinh & Ngày mất" color="blue">
            <Row label="Sinh (DL)"  value={member.birthDate  ? new Date(member.birthDate).toLocaleDateString('vi-VN')  : ''} />
            <Row label="Sinh (ÂL)"  value={member.birthDateLunar} />
            <Row label="Nơi sinh"   value={member.birthPlace} />
            <Row label="Mất (DL)"   value={member.deathDate  ? new Date(member.deathDate).toLocaleDateString('vi-VN')   : ''} />
            <Row label="Ngày giỗ ⭐" value={member.deathDateLunar} />
            <Row label="Nơi mất"    value={member.deathPlace} />
          </Section>
        )}

        {/* Địa danh */}
        {(member.birthPlace || member.residence || member.burialAddress || member.burialPlace) && (
          <Section title="📍 Địa danh" color="green">
            <Row label="Cư trú" value={member.residence} />
            {(member.burialAddress || member.burialPlace) && (
              <div className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5 flex items-center gap-1">
                  <MapPin size={11} /> Mộ phần
                </span>
                <div className="flex-1 flex items-start justify-between gap-2">
                  <span className="text-sm text-gray-700 flex-1 leading-relaxed">
                    {member.burialAddress || member.burialPlace}
                  </span>
                  {member.burialMapLink && (
                    <a href={member.burialMapLink} target="_blank" rel="noreferrer"
                      className="flex-shrink-0 bg-blue-600 text-white text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 font-bold shadow-sm">
                      <ExternalLink size={11} /> Maps
                    </a>
                  )}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Gia đình */}
        <Section title="👨‍👩‍👧 Gia đình" color="pink">
          <Row label="Cha"  value={father?.name} />
          <Row label="Mẹ"   value={mother?.name} />
          <Row label={member.gender==='Nam' ? '💑 Vợ' : '💑 Chồng'} value={spouse?.name} />
          {children.length > 0 && (
            <div className="mt-3 pt-3 border-t border-pink-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                Con cái ({children.length})
              </p>
              <div className="space-y-2">
                {children.map((c, idx) => (
                  <motion.div key={c.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2 shadow-sm">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center text-base">
                      {c.photoUrl
                        ? <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
                        : (c.gender==='Nam' ? '👦' : '👧')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">
                        {c.gender} · {c.birthDate ? new Date(c.birthDate).getFullYear() : '?'}
                        {c.deathDate ? ` — ${new Date(c.deathDate).getFullYear()}` : ''}
                      </p>
                    </div>
                    {c.deathDate && <span className="text-xs flex-shrink-0">🕯️</span>}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {member.biography && (
          <Section title="📝 Tiểu sử" color="gray">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{member.biography}</p>
          </Section>
        )}

        {member.email && (
          <div className="text-xs text-gray-400 text-center pb-2">📧 {member.email}</div>
        )}
      </div>
    </div>
  );
}
