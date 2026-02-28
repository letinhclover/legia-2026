import { Handle, Position } from 'reactflow';
import { Member } from '../types';

interface FamilyNodeProps {
  data: Member & {
    onEdit: (member: Member) => void;
    spouseName?: string;
  };
}

export default function FamilyNode({ data }: FamilyNodeProps) {
  const isAlive = !data.deathDate;
  const isMale = data.gender === 'Nam';
  const borderColor = isMale ? '#1D4ED8' : '#BE185D';
  const birthYear = data.birthDate ? new Date(data.birthDate).getFullYear() : null;
  const deathYear = data.deathDate ? new Date(data.deathDate).getFullYear() : null;

  return (
    <div
      onClick={() => data.onEdit(data)}
      className="relative rounded-2xl cursor-pointer transition-all active:scale-95"
      style={{
        minWidth: 200,
        background: isAlive ? '#FFFDF5' : '#F4F4F4',
        border: `3px solid ${borderColor}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#800000', width: 10, height: 10 }} />

      <div className="flex items-center gap-2.5 p-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl"
          style={{ background: '#EEE', border: `2px solid ${borderColor}`, filter: isAlive ? 'none' : 'grayscale(50%)' }}>
          {data.photoUrl
            ? <img src={data.photoUrl} alt={data.name} className="w-full h-full object-cover" />
            : <span>{isMale ? '👨' : '👩'}</span>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 text-sm truncate leading-tight">
            {data.name}
          </div>
          {data.tenHuy && (
            <div className="text-xs text-gray-400 italic truncate">Húy: {data.tenHuy}</div>
          )}
          {data.chucTuoc && (
            <div className="text-xs font-semibold truncate" style={{ color: '#B8860B' }}>{data.chucTuoc}</div>
          )}
          <div className="text-xs text-gray-400 mt-0.5">
            {birthYear && <span>{birthYear}</span>}
            {deathYear && <span> — {deathYear}</span>}
          </div>
          {data.spouseName && (
            <div className="text-xs text-gray-400 truncate">💑 {data.spouseName}</div>
          )}
        </div>

        {/* Đời badge */}
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white font-black"
          style={{ fontSize: 9, background: '#800000' }}>
          {data.generation}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#800000', width: 10, height: 10 }} />
    </div>
  );
}
