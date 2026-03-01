import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, LogIn, LogOut, BarChart2, Flame, ChevronRight, Info, Download, Upload, FileSpreadsheet, Map, FileText, Share2 } from 'lucide-react';
import { downloadGedcom } from '../utils/gedcom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Member } from '../types';
import { exportToExcel, importFromExcel } from '../utils/excelIO';
import { exportToPDF } from '../utils/pdfExport';

interface Props {
  darkMode?: boolean;
  user: { email: string | null } | null;
  isAdmin: boolean;
  members: Member[];
  onShowStats: () => void;
  onShowMemorial: () => void;
  onShowGraveMap: () => void;
  onImportMembers: (data: Partial<Member>[]) => Promise<void>;
  adminEmails: string[];
}

export default function SettingsTab({ user, isAdmin, members, onShowStats, onShowMemorial, onShowGraveMap, onImportMembers, adminEmails, darkMode }: Props) {
  const bg       = darkMode ? '#0f1724' : '#F3F4F6';
  const cardBg   = darkMode ? '#1e2a3a' : 'white';
  const textMain = darkMode ? '#f1f5f9' : '#111827';
  const textSub  = darkMode ? '#64748b' : '#6B7280';
  const border   = darkMode ? '#2d3d52' : '#F3F4F6';
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [pdfProgress, setPdfProgress] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const r = await signInWithEmailAndPassword(auth, email, pw);
      if (!adminEmails.includes(r.user.email || '')) {
        await signOut(auth);
        setError('Tài khoản này không có quyền quản trị');
      } else { setSuccess('Đăng nhập thành công!'); setTimeout(() => setSuccess(''), 3000); }
    } catch { setError('Email hoặc mật khẩu không đúng'); }
    setLoading(false);
  };

  const handleExportExcel = async () => {
    try {
      await exportToExcel(members);
      setSuccess('✅ Đã xuất Excel thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) { setError('Lỗi xuất Excel: ' + e.message); }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const data = await importFromExcel(file);
      if (data.length === 0) throw new Error('File không có dữ liệu hợp lệ');
      const confirm = window.confirm(
        `Tìm thấy ${data.length} thành viên trong file.\n\nLưu ý: Hệ thống sẽ CẬP NHẬT thành viên có ID trùng và THÊM MỚI thành viên chưa có.\nDữ liệu cũ KHÔNG bị xóa.\n\nTiếp tục?`
      );
      if (!confirm) return;
      await onImportMembers(data);
      setSuccess(`✅ Đã nhập ${data.length} thành viên thành công!`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError('Lỗi nhập Excel: ' + e.message);
    } finally {
      setLoading(false);
      if (importRef.current) importRef.current.value = '';
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF(members, msg => setPdfProgress(msg));
      setTimeout(() => setPdfProgress(''), 3000);
    } catch (e: any) {
      setPdfProgress('');
      setError('Lỗi xuất PDF: ' + e.message);
    }
  };

  const alive = members.filter(m => !m.deathDate).length;
  const maxGen = Math.max(...members.map(m => m.generation), 0);
  const withGrave = members.filter(m => m.deathDate && m.burialPlace).length;

  const MenuItem = ({ icon, label, sub, onClick, color = '#800000' }: {
    icon: React.ReactNode; label: string; sub?: string; onClick: () => void; color?: string;
  }) => (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FFF0F0' }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800">{label}</div>
        {sub && <div className="text-xs text-gray-400 truncate">{sub}</div>}
      </div>
      <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
    </motion.button>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: bg }}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 bg-white border-b border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Quản Trị & Cài Đặt</h2>
        <p className="text-xs text-gray-400">Xuất dữ liệu, sao lưu, và quản lý gia phả</p>
      </div>

      <div className="py-4 space-y-4">
        {/* Thống kê nhanh */}
        <div className="px-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Thành viên', value: members.length, color: '#800000' },
            { label: 'Còn sống', value: alive, color: '#16A34A' },
            { label: 'Mộ phần', value: withGrave, color: '#B8860B' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 text-center shadow-sm">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toast */}
        {(success || pdfProgress || error) && (
          <div className={`mx-4 px-4 py-3 rounded-2xl text-sm font-semibold ${
            error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {error || pdfProgress || success}
          </div>
        )}

        {/* Công cụ */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase px-4 mb-2 tracking-wider">Công Cụ</p>
          <div className="bg-white rounded-2xl mx-4 overflow-hidden shadow-sm divide-y divide-gray-50">
            <MenuItem icon={<BarChart2 size={18} color="#800000" />} label="Thống kê dòng họ" sub="Biểu đồ theo đời, nam/nữ" onClick={onShowStats} />
            <MenuItem icon={<Flame size={18} color="#800000" />} label="Trang tưởng nhớ" sub="Tưởng nhớ người đã mất" onClick={onShowMemorial} />
            <MenuItem icon={<Map size={18} color="#800000" />} label="Bản đồ mộ phần" sub={`${withGrave} mộ có địa chỉ · Chỉ đường Google Maps`} onClick={onShowGraveMap} />
          </div>
        </div>

        {/* Xuất / Nhập dữ liệu */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase px-4 mb-2 tracking-wider">Xuất / Nhập Dữ Liệu</p>
          {/* YC7: Cảnh báo nếu chưa đăng nhập */}
          {!isAdmin && (
            <div className="mx-4 mb-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2">
              <span className="text-lg flex-shrink-0">🔒</span>
              <p className="text-xs text-amber-700 font-semibold">
                Xuất PDF, Excel và GEDCOM chỉ dành cho Quản trị viên.
                Vui lòng đăng nhập bên dưới để mở khoá.
              </p>
            </div>
          )}
          <div className="bg-white rounded-2xl mx-4 overflow-hidden shadow-sm divide-y divide-gray-50">

            {/* Xuất Excel — YC7: chỉ admin */}
            <div className={!isAdmin ? 'opacity-40 pointer-events-none select-none' : ''}>
              <MenuItem
                icon={<FileSpreadsheet size={18} color={isAdmin ? '#16A34A' : '#9CA3AF'} />}
                label={`Xuất Excel (Sao lưu)${!isAdmin ? ' 🔒' : ''}`}
                sub={isAdmin ? 'Tất cả dữ liệu · Có thể sửa và nhập lại' : 'Yêu cầu đăng nhập Admin'}
                onClick={handleExportExcel}
              />
            </div>

            {/* Nhập Excel — YC7: chỉ admin */}
            {isAdmin && (
              <>
                <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
                <MenuItem
                  icon={<Upload size={18} color="#2563EB" />}
                  label="Nhập Excel"
                  sub="Cập nhật / thêm từ file đã sửa"
                  onClick={() => importRef.current?.click()}
                />
              </>
            )}

            {/* Xuất PDF — YC7: chỉ admin */}
            <div className={!isAdmin ? 'opacity-40 pointer-events-none select-none' : ''}>
              <MenuItem
                icon={<FileText size={18} color={isAdmin ? '#800000' : '#9CA3AF'} />}
                label={`${pdfProgress || `Xuất PDF in ấn${!isAdmin ? ' 🔒' : ''}`}`}
                sub={isAdmin ? 'Phả đồ khổ lớn · In họp dòng họ' : 'Yêu cầu đăng nhập Admin'}
                onClick={handleExportPDF}
              />
            </div>

            {/* Xuất GEDCOM — chỉ admin, mờ nếu chưa đăng nhập */}
            <div className={!isAdmin ? 'opacity-40 pointer-events-none select-none' : ''}>
              <MenuItem
                icon={<Download size={18} color={isAdmin ? '#6B21A8' : '#9CA3AF'} />}
                label={`Sao lưu GEDCOM${!isAdmin ? ' 🔒' : ''}`}
                sub={isAdmin ? 'Chuẩn quốc tế · Dùng cho Ancestry, MyHeritage…' : 'Yêu cầu đăng nhập Admin'}
                onClick={isAdmin ? () => downloadGedcom(members) : undefined}
              />
            </div>
          </div>
        </div>

        {/* Admin login / logout */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase px-4 mb-2 tracking-wider">Quản Trị Viên</p>
          <div className="mx-4">
            {isAdmin ? (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-50">
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                    <Shield size={18} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-green-700">✅ Đang là Quản trị viên</div>
                    <div className="text-xs text-gray-400">{user?.email}</div>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => signOut(auth)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={18} /><span className="font-semibold text-sm">Đăng xuất</span>
                </motion.button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={18} style={{ color: '#800000' }} />
                  <h3 className="font-bold text-gray-800">Đăng nhập Quản trị</h3>
                </div>
                {success && <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-xl mb-3 font-semibold">{success}</div>}
                <form onSubmit={handleLogin} className="space-y-3">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-opacity-20"
                    placeholder="Email quản trị" required />
                  <input type="password" value={pw} onChange={e => setPw(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-opacity-20"
                    placeholder="Mật khẩu" required />
                  {error && <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-xl">❌ {error}</p>}
                  <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
                    className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #800000, #6B0000)' }}>
                    <LogIn size={16} />{loading ? 'Đang xác thực...' : 'Đăng nhập'}
                  </motion.button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer card gom tất cả ── */}
        <div className="mx-4 rounded-2xl shadow-sm overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>

          {/* Logo + App name */}
          <div className="px-5 pt-5 pb-4 flex items-center gap-4 border-b" style={{ borderColor: border }}>
            {/* Logo ô vuông đỏ */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
              style={{ background: 'linear-gradient(135deg, #800000 0%, #4a0000 60%, #B8860B 100%)' }}>
              <span className="text-white text-2xl font-black" style={{ fontFamily: 'serif', letterSpacing: -1 }}>Lê</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-base" style={{ color: textMain }}>Gia Phả Dòng Họ Lê</p>
              <p className="text-[11px] font-bold mt-0.5" style={{ color: '#800000' }}>v16 — Phiên bản chính thức</p>
              <p className="text-[10px] mt-1 leading-relaxed" style={{ color: textSub }}>
                Firebase · Cloudinary · Cloudflare Pages · GitHub
              </p>
            </div>
          </div>

          {/* Link chia sẻ */}
          <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: border }}>
            <div>
              <p className="text-xs font-bold" style={{ color: textMain }}>Truy cập & Chia sẻ</p>
              <p className="text-[11px] mt-0.5" style={{ color: textSub }}>legia-2026.pages.dev</p>
            </div>
            <button
              onClick={() => {
                const url = 'https://legia-2026.pages.dev';
                if (navigator.share) {
                  navigator.share({ title: 'Gia Phả Dòng Họ Lê', url });
                } else {
                  navigator.clipboard.writeText(url).then(() => alert('Đã sao chép link!'));
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: '#800000' }}
            >
              <Share2 size={13}/> Chia sẻ
            </button>
          </div>



          {/* Nhà phát triển */}
          <div className="px-5 py-3.5 border-b" style={{ borderColor: border }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: textSub }}>
              Nhà Phát Triển
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #0068FF, #0044CC)' }}>
                LT
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: textMain }}>Lê Tỉnh</p>
                <p className="text-[11px]" style={{ color: textSub }}>Muốn bổ sung thông tin dòng họ? Liên hệ ngay</p>
              </div>
              <a href="https://zalo.me/0708312789" target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
                style={{ background: '#0068FF' }}>
                <span>💬</span> Zalo
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="px-5 py-3 text-center">
            <p className="text-[11px]" style={{ color: textSub }}>
              © {new Date().getFullYear()} Bản quyền thuộc về{' '}
              <span className="font-semibold" style={{ color: textMain }}>Dòng Họ Lê</span>
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: textSub }}>
              Dữ liệu được bảo vệ và lưu trữ an toàn trên Firebase
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
