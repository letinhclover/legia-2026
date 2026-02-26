import { Handle, Position } from 'reactflow';
import { Member } from '../types';
import { User } from 'lucide-react';

interface FamilyNodeProps {
  data: Member & {
    onEdit: (member: Member) => void;
    spouseName?: string;
  };
}

export default function FamilyNode({ data }: FamilyNodeProps) {
  const isAlive = !data.deathDate;
  const borderColor = data.gender === 'Nam' ? '#1D4ED8' : '#BE185D';
  const bgColor = isAlive ? '#FFFDD0' : '#F5F5F5';

  const birthYear = data.birthDate ? new Date(data.birthDate).getFullYear() : data.birthDate;

  return (
    <div
      className="relative rounded-xl shadow-lg border-4 cursor-pointer hover:shadow-2xl transition-all hover:scale-105"
      style={{ borderColor, minWidth: '200px', backgroundColor: bgColor }}
      onClick={() => data.onEdit(data)}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-[#800000]" />

      <div className="flex items-center gap-3 p-3">
        <div className="w-14 h-14 rounded-full border-4 overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center" style={{ borderColor }}>
          {data.photoUrl
            ? <img src={data.photoUrl} alt={data.name} className="w-full h-full object-cover" />
            : <User size={28} className="text-gray-400" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-[#800000] text-sm truncate">{data.name}</div>
          {data.tenHuy && <div className="text-xs text-gray-500 italic truncate">Húy: {data.tenHuy}</div>}
          {data.chucTuoc && <div className="text-xs text-[#800000] truncate">{data.chucTuoc}</div>}

          <div className="text-xs text-gray-600 mt-0.5">
            {birthYear && <span>🎂 {birthYear}</span>}
            {data.deathDate && <span className="ml-1">— 🕯️ {new Date(data.deathDate).getFullYear()}</span>}
          </div>

          {data.spouseName && (
            <div className="text-xs text-pink-700 truncate">💑 {data.spouseName}</div>
          )}

          <div className="text-xs text-[#B8860B] font-semibold">Đời {data.generation}</div>
        </div>
      </div>

      {!isAlive && (
        <div className="absolute top-1 right-1 text-gray-400 text-xs">†</div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-[#800000]" />
    </div>
  );
}
