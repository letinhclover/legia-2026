import { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Camera, User } from 'lucide-react';
import { Member, MemberType } from '../types';
import { uploadToCloudinary } from '../utils/imageCompress';
import { solarToLunarString } from '../utils/lunarCalendar';

interface MemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Partial<Member>) => void;
  onDelete?: (id: string) => void;
  members: Member[];
  editingMember?: Member | null;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  darkMode?: boolean;
}

const emptyForm = {
  name:'',tenHuy:'',nickname:'',chucTuoc:'',memberType:'chinh' as MemberType,
  gender:'Nam' as 'Nam'|'Nữ', generation:'1',
  birthDate:'',birthDateLunar:'',birthPlace:'',
  deathDate:'',deathDateLunar:'',deathPlace:'',
  burialAddress:'',burialMapLink:'',
  residence:'',fatherId:'',motherId:'',spouseId:'',
  photoUrl:'',biography:'',
};

export default function MemberForm({
  isOpen, onClose, onSave, onDelete, members, editingMember,
  isAdmin, isSuperAdmin = false, darkMode = false,
}: MemberFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab]   = useState<'basic'|'dates'|'places'|'relations'|'bio'>('basic');
  const [uploading, setUploading]         = useState(false);
  const [uploadError, setUploadError]     = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Màu sắc Dark/Light ────────────────────────────────────────────────────
  const bg         = darkMode ? '#111214'   : '#ffffff';
  const cardBg     = darkMode ? '#1d1f21'   : '#F8F5F0';
  const textMain   = darkMode ? '#f5f5f5'   : '#0b0b0b';
  const textSub    = darkMode ? '#c0c0c0'   : '#3d3d3d';
  const border     = darkMode ? '#2d3748'   : '#e2e8f0';
  const inputBg    = darkMode ? '#0f1a28'   : '#FFFFFF';
  const inputBorder = darkMode ? '#3a4d63'  : '#D0C4B4';
  const inputFocus = '#CC0000';
  const sectionBg  = darkMode ? '#1d1f21'   : '#F0EBE1';
  const labelColor = darkMode ? '#c0c0c0'   : '#7A6A5E';
  const tabActive  = darkMode ? '#1d1f21'   : '#FFFFFF';
  const tabInactive = darkMode ? '#111214'  : '#F0EBE1';
  const tabActiveTxt = '#CC0000';
  const tabInactiveTxt = darkMode ? '#6B7E96' : '#9C8E82';
  const dangerBg   = darkMode ? '#2a1010'   : '#FEF2F2';
  const warningBg  = darkMode ? '#2a1f08'   : '#FFFBEB';
  const successBg  = darkMode ? '#0f2a1a'   : '#F0FDF4';
  const infoBg     = darkMode ? '#1a1c1e'   : '#EFF6FF';

  useEffect(() => {
    if (editingMember) {
      setForm({
        name: editingMember.name || '',
        tenHuy: editingMember.tenHuy || '',
        nickname: (editingMember as any).nickname || '',
        chucTuoc: editingMember.chucTuoc || '',
        memberType: (editingMember.memberType || 'chinh') as MemberType,
        gender: editingMember.gender || 'Nam',
        generation: String(editingMember.generation || 1),
        birthDate: editingMember.birthDate || '',
        birthDateLunar: editingMember.birthDateLunar || '',
        birthPlace: editingMember.birthPlace || '',
        deathDate: editingMember.deathDate || '',
        deathDateLunar: editingMember.deathDateLunar || '',
        deathPlace: editingMember.deathPlace || '',
        burialAddress: editingMember.burialAddress || editingMember.burialPlace || '',
        burialMapLink: editingMember.burialMapLink || '',
        residence: editingMember.residence || '',
        fatherId: editingMember.fatherId || '',
        motherId: editingMember.motherId || '',
        spouseId: editingMember.spouseId || '',
        photoUrl: editingMember.photoUrl || '',
        biography: editingMember.biography || '',
      });
    } else {
      setForm(emptyForm);
    }
    setTab('basic');
    setUploadError('');
    setUploadProgress('');
  }, [editingMember, isOpen]);

  if (!isOpen) return null;

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleBirthDate = (v: string) => {
    set('birthDate', v);
    if (v) set('birthDateLunar', solarToLunarString(v));
  };
  const handleDeathDate = (v: string) => {
    set('deathDate', v);
    if (v) {
      const lunar = solarToLunarString(v);
      const parts = lunar.split(' năm ');
      set('deathDateLunar', parts[0] || lunar);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setUploadError('Ảnh quá lớn (tối đa 10MB)'); return; }
    setUploading(true); setUploadError(''); setUploadProgress('Đang nén ảnh...');
    try {
      setUploadProgress('Đang tải lên...');
      const url = await uploadToCloudinary(file);
      set('photoUrl', url);
      setUploadProgress('✅ Tải ảnh thành công!');
      setTimeout(() => setUploadProgress(''), 2000);
    } catch (err: any) {
      setUploadError('Lỗi tải ảnh: ' + err.message);
      setUploadProgress('');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const gen = parseInt(form.generation) || 1;
    onSave({
      ...form,
      memberType: form.memberType as MemberType,
      generation: Number(gen),
      fatherId: form.fatherId || null,
      motherId: form.motherId || null,
      spouseId: form.spouseId || null,
      burialAddress: form.burialAddress || null,
      burialMapLink: form.burialMapLink || null,
      burialPlace: form.burialAddress || null,
      id: editingMember?.id,
    });
  };

  const prevGen = members.filter(m => m.generation === parseInt(form.generation) - 1 && m.id !== editingMember?.id);

  const getDescendantIds = (rootId: string): Set<string> => {
    const result = new Set<string>();
    const queue = [rootId];
    while (queue.length) {
      const id = queue.shift()!;
      members.forEach(m => {
        if ((m.fatherId === id || m.motherId === id) && !result.has(m.id)) {
          result.add(m.id); queue.push(m.id);
        }
      });
    }
    return result;
  };

  const getRelatedIds = (id: string): Set<string> => {
    const rel = new Set<string>();
    const me = members.find(m => m.id === id);
    if (!me) return rel;
    if (me.fatherId) rel.add(me.fatherId);
    if (me.motherId) rel.add(me.motherId);
    const siblings = members.filter(s =>
      s.id !== id &&
      ((me.fatherId && s.fatherId === me.fatherId) ||
       (me.motherId && s.motherId === me.motherId))
    );
    siblings.forEach(s => rel.add(s.id));
    members.forEach(m => {
      if (siblings.some(s => m.fatherId === s.id || m.motherId === s.id)) rel.add(m.id);
    });
    return rel;
  };

  const descendantIds = editingMember ? getDescendantIds(editingMember.id) : new Set<string>();
  const relatedIds    = editingMember ? getRelatedIds(editingMember.id) : new Set<string>();
  const oppositeGender = form.gender === 'Nam' ? 'Nữ' : 'Nam';
  const currentGen = parseInt(form.generation) || 1;
  const spousePool = members.filter(m =>
    m.gender === oppositeGender &&
    m.id !== editingMember?.id &&
    !descendantIds.has(m.id) &&
    !relatedIds.has(m.id) &&
    m.generation === currentGen &&
    (!m.spouseId || m.spouseId === editingMember?.id)
  );

  // ── Style helpers ─────────────────────────────────────────────────────────
  // Kích thước lớn hơn cho người cao tuổi
  const inpStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: `2px solid ${inputBorder}`,
    background: inputBg,
    color: textMain,
    fontSize: 16,
    fontFamily: "'Roboto', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s',
  };
  const lblStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: labelColor,
    marginBottom: 6,
    fontFamily: "'Roboto', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const tabsList = [
    { id: 'basic',     label: '👤 Cơ bản'   },
    { id: 'dates',     label: '📅 Ngày'     },
    { id: 'places',    label: '📍 Địa'      },
    { id: 'relations', label: '👨‍👩‍👧 Quan hệ' },
    { id: 'bio',       label: '📝 Tiểu sử'  },
  ] as const;

  const SectionBox = ({ children, color = sectionBg }: { children: React.ReactNode; color?: string }) => (
    <div style={{ background: color, borderRadius: 16, padding: 16 }}>{children}</div>
  );

  return (
    <div className="flex flex-col" style={{ background: bg, minHeight: '100%' }}>

      {/* Header */}
      <div
        className="flex justify-between items-center px-4 py-4 flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, #CC0000, #dd2476)',
          borderRadius: '24px 24px 0 0',
        }}
      >
        <div>
          <h3 style={{ fontFamily: "'Roboto', sans-serif", fontSize: 18, fontWeight: 900, color: 'white' }}>
            {editingMember ? '✏️ Sửa thông tin' : '➕ Thêm thành viên'}
          </h3>
          <p style={{ fontSize: 12, color: '#FFD700', opacity: 0.85, fontFamily: "'Roboto', sans-serif" }}>
            Gia Phả Dòng Họ Lê
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.18)',
            border: 'none', borderRadius: '50%',
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={22} color="white" />
        </button>
      </div>

      {/* Tabs — lớn hơn để dễ bấm */}
      <div
        className="flex border-b overflow-x-auto flex-shrink-0"
        style={{ background: tabInactive, borderColor: border }}
      >
        {tabsList.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '12px 14px',
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              background: tab === t.id ? tabActive : 'transparent',
              color: tab === t.id ? tabActiveTxt : tabInactiveTxt,
              borderBottom: tab === t.id ? '3px solid #CC0000' : '3px solid transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Roboto', sans-serif",
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ flex: 1 }}>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── TAB: CƠ BẢN ── */}
          {tab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Upload ảnh */}
              <SectionBox>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: 16,
                      border: `2px dashed ${border}`,
                      overflow: 'hidden', background: inputBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {form.photoUrl
                        ? <img src={form.photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <User size={32} color={textSub} />
                      }
                    </div>
                    {form.photoUrl && (
                      <button
                        type="button" onClick={() => set('photoUrl', '')}
                        style={{
                          position: 'absolute', top: -4, right: -4,
                          background: '#DC2626', color: 'white',
                          borderRadius: '50%', width: 22, height: 22,
                          fontSize: 14, fontWeight: 900,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: 'none', cursor: 'pointer',
                        }}
                      >×</button>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                    <button
                      type="button" onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      style={{
                        background: '#CC0000', color: 'white',
                        padding: '10px 16px', borderRadius: 12,
                        fontSize: 14, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', justifyContent: 'center',
                        border: 'none', cursor: uploading ? 'not-allowed' : 'pointer',
                        opacity: uploading ? 0.6 : 1,
                        fontFamily: "'Roboto', sans-serif",
                      }}
                    >
                      {uploading ? <>⏳ {uploadProgress}</> : <><Camera size={16} /> Chọn ảnh</>}
                    </button>
                    {uploadProgress && !uploading && (
                      <p style={{ color: '#16A34A', fontSize: 12, marginTop: 4, fontWeight: 600 }}>{uploadProgress}</p>
                    )}
                    {uploadError && (
                      <p style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{uploadError}</p>
                    )}
                    <p style={{ color: textSub, fontSize: 12, marginTop: 4 }}>JPG/PNG · Tối đa 10MB</p>
                  </div>
                </div>
              </SectionBox>

              {/* Họ và tên */}
              <div>
                <label style={lblStyle}>Họ và tên <span style={{ color: '#DC2626' }}>*</span></label>
                <input
                  style={inpStyle} value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Lê Văn A" required
                />
              </div>

              {/* Tên Húy | Chức tước */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lblStyle}>Tên Húy</label>
                  <input style={inpStyle} value={form.tenHuy} onChange={e => set('tenHuy', e.target.value)} placeholder="Tên gia phả" />
                </div>
                <div>
                  <label style={lblStyle}>Chức tước</label>
                  <input style={inpStyle} value={form.chucTuoc} onChange={e => set('chucTuoc', e.target.value)} placeholder="Hương lý…" />
                </div>
              </div>

              {/* Tên thường gọi | Đời thứ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lblStyle}>Tên thường gọi</label>
                  <input style={inpStyle} value={(form as any).nickname || ''} onChange={e => set('nickname', e.target.value)} placeholder="Bé, Dâu Tây…" />
                </div>
                <div>
                  <label style={lblStyle}>Đời thứ <span style={{ color: '#DC2626' }}>*</span></label>
                  <input
                    style={inpStyle} inputMode="numeric" value={form.generation}
                    onChange={e => set('generation', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="1" required
                  />
                </div>
              </div>

              {/* Vai vế | Giới tính */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lblStyle}>Vai vế</label>
                  <select style={inpStyle} value={form.memberType} onChange={e => set('memberType', e.target.value)}>
                    <option value="chinh">🔴 Chính tộc</option>
                    <option value="dau">💍 Con dâu</option>
                    <option value="re">🤝 Con rể</option>
                    <option value="chau_ngoai">👶 Cháu ngoại</option>
                    <option value="ngoai_toc">🔗 Ngoại tộc</option>
                  </select>
                </div>
                <div>
                  <label style={lblStyle}>Giới tính <span style={{ color: '#DC2626' }}>*</span></label>
                  <select style={inpStyle} value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="Nam">👨 Nam</option>
                    <option value="Nữ">👩 Nữ</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: NGÀY THÁNG ── */}
          {tab === 'dates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SectionBox color={infoBg}>
                <h4 style={{ fontWeight: 800, color: darkMode ? '#60A5FA' : '#1D4ED8', marginBottom: 12, fontSize: 15 }}>
                  🎂 Ngày sinh
                </h4>
                <div style={{ marginBottom: 12 }}>
                  <label style={lblStyle}>Ngày sinh dương lịch</label>
                  <input type="date" style={inpStyle} value={form.birthDate} onChange={e => handleBirthDate(e.target.value)} />
                </div>
                <div>
                  <label style={{ ...lblStyle }}>
                    Ngày sinh âm lịch{' '}
                    <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', color: darkMode ? '#60A5FA' : '#1D4ED8' }}>
                      (tự động tính)
                    </span>
                  </label>
                  <input
                    style={{ ...inpStyle, background: darkMode ? '#1a1c1e' : '#EFF6FF' }}
                    value={form.birthDateLunar}
                    onChange={e => set('birthDateLunar', e.target.value)}
                    placeholder="Tự động khi chọn dương lịch"
                  />
                </div>
              </SectionBox>

              <SectionBox color={warningBg}>
                <h4 style={{ fontWeight: 800, color: darkMode ? '#FCD34D' : '#92400E', marginBottom: 12, fontSize: 15 }}>
                  🕯️ Ngày mất & Ngày giỗ
                </h4>
                <div style={{ marginBottom: 12 }}>
                  <label style={lblStyle}>Ngày mất dương lịch</label>
                  <input type="date" style={inpStyle} value={form.deathDate} onChange={e => handleDeathDate(e.target.value)} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={lblStyle}>
                    Ngày giỗ âm lịch ⭐{' '}
                    <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', color: darkMode ? '#FCD34D' : '#92400E' }}>
                      (tự động tính)
                    </span>
                  </label>
                  <input
                    style={{ ...inpStyle, background: darkMode ? '#2a1f08' : '#FFFDE7' }}
                    value={form.deathDateLunar}
                    onChange={e => set('deathDateLunar', e.target.value)}
                    placeholder="VD: 15/7 — dùng để nhắc giỗ"
                  />
                </div>
                <p style={{
                  fontSize: 13, color: darkMode ? '#FCD34D' : '#92400E',
                  background: darkMode ? 'rgba(255,200,0,0.08)' : '#FEF3C7',
                  borderRadius: 10, padding: '8px 12px',
                }}>
                  ⚠️ Ngày giỗ âm lịch dùng để gửi thông báo nhắc nhở tự động
                </p>
              </SectionBox>
            </div>
          )}

          {/* ── TAB: ĐỊA DANH ── */}
          {tab === 'places' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Nơi sinh', key: 'birthPlace', ph: 'Làng Đông Ngạc, Từ Liêm, Hà Nội' },
                { label: 'Nơi cư trú', key: 'residence', ph: 'TP. Hồ Chí Minh' },
                { label: 'Nơi mất', key: 'deathPlace', ph: 'Bệnh viện Chợ Rẫy...' },
              ].map(f => (
                <div key={f.key}>
                  <label style={lblStyle}>{f.label}</label>
                  <input style={inpStyle} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.ph} />
                </div>
              ))}
              <div>
                <label style={lblStyle}>📍 Địa chỉ mộ phần</label>
                <input
                  style={inpStyle} value={form.burialAddress}
                  onChange={e => set('burialAddress', e.target.value)}
                  placeholder="Nghĩa trang Bình Dương, khu A, lô 5"
                />
              </div>
              <div>
                <label style={lblStyle}>🗺️ Link Google Maps</label>
                <input
                  style={inpStyle} value={form.burialMapLink}
                  onChange={e => set('burialMapLink', e.target.value)}
                  placeholder="https://maps.app.goo.gl/..." type="url"
                />
                {form.burialMapLink && (
                  <a href={form.burialMapLink} target="_blank" rel="noreferrer"
                    style={{ fontSize: 13, color: '#2563EB', marginTop: 4, display: 'block', textDecoration: 'underline' }}>
                    ✅ Xem trước link Maps →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: QUAN HỆ ── */}
          {tab === 'relations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                background: darkMode ? '#2a1f08' : '#FFFBEB',
                borderRadius: 12, padding: '10px 14px',
                fontSize: 13, color: darkMode ? '#FCD34D' : '#92400E',
              }}>
                💡 Chỉ hiện người ở đời phù hợp. Đảm bảo đã nhập đúng Đời thứ ở tab Cơ bản.
              </div>
              {[
                { label: `Cha (Đời ${parseInt(form.generation) - 1})`, key: 'fatherId', pool: prevGen.filter(m => m.gender === 'Nam'), ph: '-- Cụ tổ / Không rõ --' },
                { label: `Mẹ (Đời ${parseInt(form.generation) - 1})`, key: 'motherId', pool: prevGen.filter(m => m.gender === 'Nữ'), ph: '-- Không rõ --' },
              ].map(f => (
                <div key={f.key}>
                  <label style={lblStyle}>{f.label}</label>
                  <select style={inpStyle} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)}>
                    <option value="">{f.ph}</option>
                    {f.pool.map(m => (
                      <option key={m.id} value={m.id}>{m.name}{m.tenHuy ? ` (Húy: ${m.tenHuy})` : ''}</option>
                    ))}
                  </select>
                </div>
              ))}
              <div>
                <label style={lblStyle}>
                  {form.gender === 'Nam' ? '💑 Vợ' : '💑 Chồng'}
                  <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', color: textSub, marginLeft: 6 }}>
                    (Đời {currentGen} · {oppositeGender} · {spousePool.length} người)
                  </span>
                </label>
                <select style={inpStyle} value={form.spouseId} onChange={e => set('spouseId', e.target.value)}>
                  <option value="">-- Chưa có --</option>
                  {spousePool.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}{m.tenHuy ? ` (Húy: ${m.tenHuy})` : ''} · Đời {m.generation}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── TAB: TIỂU SỬ ── */}
          {tab === 'bio' && (
            <div>
              <label style={lblStyle}>Tiểu sử / Công trạng / Ghi chú</label>
              <textarea
                style={{
                  ...inpStyle,
                  minHeight: 220,
                  resize: 'none',
                  lineHeight: 1.6,
                }}
                value={form.biography}
                onChange={e => set('biography', e.target.value)}
                placeholder="Ghi lại cuộc đời, sự nghiệp, đóng góp cho dòng họ và xã hội của người này..."
              />
              <p style={{ color: textSub, fontSize: 12, marginTop: 4 }}>{form.biography.length} ký tự</p>
            </div>
          )}
        </div>

        {/* ── Nút hành động — luôn hiển thị cuối form ── */}
        <div style={{
          display: 'flex', gap: 12, padding: '14px 16px',
          borderTop: `1px solid ${border}`,
          background: darkMode ? '#1d1f21' : '#F8F5F0',
          position: 'sticky', bottom: 0, zIndex: 10,
        }}>
          <button
            type="submit"
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #B8860B, #8B6914)',
              color: 'white',
              padding: '14px 0',
              borderRadius: 14,
              fontSize: 16, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(184,134,11,0.35)',
              fontFamily: "'Roboto', sans-serif",
            }}
          >
            <Save size={20} /> Lưu thông tin
          </button>
          {editingMember && onDelete && isAdmin && (
            <button
              type="button" onClick={() => onDelete(editingMember.id)}
              style={{
                background: '#DC2626', color: 'white',
                padding: '14px 18px', borderRadius: 14,
                fontSize: 16, fontWeight: 800,
                display: 'flex', alignItems: 'center', gap: 6,
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
              }}
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
