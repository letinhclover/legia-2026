import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { LogIn, UserPlus, BookOpen } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      const msg: Record<string, string> = {
        'auth/user-not-found': 'Email không tồn tại',
        'auth/wrong-password': 'Sai mật khẩu',
        'auth/email-already-in-use': 'Email đã được đăng ký',
        'auth/weak-password': 'Mật khẩu phải có ít nhất 6 ký tự',
        'auth/invalid-email': 'Email không hợp lệ',
        'auth/invalid-credential': 'Email hoặc mật khẩu không đúng',
      };
      setError(msg[err.code] || 'Đã xảy ra lỗi, vui lòng thử lại');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FFFDD0] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#800000] text-white p-8 text-center">
          <div className="flex justify-center mb-3">
            <BookOpen size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold">Gia Phả Dòng Họ Lê</h1>
          <p className="text-[#B8860B] text-sm mt-1">Truyền thống · Đoàn kết · Phát triển</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 font-semibold text-sm transition-colors ${mode === 'login' ? 'text-[#800000] border-b-2 border-[#800000]' : 'text-gray-500'}`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-3 font-semibold text-sm transition-colors ${mode === 'register' ? 'text-[#800000] border-b-2 border-[#800000]' : 'text-gray-500'}`}
          >
            Đăng ký thành viên
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#800000] focus:outline-none"
              placeholder="email@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#800000] focus:outline-none"
              placeholder="Ít nhất 6 ký tự"
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#800000] text-white py-3 rounded-lg font-bold hover:bg-[#600000] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
            {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>

          {mode === 'register' && (
            <p className="text-xs text-gray-500 text-center">
              Sau khi đăng ký, tài khoản cần được quản trị viên phê duyệt để chỉnh sửa dữ liệu.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
