import { Member } from '../types';
import { X, Users, UserCheck, Heart, TrendingUp } from 'lucide-react';

interface Props {
  members: Member[];
  onClose: () => void;
}

export default function StatsPanel({ members, onClose }: Props) {
  const alive = members.filter(m => !m.deathDate).length;
  const deceased = members.filter(m => !!m.deathDate).length;
  const male = members.filter(m => m.gender === 'Nam').length;
  const female = members.filter(m => m.gender === 'Nữ').length;

  const maxGen = Math.max(...members.map(m => m.generation), 0);
  const byGen = Array.from({ length: maxGen }, (_, i) => ({
    gen: i + 1,
    count: members.filter(m => m.generation === i + 1).length,
    male: members.filter(m => m.generation === i + 1 && m.gender === 'Nam').length,
    female: members.filter(m => m.generation === i + 1 && m.gender === 'Nữ').length,
  }));

  const married = members.filter(m => m.spouseId).length / 2;

  const Card = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) => (
    <div className={`${color} rounded-2xl p-4 flex items-center gap-3`}>
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-[#800000] to-[#A00000] text-white p-4 rounded-t-3xl sm:rounded-t-2xl flex justify-between items-center sticky top-0">
          <div>
            <h3 className="font-bold text-lg">📊 Thống kê Dòng Họ</h3>
            <p className="text-xs text-yellow-300">Gia Phả Dòng Họ Lê</p>
          </div>
          <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 rounded-full p-2">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Tổng quan */}
          <div className="grid grid-cols-2 gap-3">
            <Card icon={<Users size={24} className="text-[#800000]" />} label="Tổng thành viên" value={members.length} color="bg-red-50" />
            <Card icon={<UserCheck size={24} className="text-green-600" />} label="Còn sống" value={alive} color="bg-green-50" />
            <Card icon="🕯️" label="Đã mất" value={deceased} color="bg-gray-50" />
            <Card icon={<Heart size={24} className="text-pink-500" />} label="Cặp vợ chồng" value={Math.round(married)} color="bg-pink-50" />
          </div>

          {/* Nam / Nữ */}
          <div className="bg-blue-50 rounded-2xl p-4">
            <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
              <TrendingUp size={18} /> Tỷ lệ Nam / Nữ
            </h4>
            <div className="flex gap-3 mb-2">
              <div className="flex-1 text-center">
                <div className="text-3xl font-bold text-blue-600">{male}</div>
                <div className="text-xs text-gray-500">👨 Nam ({Math.round(male/members.length*100)}%)</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-3xl font-bold text-pink-500">{female}</div>
                <div className="text-xs text-gray-500">👩 Nữ ({Math.round(female/members.length*100)}%)</div>
              </div>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                style={{ width: `${Math.round(male/members.length*100)}%` }} />
            </div>
          </div>

          {/* Thống kê theo đời */}
          <div className="bg-amber-50 rounded-2xl p-4">
            <h4 className="font-bold text-amber-800 mb-3">📜 Phân bổ theo đời</h4>
            <div className="space-y-2">
              {byGen.map(g => (
                <div key={g.gen} className="flex items-center gap-3">
                  <div className="text-xs font-bold text-gray-500 w-12 flex-shrink-0">Đời {g.gen}</div>
                  <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden relative">
                    <div className="h-full bg-gradient-to-r from-[#800000] to-[#B8860B] rounded-full transition-all"
                      style={{ width: `${Math.round(g.count / members.length * 100)}%` }} />
                    <span className="absolute inset-0 flex items-center px-2 text-xs font-bold text-white">
                      {g.count} người ({g.male}♂ {g.female}♀)
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
              Tổng cộng {maxGen} đời — đời đông nhất: Đời {byGen.sort((a,b)=>b.count-a.count)[0]?.gen} ({byGen.sort((a,b)=>b.count-a.count)[0]?.count} người)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
