import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowDownCircle, ArrowUpCircle, Search, Plus, BarChart3 } from 'lucide-react';

// ── Dữ liệu mẫu (sau sẽ kết nối Firestore) ──────────────────────────────
const SAMPLE_TRANSACTIONS = [
  { id: '1', name: 'Lê Văn An',      note: 'Đóng góp quỹ năm 2025', amount: 500000,   time: '10:30', date: 'HÔM NAY',   type: 'in'  },
  { id: '2', name: 'Sửa mái nhà thờ', note: 'Chi phí vật liệu & nhân công', amount: -2500000, time: '08:15', date: 'HÔM NAY',   type: 'out' },
  { id: '3', name: 'Lê Thị Mai',     note: 'Ủng hộ khuyến học',   amount: 1000000,  time: '14:20', date: 'HÔM QUA',   type: 'in'  },
  { id: '4', name: 'Lê Hùng Cường',  note: 'Đóng góp quỹ tháng 10', amount: 200000, time: '09:12', date: 'HÔM QUA',   type: 'in'  },
  { id: '5', name: 'Lê Minh Tuấn',   note: 'Đóng quỹ dòng họ',   amount: 300000,   time: '16:45', date: '20/02',     type: 'in'  },
  { id: '6', name: 'Lễ giỗ tổ Chi 2', note: 'Chi phí tổ chức',   amount: -800000,  time: '07:00', date: '18/02',     type: 'out' },
];

const fmt = (n: number) =>
  Math.abs(n).toLocaleString('vi-VN') + 'đ';

export default function FundTab() {
  const [tab, setTab] = useState<'history' | 'report'>('history');
  const [query, setQuery] = useState('');

  const balance = SAMPLE_TRANSACTIONS.reduce((s, t) => s + t.amount, 0);

  // Group by date
  const grouped = SAMPLE_TRANSACTIONS.reduce<Record<string, typeof SAMPLE_TRANSACTIONS>>((acc, t) => {
    (acc[t.date] = acc[t.date] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full hide-scrollbar" style={{ background: '#101922' }}>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3"
        style={{ background: '#192633', borderBottom: '1px solid #233648' }}>
        <h2 className="font-bold text-white text-lg">Quỹ Dòng Họ Lê</h2>
        <motion.button whileTap={{ scale: 0.9 }}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: '#D4AF37' }}>
          <Plus size={20} color="#101922" />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-6">

        {/* Balance card */}
        <div className="mx-4 mt-4 rounded-2xl p-5" style={{ background: '#192633', border: '1px solid #8B5A2B' }}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#92adc9' }}>Tổng số dư khả dụng</p>
              <p className="text-3xl font-black text-white">
                {balance.toLocaleString('vi-VN')}<span className="text-xl"> đ</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#233648' }}>
              <TrendingUp size={22} color="#D4AF37" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #233648' }}>
            <p className="text-xs flex-1" style={{ color: '#92adc9' }}>Cập nhật: 01/03/2026</p>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: '#233648' }}>
              <TrendingUp size={12} color="#10B981" />
              <span className="text-xs font-bold text-green-400">+5.2%</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
          <motion.button whileTap={{ scale: 0.95 }}
            className="rounded-2xl py-4 flex flex-col items-center justify-center gap-2"
            style={{ background: '#D4AF37' }}>
            <ArrowDownCircle size={28} color="#101922" />
            <span className="font-bold text-sm" style={{ color: '#101922' }}>Đóng góp</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }}
            className="rounded-2xl py-4 flex flex-col items-center justify-center gap-2"
            style={{ background: '#192633', border: '1px solid #233648' }}>
            <BarChart3 size={28} color="#D4AF37" />
            <span className="font-bold text-sm" style={{ color: '#D4AF37' }}>Báo cáo thu chi</span>
          </motion.button>
        </div>

        {/* Search */}
        <div className="mx-4 mt-4 flex gap-2">
          <div className="flex-1 relative flex items-center rounded-xl overflow-hidden" style={{ background: '#192633' }}>
            <Search size={15} className="absolute left-3" color="#92adc9" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Tìm kiếm giao dịch..."
              className="w-full pl-9 pr-4 py-3 bg-transparent text-sm text-white placeholder-[#92adc9] focus:outline-none" />
          </div>
        </div>

        {/* Transaction list */}
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-white">Lịch sử giao dịch</p>
            <button className="text-xs font-semibold" style={{ color: '#D4AF37' }}>Xem tất cả</button>
          </div>

          {Object.entries(grouped).map(([date, txns]) => (
            <div key={date} className="mb-4">
              {/* Date divider */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px" style={{ background: '#233648' }} />
                <p className="text-xs font-bold px-2" style={{ color: '#92adc9' }}>{date}</p>
                <div className="flex-1 h-px" style={{ background: '#233648' }} />
              </div>

              <div className="space-y-2">
                {txns.map(t => (
                  <motion.div key={t.id}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer"
                    style={{ background: '#192633', border: '1px solid #233648' }}>
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: t.type === 'in' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
                      {t.type === 'in'
                        ? <ArrowDownCircle size={20} color="#10B981" />
                        : <ArrowUpCircle  size={20} color="#EF4444" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{t.name}</p>
                      <p className="text-xs truncate" style={{ color: '#92adc9' }}>{t.note}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-black text-sm" style={{ color: t.type === 'in' ? '#10B981' : '#EF4444' }}>
                        {t.type === 'in' ? '+' : '-'}{fmt(t.amount)}
                      </p>
                      <p className="text-xs" style={{ color: '#92adc9' }}>{t.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
