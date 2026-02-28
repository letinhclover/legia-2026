import { motion } from 'framer-motion';
import { Member } from '../types';

interface Props {
  member: Member;
  onClick: (m: Member) => void;
  index?: number;
}

export default function MemberCard({ member, onClick, index = 0 }: Props) {
  const isDeceased = !!member.deathDate;
  const birthYear = member.birthDate ? new Date(member.birthDate).getFullYear() : null;
  const deathYear = member.deathDate ? new Date(member.deathDate).getFullYear() : null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(member)}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-50 text-left active:shadow-none transition-shadow hover:shadow-md"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center text-2xl"
          style={{
            background: isDeceased ? '#E5E7EB' : '#FFF3E0',
            border: `2.5px solid ${member.gender === 'Nam' ? '#B8860B' : '#BE185D'}`,
            filter: isDeceased ? 'grayscale(60%)' : 'none',
          }}
        >
          {member.photoUrl
            ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
            : <span>{member.gender === 'Nam' ? '👨' : '👩'}</span>}
        </div>
        {/* Badge đời */}
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white font-bold"
          style={{ fontSize: 9, background: '#800000' }}
        >
          {member.generation}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-900 text-sm truncate">{member.name}</div>
        {member.tenHuy && (
          <div className="text-xs text-gray-400 italic truncate">Húy: {member.tenHuy}</div>
        )}
        {member.chucTuoc && (
          <div className="text-xs font-semibold truncate" style={{ color: '#B8860B' }}>{member.chucTuoc}</div>
        )}
        <div className="text-xs text-gray-400 mt-0.5">
          {birthYear && <span>🎂 {birthYear}</span>}
          {deathYear && <span className="ml-2">🕯️ {deathYear}</span>}
          {!isDeceased && !birthYear && <span className="text-green-500">● Còn sống</span>}
        </div>
      </div>

      {/* Arrow */}
      <div className="text-gray-300 flex-shrink-0">›</div>
    </motion.button>
  );
}
