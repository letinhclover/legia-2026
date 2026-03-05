import { motion } from 'framer-motion';
import { Edit2, QrCode, X, MapPin, ExternalLink } from 'lucide-react';
import { Member, MEMBER_TYPE_LABEL, MEMBER_TYPE_COLOR } from '../types';

interface Props {
  member: Member | null;
  members: Member[];
  onClose: () => void;
  onEdit: (m: Member) => void;
  onSelectMember: (m: Member) => void;
  isAdmin: boolean;
  darkMode?: boolean;
}

function resolveMemberType(member: Member, members: Member[]): string {
  const stored = member.memberType;
  if (stored && stored !== 'chinh') return stored;

  const map    = new Map(members.map(m => [m.id, m]));
  const spouse = member.spouseId ? map.get(member.spouseId) : null;

  if (member.gender === 'Nữ' && spouse && (!spouse.memberType || spouse.memberType === 'chinh'))
    return 'dau';

  const father = member.fatherId ? map.get(member.fatherId) : null;
  const mother = member.motherId ? map.get(member.motherId) : null;
  if (mother && (!mother.memberType || mother.memberType === 'chinh'))
    if (father && (father.memberType === 're' || father.memberType === 'ngoai_toc'))
      return 'chau_ngoai';

  return 'chinh';
}

export default function MemberBottomSheet({
  member, members, onClose, onEdit, onSelectMember, isAdmin, darkMode = false,
}: Props) {
  if (!member) return null;

  // ── Màu theme ──────────────────────────────────────────────────────────────
  const bg         = darkMode ? '#111214'   : '#ffffff';
  const textMain   = darkMode ? '#f5f5f5'   : '#0b0b0b';
  const textSub    = darkMode ? '#c0c0c0'   : '#3d3d3d';
  const border     = darkMode ? '#2d3748'   : '#F0E8DC';
  const cardBg     = darkMode ? '#1d1f21'   : '#FFFFFF';
  const sectionBlue   = darkMode ? '#1a1c1e' : '#EFF6FF';
  const sectionGreen  = darkMode ? '#0f2a1a' : '#F0FDF4';
  const sectionPink   = darkMode ? '#2a0d1a' : '#FDF2F8';
  const sectionGray   = darkMode ? '#1d1f21' : '#F8F5F0';
  const blueTxt    = darkMode ? '#93C5FD'   : '#1D4ED8';
  const greenTxt   = darkMode ? '#6EE7B7'   : '#166534';
  const pinkTxt    = darkMode ? '#F9A8D4'   : '#9D174D';
  const grayTxt    = darkMode ? '#c0c0c0'   : '#3d3d3d';

  const find     = (id: string | null | undefined) => id ? members.find(m => m.id === id) ?? null : null;
  const father   = find(member.fatherId);
  const mother   = find(member.motherId);
  const spouse   = find(member.spouseId);
  const children = members
    .filter(m => m.fatherId === member.id || m.motherId === member.id)
    .sort((a, b) => (a.birthDate || '').localeCompare(b.birthDate || ''));

  const isDeceased   = !!member.deathDate;
  const resolvedType = resolveMemberType(member, members);
  const typeColor    = MEMBER_TYPE_COLOR[resolvedType] ?? MEMBER_TYPE_COLOR['chinh'];

  const handleQR = () => {
    const url = encodeURIComponent(`${window.location.origin}?member=${member.id}`);
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`, '_blank');
  };

  // ── Sub-components ─────────────────────────────────────────────────────────
  const Row = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <div style={{
        display: 'flex', gap: 12,
        paddingTop: 10, paddingBottom: 10,
        borderBottom: `1px solid ${border}`,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: textSub,
          width: 116, flexShrink: 0, textTransform: 'uppercase',
          letterSpacing: '0.03em', fontFamily: "'Roboto', sans-serif",
        }}>
          {label}
        </span>
        <span style={{
          fontSize: 15, color: textMain, flex: 1, lineHeight: 1.5,
          fontFamily: "'Roboto', sans-serif",
        }}>
          {value}
        </span>
      </div>
    ) : null;

  const Section = ({
    title, titleColor, bg: sectionBg, children: ch,
  }: { title: string; titleColor: string; bg: string; children: React.ReactNode }) => (
    <div style={{ background: sectionBg, borderRadius: 16, padding: 14 }}>
      <h4 style={{
        fontSize: 12, fontWeight: 800, color: titleColor,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: 6, fontFamily: "'Roboto', sans-serif",
      }}>
        {title}
      </h4>
      {ch}
    </div>
  );

  const PersonRow = ({
    label, person,
  }: { label: string; person: Member | null | undefined }) => {
    if (!person) return null;
    const dec = !!person.deathDate;
    return (
      <div
        onClick={() => onSelectMember(person)}
        style={{
          display: 'flex', gap: 12,
          paddingTop: 10, paddingBottom: 10,
          borderBottom: `1px solid ${border}`,
          cursor: 'pointer',
        }}
      >
        <span style={{
          fontSize: 12, fontWeight: 700, color: textSub,
          width: 116, flexShrink: 0, textTransform: 'uppercase',
          letterSpacing: '0.03em', fontFamily: "'Roboto', sans-serif",
        }}>
          {label}
        </span>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{
            fontSize: 15, fontWeight: 700,
            color: darkMode ? '#7A5A00' : '#CC0000',
            fontFamily: "'Roboto', sans-serif",
            textDecoration: 'underline', textDecorationStyle: 'dotted',
          }}>
            {person.name}
          </span>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 700,
            background: dec ? (darkMode ? '#1a1a1a' : '#F3F4F6') : (darkMode ? '#0f2a1a' : '#DCFCE7'),
            color: dec ? textSub : '#16A34A',
            flexShrink: 0,
          }}>
            {dec ? '🕯️' : '💚'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col" style={{ background: bg, minHeight: '100%' }}>

      {/* ── Cover + Avatar ── */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          height: 112, width: '100%',
          background: isDeceased
            ? 'linear-gradient(135deg, #374151 0%, #1F2937 100%)'
            : 'linear-gradient(135deg, #CC0000 0%, #880000 50%, #B8860B 100%)',
        }}>
          {/* Nút đóng */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(0,0,0,0.35)', border: 'none', borderRadius: '50%',
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
            <X size={18} color="white" />
          </motion.button>

          {/* Nút QR & Sửa & Share */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8 }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleQR}
              style={{
                background: 'rgba(0,0,0,0.35)', border: 'none',
                borderRadius: 20, padding: '7px 12px',
                display: 'flex', alignItems: 'center', gap: 5,
                color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
              <QrCode size={14} /> QR
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
              const url = `${window.location.origin}${window.location.pathname}?member=${member.id}`;
              if (navigator.share) {
                navigator.share({ title: member.name, text: `Xem thông tin ${member.name} trong Gia Phả Dòng Họ Lê`, url });
              } else {
                navigator.clipboard.writeText(url);
                // Show brief toast via alert (no state available here)
                const btn = document.activeElement as HTMLButtonElement;
                if (btn) btn.textContent = '✅ Đã chép!';
                setTimeout(() => { if (btn) btn.innerHTML = '🔗 Chia sẻ'; }, 1500);
              }
            }}
              style={{
                background: 'rgba(0,0,0,0.35)', border: 'none',
                borderRadius: 20, padding: '7px 12px',
                display: 'flex', alignItems: 'center', gap: 5,
                color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
              🔗 Chia sẻ
            </motion.button>
            {isAdmin && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => onEdit(member)}
                style={{
                  background: 'rgba(0,0,0,0.35)', border: 'none',
                  borderRadius: 20, padding: '7px 12px',
                  display: 'flex', alignItems: 'center', gap: 5,
                  color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>
                <Edit2 size={14} /> Sửa
              </motion.button>
            )}
          </div>
        </div>

        {/* Avatar */}
        <div style={{ position: 'absolute', bottom: -40, left: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 18,
            overflow: 'hidden', border: `4px solid ${bg}`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            filter: isDeceased ? 'grayscale(70%)' : 'none',
          }}>
            {member.photoUrl
              ? <img src={member.photoUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{
                  width: '100%', height: '100%',
                  background: darkMode ? '#1d1f21' : '#E8DFCF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36,
                }}>
                  {member.gender === 'Nam' ? '👨' : '👩'}
                </div>
            }
          </div>
        </div>

        {isDeceased && (
          <div style={{
            position: 'absolute', bottom: -14, left: 108,
            background: '#4B5563', color: 'white',
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            🕯️ Đã mất
          </div>
        )}
      </div>

      {/* ── Nội dung ── */}
      <div style={{ paddingTop: 56, paddingLeft: 20, paddingRight: 20, paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Tên & badges */}
        <div>
          <h2 style={{
            fontSize: 24, fontWeight: 900, color: textMain, lineHeight: 1.2,
            fontFamily: "'Roboto', sans-serif",
          }}>
            {member.name}
          </h2>
          {member.tenHuy && (
            <p style={{ fontSize: 14, color: textSub, marginTop: 3 }}>
              Húy: <strong style={{ color: textMain }}>{member.tenHuy}</strong>
            </p>
          )}
          {(member as any).nickname && (
            <p style={{ fontSize: 14, color: textSub, marginTop: 2 }}>
              Thường gọi: <strong style={{ color: textMain }}>{(member as any).nickname}</strong>
            </p>
          )}
          {member.chucTuoc && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', marginTop: 5,
              padding: '3px 10px', borderRadius: 999,
              background: '#FFF3CD', color: '#7A5A00',
              fontSize: 13, fontWeight: 800,
              fontFamily: "'Roboto', sans-serif",
            }}>
              {member.chucTuoc}
            </div>
          )}

          {/* Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {[
              {
                label: member.gender === 'Nam' ? '👨 Nam' : '👩 Nữ',
                bg: member.gender === 'Nam'
                  ? (darkMode ? '#1a1c1e' : '#DBEAFE')
                  : (darkMode ? '#2a0d1a' : '#FCE7F3'),
                color: member.gender === 'Nam'
                  ? (darkMode ? '#93C5FD' : '#1D4ED8')
                  : (darkMode ? '#F9A8D4' : '#9D174D'),
              },
              {
                label: `Đời ${member.generation}`,
                bg: darkMode ? '#2a1010' : '#FEF2F2',
                color: darkMode ? '#FCA5A5' : '#991B1B',
              },
              {
                label: isDeceased ? '🕯️ Đã mất' : '💚 Còn sống',
                bg: isDeceased
                  ? (darkMode ? '#1a1a1a' : '#F3F4F6')
                  : (darkMode ? '#0f2a1a' : '#DCFCE7'),
                color: isDeceased ? textSub : '#16A34A',
              },
              {
                label: MEMBER_TYPE_LABEL[resolvedType],
                bg: darkMode
                  ? 'rgba(255,255,255,0.08)'
                  : typeColor.bg,
                color: darkMode ? '#D4AF37' : typeColor.text,
              },
            ].map(b => (
              <span key={b.label} style={{
                fontSize: 13, fontWeight: 700,
                padding: '4px 12px', borderRadius: 999,
                background: b.bg, color: b.color,
                fontFamily: "'Roboto', sans-serif",
              }}>
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Ngày tháng */}
        {(member.birthDate || member.deathDate || member.birthDateLunar || member.deathDateLunar) && (
          <Section title="📅 Ngày sinh & Ngày mất" titleColor={blueTxt} bg={sectionBlue}>
            <Row label="Sinh (DL)"  value={member.birthDate  ? new Date(member.birthDate).toLocaleDateString('vi-VN')  : ''} />
            <Row label="Sinh (ÂL)"  value={member.birthDateLunar} />
            <Row label="Nơi sinh"   value={member.birthPlace} />
            <Row label="Mất (DL)"   value={member.deathDate  ? new Date(member.deathDate).toLocaleDateString('vi-VN')  : ''} />
            <Row label="Ngày giỗ ⭐" value={member.deathDateLunar} />
            <Row label="Nơi mất"    value={member.deathPlace} />
          </Section>
        )}

        {/* Địa danh — cư trú */}
        {member.residence && (
          <Section title="📍 Địa danh" titleColor={greenTxt} bg={sectionGreen}>
            <Row label="Cư trú" value={member.residence} />
          </Section>
        )}

        {/* Mộ phần — luôn hiện với người đã mất */}
        {member.deathDate && (
          <Section title="⚰️ Mộ phần" titleColor={blueTxt} bg={sectionBlue}>
            {(member.burialAddress || member.burialPlace) ? (
              <div style={{
                display: 'flex', gap: 12,
                paddingTop: 10, paddingBottom: 10,
                borderBottom: `1px solid ${border}`,
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: textSub,
                  width: 116, flexShrink: 0, textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontFamily: "'Roboto', sans-serif",
                }}>
                  <MapPin size={12} /> Địa chỉ
                </span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 15, color: textMain, flex: 1, lineHeight: 1.5, fontFamily: "'Roboto', sans-serif" }}>
                    {member.burialAddress || member.burialPlace}
                  </span>
                  {member.burialMapLink && (
                    <a
                      href={member.burialMapLink} target="_blank" rel="noreferrer"
                      style={{
                        flexShrink: 0,
                        background: '#2563EB', color: 'white',
                        fontSize: 12, fontWeight: 700,
                        padding: '6px 10px', borderRadius: 10,
                        textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontFamily: "'Roboto', sans-serif",
                      }}
                    >
                      <ExternalLink size={12} /> Maps
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p style={{
                fontSize: 13, color: textSub, fontStyle: 'italic',
                padding: '8px 0', fontFamily: "'Roboto', sans-serif",
              }}>
                Chưa có thông tin mộ phần
              </p>
            )}
          </Section>
        )}

        {/* Gia đình */}
        <Section title="👨‍👩‍👧 Gia đình" titleColor={pinkTxt} bg={sectionPink}>
          <PersonRow label="Cha" person={father} />
          <PersonRow label="Mẹ"  person={mother} />
          <PersonRow
            label={member.gender === 'Nam' ? '💑 Vợ' : '💑 Chồng'}
            person={spouse}
          />

          {children.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${border}` }}>
              <p style={{
                fontSize: 12, fontWeight: 800, color: pinkTxt,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                marginBottom: 10, fontFamily: "'Roboto', sans-serif",
              }}>
                Con cái ({children.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {children.map((c, idx) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onSelectMember(c)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: cardBg, borderRadius: 14,
                      padding: '10px 12px',
                      boxShadow: darkMode
                        ? '0 2px 8px rgba(0,0,0,0.3)'
                        : '0 1px 6px rgba(28,20,16,0.08)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      overflow: 'hidden', flexShrink: 0,
                      background: darkMode ? '#1d1f21' : '#E8DFCF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      {c.photoUrl
                        ? <img src={c.photoUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (c.gender === 'Nam' ? '👦' : '👧')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 15, fontWeight: 800, color: textMain,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontFamily: "'Roboto', sans-serif",
                      }}>
                        {c.name}
                      </p>
                      <p style={{ fontSize: 13, color: textSub, marginTop: 1, fontFamily: "'Roboto', sans-serif" }}>
                        {c.gender} ·{' '}
                        {c.birthDate ? new Date(c.birthDate).getFullYear() : '?'}
                        {c.deathDate ? ` — ${new Date(c.deathDate).getFullYear()}` : ''}
                      </p>
                    </div>
                    {c.deathDate && <span style={{ fontSize: 16, flexShrink: 0 }}>🕯️</span>}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Tiểu sử */}
        {member.biography && (
          <Section title="📝 Tiểu sử & Công trạng" titleColor={grayTxt} bg={sectionGray}>
            <p style={{
              fontSize: 15, color: textMain, lineHeight: 1.7,
              whiteSpace: 'pre-line', fontFamily: "'Roboto', sans-serif",
            }}>
              {member.biography}
            </p>
          </Section>
        )}
      </div>
    </div>
  );
}
