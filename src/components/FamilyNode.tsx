import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Member } from '../types';
import { cloudinaryThumb } from '../utils/imageCompress';

interface FamilyNodeProps {
  data: Member & {
    onEdit:      (m: Member) => void;
    darkMode?:   boolean;
    highlighted?: boolean;
    dimmed?:      boolean;
  };
}

function calcAge(birthDate: string): number | null {
  const y = parseInt(birthDate.slice(0, 4));
  return isNaN(y) ? null : new Date().getFullYear() - y;
}

// ── Icons SVG to và rõ ràng hơn ──────────────────────────────────────────
function WeddingRingIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="#A855F7" strokeWidth="2.5"/>
      <circle cx="12" cy="12" r="4" fill="#A855F7" opacity="0.3"/>
      <path d="M8 12 C8 9.8 9.8 8 12 8 C14.2 8 16 9.8 16 12" stroke="#A855F7" strokeWidth="2" fill="none"/>
    </svg>
  );
}

function SonInLawIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="4" stroke="#3B82F6" strokeWidth="2.2"/>
      <path d="M4 20 C4 16 7.6 13 12 13 C16.4 13 20 16 20 20" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M18 3 L21 6 L18 9" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function GrandchildIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="#10B981" strokeWidth="2.2"/>
      <path d="M6 20 C6 17 8.7 15 12 15 C15.3 15 18 17 18 20" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M8 4 C9.5 2.5 14.5 2.5 16 4" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function HeartIcon({ size = 16, color = '#EC4899' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

const FamilyNode = memo(function FamilyNode({ data }: FamilyNodeProps) {
  const isAlive = !data.deathDate && !(data as any).deathYear;
  const isMale  = data.gender === 'Nam';
  const isDark  = data.darkMode;

  let birthY = (data as any).birthYear;
  if (!birthY && data.birthDate) birthY = parseInt(data.birthDate.slice(0, 4));
  let deathY = (data as any).deathYear;
  if (!deathY && data.deathDate) deathY = parseInt(data.deathDate.slice(0, 4));

  const age = isAlive && data.birthDate ? calcAge(data.birthDate) : null;

  const memberType = data.memberType ?? 'chinh';
  const isDau       = memberType === 'dau';
  const isRe        = memberType === 're';
  const isChauNgoai = memberType === 'chau_ngoai';

  // ── Màu Neo-Traditional ─────────────────────────────────────────────────
  const accentColor = isMale ? '#1D3A6B' : '#8B2252';
  const accentLight = isMale
    ? (isDark ? '#0d1f3c' : '#EEF2FF')
    : (isDark ? '#2d0e20' : '#FFF0F6');

  const cardBg   = isDark ? '#1a2535' : '#FFFDF7';
  const textMain = isDark ? '#E8DDD0' : '#1C1410';
  const textSub  = isDark ? '#8A9BB0' : '#6B5E52';
  const border   = isDark ? '#2d3d52' : '#E2D8CA';

  // ── Shadow & highlight ──────────────────────────────────────────────────
  const cardShadow = data.highlighted
    ? `0 0 0 3px #D4AF37, 0 6px 20px rgba(212,175,55,0.3)`
    : isDark
      ? '0 4px 16px rgba(0,0,0,0.45)'
      : '0 3px 12px rgba(28,20,16,0.11), 0 1px 3px rgba(28,20,16,0.07)';

  const avatarShadow = data.highlighted
    ? `0 0 0 3px #D4AF37, 0 4px 14px rgba(212,175,55,0.3)`
    : `0 3px 10px rgba(28,20,16,0.16)`;

  const opacity = data.dimmed ? 0.3 : 1;
  const filter  = (!isAlive || data.dimmed) ? 'grayscale(75%)' : 'none';

  const displayName = (() => {
    const full = data.name.trim();
    const parts = full.split(' ');
    if (full.length <= 13) return full;
    const lastName  = parts[0]?.[0] ?? '';
    const firstName = parts.slice(-1)[0] ?? '';
    const midAbbr   = parts.length > 2 ? parts[1]?.[0] + '.' : '';
    return `${lastName}.${midAbbr} ${firstName}`;
  })();

  const genLabel = `(${data.generation})`;

  return (
    <motion.div
      onClick={() => data.onEdit(data)}
      whileHover={{ scale: 1.06, y: -3 }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className="relative flex flex-col items-center select-none"
      style={{ width: 108, opacity, filter }}
    >
      <Handle
        type="target" position={Position.Top}
        style={{ background: '#800000', width: 6, height: 6, border: 'none', top: 2 }}
      />

      {/* ── AVATAR ── */}
      <div
        className="relative z-10 flex items-center justify-center rounded-full overflow-hidden flex-shrink-0"
        style={{
          width: 60, height: 60,
          border: `3px solid ${accentColor}`,
          background: accentLight,
          marginBottom: -10,
          boxShadow: avatarShadow,
          transition: 'box-shadow 0.2s',
        }}
      >
        {data.photoUrl ? (
          <img
            src={cloudinaryThumb(data.photoUrl, 120)}
            alt={data.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span style={{ fontSize: 26 }}>{isMale ? '👨' : '👩'}</span>
        )}

        {/* Icon nến — người đã mất */}
        {!isAlive && (
          <div
            className="absolute bottom-0 right-0 rounded-full flex items-center justify-center"
            style={{
              width: 17, height: 17,
              background: isDark ? '#1a2535' : '#F5F0E8',
              border: `1px solid ${border}`,
              fontSize: 10,
            }}
          >🕯️</div>
        )}
      </div>

      {/* ── CARD THÔNG TIN ── */}
      <div
        className="w-full pt-4 pb-2 px-1.5 rounded-2xl flex flex-col items-center text-center z-0"
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          minHeight: 54,
          boxShadow: cardShadow,
          transition: 'box-shadow 0.2s',
        }}
      >
        {/* TÊN + (ĐỜI) */}
        <div
          className="flex items-baseline justify-center gap-0.5 px-0.5 w-full"
          style={{ minHeight: 16 }}
        >
          <span
            className="font-bold leading-tight text-center"
            style={{
              fontSize: 10,
              color: textMain,
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 76,
            }}
            title={data.name}
          >
            {displayName}
          </span>
          <span
            style={{
              fontSize: 9,
              color: textSub,
              fontWeight: 500,
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {genLabel}
          </span>
        </div>

        {/* Chức tước */}
        {data.chucTuoc && (
          <div
            className="truncate w-full px-1 mt-0.5"
            style={{ fontSize: 8, color: '#B8860B', fontWeight: 600 }}
          >
            {data.chucTuoc}
          </div>
        )}

        {/* ── NĂM SINH – NĂM MẤT + TUỔI ── */}
        <div
          className="flex items-center justify-center gap-1 mt-0.5"
          style={{ fontSize: 9, color: textSub }}
        >
          <span style={{ whiteSpace: 'nowrap' }}>
            {birthY ? birthY : '????'}
            {deathY ? `–${deathY}` : ''}
          </span>
          {isAlive && age !== null && (
            <span
              style={{ color: accentColor, fontWeight: 700, fontSize: 8.5, whiteSpace: 'nowrap' }}
            >
              ({age}t)
            </span>
          )}
        </div>

        {/* ── ICONS NHẬN DẠNG VAI VẾ — To và rõ ── */}
        <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
          {isDau && (
            <div title="Con dâu" style={{ lineHeight: 1 }}>
              <WeddingRingIcon size={18} />
            </div>
          )}
          {isRe && (
            <div title="Con rể" style={{ lineHeight: 1 }}>
              <SonInLawIcon size={18} />
            </div>
          )}
          {isChauNgoai && (
            <div title="Cháu ngoại" style={{ lineHeight: 1 }}>
              <GrandchildIcon size={18} />
            </div>
          )}
          {/* Tim xanh - còn sống */}
          {isAlive && memberType === 'chinh' && (
            <div title="Còn sống" style={{ lineHeight: 1 }}>
              <HeartIcon size={16} color="#10B981" />
            </div>
          )}
        </div>

        {/* Đường accent vàng khi highlighted */}
        {data.highlighted && (
          <div
            className="w-8 rounded-full mt-1"
            style={{ height: 2, background: '#D4AF37' }}
          />
        )}
      </div>

      <Handle
        type="source" position={Position.Bottom}
        style={{ background: '#800000', width: 6, height: 6, border: 'none', bottom: -3 }}
      />
    </motion.div>
  );
});

export default FamilyNode;
