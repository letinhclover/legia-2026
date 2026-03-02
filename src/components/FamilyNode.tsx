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
  const isAlive   = !data.deathDate;
  const isMale    = data.gender === 'Nam';
  const isDark    = data.darkMode;
  const dimmed    = data.dimmed;
  const birthY    = data.birthDate ? parseInt(data.birthDate.slice(0, 4)) : null;
  const deathY    = data.deathDate ? parseInt(data.deathDate.slice(0, 4)) : null;
  const age       = isAlive && data.birthDate ? calcAge(data.birthDate) : null;

  // ── Màu theo giới & trạng thái ─────────────────────────────────────
  const accentColor = isAlive
    ? (isMale ? '#1D4ED8' : '#BE185D')
    : '#6B7280';

  const bgGradient = isDark
    ? (isAlive
        ? (isMale ? 'linear-gradient(160deg,#1a2840 0%,#0f1a2e 100%)'
                  : 'linear-gradient(160deg,#2a1828 0%,#1a0e1a 100%)')
        : 'linear-gradient(160deg,#1e1e22 0%,#141418 100%)')
    : (isAlive
        ? (isMale ? 'linear-gradient(160deg,#EFF6FF 0%,#DBEAFE 100%)'
                  : 'linear-gradient(160deg,#FDF2F8 0%,#FCE7F3 100%)')
        : 'linear-gradient(160deg,#F9FAFB 0%,#F3F4F6 100%)');

  const nameColor = isDark ? '#f1f5f9' : '#0f172a';
  const subColor  = isDark ? '#64748b' : '#9CA3AF';

  const highlightStyle = data.highlighted
    ? { border: '2.5px solid #F59E0B', boxShadow: '0 0 0 3px rgba(245,158,11,0.3), 0 6px 24px rgba(0,0,0,0.18)' }
    : { border: `2px solid ${accentColor}33`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.09)' };

  return (
    <motion.div
      onClick={() => data.onEdit(data)}
      whileHover={{ scale: 1.06, y: -4 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 440, damping: 28 }}
      className="relative cursor-pointer select-none flex flex-col items-center"
      style={{
        width: 138, height: 150,
        borderRadius: 20,
        background: bgGradient,
        ...highlightStyle,
        filter: isAlive
          ? (dimmed ? 'opacity(0.3)' : 'none')
          : (dimmed ? 'grayscale(100%) opacity(0.2)' : 'grayscale(75%) opacity(0.82)'),
        transition: 'filter 0.25s, box-shadow 0.2s',
        padding: '10px 8px 8px',
      }}
    >
      <Handle type="target" position={Position.Top}
        style={{ background: accentColor, width: 8, height: 8, border: '2px solid white', top: -4 }} />

      {/* Accent bar trên cùng theo giới tính */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        borderRadius: '20px 20px 0 0',
        background: accentColor,
        opacity: isAlive ? 1 : 0.35,
      }} />

      {/* Avatar */}
      <div
        className="rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 mb-1.5"
        style={{
          width: 60, height: 58,
          background: isDark ? '#1e293b' : '#E5E7EB',
          border: `1.5px solid ${accentColor}55`,
        }}
      >
        {data.photoUrl
          ? <img src={cloudinaryThumb(data.photoUrl, 100)} alt={data.name} className="w-full h-full object-cover" loading="lazy" />
          : <span style={{ fontSize: 28 }}>{isMale ? '👨' : '👩'}</span>
        }
      </div>

      {/* Tên đầy đủ — 2 dòng */}
      <div
        className="font-bold text-center w-full"
        style={{
          fontSize: 10.5, color: nameColor, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}
        title={data.name}
      >
        {data.name}
      </div>

      {/* Chức tước */}
      {data.chucTuoc && (
        <div className="text-center w-full truncate"
          style={{ fontSize: 8.5, color: '#B8860B', fontWeight: 700, marginTop: 1 }}>
          {data.chucTuoc}
        </div>
      )}

      {/* Năm sinh–mất / Tuổi */}
      <div className="flex items-center justify-center gap-1.5 mt-auto w-full">
        {birthY && (
          <span style={{ fontSize: 9.5, color: subColor }}>
            {birthY}{deathY ? `–${deathY}` : ''}
          </span>
        )}
        {age !== null && isAlive && (
          <span
            className="flex-shrink-0 font-bold px-1.5 py-0.5 rounded-full"
            style={{ fontSize: 8.5, background: `${accentColor}18`, color: accentColor }}
          >
            {age}t
          </span>
        )}
        {!isAlive && !deathY && <span style={{ fontSize: 10 }}>🕯️</span>}
      </div>

      {/* Badge đời — góc trên phải */}
      <div className="absolute flex items-center justify-center rounded-full font-black text-white"
        style={{
          top: 7, right: 6, width: 17, height: 17, fontSize: 8,
          background: '#800000', boxShadow: '0 1px 4px rgba(128,0,0,0.5)',
        }}>
        {data.generation}
      </div>

      {/* Đã mất — góc trên trái */}
      {!isAlive && (
        <div className="absolute" style={{ top: 6, left: 6, fontSize: 10 }}>🕯️</div>
      )}

      <Handle type="source" position={Position.Bottom}
        style={{ background: accentColor, width: 8, height: 8, border: '2px solid white', bottom: -4 }} />
    </motion.div>
  );
});

export default FamilyNode;
