import { X, Edit2, QrCode } from 'lucide-react';
import { Member } from '../types';
import { getRelationship } from '../utils/relationship';

interface Props {
  member: Member | null;
  members: Member[];
  onClose: () => void;
  onEdit: (m: Member) => void;
  isAdmin?: boolean;
  viewer?: Member | null;
  darkMode?: boolean;
}

export default function MemberDetail({ member, members, onClose, onEdit, isAdmin, viewer, darkMode = false }: Props) {
  if (!member) return null;

  // ── Màu theme ─────────────────────────────────────────────────────────────
  const bg       = darkMode ? '#111214'   : '#f8fafc';
  const cardBg   = darkMode ? '#1d1f21'   : '#ffffff';
  const textMain = darkMode ? '#f5f5f5'   : '#0b0b0b';
  const textSub  = darkMode ? '#c0c0c0'   : '#3d3d3d';
  const border   = darkMode ? '#2d3748'   : '#e2e8f0';
  const divider  = darkMode ? '#1d1f21'   : '#F0E8DC';

  // Section colors
  const sectionDate   = darkMode ? '#1a1c1e' : '#EFF6FF';
  const sectionDateTxt = darkMode ? '#93C5FD' : '#1D4ED8';
  const sectionPlace  = darkMode ? '#0f2a1a' : '#F0FDF4';
  const sectionPlaceTxt = darkMode ? '#6EE7B7' : '#166534';
  const sectionFamily = darkMode ? '#2a0d1a' : '#FDF2F8';
  const sectionFamilyTxt = darkMode ? '#F9A8D4' : '#9D174D';
  const sectionBio    = darkMode ? '#1d1f21' : '#F8F5F0';
  const sectionBioTxt = darkMode ? '#c0c0c0' : '#3d3d3d';
  const sectionName   = darkMode ? '#1a1500' : '#FFFBEB';
  const sectionNameTxt = darkMode ? '#FCD34D' : '#92400E';

  const find = (id: string | null) => id ? members.find(m => m.id === id) : null;
  const father   = find(member.fatherId ?? null);
  const mother   = find(member.motherId ?? null);
  const spouse   = find(member.spouseId ?? null);
  const children = members.filter(m => m.fatherId === member.id || m.motherId === member.id);

  const relation = viewer && viewer.id !== member.id
    ? getRelationship(viewer, member, members)
    : null;

  const handleQR = () => {
    const shareUrl = `${window.location.origin}?member=${member.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;
    window.open(qrUrl, '_blank');
  };

  const isDeceased = !!member.deathDate;

  // ── Row helper ─────────────────────────────────────────────────────────────
  const Row = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <div style={{
        display: 'flex', gap: 10, paddingTop: 10, paddingBottom: 10,
        borderBottom: `1px solid ${divider}`,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: textSub,
          width: 130, flexShrink: 0, textTransform: 'uppercase',
          fontFamily: "'Roboto', sans-serif", letterSpacing: '0.03em',
        }}>
          {label}
        </span>
        <span style={{ fontSize: 15, color: textMain, fontFamily: "'Roboto', sans-serif", lineHeight: 1.5 }}>
          {value}
        </span>
      </div>
    ) : null;

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
    >
      <div
        className="rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg overflow-hidden"
        style={{
          background: bg,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center px-4 py-3 flex-shrink-0 sticky top-0 z-10"
          style={{
            background: isDeceased
              ? 'linear-gradient(135deg, #374151, #4B5563)'
              : 'linear-gradient(135deg, #CC0000, #dd2476)',
            borderRadius: '24px 24px 0 0',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'white', fontFamily: "'Roboto', sans-serif" }}>
            {isDeceased ? '🕯️ Hồ sơ thành viên' : '👤 Hồ sơ thành viên'}
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleQR}
              style={{
                background: 'rgba(255,255,255,0.18)', border: 'none',
                borderRadius: 8, padding: '6px 10px',
                display: 'flex', alignItems: 'center', gap: 5,
                color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <QrCode size={15} /> QR
            </button>
            {isAdmin && (
              <button
                onClick={() => onEdit(member)}
                style={{
                  background: 'rgba(255,255,255,0.18)', border: 'none',
                  borderRadius: 8, padding: '6px 10px',
                  display: 'flex', alignItems: 'center', gap: 5,
                  color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Edit2 size={15} /> Sửa
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.18)', border: 'none',
                borderRadius: '50%', width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={20} color="white" />
            </button>
          </div>
        </div>

        {/* Nội dung */}
        <div className="overflow-y-auto" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Ảnh & tên chính */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 84, height: 84, borderRadius: 18,
              border: `3px solid ${isDeceased ? '#6B7280' : '#7A5A00'}`,
              overflow: 'hidden', flexShrink: 0,
              background: darkMode ? '#1d1f21' : '#E8DFCF',
              boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(28,20,16,0.15)',
            }}>
              {member.photoUrl
                ? <img src={member.photoUrl} alt={member.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isDeceased ? 'grayscale(80%)' : 'none' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                    {isDeceased ? '👴' : '👤'}
                  </div>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                fontSize: 22, fontWeight: 900, color: '#CC0000',
                fontFamily: "'Roboto', sans-serif", lineHeight: 1.2, marginBottom: 3,
              }}>
                {member.name}
              </h2>
              {member.tenHuy && (
                <p style={{ fontSize: 14, color: textSub, marginBottom: 2 }}>
                  Húy: <strong style={{ color: textMain }}>{member.tenHuy}</strong>
                </p>
              )}
              {member.chucTuoc && (
                <p style={{ fontSize: 14, fontWeight: 700, color: '#7A5A00', marginBottom: 2 }}>{member.chucTuoc}</p>
              )}
              <p style={{ fontSize: 13, color: textSub }}>
                {member.gender} · Đời thứ {member.generation}
              </p>
              {relation && (
                <div style={{
                  display: 'inline-block', marginTop: 5,
                  background: 'rgba(128,0,0,0.12)', color: '#CC0000',
                  fontSize: 13, fontWeight: 800,
                  padding: '3px 10px', borderRadius: 999,
                  fontFamily: "'Roboto', sans-serif",
                }}>
                  👥 {relation.label}
                </div>
              )}
            </div>
          </div>

          {/* Tên chữ / Tên Thụy */}
          {(member.tenTu || member.tenThuy) && (
            <div style={{ background: sectionName, borderRadius: 14, padding: 14 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: sectionNameTxt, textTransform: 'uppercase', marginBottom: 8, fontFamily: "'Roboto', sans-serif" }}>
                📜 Tên chữ
              </h4>
              <Row label="Tự (Tên chữ)" value={member.tenTu} />
              <Row label="Thụy" value={member.tenThuy} />
            </div>
          )}

          {/* Ngày sinh / Mất */}
          <div style={{ background: sectionDate, borderRadius: 14, padding: 14 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: sectionDateTxt, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em', fontFamily: "'Roboto', sans-serif" }}>
              📅 Ngày sinh & Ngày mất
            </h4>
            <Row label="Sinh (DL)"     value={member.birthDate ? new Date(member.birthDate).toLocaleDateString('vi-VN') : undefined} />
            <Row label="Sinh (ÂL)"     value={member.birthDateLunar} />
            <Row label="Mất (DL)"      value={member.deathDate ? new Date(member.deathDate).toLocaleDateString('vi-VN') : undefined} />
            <Row label="Ngày giỗ (ÂL)" value={member.deathDateLunar} />
          </div>

          {/* Địa danh */}
          {(member.birthPlace || member.residence || (member.burialAddress || member.burialPlace) || member.deathPlace) && (
            <div style={{ background: sectionPlace, borderRadius: 14, padding: 14 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: sectionPlaceTxt, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em', fontFamily: "'Roboto', sans-serif" }}>
                📍 Địa danh
              </h4>
              <Row label="Nơi sinh"  value={member.birthPlace} />
              <Row label="Cư trú"    value={member.residence} />
              <Row label="Nơi mất"   value={member.deathPlace} />
              <Row label="Chôn cất"  value={member.burialAddress || member.burialPlace} />
              {member.burialMapLink && (
                <div style={{ marginTop: 8 }}>
                  <a
                    href={member.burialMapLink} target="_blank" rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'linear-gradient(135deg, #CC0000, #990000)',
                      color: 'white', textDecoration: 'none',
                      padding: '8px 14px', borderRadius: 10,
                      fontSize: 13, fontWeight: 700, fontFamily: "'Roboto', sans-serif",
                    }}
                  >
                    🗺️ Xem trên Google Maps
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Gia đình */}
          <div style={{ background: sectionFamily, borderRadius: 14, padding: 14 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: sectionFamilyTxt, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em', fontFamily: "'Roboto', sans-serif" }}>
              👨‍👩‍👧 Gia đình
            </h4>
            <Row label="Cha" value={father?.name} />
            <Row label="Mẹ" value={mother?.name} />
            <Row label={member.gender === 'Nam' ? 'Vợ' : 'Chồng'} value={spouse?.name} />
            {children.length > 0 && (
              <div style={{ display: 'flex', gap: 10, paddingTop: 10, paddingBottom: 10 }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: textSub,
                  width: 130, flexShrink: 0, textTransform: 'uppercase',
                  fontFamily: "'Roboto', sans-serif",
                }}>
                  Con ({children.length})
                </span>
                <span style={{ fontSize: 15, color: textMain, lineHeight: 1.6, fontFamily: "'Roboto', sans-serif" }}>
                  {children.map(c => c.name).join(' · ')}
                </span>
              </div>
            )}
          </div>

          {/* Tiểu sử */}
          {member.biography && (
            <div style={{ background: sectionBio, borderRadius: 14, padding: 14, border: `1px solid ${border}` }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: sectionBioTxt, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em', fontFamily: "'Roboto', sans-serif" }}>
                📝 Tiểu sử & Công trạng
              </h4>
              <p style={{ fontSize: 15, color: textMain, whiteSpace: 'pre-line', lineHeight: 1.7, fontFamily: "'Roboto', sans-serif" }}>
                {member.biography}
              </p>
            </div>
          )}

          <div style={{ height: 16 }} />
        </div>
      </div>
    </div>
  );
}
