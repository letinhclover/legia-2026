import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, LogIn, LogOut, Users, BarChart2, Flame, ChevronRight, Info } from 'lucide-react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Member } from '../types';

interface Props {
  user: { email: string | null } | null;
  isAdmin: boolean;
  members: Member[];
  onShowStats: () => void;
  onShowMemorial: () => void;
  adminEmails: string[];
}

export default function SettingsTab({ user, isAdmin, members, onShowStats, onShowMemorial, adminEmails }: Props) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const r = await signInWithEmailAndPassword(auth, email, pw);
      if (!adminEmails.includes(r.user.email || '')) {
        await signOut(auth);
        setError('Tài khoản này không có quyền quản trị');
      } else { setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
    } catch { setError('Email hoặc mật khẩu không đúng'); }
    setLoading(false);
  };

  const alive = members.filter(m => !m.deathDate).length;
  const maxGen = Math.max(...members.map(m => m.generation), 0);

  const MenuItem = ({ icon, label, sub, onClick }: { icon: React.ReactNode; label: string; sub?: string; onClick: () => void }) => (
    <motion.button whileTap={{scale:0.97}} onClick={onClick}
      className="w-full flex items-center gap-3 bg-white px-4 py-3.5 text-left hover:bg-gray-50 transition-colors">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'#FFF0F0'}}>{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-800">{label}</div>
        {sub && <div className="text-xs text-gray-400">{sub}</div>}
      </div>
      <ChevronRight size={16} className="text-gray-300"/>
    </motion.button>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 bg-white border-b border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Quản Trị</h2>
        <p className="text-xs text-gray-400">Cài đặt và quản lý gia phả</p>
      </div>

      <div className="flex-1 py-4 space-y-4">
        {/* Thống kê nhanh */}
        <div className="px-4 grid grid-cols-3 gap-3">
          {[
            {label:'Thành viên', value: members.length, color:'#800000'},
            {label:'Còn sống', value: alive, color:'#16A34A'},
            {label:'Số đời', value: maxGen, color:'#B8860B'},
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 text-center shadow-sm">
              <div className="text-2xl font-black" style={{color:s.color}}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl mx-4 overflow-hidden shadow-sm divide-y divide-gray-50">
          <MenuItem icon={<BarChart2 size={18} color="#800000"/>} label="Thống kê dòng họ" sub="Phân tích theo đời, nam/nữ" onClick={onShowStats}/>
          <MenuItem icon={<Flame size={18} color="#800000"/>} label="Trang tưởng nhớ" sub="Thắp hương tiên tổ" onClick={onShowMemorial}/>
        </div>

        {/* Admin login / logout */}
        <div className="mx-4">
          {isAdmin ? (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-50">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                  <Shield size={18} className="text-green-600"/>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-green-700">✅ Đang là Quản trị viên</div>
                  <div className="text-xs text-gray-400">{user?.email}</div>
                </div>
              </div>
              <motion.button whileTap={{scale:0.97}} onClick={() => signOut(auth)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-red-600 hover:bg-red-50 transition-colors">
                <LogOut size={18}/>
                <span className="font-semibold text-sm">Đăng xuất</span>
              </motion.button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={18} style={{color:'#800000'}}/>
                <h3 className="font-bold text-gray-800">Đăng nhập Quản trị</h3>
              </div>
              {success && (
                <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-xl mb-3 font-semibold">
                  ✅ Đăng nhập thành công! Vào tab Phả Hệ để thêm thành viên.
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-3">
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-opacity-20"
                  placeholder="Email quản trị" required/>
                <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-opacity-20"
                  placeholder="Mật khẩu" required/>
                {error && <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-xl">❌ {error}</p>}
                <motion.button whileTap={{scale:0.97}} type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{background:'linear-gradient(135deg, #800000, #6B0000)'}}>
                  <LogIn size={16}/>{loading?'Đang xác thực...':'Đăng nhập'}
                </motion.button>
              </form>
            </div>
          )}
        </div>

        {/* App info */}
        <div className="mx-4 bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3">
          <Info size={18} className="text-gray-400 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-bold text-gray-700">Gia Phả Dòng Họ Lê v2.0</p>
            <p className="text-xs text-gray-400 mt-0.5">Dữ liệu lưu trên Firebase · Ảnh trên Cloudinary · Miễn phí</p>
            <p className="text-xs text-gray-400 mt-0.5">Link: legia-2026.netlify.app</p>
          </div>
        </div>
      </div>
    </div>
  );
}
