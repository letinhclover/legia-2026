import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LogIn, LogOut, BarChart2, Flame,
  ChevronRight, Download, Upload, FileSpreadsheet,
  Map, FileText, Share2, Eye, EyeOff,
} from 'lucide-react';
import { downloadGedcom } from '../utils/gedcom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Member } from '../types';
import { exportToExcel, importFromExcel } from '../utils/excelIO';
import { exportToPDF } from '../utils/pdfExport';

interface Props {
  darkMode?:         boolean;
  user:              { email: string | null } | null;
  isAdmin:           boolean;
  isSuperAdmin?:     boolean;
  members:           Member[];
  onShowStats:       () => void;
  onShowMemorial:    () => void;
  onShowGraveMap:    () => void;
  onImportMembers:   (data: Partial<Member>[]) => Promise<void>;
  adminEmails:       string[];
}

export default function SettingsTab({
  user, isAdmin, isSuperAdmin = false, members,
  onShowStats, onShowMemorial, onShowGraveMap,
  onImportMembers, adminEmails, darkMode,
}: Props) {

  // ── Theme tokens ────────────────────────────────────────────────────────────
  const bg       = darkMode ? '#0f1724'  : '#F5F0E8';
  const cardBg   = darkMode ? '#1a2535'  : '#FFFDF7';
  const textMain = darkMode ? '#E8DDD0'  : '#1C1410';
  const textSub  = darkMode ? '#6B7E96'  : '#6B5E52';
  const border   = darkMode ? '#2d3d52'  : '#E2D8CA';
  const divider  = darkMode ? '#253040'  : '#F0E8DC';
  const inputBg  = darkMode ? '#111c2a'  : '#F0EBE1';
  const sectionLabel = darkMode ? '#5A7090' : '#9C8E82';

  // ── State ───────────────────────────────────────────────────────────────────
  const [email, setEmail]           = useState('');
  const [pw, setPw]                 = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState('');
  const [pdfProgress, setPdfProgress] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const r = await signInWithEmailAndPassword(auth, email, pw);
      if (!adminEmails.includes(r.user.email || '')) {
        await signOut(auth);
        setError('Tài khoản này không có quyền quản trị.');
      } else {
        setSuccess('Đăng nhập thành công!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Email hoặc mật khẩu không đúng.');
    }
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
      const ok = window.confirm(
        `Tìm thấy ${data.length} thành viên.\n\nHệ thống sẽ CẬP NHẬT thành viên có ID trùng và THÊM MỚI thành viên chưa có. Dữ liệu cũ KHÔNG bị xóa.\n\nTiếp tục?`
      );
      if (!ok) return;
      await onImportMembers(data);
      setSuccess(`✅ Đã nhập ${data.length} thành viên!`);
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

  // ── Computed ────────────────────────────────────────────────────────────────
  const alive    = members.filter(m => !m.deathDate).length;
  const maxGen   = Math.max(...members.map(m => m.generation), 0);
  const withGrave = members.filter(m => m.deathDate && m.burialPlace).length;

  // ── Sub-components ──────────────────────────────────────────────────────────
  const SectionLabel = ({ children }: { children: string }) => (
    <p
      className="text-xs font-bold uppercase px-4 mb-2 tracking-widest"
      style={{ color: sectionLabel, fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      {children}
    </p>
  );

  interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    sub?: string;
    onClick?: () => void;
    disabled?: boolean;
    lockReason?: string;
  }

  const MenuItem = ({ icon, label, sub, onClick, disabled, lockReason }: MenuItemProps) => (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={disabled ? undefined : onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
      style={{
        opacity: disabled ? 0.38 : 1,
        cursor:  disabled ? 'default' : 'pointer',
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: darkMode ? '#1e3a2a' : '#FFF0F0' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-semibold"
          style={{ color: textMain, fontFamily: "'Be Vietnam Pro', sans-serif" }}
        >
          {label}
        </div>
        {(sub || lockReason) && (
          <div
            className="text-xs truncate mt-0.5"
            style={{ color: disabled ? '#F59E0B' : textSub, fontFamily: "'Be Vietnam Pro', sans-serif" }}
          >
            {disabled ? `🔒 ${lockReason}` : sub}
          </div>
        )}
      </div>
      {!disabled && <ChevronRight size={15} style={{ color: darkMode ? '#3d5a70' : '#C8BEB4', flexShrink: 0 }} />}
    </motion.button>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ background: bg, fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >

      {/* ── HEADER ── */}
      <div
        className="flex-shrink-0 px-4 pt-4 pb-3 border-b"
        style={{ background: cardBg, borderColor: border }}
      >
        <h2
          className="text-lg font-bold"
          style={{ color: textMain, fontFamily: "'Merriweather', serif" }}
        >
          Quản Trị & Cài Đặt
        </h2>
        <p className="text-xs mt-0.5" style={{ color: textSub }}>
          Xuất dữ liệu, sao lưu và quản lý gia phả
        </p>
      </div>

      <div className="py-4 space-y-5">

        {/* ── THỐNG KÊ NHANH ── */}
        <div className="px-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Thành viên', value: members.length, color: '#800000' },
            { label: 'Còn sống',   value: alive,          color: '#16A34A' },
            { label: 'Mộ phần',    value: withGrave,      color: '#B8860B' },
          ].map(s => (
            <motion.div
              key={s.label}
              whileTap={{ scale: 0.96 }}
              className="rounded-2xl p-3 text-center"
              style={{
                background: cardBg,
                border: `1px solid ${border}`,
                boxShadow: '0 2px 8px rgba(28,20,16,0.07)',
              }}
            >
              <div className="text-2xl font-black" style={{ color: s.color, fontFamily: "'Merriweather', serif" }}>
                {s.value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: textSub }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── TOAST / ALERT ── */}
        <AnimatePresence>
          {(success || pdfProgress || error) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mx-4 px-4 py-3 rounded-2xl text-sm font-semibold"
              style={
                error
                  ? { background: darkMode ? '#2a1010' : '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }
                  : { background: darkMode ? '#0f2a1a' : '#F0FDF4', color: '#16A34A', border: '1px solid #86EFAC' }
              }
            >
              {error || pdfProgress || success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CÔNG CỤ ── */}
        <div>
          <SectionLabel>Công Cụ</SectionLabel>
          <div
            className="mx-4 rounded-2xl overflow-hidden"
            style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: '0 2px 10px rgba(28,20,16,0.06)' }}
          >
            {[
              {
                icon: <BarChart2 size={18} color="#800000" />,
                label: 'Thống kê dòng họ',
                sub: 'Biểu đồ theo đời, nam/nữ',
                onClick: onShowStats,
              },
              {
                icon: <Flame size={18} color="#800000" />,
                label: 'Trang tưởng nhớ',
                sub: 'Tưởng nhớ người đã mất',
                onClick: onShowMemorial,
              },
              {
                icon: <Map size={18} color="#800000" />,
                label: 'Bản đồ mộ phần',
                sub: `${withGrave} mộ có địa chỉ · Chỉ đường Google Maps`,
                onClick: onShowGraveMap,
              },
            ].map((item, i, arr) => (
              <div key={item.label}>
                <MenuItem {...item} />
                {i < arr.length - 1 && <div style={{ height: 1, background: divider, marginLeft: 56 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* ── XUẤT / NHẬP DỮ LIỆU ── */}
        <div>
          <SectionLabel>Xuất / Nhập Dữ Liệu</SectionLabel>

          <div
            className="mx-4 rounded-2xl overflow-hidden"
            style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: '0 2px 10px rgba(28,20,16,0.06)' }}
          >
            {/* Xuất Excel */}
            <MenuItem
              icon={<FileSpreadsheet size={18} color={isSuperAdmin ? '#16A34A' : '#9CA3AF'} />}
              label="Xuất Excel (Sao lưu)"
              sub="Tất cả dữ liệu · Có thể sửa và nhập lại"
              onClick={handleExportExcel}
              disabled={!isSuperAdmin}
              lockReason="Chỉ dành cho Super Admin"
            />
            <div style={{ height: 1, background: divider, marginLeft: 56 }} />

            {/* Nhập Excel — chỉ render khi là SuperAdmin */}
            {isSuperAdmin && (
              <>
                <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
                <MenuItem
                  icon={<Upload size={18} color="#2563EB" />}
                  label="Nhập Excel"
                  sub="Cập nhật / thêm từ file đã sửa"
                  onClick={() => importRef.current?.click()}
                />
                <div style={{ height: 1, background: divider, marginLeft: 56 }} />
              </>
            )}

            {/* Xuất PDF */}
            <MenuItem
              icon={<FileText size={18} color={isSuperAdmin ? '#800000' : '#9CA3AF'} />}
              label={pdfProgress || 'Xuất PDF in ấn'}
              sub="Phả đồ khổ lớn · In họp dòng họ"
              onClick={handleExportPDF}
              disabled={!isSuperAdmin}
              lockReason="Chỉ dành cho Super Admin"
            />
            <div style={{ height: 1, background: divider, marginLeft: 56 }} />

            {/* Xuất GEDCOM */}
            <MenuItem
              icon={<Download size={18} color={isSuperAdmin ? '#6B21A8' : '#9CA3AF'} />}
              label="Sao lưu GEDCOM"
              sub="Chuẩn quốc tế · Dùng cho Ancestry, MyHeritage…"
              onClick={() => downloadGedcom(members)}
              disabled={!isSuperAdmin}
              lockReason="Chỉ dành cho Super Admin"
            />
          </div>
        </div>

        {/* ── QUẢN TRỊ VIÊN ── */}
        <div>
          <SectionLabel>Quản Trị Viên</SectionLabel>
          <div className="mx-4">

            {/* Đã đăng nhập */}
            {isAdmin ? (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: '0 2px 10px rgba(28,20,16,0.06)' }}
              >
                {/* Info row */}
                <div className="px-4 py-3.5 flex items-center gap-3" style={{ borderBottom: `1px solid ${divider}` }}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isSuperAdmin ? '#dcfce7' : '#dbeafe' }}
                  >
                    <Shield size={18} style={{ color: isSuperAdmin ? '#16a34a' : '#2563eb' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-bold"
                      style={{
                        color: isSuperAdmin ? '#15803d' : '#1d4ed8',
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                      }}
                    >
                      {isSuperAdmin ? '⭐ Super Admin' : '✏️ Biên tập viên'}
                    </div>
                    <div className="text-xs truncate mt-0.5" style={{ color: textSub }}>
                      {user?.email}
                    </div>
                    {!isSuperAdmin && (
                      <div className="text-xs mt-0.5" style={{ color: '#F59E0B' }}>
                        Có thể sửa thành viên · Không xuất dữ liệu
                      </div>
                    )}
                  </div>
                </div>

                {/* Logout */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => signOut(auth)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors"
                  style={{ color: '#DC2626' }}
                >
                  <LogOut size={18} />
                  <span className="font-semibold text-sm" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                    Đăng xuất
                  </span>
                </motion.button>
              </div>

            ) : (
              /* Form đăng nhập */
              <div
                className="rounded-2xl p-4"
                style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: '0 2px 10px rgba(28,20,16,0.06)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={18} style={{ color: '#800000' }} />
                  <h3
                    className="font-bold text-base"
                    style={{ color: textMain, fontFamily: "'Merriweather', serif" }}
                  >
                    Đăng nhập Quản trị
                  </h3>
                </div>

                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="text-sm px-3 py-2 rounded-xl mb-3 font-semibold"
                      style={{ background: darkMode ? '#0f2a1a' : '#F0FDF4', color: '#16A34A' }}
                    >
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* FIX: dùng div thay form để tránh warning React nested form */}
                <div className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-opacity-20"
                    style={{
                      background: inputBg,
                      color: textMain,
                      border: `1px solid ${border}`,
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                    }}
                    placeholder="Email quản trị"
                  />

                  {/* Password field với toggle show/hide */}
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={pw}
                      onChange={e => { setPw(e.target.value); setError(''); }}
                      className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-opacity-20"
                      style={{
                        background: inputBg,
                        color: textMain,
                        border: `1px solid ${border}`,
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                      }}
                      placeholder="Mật khẩu"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: textSub }}
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="text-xs px-3 py-2 rounded-xl overflow-hidden"
                        style={{ background: darkMode ? '#2a1010' : '#FEF2F2', color: '#DC2626' }}
                      >
                        ❌ {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLogin}
                    disabled={loading || !email || !pw}
                    className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #800000, #5C0000)',
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                    }}
                  >
                    <LogIn size={16} />
                    {loading ? 'Đang xác thực…' : 'Đăng nhập'}
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER CARD ── */}
        <div
          className="mx-4 rounded-2xl overflow-hidden"
          style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: '0 2px 10px rgba(28,20,16,0.06)' }}
        >
          {/* Logo + App name */}
          <div className="px-5 pt-5 pb-4 flex items-center gap-4" style={{ borderBottom: `1px solid ${divider}` }}>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
              style={{ background: 'linear-gradient(135deg, #800000 0%, #4a0000 60%, #B8860B 100%)' }}
            >
              <span
                className="text-white text-2xl font-black"
                style={{ fontFamily: "'Merriweather', serif", letterSpacing: -1 }}
              >
                Lê
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-black text-base"
                style={{ color: textMain, fontFamily: "'Merriweather', serif" }}
              >
                Gia Phả Dòng Họ Lê
              </p>
              <p className="text-[11px] font-bold mt-0.5" style={{ color: '#800000' }}>
                v17 — Phiên bản chính thức
              </p>
              <p className="text-[10px] mt-1 leading-relaxed" style={{ color: textSub }}>
                Firebase · Cloudinary · Cloudflare Pages · GitHub
              </p>
            </div>
          </div>

          {/* Link chia sẻ */}
          <div
            className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${divider}` }}
          >
            <div>
              <p className="text-xs font-bold" style={{ color: textMain }}>Truy cập & Chia sẻ</p>
              <p className="text-[11px] mt-0.5" style={{ color: textSub }}>legia-2026.pages.dev</p>
            </div>
            <button
              onClick={() => {
                const url = 'https://legia-2026.pages.dev';
                if (navigator.share) navigator.share({ title: 'Gia Phả Dòng Họ Lê', url });
                else navigator.clipboard.writeText(url).then(() => alert('Đã sao chép link!'));
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: '#800000', fontFamily: "'Be Vietnam Pro', sans-serif" }}
            >
              <Share2 size={13} /> Chia sẻ
            </button>
          </div>

          {/* Nhà phát triển */}
          <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${divider}` }}>
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-2.5"
              style={{ color: textSub }}
            >
              Nhà Phát Triển
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #0068FF, #0044CC)' }}
              >
                LT
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: textMain }}>Lê Tỉnh</p>
                <p className="text-[11px]" style={{ color: textSub }}>
                  Muốn bổ sung thông tin dòng họ? Liên hệ ngay
                </p>
              </div>
              <a
                href="https://zalo.me/0708312789"
                target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
                style={{ background: '#0068FF', fontFamily: "'Be Vietnam Pro', sans-serif" }}
              >
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

        {/* Bottom padding cho safe area */}
        <div className="h-4" />
      </div>
    </div>
  );
}
