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
  
  // Xử lý năm sinh/mất
  let birthY = data.birthYear;
  if (!birthY && data.birthDate) birthY = parseInt(data.birthDate.slice(0, 4));
  
  let deathY = data.deathYear;
  if (!deathY && data.deathDate) deathY = parseInt(data.deathDate.slice(0, 4));

  const age = isAlive && data.birthDate ? calcAge(data.birthDate) : null;

  // Màu sắc
  const accentColor = isMale ? '#2563EB' : '#BE185D'; // Xanh / Hồng
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1f2937';
  const subTextColor = isDark ? '#94a3b8' : '#6b7280';

  // Hiệu ứng Highlight
  const ringStyle = data.highlighted
    ? { boxShadow: '0 0 0 4px #F59E0B', zIndex: 50 }
    : { boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)' };

  // Filter cho người đã mất
  const filterStyle = !isAlive || data.dimmed
    ? 'grayscale(100%)'
    : 'none';
  const opacityStyle = data.dimmed ? 0.4 : 1;

  return (
    <motion.div
      onClick={() => data.onEdit(data)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="relative flex flex-col items-center justify-start select-none"
      style={{
        width: 100,
        opacity: opacityStyle,
        filter: filterStyle,
      }}
    >
      <Handle 
        type="target" position={Position.Top} 
        style={{ background: '#800000', width: 6, height: 6, border: 'none', top: 4 }} 
      />

      {/* 1. AVATAR TRÒN SẠCH SẼ (Bỏ hết badge) */}
      <div
        className="relative z-10 flex items-center justify-center rounded-full overflow-hidden bg-gray-200"
        style={{
          width: 64, // Giảm nhẹ size cho cân đối
          height: 64,
          border: `3px solid ${accentColor}`,
          marginBottom: -10,
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

      {/* 2. KHUNG THÔNG TIN */}
      <div
        className="w-full pt-3.5 pb-2 px-1 rounded-xl flex flex-col items-center justify-center text-center z-0"
        style={{
          background: cardBg,
          border: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
          minHeight: 50,
        }}
      >
        {/* DÒNG 1: TÊN + (ĐỜI) */}
        <div 
          className="font-bold leading-tight px-0.5 line-clamp-2"
          style={{ fontSize: 10.5, color: textColor }}
        >
          {data.name} 
          <span style={{ color: subTextColor, fontWeight: 'normal', marginLeft: 2 }}>
            ({data.generation})
          </span>
        </div>

        {/* Chức tước (nếu có) */}
        {data.chucTuoc && (
          <div 
            className="truncate w-full px-1 font-semibold mt-0.5"
            style={{ fontSize: 8.5, color: '#B8860B' }}
          >
            {data.chucTuoc}
          </div>
        )}

        {/* DÒNG 2: NĂM SINH + (TUỔI) */}
        <div className="flex items-center justify-center gap-1 mt-0.5" style={{ fontSize: 9.5, color: subTextColor }}>
           {/* Năm sinh */}
           {birthY ? (
             <span>{birthY}{deathY ? `-${deathY}` : ''}</span>
           ) : (
             <span>????</span>
           )}
           
           {/* Tuổi (nằm cùng dòng) */}
           {isAlive && age !== null && (
             <span style={{ color: accentColor, fontWeight: 600 }}>
               ({age}t)
             </span>
           )}
           
           {/* Icon nến nếu đã mất */}
           {!isAlive && !deathY && <span>🕯️</span>}
        </div>
      </div>

      <Handle 
        type="source" position={Position.Bottom} 
        style={{ background: '#800000', width: 6, height: 6, border: 'none', bottom: -3 }} 
      />
    </motion.div>
  );
});

export default FamilyNode;
