import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

interface Props {
  darkMode?: boolean;
}

export default function VisitorCounter({ darkMode }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const SESSION_KEY = 'gia_pha_visited';
    const alreadyCounted = sessionStorage.getItem(SESSION_KEY);

    const statsRef = doc(db, 'meta', 'stats');

    const run = async () => {
      try {
        if (!alreadyCounted) {
          // Tăng count + lấy giá trị mới
          await setDoc(statsRef, { visits: increment(1) }, { merge: true });
          sessionStorage.setItem(SESSION_KEY, '1');
        }
        const snap = await getDoc(statsRef);
        if (snap.exists()) {
          setCount(snap.data().visits ?? 0);
        }
      } catch {
        // Silent fail — không ảnh hưởng UX
      }
    };
    run();
  }, []);

  const textColor = darkMode ? '#92adc9' : '#9CA3AF';

  return (
    <div className="text-center" style={{ fontSize: 10, color: textColor }}>
      {count !== null
        ? `👁️ ${count.toLocaleString('vi-VN')} lượt truy cập`
        : ''}
    </div>
  );
}
