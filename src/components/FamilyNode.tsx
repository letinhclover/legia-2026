import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Member } from '../types';
import { cloudinaryThumb } from '../utils/imageCompress';

interface FamilyNodeProps {
  data: Member & {
    onEdit: (m: Member) => void;
    spouseName?: string;
    darkMode?: boolean;
    highlighted?: boolean;
    dimmed?: boolean;
  };
}

function calcAge(birthDate: string): number | null {
  const by = parseInt(birthDate.slice(0, 4));
  if (isNaN(by)) return null;
  return new Date().getFullYear() - by;
}

const FamilyNode = memo(function FamilyNode({ data }: FamilyNodeProps) {
  const isAlive = !data.deathDate && !data.deathYear;
  const isMale  = data.gender === 'Nam';
  const isDark  = data.darkMode;

  let birthY = data.birthYear;
  if (!birthY && data.birthDate) birthY = parseInt(data.birthDate.slice(0, 4));
  let deathY = data.deathYear;
  if (!deathY && data.deathDate) deathY = parseInt(data.deathDate.slice(0, 4));

  const age = isAlive && data.birthDate ? calcAge(data.birthDate) : null;

  /* ── MÀUSẮC Neo-Traditional ── */
  // Nam: xanh navy sang trọng | Nữ: hồng antique
  const accentColor = isMale ? '#1D3A6B' : '#8B2252';
  const accentLight = isMale ? '#EEF2FF' : '#FFF0F6';

  // Nền card
  const cardBg   = isDark ? '#1a2535' : '#FFFDF7';
  const textMain = isDark ? '#E8DDD0' : '#1C1410';
  const textSub  = isDark ? '#8A9BB0' : '#6B5E52';
  const border   = isDark ? '#2d3d52' : '#E2D8CA';

  /* ── HIGHLIGHT / DIM ── */
  const ringStyle = data.highlighted
    ? {
        boxShadow: `0 0 0 3px #D4AF37, 0 0 16px 4px rgba(212,175,55,0.35)`,
        zIndex: 50,
      }
    : isDark
      ? { boxShadow: '0 6px 20px rgba(0,0,0,0.45)' }
      : { boxShadow: '0 4px 16px rgba(28,20,16,0.13), 0 1px 4px rgba(28,20,16,0.07)' };

  const filterStyle  = !isAlive || data.dimmed ? 'grayscale(80%)' : 'none';
  const opacityStyle = data.dimmed ? 0.35 : 1;

  return (
    <motion.div
      onClick={() => data.onEdit(data)}
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className="relative flex flex-col items-center select-none"
      style={{ width: 100, opacity: opacityStyle, filter: filterStyle }}
    >
      <Handle
        type="target" position={Position.Top}
        style={{ background: '#800000', width: 6, height: 6, border: 'none', top: 4 }}
      />

      {/* ── AVATAR ── */}
      <motion.div
        className="relative z-10 flex items-center justify-center rounded-full overflow-hidden"
        style={{
          width: 62,
          height: 62,
          border: `3px solid ${accentColor}`,
          background: accentLight,
          marginBottom: -10,
          /* Bóng nổi rõ hơn cho avatar */
          boxShadow: data.highlighted
            ? `0 0 0 3px #D4AF37, 0 6px 18px rgba(28,20,16,0.22)`
            : `0 4px 14px rgba(28,20,16,0.18)`,
          transition: 'box-shadow 0.2s ease',
        }}
        whileHover={{ boxShadow: `0 6px 22px rgba(28,20,16,0.28)` }}
      >
        {data.photoUrl ? (
          <img
            src={cloudinaryThumb(data.photoUrl, 150)}
            alt={data.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span style={{ fontSize: 28, lineHeight: 1 }}>
            {isMale ? '👨' : '👩'}
          </span>
        )}

        {/* Badge đã mất — nến nhỏ góc dưới phải avatar */}
        {!isAlive && (
          <div
            className="absolute bottom-0 right-0 rounded-full flex items-center justify-center"
            style={{
              width: 18, height: 18,
              background: isDark ? '#2a3545' : '#F5F0E8',
              border: `1px solid ${border}`,
              fontSize: 11,
            }}
          >
            🕯️
          </div>
        )}
      </motion.div>

      {/* ── KHUNG THÔNG TIN ── */}
      <div
        className="w-full pt-4 pb-2.5 px-1.5 rounded-2xl flex flex-col items-center text-center z-0 family-node-card"
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          minHeight: 52,
          ...ringStyle,
        }}
      >
        {/* Tên + (đời) */}
        <div
          className="font-bold leading-tight px-0.5 line-clamp-2"
          style={{
            fontSize: 10.5,
            color: textMain,
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontWeight: 700,
          }}
        >
          {data.name}
          <span style={{ color: textSub, fontWeight: 500, marginLeft: 2, fontSize: 9.5 }}>
            ({data.generation})
          </span>
        </div>

        {/* Chức tước */}
        {data.chucTuoc && (
          <div
            className="truncate w-full px-1 mt-0.5"
            style={{ fontSize: 8.5, color: '#B8860B', fontWeight: 600 }}
          >
            {data.chucTuoc}
          </div>
        )}

        {/* Năm sinh – mất + tuổi */}
        <div
          className="flex items-center justify-center gap-1 mt-1"
          style={{ fontSize: 9.5, color: textSub }}
        >
          {birthY ? (
            <span>{birthY}{deathY ? `–${deathY}` : ''}</span>
          ) : (
            <span style={{ opacity: 0.5 }}>????</span>
          )}
          {isAlive && age !== null && (
            <span style={{ color: accentColor, fontWeight: 700, fontSize: 9 }}>
              ({age}t)
            </span>
          )}
        </div>

        {/* Divider accent — chỉ hiện khi highlighted */}
        {data.highlighted && (
          <div
            className="w-8 rounded-full mt-1.5"
            style={{ height: 2, background: '#D4AF37', opacity: 0.9 }}
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
