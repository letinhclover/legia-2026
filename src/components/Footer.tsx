import { useEffect, useState } from 'react';

interface Props {
  darkMode?: boolean;
}

export default function Footer({ darkMode = false }: Props) {
  const [visitCount, setVisitCount] = useState<number | null>(null);

  useEffect(() => {
    // Dùng counterapi.dev — đếm thực tế, giống HTML mẫu
    fetch('https://api.counterapi.dev/v1/legia-2026/visits/up')
      .then(r => r.json())
      .then(d => setVisitCount(d.count))
      .catch(() => setVisitCount(null));
  }, []);

  const bg      = darkMode ? '#1d1f21' : '#ffffff';
  const border  = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const txtMain = darkMode ? '#f5f5f5'  : '#CC0000';
  const txtSub  = darkMode ? '#aaaaaa'  : '#555555';
  const linkClr = darkMode ? '#4ade80'  : '#198845';

  return (
    <footer style={{
      padding: '12px 16px',
      textAlign: 'center',
      background: bg,
      borderTop: `1px solid ${border}`,
      fontSize: 13,
      fontFamily: "'Roboto', sans-serif",
    }}>
      {/* Visit counter */}
      {visitCount !== null && (
        <div style={{ color: txtSub, marginBottom: 6, fontSize: 12 }}>
          👀 Lượt truy cập: <strong style={{ color: txtMain }}>{visitCount.toLocaleString('vi-VN')}</strong>
        </div>
      )}

      {/* Footer text */}
      <div style={{ color: txtMain, fontWeight: 700, fontSize: 13 }}>
        Gia Phả Dòng Họ Lê © {new Date().getFullYear()}
      </div>
      <div style={{ color: txtSub, fontSize: 11, marginTop: 4 }}>
        Truyền thống · Đoàn kết · Phát triển
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: txtSub }}>
        Thiết kế bởi{' '}
        <a
          href="https://github.com/letinhclover"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: linkClr, fontWeight: 700, textDecoration: 'none' }}
        >
          letinhclover
        </a>
      </div>
    </footer>
  );
}
