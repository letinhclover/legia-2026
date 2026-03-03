import { useEffect, useState } from 'react';
import { doc, setDoc, increment, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface Props {
  darkMode?: boolean;
}

export default function VisitorCounter({ darkMode }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // 1. Định nghĩa vị trí lưu: collection "meta", document "stats"
    const statsRef = doc(db, 'meta', 'stats');

    // 2. Logic tăng view (Chỉ chạy 1 lần mỗi phiên)
    const SESSION_KEY = 'gia_pha_visited';
    const hasCounted = sessionStorage.getItem(SESSION_KEY);

    if (!hasCounted) {
      // Tăng view nhưng không chờ (fire and forget) để tránh chặn giao diện
      setDoc(statsRef, { visits: increment(1) }, { merge: true })
        .then(() => sessionStorage.setItem(SESSION_KEY, '1'))
        .catch((err) => console.error("Lỗi tăng view:", err));
    }

    // 3. Lắng nghe Realtime (Số nhảy tanh tách khi có người vào)
    const unsubscribe = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCount(data.visits || 0);
      } else {
        // Nếu chưa có document, set là 0
        setCount(0);
      }
    }, (error) => {
      console.error("Lỗi đọc view:", error);
    });

    // Dọn dẹp khi component unmount
    return () => unsubscribe();
  }, []);

  const textColor = darkMode ? '#94a3b8' : '#64748b';

  // Nếu chưa load xong (count === null) thì hiện dấu ...
  return (
    <div className="text-center font-medium mt-2" 
         style={{ fontSize: 11, color: textColor, opacity: 0.8 }}>
      {count !== null ? (
        <span>👁️ <span className="font-bold">{count.toLocaleString('vi-VN')}</span> lượt truy cập</span>
      ) : (
        <span>...</span>
      )}
    </div>
  );
}
