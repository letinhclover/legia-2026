import { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Upload, User } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { Member } from '../types';

interface MemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Partial<Member>) => void;
  onDelete?: (id: string) => void;
  members: Member[];
  editingMember?: Member | null;
  isAdmin: boolean;
}

const emptyForm = {
  name: '', tenHuy: '', tenTu: '', tenThuy: '', chucTuoc: '',
  gender: 'Nam' as 'Nam' | 'Nữ', generation: 1,
  birthDate: '', birthDateLunar: '', birthPlace: '',
  deathDate: '', deathDateLunar: '', deathPlace: '', burialPlace: '',
  residence: '', fatherId: '', motherId: '', spouseId: '',
  photoUrl: '', biography: '', email: '',
};

export default function MemberForm({ isOpen, onClose, onSave, onDelete, members, editingMember, isAdmin }: MemberFormProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [tab, setTab] = useState<'basic' | 'dates' | 'places' | 'relations' | 'bio'>('basic');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingMember) {
      setFormData({
        name: editingMember.name || '',
        tenHuy: editingMember.tenHuy || '',
        tenTu: editingMember.tenTu || '',
        tenThuy: editingMember.tenThuy || '',
        chucTuoc: editingMember.chucTuoc || '',
        gender: editingMember.gender || 'Nam',
        generation: editingMember.generation || 1,
        birthDate: editingMember.birthDate || '',
        birthDateLunar: editingMember.birthDateLunar || '',
        birthPlace: editingMember.birthPlace || '',
        deathDate: editingMember.deathDate || '',
        deathDateLunar: editingMember.deathDateLunar || '',
        deathPlace: editingMember.deathPlace || '',
        burialPlace: editingMember.burialPlace || '',
        residence: editingMember.residence || '',
        fatherId: editingMember.fatherId || '',
        motherId: editingMember.motherId || '',
        spouseId: editingMember.spouseId || '',
        photoUrl: editingMember.photoUrl || '',
        biography: editingMember.biography || '',
        email: editingMember.email || '',
      });
    } else {
      setFormData(emptyForm);
    }
    setTab('basic');
  }, [editingMember, isOpen]);

  if (!isOpen) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `photos/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(f => ({ ...f, photoUrl: url }));
    } catch {
      alert('Lỗi upload ảnh. Vui lòng thử lại.');
    }
    setUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, fatherId: formData.fatherId || null, motherId: formData.motherId || null, spouseId: formData.spouseId || null, id: editingMember?.id });
  };

  const byGen = (gen: number) => members.filter(m => m.generation === gen && m.id !== editingMember?.id);
  const prevGen = byGen(formData.generation - 1);
  const sameGen = members.filter(m => m.generation === formData.generation && m.id !== editingMember?.id);

  const inp = "w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-[#800000] focus:outline-none text-sm";
  const lbl = "block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide";
  const tabs = [
    { id: 'basic', label: '👤 Cơ bản' },
    { id: 'dates', label: '📅 Ngày tháng' },
    { id: 'places', label: '📍 Địa danh' },
    { id: 'relations', label: '👨‍👩‍👧 Quan hệ' },
    { id: 'bio', label: '📝 Tiểu sử' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#800000] text-white p-4 rounded-t-2xl flex justify-between items-center flex-shrink-0">
          <h3 className="font-bold text-lg">{editingMember ? 'Sửa thông tin thành viên' : 'Thêm thành viên mới'}</h3>
          <button onClick={onClose} className="hover:bg-[#600000] rounded-full p-1"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${tab === t.id ? 'text-[#800000] border-b-2 border-[#800000]' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5">

          {/* TAB: Cơ bản */}
          {tab === 'basic' && (
            <div className="space-y-4">
              {/* Ảnh */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-4 border-[#B8860B] overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                  {formData.photoUrl
                    ? <img src={formData.photoUrl} alt="avatar" className="w-full h-full object-cover" />
                    : <User size={32} className="text-gray-400" />}
                </div>
                <div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 bg-[#B8860B] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#996B08] transition-colors disabled:opacity-60"
                    disabled={uploading}>
                    <Upload size={16} />
                    {uploading ? 'Đang tải...' : 'Chọn ảnh'}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG — tối đa 5MB</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Họ và tên khai sinh <span className="text-red-500">*</span></label>
                  <input className={inp} value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className={lbl}>Tên Húy</label>
                  <input className={inp} value={formData.tenHuy} onChange={e => setFormData(f => ({ ...f, tenHuy: e.target.value }))} placeholder="Tên thật trong gia phả" />
                </div>
                <div>
                  <label className={lbl}>Tự (Tên chữ)</label>
                  <input className={inp} value={formData.tenTu} onChange={e => setFormData(f => ({ ...f, tenTu: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Thụy (Tên sau khi mất)</label>
                  <input className={inp} value={formData.tenThuy} onChange={e => setFormData(f => ({ ...f, tenThuy: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Chức tước / Phẩm hàm</label>
                  <input className={inp} value={formData.chucTuoc} onChange={e => setFormData(f => ({ ...f, chucTuoc: e.target.value }))} placeholder="VD: Chánh tổng, Hương lý..." />
                </div>
                <div>
                  <label className={lbl}>Giới tính <span className="text-red-500">*</span></label>
                  <select className={inp} value={formData.gender} onChange={e => setFormData(f => ({ ...f, gender: e.target.value as 'Nam' | 'Nữ' }))}>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Đời thứ <span className="text-red-500">*</span></label>
                  <input type="number" min="1" className={inp} value={formData.generation} onChange={e => setFormData(f => ({ ...f, generation: parseInt(e.target.value) || 1 }))} required />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Email nhận thông báo giỗ/sinh nhật</label>
                  <input type="email" className={inp} value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                </div>
              </div>
            </div>
          )}

          {/* TAB: Ngày tháng */}
          {tab === 'dates' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-bold text-blue-800 mb-3">🎂 Ngày sinh</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Ngày sinh (dương lịch)</label>
                    <input type="date" className={inp} value={formData.birthDate} onChange={e => setFormData(f => ({ ...f, birthDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className={lbl}>Ngày sinh âm lịch</label>
                    <input className={inp} value={formData.birthDateLunar} onChange={e => setFormData(f => ({ ...f, birthDateLunar: e.target.value }))} placeholder="VD: 15/7/Giáp Tý" />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-700 mb-3">🕯️ Ngày mất & Ngày giỗ</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Ngày mất (dương lịch)</label>
                    <input type="date" className={inp} value={formData.deathDate} onChange={e => setFormData(f => ({ ...f, deathDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className={lbl}>Ngày giỗ (âm lịch) ⭐</label>
                    <input className={inp} value={formData.deathDateLunar} onChange={e => setFormData(f => ({ ...f, deathDateLunar: e.target.value }))} placeholder="VD: 15/7 — dùng nhắc giỗ" />
                  </div>
                </div>
                <p className="text-xs text-orange-600 mt-2">⚠️ Ngày giỗ âm lịch sẽ được dùng để gửi email nhắc nhở tự động</p>
              </div>
            </div>
          )}

          {/* TAB: Địa danh */}
          {tab === 'places' && (
            <div className="space-y-3">
              <div>
                <label className={lbl}>Nơi sinh</label>
                <input className={inp} value={formData.birthPlace} onChange={e => setFormData(f => ({ ...f, birthPlace: e.target.value }))} placeholder="VD: Làng Đông Ngạc, Từ Liêm, Hà Nội" />
              </div>
              <div>
                <label className={lbl}>Nơi cư trú (hiện tại hoặc cuối đời)</label>
                <input className={inp} value={formData.residence} onChange={e => setFormData(f => ({ ...f, residence: e.target.value }))} placeholder="VD: TP. Hồ Chí Minh" />
              </div>
              <div>
                <label className={lbl}>Nơi mất</label>
                <input className={inp} value={formData.deathPlace} onChange={e => setFormData(f => ({ ...f, deathPlace: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>Nơi chôn cất / Mộ phần</label>
                <input className={inp} value={formData.burialPlace} onChange={e => setFormData(f => ({ ...f, burialPlace: e.target.value }))} placeholder="VD: Nghĩa trang Bình Dương, khu A, lô 5" />
              </div>
            </div>
          )}

          {/* TAB: Quan hệ */}
          {tab === 'relations' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg">Chỉ hiển thị người ở đời phù hợp. Đảm bảo đã nhập đúng "Đời thứ" ở tab Cơ bản.</p>
              <div>
                <label className={lbl}>Người cha (Đời {formData.generation - 1})</label>
                <select className={inp} value={formData.fatherId} onChange={e => setFormData(f => ({ ...f, fatherId: e.target.value }))}>
                  <option value="">-- Không rõ / Cụ tổ --</option>
                  {prevGen.filter(m => m.gender === 'Nam').map(m => (
                    <option key={m.id} value={m.id}>{m.name}{m.tenHuy ? ` (${m.tenHuy})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Người mẹ (Đời {formData.generation - 1})</label>
                <select className={inp} value={formData.motherId} onChange={e => setFormData(f => ({ ...f, motherId: e.target.value }))}>
                  <option value="">-- Không rõ --</option>
                  {prevGen.filter(m => m.gender === 'Nữ').map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Vợ / Chồng (Đời {formData.generation})</label>
                <select className={inp} value={formData.spouseId} onChange={e => setFormData(f => ({ ...f, spouseId: e.target.value }))}>
                  <option value="">-- Chưa có hoặc không rõ --</option>
                  {sameGen.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.gender})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB: Tiểu sử */}
          {tab === 'bio' && (
            <div>
              <label className={lbl}>Tiểu sử / Công trạng / Ghi chú</label>
              <textarea
                className={`${inp} h-64 resize-none`}
                value={formData.biography}
                onChange={e => setFormData(f => ({ ...f, biography: e.target.value }))}
                placeholder="Ghi lại cuộc đời, sự nghiệp, đóng góp cho dòng họ và xã hội..."
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-5 border-t border-gray-100 mt-5">
            <button type="submit"
              className="flex-1 bg-[#B8860B] text-white py-3 rounded-lg font-bold hover:bg-[#996B08] transition-colors flex items-center justify-center gap-2">
              <Save size={18} /> Lưu thông tin
            </button>
            {editingMember && onDelete && isAdmin && (
              <button type="button" onClick={() => onDelete(editingMember.id)}
                className="bg-red-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
