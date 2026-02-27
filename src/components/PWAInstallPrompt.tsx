import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Kiểm tra đã cài chưa
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Hiện prompt sau 3 giây
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShow(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setShow(false);
    setDeferredPrompt(null);
  };

  if (installed || !show || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
      <div className="bg-gradient-to-r from-[#800000] to-[#A00000] p-3 flex items-center justify-between">
        <span className="text-white font-bold text-sm">📱 Cài app Gia Phả</span>
        <button onClick={() => setShow(false)} className="text-white opacity-70 hover:opacity-100">
          <X size={18} />
        </button>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3">
          Cài đặt như app thật — truy cập nhanh hơn, không cần mở trình duyệt
        </p>
        <button onClick={handleInstall}
          className="w-full bg-[#800000] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#600000] transition-colors">
          <Download size={18} />
          Cài đặt ngay
        </button>
        <button onClick={() => setShow(false)} className="w-full mt-2 text-gray-400 text-xs py-1">
          Để sau
        </button>
      </div>
    </div>
  );
}
