import { X, Edit2 } from 'lucide-react';
import { Member } from '../types';

interface Props {
  member: Member | null;
  members: Member[];
  onClose: () => void;
  onEdit: (m: Member) => void;
  isAdmin?: boolean;
}

export default function MemberDetail({ member, members, onClose, onEdit, isAdmin }: Props) {
  if (!member) return null;

  const find = (id: string | null) => id ? members.find(m => m.id === id) : null;
  const father = find(member.fatherId);
  const mother = find(member.motherId);
  const spouse = find(member.spouseId);
  const children = members.filter(m => m.fatherId === member.id || m.motherId === member.id);

  const Row = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <div className="flex gap-2 py-1.5 border-b border-gray-100 last:border-0">
        <span className="text-xs font-semibold text-gray-500 w-36 flex-shrink-0">{label}</span>
        <span className="text-sm text-gray-800">{value}</span>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-[#800000] text-white p-4 rounded-t-2xl flex justify-between items-center sticky top-0">
          <h3 className="font-bold text-lg">Hồ sơ thành viên</h3>
          <div className="flex gap-2">
            {isAdmin && (
              <button onClick={() => onEdit(member)}
                className="hover:bg-[#600000] rounded-lg px-3 py-1 flex items-center gap-1 text-sm">
                <Edit2 size={16} /> Sửa
              </button>
            )}
            <button onClick={onClose} className="hover:bg-[#600000] rounded-full p-1"><X size={20} /></button>
          </div>
        </div>

        <div className="p-5">
          {/* Ảnh & tên */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-20 h-20 rounded-full border-4 border-[#B8860B] overflow-hidden flex-shrink-0 bg-gray-100">
              {member.photoUrl
                ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">👤</div>}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#800000]">{member.name}</h2>
              {member.tenHuy && <p className="text-sm text-gray-600">Húy: <strong>{member.tenHuy}</strong></p>}
              {member.chucTuoc && <p className="text-sm text-[#B8860B] font-semibold">{member.chucTuoc}</p>}
              <p className="text-xs text-gray-500">{member.gender} · Đời thứ {member.generation}</p>
            </div>
          </div>

          {(member.tenTu || member.tenThuy) && (
            <div className="bg-yellow-50 rounded-xl p-3 mb-4">
              <Row label="Tự (Tên chữ)" value={member.tenTu} />
              <Row label="Thụy" value={member.tenThuy} />
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-3 mb-4">
            <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Ngày sinh & Ngày mất</h4>
            <Row label="Ngày sinh (DL)" value={member.birthDate ? new Date(member.birthDate).toLocaleDateString('vi-VN') : ''} />
            <Row label="Ngày sinh (ÂL)" value={member.birthDateLunar} />
            <Row label="Ngày mất (DL)" value={member.deathDate ? new Date(member.deathDate).toLocaleDateString('vi-VN') : ''} />
            <Row label="Ngày giỗ (ÂL)" value={member.deathDateLunar} />
          </div>

          {(member.birthPlace || member.residence || member.burialPlace || member.deathPlace) && (
            <div className="bg-green-50 rounded-xl p-3 mb-4">
              <h4 className="text-xs font-bold text-green-800 uppercase mb-2">Địa danh</h4>
              <Row label="Nơi sinh" value={member.birthPlace} />
              <Row label="Nơi cư trú" value={member.residence} />
              <Row label="Nơi mất" value={member.deathPlace} />
              <Row label="Nơi chôn cất" value={member.burialPlace} />
            </div>
          )}

          <div className="bg-pink-50 rounded-xl p-3 mb-4">
            <h4 className="text-xs font-bold text-pink-800 uppercase mb-2">Quan hệ gia đình</h4>
            <Row label="Cha" value={father?.name} />
            <Row label="Mẹ" value={mother?.name} />
            <Row label="Vợ / Chồng" value={spouse?.name} />
            {children.length > 0 && (
              <div className="flex gap-2 py-1.5">
                <span className="text-xs font-semibold text-gray-500 w-36 flex-shrink-0">Con cái ({children.length})</span>
                <span className="text-sm text-gray-800">{children.map(c => c.name).join(', ')}</span>
              </div>
            )}
          </div>

          {member.biography && (
            <div className="bg-gray-50 rounded-xl p-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Tiểu sử & Công trạng</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">{member.biography}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
