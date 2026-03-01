import { X, Edit2, QrCode } from 'lucide-react';
import { Member } from '../types';
import { getRelationship } from '../utils/relationship';

interface Props {
  member: Member | null;
  members: Member[];
  onClose: () => void;
  onEdit: (m: Member) => void;
  isAdmin?: boolean;
  viewer?: Member | null; // người đang xem — để tính xưng hô
}

export default function MemberDetail({ member, members, onClose, onEdit, isAdmin, viewer }: Props) {
  if (!member) return null;

  const find = (id: string | null) => id ? members.find(m => m.id === id) : null;
  const father = find(member.fatherId);
  const mother = find(member.motherId);
  const spouse = find(member.spouseId);
  const children = members.filter(m => m.fatherId === member.id || m.motherId === member.id);

  const relation = viewer && viewer.id !== member.id
    ? getRelationship(viewer, member, members)
    : null;

  const Row = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <div className="flex gap-2 py-2 border-b border-gray-50 last:border-0">
        <span className="text-xs font-bold text-gray-400 w-32 flex-shrink-0 uppercase">{label}</span>
        <span className="text-sm text-gray-700">{value}</span>
      </div>
    ) : null;

  const shareUrl = `${window.location.origin}?member=${member.id}`;

  const handleQR = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;
    window.open(qrUrl, '_blank');
  };

  const isDeceased = !!member.deathDate;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className={`${isDeceased ? 'bg-gray-50' : 'bg-white'} rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto`}>

        {/* Header */}
        <div className={`${isDeceased ? 'bg-gradient-to-r from-gray-700 to-gray-600' : 'bg-gradient-to-r from-[#800000] to-[#A00000]'} text-white p-4 rounded-t-3xl sm:rounded-t-2xl flex justify-between items-center sticky top-0 z-10`}>
          <h3 className="font-bold">
            {isDeceased ? '🕯️ Hồ sơ thành viên' : '👤 Hồ sơ thành viên'}
          </h3>
          <div className="flex gap-2">
            <button onClick={handleQR} className="hover:bg-white hover:bg-opacity-20 rounded-lg px-2 py-1 flex items-center gap-1 text-xs">
              <QrCode size={15} /> QR
            </button>
            {isAdmin && (
              <button onClick={() => onEdit(member)} className="hover:bg-white hover:bg-opacity-20 rounded-lg px-2 py-1 flex items-center gap-1 text-xs">
                <Edit2 size={15} /> Sửa
              </button>
            )}
            <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 rounded-full p-1"><X size={20}/></button>
          </div>
        </div>

        <div className="p-5">
          {/* Ảnh & tên */}
          <div className="flex items-center gap-4 mb-5">
            <div className={`w-20 h-20 rounded-2xl border-4 ${isDeceased ? 'border-gray-400' : 'border-[#B8860B]'} overflow-hidden flex-shrink-0 bg-gray-100 shadow-lg`}>
              {member.photoUrl
                ? <img src={member.photoUrl} alt={member.name} className={`w-full h-full object-cover ${isDeceased ? 'grayscale' : ''}`}/>
                : <div className="w-full h-full flex items-center justify-center text-4xl">{isDeceased ? '👴' : '👤'}</div>}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#800000]">{member.name}</h2>
              {member.tenHuy && <p className="text-sm text-gray-500">Húy: <strong className="text-gray-700">{member.tenHuy}</strong></p>}
              {member.chucTuoc && <p className="text-sm font-semibold text-[#B8860B]">{member.chucTuoc}</p>}
              <p className="text-xs text-gray-400 mt-0.5">{member.gender} · Đời thứ {member.generation}</p>
              {relation && (
                <div className="mt-1 bg-[#800000] bg-opacity-10 text-[#800000] text-xs font-bold px-2 py-0.5 rounded-full inline-block">
                  👥 {relation.label}
                </div>
              )}
            </div>
          </div>

          {/* Tên chữ */}
          {(member.tenTu || member.tenThuy) && (
            <div className="bg-yellow-50 rounded-xl p-3 mb-3">
              <Row label="Tự (Tên chữ)" value={member.tenTu} />
              <Row label="Thụy" value={member.tenThuy} />
            </div>
          )}

          {/* Ngày tháng */}
          <div className="bg-blue-50 rounded-xl p-3 mb-3">
            <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">📅 Ngày sinh & Ngày mất</h4>
            <Row label="Sinh (DL)" value={member.birthDate ? new Date(member.birthDate).toLocaleDateString('vi-VN') : ''} />
            <Row label="Sinh (ÂL)" value={member.birthDateLunar} />
            <Row label="Mất (DL)" value={member.deathDate ? new Date(member.deathDate).toLocaleDateString('vi-VN') : ''} />
            <Row label="Ngày giỗ (ÂL)" value={member.deathDateLunar} />
          </div>

          {/* Địa danh */}
          {(member.birthPlace || member.residence || member.burialPlace || member.deathPlace) && (
            <div className="bg-green-50 rounded-xl p-3 mb-3">
              <h4 className="text-xs font-bold text-green-700 uppercase mb-2">📍 Địa danh</h4>
              <Row label="Nơi sinh" value={member.birthPlace} />
              <Row label="Cư trú" value={member.residence} />
              <Row label="Nơi mất" value={member.deathPlace} />
              <Row label="Chôn cất" value={member.burialPlace} />
            </div>
          )}

          {/* Quan hệ */}
          <div className="bg-pink-50 rounded-xl p-3 mb-3">
            <h4 className="text-xs font-bold text-pink-700 uppercase mb-2">👨‍👩‍👧 Gia đình</h4>
            <Row label="Cha" value={father?.name} />
            <Row label="Mẹ" value={mother?.name} />
            <Row label={member.gender === 'Nam' ? 'Vợ' : 'Chồng'} value={spouse?.name} />
            {children.length > 0 && (
              <div className="flex gap-2 py-2">
                <span className="text-xs font-bold text-gray-400 w-32 flex-shrink-0 uppercase">Con ({children.length})</span>
                <span className="text-sm text-gray-700">{children.map(c => c.name).join(' · ')}</span>
              </div>
            )}
          </div>

          {/* Tiểu sử */}
          {member.biography && (
            <div className="bg-gray-50 rounded-xl p-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">📝 Tiểu sử & Công trạng</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{member.biography}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
