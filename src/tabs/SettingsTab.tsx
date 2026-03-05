import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LogIn, LogOut, BarChart2, Flame,
  ChevronRight, Download, Upload, FileSpreadsheet,
  Map, FileText, Share2, Eye, EyeOff, GitMerge,
} from 'lucide-react';
import { downloadGedcom, importFromGedcom } from '../utils/gedcom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Member } from '../types';
import { exportToExcel, importFromExcel } from '../utils/excelIO';
import { exportToPDF } from '../utils/pdfExport';

interface Props {
  darkMode?:       boolean;
  user:            { email: string | null } | null;
  isAdmin:         boolean;     // chỉ Super Admin
  isSuperAdmin?:   boolean;
  canEdit?:        boolean;     // Super Admin + Editor
  members:         Member[];
  onShowStats:     () => void;
  onShowMemorial:  () => void;
  onShowGraveMap:  () => void;
  onImportMembers: (data: Partial<Member>[]) => Promise<void>;
  adminEmails:     string[];
}

export default function SettingsTab({
  user, isAdmin, isSuperAdmin = false, canEdit = false,
  members, onShowStats, onShowMemorial, onShowGraveMap,
  onImportMembers, adminEmails, darkMode,
}: Props) {

  // ── Design tokens — dark/light đồng bộ hoàn toàn ─────────────────────────
  const bg        = darkMode ? '#111214' : '#f8fafc';
  const cardBg    = darkMode ? '#1d1f21' : '#ffffff';
  const headerBg  = darkMode ? '#1d1f21' : '#ffffff';
  const textMain  = darkMode ? '#f5f5f5' : '#0b0b0b';
  const textSub   = darkMode ? '#6B7E96' : '#3d3d3d';
  const border    = darkMode ? '#2d3748' : '#e2e8f0';
  const divider   = darkMode ? '#1d1f21' : '#F0E8DC';
  const inputBg   = darkMode ? '#0f1a28' : '#F0EBE1';
  const inputBorder = darkMode ? '#2d3748' : '#D8CCBB';
  const secLabel  = darkMode ? '#4a6080' : '#9C8E82';
  const hoverBg   = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  // ── State ─────────────────────────────────────────────────────────────────
  const [email, setEmail]           = useState('');
  const [pw, setPw]                 = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [msg, setMsg]               = useState<{ text: string; ok: boolean } | null>(null);
  const [pdfProgress, setPdfProgress] = useState('');
  const excelImportRef = useRef<HTMLInputElement>(null);
  const gedcomImportRef = useRef<HTMLInputElement>(null);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !pw) return;
    setLoginLoading(true); setLoginError('');
    try {
      const r = await signInWithEmailAndPassword(auth, email, pw);
      if (!adminEmails.includes(r.user.email ?? '')) {
        await signOut(auth);
        setLoginError('Tài khoản không có quyền quản trị.');
      }
    } catch {
      setLoginError('Email hoặc mật khẩu không đúng.');
    }
    setLoginLoading(false);
  };

  // ── Excel ─────────────────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    try { await exportToExcel(members); showMsg('✅ Đã xuất Excel thành công!'); }
    catch (e: any) { showMsg('❌ Lỗi xuất Excel: ' + e.message, false); }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const data = await importFromExcel(file);
      if (!data.length) throw new Error('File không có dữ liệu hợp lệ');
      const ok = window.confirm(`Tìm thấy ${data.length} thành viên.\nHệ thống sẽ CẬP NHẬT trùng ID và THÊM MỚI chưa có.\nTiếp tục?`);
      if (!ok) return;
      await onImportMembers(data);
      showMsg(`✅ Đã nhập ${data.length} thành viên!`);
    } catch (e: any) { showMsg('❌ Lỗi nhập Excel: ' + e.message, false); }
    finally { if (excelImportRef.current) excelImportRef.current.value = ''; }
  };

  // ── PDF ───────────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    try {
      await exportToPDF(members, msg => setPdfProgress(msg));
      setTimeout(() => setPdfProgress(''), 3000);
    } catch (e: any) {
      setPdfProgress('');
      showMsg('❌ Lỗi xuất PDF: ' + e.message, false);
    }
  };

  // ── GEDCOM Export ─────────────────────────────────────────────────────────
  const handleExportGedcom = () => {
    try { downloadGedcom(members); showMsg('✅ Đã xuất GEDCOM!'); }
    catch (e: any) { showMsg('❌ Lỗi GEDCOM: ' + e.message, false); }
  };

  // ── GEDCOM Import (mới) ───────────────────────────────────────────────────
  const handleImportGedcom = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      // importFromGedcom cần được implement trong utils/gedcom.ts
      const data = await importFromGedcom(file);
      if (!data.length) throw new Error('File GEDCOM không có dữ liệu');
      const ok = window.confirm(`Tìm thấy ${data.length} thành viên từ GEDCOM.\nHệ thống sẽ THÊM MỚI toàn bộ.\nTiếp tục?`);
      if (!ok) return;
      await onImportMembers(data);
      showMsg(`✅ Đã nhập ${data.length} thành viên từ GEDCOM!`);
    } catch (e: any) { showMsg('❌ Lỗi nhập GEDCOM: ' + e.message, false); }
    finally { if (gedcomImportRef.current) gedcomImportRef.current.value = ''; }
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const alive     = members.filter(m => !m.deathDate).length;
  const withGrave = members.filter(m => m.deathDate && m.burialPlace).length;

  // ── Sub-components ────────────────────────────────────────────────────────
  const SectionLabel = ({ children }: { children: string }) => (
    <p className="text-xs font-bold uppercase px-4 mb-2 tracking-widest"
      style={{ color: secLabel, fontFamily: "'Roboto', sans-serif" }}>
      {children}
    </p>
  );

  const MenuItem = ({
    icon, label, sub, onClick, disabled, lockNote,
  }: {
    icon: React.ReactNode; label: string; sub?: string;
    onClick?: () => void; disabled?: boolean; lockNote?: string;
  }) => (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={disabled ? undefined : onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
      style={{
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: 'transparent',
      }}
      onMouseEnter={e => !disabled && ((e.currentTarget as HTMLElement).style.background = hoverBg)}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: darkMode ? '#1a2e20' : '#FFF0F0' }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold"
          style={{ color: textMain, fontFamily: "'Roboto', sans-serif" }}>
          {label}
        </div>
        {(sub || lockNote) && (
          <div className="text-xs mt-0.5 truncate"
            style={{ color: disabled ? '#F59E0B' : textSub }}>
            {disabled ? `🔒 ${lockNote}` : sub}
          </div>
        )}
      </div>
      {!disabled && <ChevronRight size={14} style={{ color: darkMode ? '#3a5570' : '#C8BEB4', flexShrink: 0 }} />}
    </motion.button>
  );

  const Divider = () => <div style={{ height: 1, background: divider, marginLeft: 56 }} />;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-y-auto"
      style={{ background: bg, fontFamily: "'Roboto', sans-serif" }}>

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-5 pb-3 border-b"
        style={{ background: headerBg, borderColor: border }}>
        <h2 className="text-lg font-bold"
          style={{ color: textMain, fontFamily: "'Roboto', sans-serif" }}>
          Quản Trị & Cài Đặt
        </h2>
        <p className="text-xs mt-0.5" style={{ color: textSub }}>
          Xuất dữ liệu, sao lưu và quản lý gia phả
        </p>
      </div>

      <div className="py-4 space-y-5 pb-8">

        {/* ── THỐNG KÊ NHANH ── */}
        <div className="px-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Thành viên', value: members.length, color: '#CC0000' },
            { label: 'Còn sống',   value: alive,          color: '#16A34A' },
            { label: 'Mộ phần',    value: withGrave,      color: '#7A5A00' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center"
              style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: '0 2px 8px rgba(28,20,16,0.06)' }}>
              <div className="text-2xl font-black" style={{ color: s.color, fontFamily: "'Roboto', sans-serif" }}>
                {s.value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: textSub }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── TOAST ── */}
        <AnimatePresence>
          {(msg || pdfProgress) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mx-4 px-4 py-3 rounded-2xl text-sm font-semibold"
              style={msg?.ok === false
                ? { background: darkMode ? '#2a1010' : '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }
                : { background: darkMode ? '#0f2a1a' : '#F0FDF4', color: '#16A34A', border: '1px solid #86EFAC' }}>
              {pdfProgress || msg?.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CÔNG CỤ ── */}
        <div>
          <SectionLabel>Công Cụ</SectionLabel>
          <div className="mx-4 rounded-2xl overflow-hidden"
            style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: '0 2px 10px rgba(28,20,16,0.06)' }}>
            <MenuItem icon={<BarChart2 size={18} color="#CC0000" />} label="Thống kê dòng họ" sub="Biểu đồ theo đời, nam/nữ" onClick={onShowStats} />
            <Divider />
            <MenuItem icon={<Flame size={18} color="#CC0000" />} label="Trang tưởng nhớ" sub="Tưởng nhớ người đã mất" onClick={onShowMemorial} />
            <Divider />
            <MenuItem icon={<Map size={18} color="#CC0000" />} label="Bản đồ mộ phần" sub={`${withGrave} mộ có địa chỉ · Chỉ đường Google Maps`} onClick={onShowGraveMap} />
          </div>
        </div>

        {/* ── XUẤT / NHẬP DỮ LIỆU ── */}
        <div>
          <SectionLabel>Xuất / Nhập Dữ Liệu</SectionLabel>
          <div className="mx-4 rounded-2xl overflow-hidden"
            style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: '0 2px 10px rgba(28,20,16,0.06)' }}>

            {/* Xuất Excel */}
            <MenuItem icon={<FileSpreadsheet size={18} color={isSuperAdmin ? '#16A34A' : '#9CA3AF'} />}
              label="Xuất Excel (Sao lưu)" sub="Tất cả dữ liệu · Có thể sửa và nhập lại"
              onClick={handleExportExcel} disabled={!isSuperAdmin} lockNote="Chỉ dành cho Super Admin" />
            <Divider />

            {/* Nhập Excel — chỉ SuperAdmin */}
            {isSuperAdmin && (
              <>
                <input ref={excelImportRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
                <MenuItem icon={<Upload size={18} color="#2563EB" />}
                  label="Nhập Excel" sub="Cập nhật / thêm từ file đã sửa"
                  onClick={() => excelImportRef.current?.click()} />
                <Divider />
              </>
            )}

            {/* Xuất PDF */}
            <MenuItem icon={<FileText size={18} color={isSuperAdmin ? '#CC0000' : '#9CA3AF'} />}
              label={pdfProgress || 'Xuất PDF in ấn'} sub="Phả đồ khổ lớn · Thiết kế đẹp để in"
              onClick={handleExportPDF} disabled={!isSuperAdmin} lockNote="Chỉ dành cho Super Admin" />
            <Divider />

            {/* Xuất GEDCOM */}
            <MenuItem icon={<Download size={18} color={isSuperAdmin ? '#6B21A8' : '#9CA3AF'} />}
              label="Xuất GEDCOM" sub="Chuẩn quốc tế · Ancestry, MyHeritage…"
              onClick={handleExportGedcom} disabled={!isSuperAdmin} lockNote="Chỉ dành cho Super Admin" />
            <Divider />

            {/* Nhập GEDCOM — MỚI */}
            {isSuperAdmin && (
              <>
                <input ref={gedcomImportRef} type="file" accept=".ged,.gedcom" onChange={handleImportGedcom} className="hidden" />
                <MenuItem icon={<GitMerge size={18} color="#6B21A8" />}
                  label="Nhập GEDCOM" sub="Import từ Ancestry, MyHeritage, Gramps…"
                  onClick={() => gedcomImportRef.current?.click()} />
              </>
            )}
          </div>
        </div>

        {/* ── QUẢN TRỊ VIÊN ── */}
        <div>
          <SectionLabel>Quản Trị Viên</SectionLabel>
          <div className="mx-4">

            {/* ĐÃ ĐĂNG NHẬP (canEdit = true: cả admin lẫn editor đều hiện) */}
            {canEdit ? (
              <div className="rounded-2xl overflow-hidden"
                style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: '0 2px 10px rgba(28,20,16,0.06)' }}>

                {/* Info */}
                <div className="px-4 py-4 flex items-center gap-3"
                  style={{ borderBottom: `1px solid ${divider}` }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isSuperAdmin ? (darkMode ? '#0f2a1a' : '#dcfce7') : (darkMode ? '#1a1c1e' : '#dbeafe') }}>
                    <Shield size={20} style={{ color: isSuperAdmin ? '#16a34a' : '#2563eb' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold"
                      style={{ color: isSuperAdmin ? '#16a34a' : '#2563eb', fontFamily: "'Roboto', sans-serif" }}>
                      {isSuperAdmin ? '⭐ Super Admin' : '✏️ Biên tập viên'}
                    </div>
                    <div className="text-xs truncate mt-0.5" style={{ color: textSub }}>
                      {user?.email}
                    </div>
                    {!isSuperAdmin && (
                      <div className="text-xs mt-1 px-2 py-0.5 rounded-lg inline-block"
                        style={{ background: darkMode ? '#1a2010' : '#FFFBEB', color: '#B45309', fontWeight: 600 }}>
                        Có thể thêm/sửa thành viên · Không xuất dữ liệu
                      </div>
                    )}
                  </div>
                </div>

                {/* Đăng xuất */}
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => signOut(auth)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors"
                  style={{ color: '#DC2626' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = darkMode ? '#2a1010' : '#FEF2F2')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  <LogOut size={18} />
                  <span className="font-semibold text-sm" style={{ fontFamily: "'Roboto', sans-serif" }}>
                    Đăng xuất
                  </span>
                </motion.button>
              </div>

            ) : (
              /* FORM ĐĂNG NHẬP */
              <div className="rounded-2xl p-5"
                style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: '0 2px 10px rgba(28,20,16,0.06)' }}>
                <div className="flex items-center gap-2 mb-5">
                  <Shield size={20} style={{ color: '#CC0000' }} />
                  <h3 className="font-bold text-base"
                    style={{ color: textMain, fontFamily: "'Roboto', sans-serif" }}>
                    Đăng nhập Quản trị
                  </h3>
                </div>

                <div className="space-y-3">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
                      style={{ color: textSub }}>
                      Email
                    </label>
                    <input
                      type="email" value={email}
                      onChange={e => { setEmail(e.target.value); setLoginError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{
                        background: inputBg, color: textMain,
                        border: `1.5px solid ${inputBorder}`,
                        fontFamily: "'Roboto', sans-serif",
                        fontSize: 15,   // to hơn cho người già dễ nhìn
                      }}
                      placeholder="admin@example.com"
                      autoComplete="email"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
                      style={{ color: textSub }}>
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'} value={pw}
                        onChange={e => { setPw(e.target.value); setLoginError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        className="w-full px-4 py-3 pr-12 rounded-xl text-sm focus:outline-none"
                        style={{
                          background: inputBg, color: textMain,
                          border: `1.5px solid ${inputBorder}`,
                          fontFamily: "'Roboto', sans-serif",
                          fontSize: 15,
                        }}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                        style={{ color: textSub }}>
                        {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {loginError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm px-3 py-2.5 rounded-xl font-medium overflow-hidden"
                        style={{ background: darkMode ? '#2a1010' : '#FEF2F2', color: '#DC2626' }}>
                        ❌ {loginError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Nút đăng nhập — to hơn cho người già */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLogin}
                    disabled={loginLoading || !email || !pw}
                    className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                    style={{
                      background: 'linear-gradient(135deg, #CC0000, #990000)',
                      fontSize: 15,
                      fontFamily: "'Roboto', sans-serif",
                      boxShadow: '0 4px 14px rgba(128,0,0,0.3)',
                    }}>
                    <LogIn size={18} />
                    {loginLoading ? 'Đang xác thực…' : 'Đăng nhập'}
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="mx-4 rounded-2xl overflow-hidden"
          style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: '0 2px 10px rgba(28,20,16,0.06)' }}>

          {/* Logo + App name */}
          <div className="px-5 pt-5 pb-4 flex items-center gap-4"
            style={{ borderBottom: `1px solid ${divider}` }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
              style={{ background: 'linear-gradient(135deg, #CC0000 0%, #880000 60%, #B8860B 100%)' }}>
              <span className="text-white text-2xl font-black"
                style={{ fontFamily: "'Roboto', sans-serif" }}>Lê</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-base"
                style={{ color: textMain, fontFamily: "'Roboto', sans-serif" }}>
                Gia Phả Dòng Họ Lê
              </p>
              <p className="text-[11px] font-bold mt-0.5" style={{ color: '#CC0000' }}>
                v18 — Phiên bản thử nghiệm
              </p>
              <p className="text-[10px] mt-1" style={{ color: textSub }}>
                Firebase · Cloudinary · Cloudflare Pages
              </p>
            </div>
          </div>

          {/* Chia sẻ */}
          <div className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${divider}` }}>
            <div>
              <p className="text-xs font-bold" style={{ color: textMain }}>Truy cập & Chia sẻ</p>
              <p className="text-[11px] mt-0.5" style={{ color: textSub }}>legia-2026.pages.dev</p>
            </div>
            <button
              onClick={() => {
                const url = 'https://legia-2026.pages.dev';
                if (navigator.share) navigator.share({ title: 'Gia Phả Dòng Họ Lê', url });
                else navigator.clipboard.writeText(url).then(() => showMsg('✅ Đã sao chép link!'));
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: '#CC0000', fontFamily: "'Roboto', sans-serif" }}>
              <Share2 size={13} /> Chia sẻ
            </button>
          </div>

          {/* Liên hệ */}
          <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${divider}` }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: textSub }}>
              Nhà Phát Triển
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #0068FF, #0044CC)' }}>LT</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: textMain }}>Lê Tỉnh</p>
                <p className="text-[11px]" style={{ color: textSub }}>Muốn bổ sung thông tin? Liên hệ ngay</p>
              </div>
              <a href="https://zalo.me/0708312789" target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: '#0068FF', fontFamily: "'Roboto', sans-serif" }}>
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
          </div>
        </div>
      </div>
    </div>
  );
}
