import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string;
  title?: string;
}

export default function BottomSheet({ isOpen, onClose, children, height = '90vh', title }: Props) {
  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 260], [0.48, 0.02]);
  const handleRef = useRef<HTMLDivElement>(null);

  // Khoá scroll body khi mở
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset vị trí khi mở
  useEffect(() => {
    if (isOpen) animate(y, 0, { duration: 0 });
  }, [isOpen]);

  // ── Manual touch handler CHỈ trên handle ──────────────────────────────
  // Không đặt `drag` prop trên sheet → nội dung bên trong scroll tự do hoàn toàn
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle || !isOpen) return;

    let startClientY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startClientY = e.touches[0].clientY;
      y.set(0);
    };

    const onTouchMove = (e: TouchEvent) => {
      const delta = e.touches[0].clientY - startClientY;
      if (delta > 0) y.set(delta); // chỉ cho kéo xuống
    };

    const onTouchEnd = (e: TouchEvent) => {
      const delta = e.changedTouches[0].clientY - startClientY;
      if (delta > 110) {
        onClose();
      } else {
        animate(y, 0, { type: 'spring', stiffness: 380, damping: 34 });
      }
    };

    handle.addEventListener('touchstart', onTouchStart, { passive: true });
    handle.addEventListener('touchmove', onTouchMove, { passive: true });
    handle.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      handle.removeEventListener('touchstart', onTouchStart);
      handle.removeEventListener('touchmove', onTouchMove);
      handle.removeEventListener('touchend', onTouchEnd);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ opacity: backdropOpacity }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/* Sheet — KHÔNG có drag prop → content scroll tự do */}
          <motion.div
            style={{ y, maxHeight: height, willChange: 'transform' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.9 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col"
          >
            {/* Handle — manual touch drag */}
            <div
              ref={handleRef}
              className="flex-shrink-0 flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none' }}
            >
              <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {title && (
              <div className="flex-shrink-0 px-5 py-2.5 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
              </div>
            )}

            {/* Content — hoàn toàn tự do, không có drag interference */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{
                touchAction: 'pan-y',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
