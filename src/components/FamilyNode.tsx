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
  const isMale = data.gender === 'Nam';
  const isDark = data.darkMode;
  
  // Xử lý năm sinh
  let birthY = data.birthYear;
  if (!birthY && data.birthDate) birthY = parseInt(data.birthDate.slice(0, 4));
  
  let deathY = data.deathYear;
  if (!deathY && data.deathDate) deathY = parseInt(data.deathDate.slice(0, 4));

  const age = isAlive && data.birthDate ? calcAge(data.birthDate) : null;

  // Màu sắc chủ đạo
  const accentColor = isMale ? '#2563EB' : '#BE185D'; // Nam: Xanh / Nữ: Hồng
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1f2937';
  const subTextColor = isDark ? '#94a3b8' : '#6b7280';

  // Hiệu ứng Highlight
  const ringStyle = data.highlighted
    ? { boxShadow: '0 0 0 4px #F59E0B', zIndex: 50 }
    : { boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 10px rgba(0,0,0,0.08)' };

  // Filter cho người đã mất
  const filterStyle = !isAlive || data.dimmed
    ? 'grayscale(100%) opacity(0.8)'
    : 'none';

  return (
    <motion.div
      onClick={() => data.onEdit(data)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="relative flex flex-col items-center justify-start select-none group"
      style={{
        width: 100, // KÍCH THƯỚC CHUẨN ĐỒNG BỘ VỚI LAYOUT
        filter: filterStyle,
      }}
    >
      {/* Handle Đỉnh (Nhận từ Cha) */}
      <Handle 
        type="target" position={Position.Top} 
        style={{ background: '#800000', width: 6, height: 6, border: 'none', top: 5 }} 
      />

      {/* 1. AVATAR TRÒN NỔI (Đè lên khung tên) */}
      <div
        className="relative z-10 flex items-center justify-center rounded-full overflow-hidden bg-gray-100"
        style={{
          width: 64, 
          height: 64,
          border: `3px solid ${accentColor}`,
          marginBottom: -12, // Đè lên khung dưới
          ...ringStyle,
        }}
      >
        {data.photoUrl ? (
          <img 
            src={cloudinaryThumb(data.photoUrl, 150)} 
            alt={data.name} 
            className="w-full h-full object-cover" 
            loading="lazy" 
          />
        ) : (
          <span style={{ fontSize: 30 }}>{isMale ? '👨' : '👩'}</span>
        )}
      </div>

      {/* 2. KHUNG THÔNG TIN (Ở Dưới) */}
      <div
        className="w-full pt-4 pb-2 px-1 rounded-xl flex flex-col items-center justify-center text-center z-0 transition-shadow"
        style={{
          background: cardBg,
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          minHeight: 56,
        }}
      >
        {/* Tên + Đời */}
        <div 
          className="font-bold leading-tight px-0.5 line-clamp-2"
          style={{ fontSize: 10.5, color: textColor }}
        >
          {data.name}
          <span className="ml-1 font-normal" style={{ color: subTextColor, fontSize: 9 }}>
            ({data.generation})
          </span>
        </div>

        {/* Chức tước */}
        {data.chucTuoc && (
          <div 
            className="truncate w-full px-1 font-bold mt-0.5"
            style={{ fontSize: 8.5, color: '#B8860B' }}
          >
            {data.chucTuoc}
          </div>
        )}

        {/* Năm sinh + Tuổi */}
        <div className="flex items-center justify-center gap-1 mt-0.5" style={{ fontSize: 9.5, color: subTextColor }}>
           <span>{birthY || '????'}</span>
           
           {isAlive && age !== null && (
             <span className="font-bold" style={{ color: accentColor }}>
               ({age}t)
             </span>
           )}
           
           {!isAlive && <span>🕯️</span>}
        </div>
      </div>

      {/* Handle Đáy (Nối xuống Con) */}
      <Handle 
        type="source" position={Position.Bottom} 
        style={{ background: '#800000', width: 6, height: 6, border: 'none', bottom: -3 }} 
      />
    </motion.div>
  );
});

export default FamilyNode;
