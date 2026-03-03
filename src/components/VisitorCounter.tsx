import { useEffect, useState } from 'react';
import { doc, setDoc, increment, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface Props {
  darkMode?: boolean;
  /** compact=true: hiển thị 1 dòng nhỏ trên BottomNav */
  compact?: boolean;
}

export default function VisitorCounter({ darkMode, compact = false }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const statsRef = doc(db, 'meta', 'stats');
    const SESSION_KEY = 'gia_pha_visited';

    if (!sessionStorage.getItem(SESSION_KEY)) {
      setDoc(statsRef, { visits: increment(1) }, { merge: true })
        .then(() => sessionStorage.setItem(SESSION_KEY, '1'))
        .catch(err => console.error('Lỗi tăng view:', err));
    }

    const unsub = onSnapshot(statsRef, snap => {
      setCount(snap.exists() ? (snap.data().visits ?? 0) : 0);
    }, err => console.error('Lỗi đọc view:', err));

    return () => unsub();
  }, []);

  if (count === null) return null; // Không render khi chưa load — tránh layout shift

  /* ── Compact mode: 1 dòng nhỏ nằm trên BottomNav ── */
  if (compact) {
    const color = darkMode ? 'rgba(138,155,176,0.7)' : 'rgba(107,94,82,0.65)';
    return (
      <div
        className="flex items-center justify-center gap-1 pt-1"
        style={{ fontSize: 9.5, color, fontFamily: "'Be Vietnam Pro', sans-serif" }}
      >
        <span>👁️</span>
        <span>
          <span style={{ fontWeight: 700 }}>{count.toLocaleString('vi-VN')}</span>
          {' '}lượt xem
        </span>
      </div>
    );
  }

  /* ── Full mode: block độc lập ── */
  const textColor = darkMode ? '#94a3b8' : '#64748b';
  return (
    <div
      className="text-center font-medium mt-2"
      style={{ fontSize: 11, color: textColor, opacity: 0.8, fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      👁️ <span style={{ fontWeight: 700 }}>{count.toLocaleString('vi-VN')}</span> lượt truy cập
    </div>
  );
}
