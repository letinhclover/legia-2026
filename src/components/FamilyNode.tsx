import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Member } from '../types';

interface FamilyNodeProps {
  data: Member & {
    onEdit: (member: Member) => void;
    spouseName?: string;
  };
}

// Dùng memo để tránh re-render không cần thiết khi cây lớn
const FamilyNode = memo(function FamilyNode({ data }: FamilyNodeProps) {
  const isAlive  = !data.deathDate;
  const isMale   = data.gender === 'Nam';

  // Màu viền theo giới tính
  const borderColor = isMale ? '#1D4ED8' : '#BE185D';
  const bgColor     = isAlive
    ? (isMale ? '#F0F7FF' : '#FFF0F7')
    : '#F0F0F0';

  const birthYear = data.birthDate ? new Date(data.birthDate).getFullYear() : null;
  const deathYear = data.deathDate ? new Date(data.deathDate).getFullYear() : null;

  return (
    <motion.div
      onClick={() => data.onEdit(data)}
      // Hover scale nhẹ (framer-motion với whileHover)
      whileHover={{ scale: 1.04, y: -3 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="relative cursor-pointer rounded-2xl select-none"
      style={{
        minWidth: 220,
        background: bgColor,
        border: `2.5px solid ${borderColor}`,
        boxShadow: isAlive
          ? '0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        // Grayscale 100% khi đã mất
        filter: isAlive ? 'none' : 'grayscale(100%) opacity(0.82)',
      }}
    >
      {/* Handle kết nối phía trên (nhận edge từ cha/mẹ) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#800000', width: 10, height: 10, border: '2px solid white' }}
      />

      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Avatar */}
        <div
          className="flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-2xl"
          style={{
            width: 52,
            height: 52,
            background: '#E5E7EB',
            border: `2.5px solid ${borderColor}`,
          }}
        >
          {data.photoUrl
            ? <img
                src={data.photoUrl}
                alt={data.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            : <span style={{ fontSize: 26 }}>{isMale ? '👨' : '👩'}</span>
          }
        </div>

        {/* Thông tin */}
        <div className="flex-1 min-w-0">
          {/* Tên */}
          <div className="font-bold text-gray-900 leading-tight text-sm truncate">
            {data.name}
          </div>

          {/* Húy */}
          {data.tenHuy && (
            <div className="text-xs text-gray-400 italic truncate">
              Húy: {data.tenHuy}
            </div>
          )}

          {/* Chức tước */}
          {data.chucTuoc && (
            <div
              className="text-xs font-semibold truncate"
              style={{ color: '#B8860B' }}
            >
              {data.chucTuoc}
            </div>
          )}

          {/* Năm sinh — mất */}
          <div className="flex items-center gap-1 mt-0.5">
            {birthYear && (
              <span className="text-xs text-gray-400">{birthYear}</span>
            )}
            {deathYear && (
              <span className="text-xs text-gray-400">— {deathYear}</span>
            )}
            {!isAlive && !deathYear && (
              <span className="text-xs">🕯️</span>
            )}
          </div>

          {/* Vợ/chồng */}
          {data.spouseName && (
            <div className="text-xs text-gray-400 truncate mt-0.5">
              💑 {data.spouseName.split(' ').slice(-2).join(' ')}
            </div>
          )}
        </div>
      </div>

      {/* Badge đời — góc trên phải */}
      <div
        className="absolute top-2 right-2 flex items-center justify-center rounded-full font-black text-white"
        style={{
          width: 20, height: 20,
          fontSize: 9,
          background: '#800000',
          boxShadow: '0 1px 4px rgba(128,0,0,0.4)',
        }}
      >
        {data.generation}
      </div>

      {/* Indicator đã mất — góc trên trái */}
      {!isAlive && (
        <div
          className="absolute top-2 left-2 text-gray-400"
          style={{ fontSize: 11 }}
        >
          🕯️
        </div>
      )}

      {/* Handle kết nối phía dưới (xuất edge xuống con) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#800000', width: 10, height: 10, border: '2px solid white' }}
      />
    </motion.div>
  );
});

export default FamilyNode;
