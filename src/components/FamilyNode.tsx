import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Member } from '../types';

interface FamilyNodeProps {
  data: Member & { onEdit: (m: Member) => void; spouseName?: string };
}

const FamilyNode = memo(function FamilyNode({ data }: FamilyNodeProps) {
  const isAlive  = !data.deathDate;
  const isMale   = data.gender === 'Nam';
  const birthY   = data.birthDate ? new Date(data.birthDate).getFullYear() : null;
  const deathY   = data.deathDate ? new Date(data.deathDate).getFullYear() : null;

  // Màu viền avatar: vàng gold cho trưởng, xanh nam, hồng nữ
  const ringColor = isMale ? '#60A5FA' : '#F472B6';

  return (
    <motion.div
      onClick={() => data.onEdit(data)}
      whileHover={{ scale: 1.06, y: -4 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="flex flex-col items-center cursor-pointer select-none"
      style={{ width: 90 }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#D4AF37', width: 8, height: 8, border: '2px solid #101922' }}
      />

      {/* Avatar tròn — kiểu Stitch */}
      <div className="relative">
        <div
          className="rounded-full overflow-hidden flex items-center justify-center"
          style={{
            width: 64, height: 64,
            border: `3px solid ${ringColor}`,
            background: '#192633',
            filter: isAlive ? 'none' : 'grayscale(80%) brightness(0.7)',
            boxShadow: `0 0 0 2px #101922, 0 4px 16px rgba(0,0,0,0.5)`,
          }}
        >
          {data.photoUrl
            ? <img src={data.photoUrl} alt={data.name} className="w-full h-full object-cover" loading="lazy" />
            : <span style={{ fontSize: 28 }}>{isMale ? '👨' : '👩'}</span>
          }
        </div>

        {/* Badge đời */}
        <div
          className="absolute -top-1 -right-1 rounded-full flex items-center justify-center font-black"
          style={{
            width: 18, height: 18, fontSize: 8,
            background: '#D4AF37', color: '#101922',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          }}
        >
          {data.generation}
        </div>

        {/* Indicator mất */}
        {!isAlive && (
          <div className="absolute -bottom-1 -right-1 text-sm">🕯️</div>
        )}
      </div>

      {/* Tên + năm */}
      <div
        className="mt-2 rounded-xl px-2 py-1.5 text-center w-full"
        style={{ background: '#192633', border: '1px solid #233648' }}
      >
        <div className="font-bold text-white leading-tight truncate" style={{ fontSize: 11 }}>
          {data.name.split(' ').slice(-2).join(' ')}
        </div>
        {(birthY || deathY) && (
          <div style={{ fontSize: 9, color: '#92adc9' }} className="mt-0.5">
            {birthY}{deathY ? ` — ${deathY}` : ''}
          </div>
        )}
        {data.chucTuoc && (
          <div style={{ fontSize: 9, color: '#D4AF37' }} className="truncate">{data.chucTuoc}</div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#D4AF37', width: 8, height: 8, border: '2px solid #101922' }}
      />
    </motion.div>
  );
});

export default FamilyNode;
