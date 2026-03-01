import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Member } from '../types';

interface FamilyNodeProps {
  data: Member & {
    onEdit: (m: Member) => void;
    spouseName?: string;
    darkMode?: boolean;
    highlighted?: boolean;
    dimmed?: boolean;
  };
}

const FamilyNode = memo(function FamilyNode({ data }: FamilyNodeProps) {
  const isAlive = !data.deathDate;
  const isMale  = data.gender === 'Nam';
  const isDark  = data.darkMode;
  const dimmed  = data.dimmed;

  const borderColor = isAlive ? (isMale ? '#1D4ED8' : '#BE185D') : '#9CA3AF';
  const bgColor = isDark
    ? (isAlive ? (isMale ? '#1a2840' : '#2a1828') : '#1e1e1e')
    : (isAlive ? (isMale ? '#EFF6FF' : '#FDF2F8') : '#F3F4F6');
  const nameColor = isDark ? '#f1f5f9' : '#111827';
  const subColor  = isDark ? '#94a3b8' : '#6B7280';

  const birthY = data.birthDate ? new Date(data.birthDate).getFullYear() : null;
  const deathY = data.deathDate ? new Date(data.deathDate).getFullYear() : null;

  return (
    <motion.div
      onClick={() => data.onEdit(data)}
      whileHover={{ scale: 1.07, y: -5 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 440, damping: 28 }}
      className="relative cursor-pointer select-none flex flex-col items-center justify-between"
      style={{
        width: 145, height: 148,
        padding: '9px 7px 8px',
        borderRadius: 18,
        background: bgColor,
        border: `2.5px solid ${data.highlighted ? '#F59E0B' : borderColor}`,
        boxShadow: data.highlighted
          ? '0 0 0 3px rgba(245,158,11,0.4), 0 4px 20px rgba(0,0,0,0.15)'
          : (isDark ? '0 4px 22px rgba(0,0,0,0.45)' : '0 3px 16px rgba(0,0,0,0.11)'),
        filter: isAlive
          ? (dimmed ? 'opacity(0.35)' : 'none')
          : (dimmed ? 'grayscale(100%) opacity(0.25)' : 'grayscale(80%) opacity(0.8)'),
        transition: 'filter 0.2s, box-shadow 0.2s',
      }}
    >
      <Handle type="target" position={Position.Top}
        style={{ background: '#800000', width: 9, height: 9, border: '2.5px solid white', top: -5 }} />

      {/* Avatar */}
      <div
        className="rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{
          width: 62, height: 60,
          background: isDark ? '#2d3748' : '#E5E7EB',
          border: `2px solid ${borderColor}`,
        }}
      >
        {data.photoUrl
          ? <img src={data.photoUrl} alt={data.name} className="w-full h-full object-cover" loading="lazy" />
          : <span style={{ fontSize: 28 }}>{isMale ? '👨' : '👩'}</span>
        }
      </div>

      {/* Tên ĐẦY ĐỦ — wrap 2 dòng, không tắt */}
      <div
        className="font-bold text-center w-full leading-tight"
        style={{
          fontSize: 10.5,
          color: nameColor,
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
        }}
        title={data.name}
      >
        {data.name}
      </div>

      {/* Chức tước */}
      {data.chucTuoc && (
        <div className="text-center w-full truncate"
          style={{ fontSize: 9, color: '#B8860B', fontWeight: 700, lineHeight: 1.2 }}>
          {data.chucTuoc}
        </div>
      )}

      {/* Năm */}
      <div className="text-center w-full" style={{ fontSize: 9.5, color: subColor }}>
        {birthY && <span>{birthY}</span>}
        {deathY  && <span> – {deathY}</span>}
      </div>

      {/* Badge đời */}
      <div className="absolute flex items-center justify-center rounded-full font-black text-white"
        style={{ top: 5, right: 5, width: 18, height: 18, fontSize: 8, background: '#800000',
          boxShadow: '0 1px 4px rgba(128,0,0,0.5)' }}>
        {data.generation}
      </div>

      {/* Đã mất */}
      {!isAlive && (
        <div className="absolute" style={{ top: 5, left: 5, fontSize: 10 }}>🕯️</div>
      )}

      <Handle type="source" position={Position.Bottom}
        style={{ background: '#800000', width: 9, height: 9, border: '2.5px solid white', bottom: -5 }} />
    </motion.div>
  );
});

export default FamilyNode;
