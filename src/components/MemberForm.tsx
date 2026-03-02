import { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Upload, User, Camera } from 'lucide-react';
import { Member } from '../types';
import { uploadToCloudinary } from '../utils/imageCompress';
import { solarToLunarString } from '../utils/lunarCalendar';

interface MemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Partial<Member>) => void;
  onDelete?: (id: string) => void;
  members: Member[];
  editingMember?: Member | null;
  isAdmin: boolean;      // canEdit
  isSuperAdmin?: boolean;
}

const emptyForm = {
  name:'',tenHuy:'',tenTu:'',tenThuy:'',chucTuoc:'',
  gender:'Nam' as 'Nam'|'Nữ', generation:'1',
  birthDate:'',birthDateLunar:'',birthPlace:'',
  deathDate:'',deathDateLunar:'',deathPlace:'',
  burialAddress:'',burialMapLink:'',   // YC3: tách mộ phần thành 2 trường
  residence:'',fatherId:'',motherId:'',spouseId:'',
  photoUrl:'',biography:'',email:'',
};

export default function MemberForm({isOpen,onClose,onSave,onDelete,members,editingMember,isAdmin,isSuperAdmin=false}:MemberFormProps){
  const [form,setForm]=useState(emptyForm);
  const [tab,setTab]=useState<'basic'|'dates'|'places'|'relations'|'bio'>('basic');
  const [uploading,setUploading]=useState(false);
  const [uploadError,setUploadError]=useState('');
  const [uploadProgress,setUploadProgress]=useState('');
  const fileRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{
    if(editingMember){
      setForm({
        name:editingMember.name||'',
        tenHuy:editingMember.tenHuy||'',
        tenTu:editingMember.tenTu||'',
        tenThuy:editingMember.tenThuy||'',
        chucTuoc:editingMember.chucTuoc||'',
        gender:editingMember.gender||'Nam',
        generation:String(editingMember.generation||1),
        birthDate:editingMember.birthDate||'',
        birthDateLunar:editingMember.birthDateLunar||'',
        birthPlace:editingMember.birthPlace||'',
        deathDate:editingMember.deathDate||'',
        deathDateLunar:editingMember.deathDateLunar||'',
        deathPlace:editingMember.deathPlace||'',
        // YC3: migrate burialPlace cũ → burialAddress nếu chưa có
        burialAddress:editingMember.burialAddress||editingMember.burialPlace||'',
        burialMapLink:editingMember.burialMapLink||'',
        residence:editingMember.residence||'',
        fatherId:editingMember.fatherId||'',
        motherId:editingMember.motherId||'',
        spouseId:editingMember.spouseId||'',
        photoUrl:editingMember.photoUrl||'',
        biography:editingMember.biography||'',
        email:editingMember.email||'',
      });
    } else {
      setForm(emptyForm);
    }
    setTab('basic');
    setUploadError('');
    setUploadProgress('');
  },[editingMember,isOpen]);

  if(!isOpen)return null;

  const set=(k:string,v:string)=>setForm(f=>({...f,[k]:v}));
  // Note: outer modal wrapper removed — BottomSheet handles it

  // Auto chuyển dương → âm lịch
  const handleBirthDate=(v:string)=>{
    set('birthDate',v);
    if(v){
      const lunar=solarToLunarString(v);
      set('birthDateLunar',lunar);
    }
  };
  const handleDeathDate=(v:string)=>{
    set('deathDate',v);
    if(v){
      const lunar=solarToLunarString(v);
      // Ngày giỗ = ngày/tháng âm lịch (bỏ phần năm)
      const parts=solarToLunarString(v).split(' năm ');
      set('deathDateLunar',parts[0]||lunar);
    }
  };

  const handleUpload=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    if(file.size>10*1024*1024){setUploadError('Ảnh quá lớn (tối đa 10MB)');return;}
    setUploading(true);
    setUploadError('');
    setUploadProgress('Đang nén ảnh...');
    try{
      setUploadProgress('Đang tải lên...');
      const url=await uploadToCloudinary(file);
      set('photoUrl',url);
      setUploadProgress('✅ Tải ảnh thành công!');
      setTimeout(()=>setUploadProgress(''),2000);
    }catch(err:any){
      setUploadError('Lỗi tải ảnh: '+err.message);
      setUploadProgress('');
    }
    setUploading(false);
    if(fileRef.current)fileRef.current.value='';
  };

  const handleSubmit=(e:React.FormEvent)=>{
    e.preventDefault();
    const gen=parseInt(form.generation)||1;
    onSave({
      ...form,
      generation: Number(gen),           // YC2: ép kiểu Number tường minh
      fatherId:form.fatherId||null,
      motherId:form.motherId||null,
      spouseId:form.spouseId||null,
      burialAddress:form.burialAddress||null,
      burialMapLink:form.burialMapLink||null,
      burialPlace:form.burialAddress||null, // sync ngược để GraveMap vẫn dùng được
      id:editingMember?.id,
    });
  };

  const prevGen=members.filter(m=>m.generation===parseInt(form.generation)-1&&m.id!==editingMember?.id);

  // YC4: Spouse pool thông minh — chỉ hiện giới tính đối lập, loại con cháu trực hệ
  const getDescendantIds = (rootId: string): Set<string> => {
    const result = new Set<string>();
    const queue = [rootId];
    while (queue.length) {
      const id = queue.shift()!;
      members.forEach(m => {
        if ((m.fatherId === id || m.motherId === id) && !result.has(m.id)) {
          result.add(m.id);
          queue.push(m.id);
        }
      });
    }
    return result;
  };
  const descendantIds = editingMember ? getDescendantIds(editingMember.id) : new Set<string>();

  // ── Lọc họ hàng gần: không được cưới anh em ruột, con của anh em ruột ──
  const getRelatedIds = (memberId: string): Set<string> => {
    const rel = new Set<string>();
    if (!memberId) return rel;
    const me = members.find(m => m.id === memberId);
    if (!me) return rel;

    // Cha mẹ ruột → không được cưới
    if (me.fatherId) rel.add(me.fatherId);
    if (me.motherId) rel.add(me.motherId);

    // Tìm anh chị em ruột (cùng cha hoặc cùng mẹ)
    const siblings = members.filter(s =>
      s.id !== memberId &&
      ((me.fatherId && s.fatherId === me.fatherId) ||
       (me.motherId && s.motherId === me.motherId))
    );
    // Anh em ruột → không được cưới
    siblings.forEach(s => rel.add(s.id));

    // Con của anh em ruột (cousins ruột) → không được cưới
    members.forEach(m => {
      if (siblings.some(s => m.fatherId === s.id || m.motherId === s.id)) {
        rel.add(m.id);
      }
    });

    return rel;
  };
  const relatedIds = editingMember ? getRelatedIds(editingMember.id) : new Set<string>();

  const oppositeGender = form.gender === 'Nam' ? 'Nữ' : 'Nam';
  const currentGen = parseInt(form.generation) || 1;
  const spousePool = members.filter(m =>
    m.gender === oppositeGender &&                        // giới tính đối lập
    m.id !== editingMember?.id &&                         // không phải bản thân
    !descendantIds.has(m.id) &&                           // không phải con cháu
    !relatedIds.has(m.id) &&                              // không phải họ hàng gần (anh em, cô cậu ruột)
    m.generation === currentGen &&                        // cùng thế hệ
    (!m.spouseId || m.spouseId === editingMember?.id)     // chưa có spouse (hoặc đang là spouse hiện tại)
  );

  const inp="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#800000] focus:outline-none text-sm transition-colors";
  const lbl="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide";

  const tabs=[
    {id:'basic',label:'👤 Cơ bản'},
    {id:'dates',label:'📅 Ngày tháng'},
    {id:'places',label:'📍 Địa danh'},
    {id:'relations',label:'👨‍👩‍👧 Quan hệ'},
    {id:'bio',label:'📝 Tiểu sử'},
  ] as const;

  return(
    <div className="flex flex-col h-full" style={{background:"#101922"}}>

        {/* Header */}
        <div className=" text-white p-4 rounded-t-3xl sm:rounded-t-2xl flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="font-bold text-lg">{editingMember?'✏️ Sửa thông tin':'➕ Thêm thành viên'}</h3>
            <p className="text-xs text-[#FFD700] opacity-80">Gia Phả Dòng Họ Lê</p>
          </div>
          <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
            <X size={22}/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0 overflow-x-auto bg-gray-50">
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`px-3 py-3 text-xs font-bold whitespace-nowrap transition-all ${tab===t.id?'text-[#800000] border-b-2 border-[#800000] bg-white':'text-gray-400 hover:text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">

          {/* TAB: Cơ bản */}
          {tab==='basic'&&(
            <div className="space-y-4">
              {/* Upload ảnh */}
              <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden bg-white flex items-center justify-center">
                    {form.photoUrl
                      ?<img src={form.photoUrl} alt="avatar" className="w-full h-full object-cover"/>
                      :<User size={32} className="text-gray-300"/>}
                  </div>
                  {form.photoUrl&&(
                    <button type="button" onClick={()=>set('photoUrl','')}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      ×
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden"/>
                  <button type="button" onClick={()=>fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 bg-[#800000] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#600000] transition-colors disabled:opacity-50 w-full justify-center">
                    {uploading?<>⏳ {uploadProgress}</>:<><Camera size={16}/> Chọn ảnh đại diện</>}
                  </button>
                  {uploadProgress&&!uploading&&<p className="text-green-600 text-xs mt-1 font-semibold">{uploadProgress}</p>}
                  {uploadError&&<p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                  <p className="text-xs text-gray-400 mt-1">JPG/PNG · Tự động nén · Tối đa 10MB</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Họ và tên <span className="text-red-500">*</span></label>
                  <input className={inp} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Nguyễn Văn A" required/>
                </div>
                <div>
                  <label className={lbl}>Tên Húy</label>
                  <input className={inp} value={form.tenHuy} onChange={e=>set('tenHuy',e.target.value)} placeholder="Tên trong gia phả"/>
                </div>
                <div>
                  <label className={lbl}>Tự</label>
                  <input className={inp} value={form.tenTu} onChange={e=>set('tenTu',e.target.value)} placeholder="Tên chữ"/>
                </div>
                <div>
                  <label className={lbl}>Thụy</label>
                  <input className={inp} value={form.tenThuy} onChange={e=>set('tenThuy',e.target.value)} placeholder="Tên sau khi mất"/>
                </div>
                <div>
                  <label className={lbl}>Chức tước</label>
                  <input className={inp} value={form.chucTuoc} onChange={e=>set('chucTuoc',e.target.value)} placeholder="Chánh tổng, Hương lý..."/>
                </div>
                <div>
                  <label className={lbl}>Giới tính <span className="text-red-500">*</span></label>
                  <select className={inp} value={form.gender} onChange={e=>set('gender',e.target.value)}>
                    <option value="Nam">👨 Nam</option>
                    <option value="Nữ">👩 Nữ</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Đời thứ <span className="text-red-500">*</span></label>
                  <input
                    className={inp}
                    inputMode="numeric"
                    value={form.generation}
                    onChange={e=>{
                      const v=e.target.value.replace(/[^0-9]/g,'');
                      set('generation',v);
                    }}
                    placeholder="1"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Email nhận thông báo giỗ/sinh nhật</label>
                  <input type="email" className={inp} value={form.email} onChange={e=>set('email',e.target.value)} placeholder="email@gmail.com"/>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Ngày tháng */}
          {tab==='dates'&&(
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-blue-800 flex items-center gap-2">🎂 Ngày sinh</h4>
                <div>
                  <label className={lbl}>Ngày sinh dương lịch</label>
                  <input type="date" className={inp} value={form.birthDate}
                    onChange={e=>handleBirthDate(e.target.value)}/>
                </div>
                <div>
                  <label className={lbl}>Ngày sinh âm lịch <span className="text-blue-500 font-normal normal-case">(tự động tính)</span></label>
                  <input className={`${inp} bg-blue-50`} value={form.birthDateLunar}
                    onChange={e=>set('birthDateLunar',e.target.value)}
                    placeholder="Tự động khi chọn dương lịch, hoặc nhập tay"/>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-amber-800 flex items-center gap-2">🕯️ Ngày mất & Ngày giỗ</h4>
                <div>
                  <label className={lbl}>Ngày mất dương lịch</label>
                  <input type="date" className={inp} value={form.deathDate}
                    onChange={e=>handleDeathDate(e.target.value)}/>
                </div>
                <div>
                  <label className={lbl}>Ngày giỗ âm lịch ⭐ <span className="text-amber-600 font-normal normal-case">(tự động tính)</span></label>
                  <input className={`${inp} bg-amber-50`} value={form.deathDateLunar}
                    onChange={e=>set('deathDateLunar',e.target.value)}
                    placeholder="VD: 15/7 — dùng để nhắc giỗ hàng năm"/>
                </div>
                <p className="text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
                  ⚠️ Ngày giỗ âm lịch dùng để gửi thông báo nhắc nhở tự động
                </p>
              </div>
            </div>
          )}

          {/* TAB: Địa danh */}
          {tab==='places'&&(
            <div className="space-y-3">
              {[
                {label:'Nơi sinh',key:'birthPlace',ph:'Làng Đông Ngạc, Từ Liêm, Hà Nội'},
                {label:'Nơi cư trú',key:'residence',ph:'TP. Hồ Chí Minh'},
                {label:'Nơi mất',key:'deathPlace',ph:'Bệnh viện Chợ Rẫy...'},
              ].map(f=>(
                <div key={f.key}>
                  <label className={lbl}>{f.label}</label>
                  <input className={inp} value={(form as any)[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.ph}/>
                </div>
              ))}
              {/* YC3: Tách mộ phần thành 2 trường */}
              <div>
                <label className={lbl}>📍 Địa chỉ mộ phần</label>
                <input className={inp} value={form.burialAddress}
                  onChange={e=>set('burialAddress',e.target.value)}
                  placeholder="Nghĩa trang Bình Dương, khu A, lô 5"/>
              </div>
              <div>
                <label className={lbl}>🗺️ Link Google Maps (dán link từ app Maps)</label>
                <input className={inp} value={form.burialMapLink}
                  onChange={e=>set('burialMapLink',e.target.value)}
                  placeholder="https://maps.app.goo.gl/..." type="url"/>
                {form.burialMapLink && (
                  <a href={form.burialMapLink} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 underline mt-1 block">
                    ✅ Xem trước link Maps →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* TAB: Quan hệ */}
          {tab==='relations'&&(
            <div className="space-y-4">
              <div className="bg-yellow-50 rounded-xl p-3 text-xs text-yellow-800">
                💡 Chỉ hiện người ở đời phù hợp. Đảm bảo đã nhập đúng Đời thứ ở tab Cơ bản.
              </div>
              {[
                {label:`Người cha (Đời ${parseInt(form.generation)-1})`,key:'fatherId',pool:prevGen.filter(m=>m.gender==='Nam'),ph:'-- Cụ tổ / Không rõ --'},
                {label:`Người mẹ (Đời ${parseInt(form.generation)-1})`,key:'motherId',pool:prevGen.filter(m=>m.gender==='Nữ'),ph:'-- Không rõ --'},
              ].map(f=>(
                <div key={f.key}>
                  <label className={lbl}>{f.label}</label>
                  <select className={inp} value={(form as any)[f.key]} onChange={e=>set(f.key,e.target.value)}>
                    <option value="">{f.ph}</option>
                    {f.pool.map(m=>(
                      <option key={m.id} value={m.id}>{m.name}{m.tenHuy?` (Húy: ${m.tenHuy})`:''}</option>
                    ))}
                  </select>
                </div>
              ))}
              {/* YC4: Spouse thông minh - chỉ giới tính đối lập, không có con cháu */}
              <div>
                <label className={lbl}>
                  {form.gender==='Nam' ? '💑 Vợ' : '💑 Chồng'}
                  <span className="font-normal text-gray-400 ml-1">
                    (Đời {currentGen} · {oppositeGender} · {spousePool.length} người)
                  </span>
                </label>
                <select className={inp} value={form.spouseId} onChange={e=>set('spouseId',e.target.value)}>
                  <option value="">-- Chưa có --</option>
                  {spousePool.map(m=>(
                    <option key={m.id} value={m.id}>
                      {m.name}{m.tenHuy?` (Húy: ${m.tenHuy})`:''} · Đời {m.generation}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB: Tiểu sử */}
          {tab==='bio'&&(
            <div>
              <label className={lbl}>Tiểu sử / Công trạng / Ghi chú</label>
              <textarea
                className={`${inp} min-h-[220px] resize-none`}
                value={form.biography}
                onChange={e=>set('biography',e.target.value)}
                placeholder="Ghi lại cuộc đời, sự nghiệp, đóng góp cho dòng họ và xã hội của người này..."/>
              <p className="text-xs text-gray-400 mt-1">{form.biography.length} ký tự</p>
            </div>
          )}

          </div>

          {/* Buttons */}
          <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50">
            <button type="submit"
              className="flex-1 bg-[#B8860B] text-white py-3 rounded-xl font-bold hover:bg-[#996B08] transition-colors flex items-center justify-center gap-2 shadow-md">
              <Save size={18}/> Lưu thông tin
            </button>
            {editingMember&&onDelete&&isAdmin&&(
              <button type="button" onClick={()=>onDelete(editingMember.id)}
                className="bg-red-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-1">
                <Trash2 size={18}/>
              </button>
            )}
          </div>
        </form>
    </div>
  );
}
