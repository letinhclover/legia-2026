import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Image, FileText, Play } from 'lucide-react';

const MEDIA = [
  { id: '1', type: 'image', title: 'Nhà thờ tổ ngành 2',     sub: 'Thanh Hóa',        year: '1920', tag: 'Nhà thờ tổ' },
  { id: '2', type: 'video', title: 'Giỗ tổ năm 2023',        sub: 'Video',             dur: '04:20', tag: 'Họp mặt'    },
  { id: '3', type: 'image', title: 'Mừng thọ Cụ Cà',         sub: 'Sân đình làng',    year: '1955', tag: 'Ảnh cổ'     },
  { id: '4', type: 'doc',   title: 'Gia phả Chi 3 (Bản số hóa)', sub: 'Cập nhật 2020', tag: 'Tài liệu'  },
  { id: '5', type: 'image', title: 'Sắc phong Triều Nguyễn', sub: 'Bảo lưu tại chi 1', tag: 'Sắc phong' },
  { id: '6', type: 'doc',   title: 'Bằng công nhận Dòng họ văn hóa', sub: 'UBND Tỉnh trao tặng', tag: 'Tài liệu' },
];

const TAGS = ['Tất cả', 'Ảnh cổ', 'Nhà thờ tổ', 'Họp mặt', 'Sắc phong', 'Tài liệu'];

export default function LibraryTab() {
  const [mediaTab, setMediaTab] = useState<'media' | 'docs'>('media');
  const [tag, setTag]           = useState('Tất cả');
  const [query, setQuery]       = useState('');

  const filtered = MEDIA.filter(m => {
    const matchQuery = !query || m.title.toLowerCase().includes(query.toLowerCase());
    const matchTag   = tag === 'Tất cả' || m.tag === tag;
    const matchType  = mediaTab === 'docs' ? m.type === 'doc' : m.type !== 'doc';
    return matchQuery && matchTag && matchType;
  });

  return (
    <div className="flex flex-col h-full hide-scrollbar" style={{ background: '#101922' }}>

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3" style={{ background: '#192633', borderBottom: '1px solid #233648' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white text-lg">Thư Viện Dòng Họ Lê</h2>
          <motion.button whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#D4AF37' }}>
            <Plus size={20} color="#101922" />
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative flex items-center rounded-xl overflow-hidden mb-3" style={{ background: '#233648' }}>
          <Search size={15} className="absolute left-3" color="#92adc9" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Tìm kiếm theo năm hoặc từ khóa..."
            className="w-full pl-9 pr-4 py-3 bg-transparent text-sm text-white placeholder-[#92adc9] focus:outline-none" />
        </div>

        {/* Ảnh/Video vs Tài liệu toggle */}
        <div className="flex rounded-xl overflow-hidden" style={{ background: '#233648' }}>
          {(['media', 'docs'] as const).map(t => (
            <button key={t} onClick={() => setMediaTab(t)}
              className="flex-1 py-2.5 text-sm font-bold transition-all"
              style={{
                background: mediaTab === t ? 'white' : 'transparent',
                color:      mediaTab === t ? '#101922' : '#92adc9',
                borderRadius: 10,
              }}>
              {t === 'media' ? 'Ảnh & Video' : 'Tài liệu'}
            </button>
          ))}
        </div>
      </div>

      {/* Tag chips */}
      <div className="flex-shrink-0 flex gap-2 px-4 py-3 overflow-x-auto hide-scrollbar">
        {TAGS.map(t => (
          <button key={t} onClick={() => setTag(t)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: tag === t ? '#D4AF37' : '#192633',
              color:      tag === t ? '#101922' : '#92adc9',
              border: `1px solid ${tag === t ? '#D4AF37' : '#233648'}`,
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 hide-scrollbar">
        <div className="columns-2 gap-3">
          <AnimatePresence>
            {filtered.map((item, i) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}
                className="break-inside-avoid mb-3 rounded-2xl overflow-hidden cursor-pointer"
                style={{ background: '#192633', border: '1px solid #233648' }}>

                {/* Thumbnail */}
                <div className="relative w-full bg-gradient-to-br from-[#233648] to-[#192633] flex items-center justify-center"
                  style={{ aspectRatio: '4/3' }}>
                  {item.type === 'video'
                    ? <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.9)' }}>
                        <Play size={18} color="#101922" />
                      </div>
                    : item.type === 'doc'
                    ? <FileText size={32} color="#D4AF37" />
                    : <Image size={32} color="#92adc9" />
                  }

                  {/* Badges */}
                  {item.year && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                      style={{ background: 'rgba(0,0,0,0.6)' }}>{item.year}</div>
                  )}
                  {item.dur && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                      style={{ background: 'rgba(0,0,0,0.6)' }}>{item.dur}</div>
                  )}
                  {item.tag && item.tag !== 'Tất cả' && item.type !== 'image' && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: '#D4AF37', color: '#101922' }}>{item.tag}</div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <p className="font-bold text-white text-xs leading-snug">{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#92adc9' }}>{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length > 0 && (
          <div className="text-center mt-2">
            <p className="text-xs italic mb-2" style={{ color: '#92adc9' }}>
              Đang hiển thị {filtered.length} trên {MEDIA.length} tư liệu
            </p>
            <button className="text-sm font-semibold" style={{ color: '#D4AF37' }}>Xem thêm</button>
          </div>
        )}
      </div>
    </div>
  );
}
