import { motion } from 'framer-motion';
import { Edit2, Flame, QrCode, X } from 'lucide-react';
import { Member } from '../types';

interface Props {
  member: Member | null;
  members: Member[];
  onClose: () => void;
  onEdit: (m: Member) => void;
  isAdmin: boolean;
}

export default function MemberBottomSheet({ member, members, onClose, onEdit, isAdmin }: Props) {
  if (!member) return null;

  const find = (id: string | null) => id ? members.find(m => m.id === id) : null;
  const father = find(member.fatherId);
  const mother = find(member.motherId);
  const spouse = find(member.spouseId);
  const children = members.filter(m => m.fatherId === member.id || m.motherId === member.id);
  const isDeceased = !!member.deathDate;

  const handleQR = () => {
    const url = encodeURIComponent(`${window.location.origin}?member=${member.id}`);
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`, '_blank');
  };

  const Row = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
        <span className="text-xs font-bold text-gray-400 uppercase w-28 flex-shrink-0 pt-0.5">{label}</span>
        <span className="text-sm text-gray-700 flex-1">{value}</span>
      </div>
    ) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Cover & Avatar — Facebook style */}
      <div className="relative flex-shrink-0">
        {/* Cover */}
        <div
          className="h-32 w-full"
          style={{
            background: isDeceased
              ? 'linear-gradient(135deg, #374151 0%, #1F2937 100%)'
              : 'linear-gradient(135deg, #800000 0%, #4a0000 50%, #B8860B 100%)',
          }}
        >
          {/* Nút đóng */}
          <button onClick={onClose}
            className="absolute top-3 right-3 bg-black bg-opacity-30 rounded-full p-1.5 text-white">
            <X size={18} />
          </button>
          {/* Nút sửa & QR */}
          <div className="absolute top-3 left-3 flex gap-2">
            <button onClick={handleQR}
              className="bg-black bg-opacity-30 rounded-full px-3 py-1.5 text-white text-xs font-semibold flex items-center gap-1">
              <QrCode size={14} /> QR
            </button>
            {isAdmin && (
              <button onClick={() => onEdit(member)}
                className="bg-black bg-opacity-30 rounded-full px-3 py-1.5 text-white text-xs font-semibold flex items-center gap-1">
                <Edit2 size={14} /> Sửa
              </button>
            )}
          </div>
        </div>

        {/* Avatar — chồng lên cover */}
        <div className="absolute -bottom-10 left-5">
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg"
            style={{ filter: isDeceased ? 'grayscale(60%)' : 'none' }}
          >
            {member.photoUrl
              ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl">
                  {member.gender === 'Nam' ? '👨' : '👩'}
                </div>}
          </div>
        </div>

        {/* Badge deceased */}
        {isDeceased && (
          <div className="absolute -bottom-3 left-20 ml-2 bg-gray-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
            <Flame size={10} /> Tiên tổ
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pt-14 px-5 pb-6 space-y-4">
        {/* Tên & thông tin cơ bản */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
          {member.tenHuy && (
            <p className="text-sm text-gray-500">Húy: <span className="font-semibold text-gray-700">{member.tenHuy}</span></p>
          )}
          {member.chucTuoc && (
            <div className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: '#FFF3CD', color: '#B8860B' }}>
              {member.chucTuoc}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${member.gender === 'Nam' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
              {member.gender}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-50 text-red-700">
              Đời {member.generation}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isDeceased ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
              {isDeceased ? '🕯️ Đã mất' : '💚 Còn sống'}
            </span>
          </div>
        </div>

        {/* Ngày tháng */}
        {(member.birthDate || member.deathDate || member.birthDateLunar || member.deathDateLunar) && (
          <div className="bg-blue-50 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-blue-700 uppercase mb-2 tracking-wide">📅 Ngày sinh & Ngày mất</h4>
            <Row label="Sinh (DL)" value={member.birthDate ? new Date(member.birthDate).toLocaleDateString('vi-VN') : ''} />
            <Row label="Sinh (ÂL)" value={member.birthDateLunar} />
            <Row label="Mất (DL)" value={member.deathDate ? new Date(member.deathDate).toLocaleDateString('vi-VN') : ''} />
            <Row label="Ngày giỗ" value={member.deathDateLunar} />
          </div>
        )}

        {/* Địa danh */}
        {(member.birthPlace || member.residence || member.burialPlace) && (
          <div className="bg-green-50 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-green-700 uppercase mb-2 tracking-wide">📍 Địa danh</h4>
            <Row label="Nơi sinh" value={member.birthPlace} />
            <Row label="Cư trú" value={member.residence} />
            <Row label="Nơi mất" value={member.deathPlace} />
            <Row label="Chôn cất" value={member.burialPlace} />
          </div>
        )}

        {/* Gia đình */}
        <div className="bg-pink-50 rounded-2xl p-4">
          <h4 className="text-xs font-bold text-pink-700 uppercase mb-2 tracking-wide">👨‍👩‍👧 Gia đình</h4>
          <Row label="Cha" value={father?.name} />
          <Row label="Mẹ" value={mother?.name} />
          <Row label={member.gender === 'Nam' ? 'Vợ' : 'Chồng'} value={spouse?.name} />
          {children.length > 0 && (
            <div className="flex gap-3 py-2">
              <span className="text-xs font-bold text-gray-400 uppercase w-28 flex-shrink-0 pt-0.5">Con ({children.length})</span>
              <span className="text-sm text-gray-700">{children.map(c => c.name).join(' · ')}</span>
            </div>
          )}
        </div>

        {/* Tiểu sử */}
        {member.biography && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">📝 Tiểu sử</h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{member.biography}</p>
          </div>
        )}
      </div>
    </div>
  );
}
