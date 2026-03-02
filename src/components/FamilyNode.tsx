import { memo } from 'react';
import { cloudinaryThumb } from '../utils/imageCompress';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Member } from '../types';

interface FamilyNodeProps {
  data: Member & {
    onEdit: (member: Member) => void;
    spouseName?: string;
    darkMode?: boolean;
  };
}

const FamilyNode = memo(function FamilyNode({ data }: FamilyNodeProps) {
  const isAlive  = !data.deathDate;
  const isMale   = data.gender === 'Nam';
  const isDark   = data.darkMode;

  // Màu viền & nền theo giới tính + trạng thái
  const borderColor = isAlive
    ? (isMale ? '#1D4ED8' : '#BE185D')
    : '#9CA3AF';
  const bgColor = isDark
    ? (isAlive ? (isMale ? '#1e2d47' : '#2d1e30') : '#222')
    : (isAlive ? (isMale ? '#EFF6FF' : '#FDF2F8') : '#F3F4F6');
  const textColor   = isDark ? '#f1f5f9' : '#111827';
  const subColor    = isDark ? '#94a3b8' : '#6B7280';

  const birthYear = data.birthDate ? new Date(data.birthDate).getFullYear() : null;
  const deathYear = data.deathDate ? new Date(data.deathDate).getFullYear() : null;

  // Tên ngắn gọn (2 từ cuối) để vừa ô vuông
  const shortName = data.name.split(' ').slice(-2).join(' ');

  return (
    <motion.div
      onClick={() => data.onEdit(data)}
      whileHover={{ scale: 1.06, y: -4, boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="relative cursor-pointer select-none flex flex-col items-center"
      style={{
        width: 145, height: 148,
        borderRadius: 18,
        background: bgColor,
        border: `2.5px solid ${borderColor}`,
        boxShadow: isDark
          ? '0 4px 20px rgba(0,0,0,0.4)'
          : '0 3px 14px rgba(0,0,0,0.10)',
        filter: isAlive ? 'none' : 'grayscale(80%) opacity(0.82)',
        padding: '10px 8px 8px',
      }}
    >
      <Handle type="target" position={Position.Top}
        style={{ background: '#800000', width: 9, height: 9, border: '2px solid white', top: -5 }} />

      {/* Avatar — chiếm phần trên node */}
      <div
        className="rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 mb-2"
        style={{
          width: 68, height: 68,
          background: isDark ? '#334155' : '#E5E7EB',
          border: `2px solid ${borderColor}`,
        }}
      >
        {data.photoUrl
          ? <img src={cloudinaryThumb(data.photoUrl, 100)} alt={data.name} className="w-full h-full object-cover" loading="lazy" />
          : <span style={{ fontSize: 32 }}>{isMale ? '👨' : '👩'}</span>
        }
      </div>

      {/* Tên (2 từ cuối) */}
      <div
        className="font-bold leading-tight text-center w-full truncate"
        style={{ fontSize: 11.5, color: textColor, lineHeight: 1.3 }}
        title={data.name}
      >
        {shortName}
      </div>

      {/* Chức tước nếu có */}
      {data.chucTuoc && (
        <div
          className="text-center w-full truncate"
          style={{ fontSize: 9.5, color: '#B8860B', fontWeight: 600, marginTop: 1 }}
        >
          {data.chucTuoc}
        </div>
      )}

      {/* Năm sinh — mất */}
      <div
        className="text-center w-full mt-auto"
        style={{ fontSize: 10, color: subColor }}
      >
        {birthYear && <span>{birthYear}</span>}
        {deathYear && <span> — {deathYear}</span>}
        {!isAlive && !deathYear && <span>🕯️</span>}
      </div>

      {/* Badge đời — góc trên phải */}
      <div
        className="absolute flex items-center justify-center rounded-full font-black text-white"
        style={{
          top: 6, right: 6, width: 18, height: 18,
          fontSize: 8.5, background: '#800000',
          boxShadow: '0 1px 4px rgba(128,0,0,0.5)',
        }}
      >
        {data.generation}
      </div>

      {/* Icon đã mất — góc trên trái */}
      {!isAlive && (
        <div className="absolute" style={{ top: 6, left: 6, fontSize: 11 }}>🕯️</div>
      )}

      <Handle type="source" position={Position.Bottom}
        style={{ background: '#800000', width: 9, height: 9, border: '2px solid white', bottom: -5 }} />
    </motion.div>
  );
});

export default FamilyNode;
