import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Member } from '../types';
import { cloudinaryThumb } from '../utils/imageCompress'; // Giữ lại tiện ích nén ảnh của bạn

interface FamilyNodeProps {
  data: Member & {
    onEdit: (m: Member) => void;
    spouseName?: string;
    darkMode?: boolean;
    highlighted?: boolean;
    dimmed?: boolean;
  };
}

// Giữ lại hàm tính tuổi hữu ích
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

  // ── MÀU SẮC THEO GIỚI TÍNH & GIAO DIỆN ──
  // Nam: Xanh dương đậm / Nữ: Hồng mận
  const accentColor = isMale ? '#2563EB' : '#BE185D'; 
  
  // Nền thẻ: Dark Mode thì màu xám đậm, Light Mode thì trắng
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1f2937';
  const subTextColor = isDark ? '#94a3b8' : '#6b7280';

  // Hiệu ứng Highlight (khi tìm kiếm)
  const ringStyle = data.highlighted
    ? { boxShadow: '0 0 0 4px #F59E0B', zIndex: 50 } // Vòng vàng sáng
    : { boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)' };

  // Xử lý Grayscale khi đã mất hoặc bị làm mờ
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
        width: 100, // Chiều rộng cố định nhỏ gọn (khớp với layout mới)
        opacity: opacityStyle,
        filter: filterStyle,
      }}
    >
      {/* Handle Đỉnh (Nhận từ Cha) */}
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ 
          background: '#800000', 
          width: 6, height: 6, 
          border: 'none', 
          top: 2 // Thụt xuống một chút để Avatar che đi
        }} 
      />

      {/* 1. AVATAR TRÒN (NỔI BẬT) */}
      <div
        className="relative z-10 flex items-center justify-center rounded-full overflow-hidden bg-gray-200"
        style={{
          width: 68,
          height: 68,
          border: `3px solid ${accentColor}`,
          marginBottom: -12, // Kỹ thuật Negative Margin: Để avatar đè lên khung tên
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
          <span style={{ fontSize: 32 }}>{isMale ? '👨' : '👩'}</span>
        )}

        {/* Badge Đời - Góc phải trên của Avatar */}
        <div 
          className="absolute top-0 right-0 flex items-center justify-center rounded-full text-white font-black shadow-sm"
          style={{
            width: 18, height: 18, fontSize: 9,
            background: '#800000',
            border: '1.5px solid white'
          }}
        >
          {data.generation}
        </div>
      </div>

      {/* 2. KHUNG TÊN & THÔNG TIN (Ở DƯỚI) */}
      <div
        className="w-full pt-4 pb-2 px-1 rounded-xl flex flex-col items-center justify-center text-center z-0"
        style={{
          background: cardBg,
          border: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
          minHeight: 55, // Đảm bảo chiều cao đồng đều
        }}
      >
        {/* Tên thành viên */}
        <div 
          className="font-bold leading-tight px-1 mb-0.5 line-clamp-2"
          style={{ fontSize: 10.5, color: textColor }}
        >
          {data.name}
        </div>

        {/* Chức tước (nếu có) */}
        {data.chucTuoc && (
          <div 
            className="truncate w-full px-1 font-semibold"
            style={{ fontSize: 8.5, color: '#B8860B' }}
          >
            {data.chucTuoc}
          </div>
        )}

        {/* Năm sinh - Năm mất */}
        <div className="flex items-center gap-1 mt-auto">
           {birthY ? (
             <span style={{ fontSize: 9, color: subTextColor }}>
               {birthY}{deathY ? `-${deathY}` : ''}
             </span>
           ) : (
             <span style={{ fontSize: 9, color: subTextColor }}>????</span>
           )}
           
           {!isAlive && !deathY && <span style={{ fontSize: 9 }}>🕯️</span>}
        </div>

        {/* Hiển thị tuổi nếu còn sống */}
        {isAlive && age !== null && (
          <div 
            className="absolute bottom-[-6px] px-1.5 py-[1px] rounded-full font-bold shadow-sm"
            style={{ 
              fontSize: 8, 
              background: accentColor, 
              color: 'white',
              zIndex: 20 
            }}
          >
            {age}t
          </div>
        )}
      </div>

      {/* Handle Đáy (Nối xuống Con) */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ 
          background: '#800000', 
          width: 6, height: 6, 
          border: 'none',
          bottom: -3
        }} 
      />
    </motion.div>
  );
});

export default FamilyNode;
