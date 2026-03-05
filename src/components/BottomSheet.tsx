import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string;
  title?: string;
}

// Counter toàn cục để track bao nhiêu BottomSheet đang mở
// Tránh trường hợp sheet 1 đóng reset overflow, trong khi sheet 2 vẫn còn mở
let openSheetCount = 0;

export default function BottomSheet({ isOpen, onClose, children, height = '90vh', title }: Props) {
  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 260], [0.48, 0.02]);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      openSheetCount++;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (isOpen) {
        openSheetCount--;
        if (openSheetCount <= 0) {
          openSheetCount = 0;
          document.body.style.overflow = '';
        }
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) animate(y, 0, { duration: 0 });
  }, [isOpen]);

  // Touch handlers CHỈ trên handle — không touch content
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle || !isOpen) return;
    let startY = 0;

    const onStart = (e: TouchEvent) => { startY = e.touches[0].clientY; y.set(0); };
    const onMove  = (e: TouchEvent) => {
      const d = e.touches[0].clientY - startY;
      if (d > 0) y.set(d);
    };
    const onEnd   = (e: TouchEvent) => {
      const d = e.changedTouches[0].clientY - startY;
      if (d > 110) onClose();
      else animate(y, 0, { type: 'spring', stiffness: 380, damping: 34 });
    };

    handle.addEventListener('touchstart', onStart, { passive: true });
    handle.addEventListener('touchmove',  onMove,  { passive: true });
    handle.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      handle.removeEventListener('touchstart', onStart);
      handle.removeEventListener('touchmove',  onMove);
      handle.removeEventListener('touchend',   onEnd);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ opacity: backdropOpacity }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/*
            FIX SCROLL:
            - Outer motion.div: position + slide animation, KHÔNG overflow
            - Inner wrapper: maxHeight + overflow:hidden → ràng buộc chiều cao thật
            - Content div: flex-1 overflow-y-auto → scroll trong vùng ràng buộc
          */}
          <motion.div
            style={{ y, willChange: 'transform' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.9 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            {/* Inner wrapper: chiều cao thật, overflow hidden để bo góc */}
            <div
              className="bg-white rounded-t-3xl flex flex-col"
              style={{
                maxHeight: height,
                // overflow: hidden ở đây để rounded-t-3xl hoạt động + ràng buộc flex-1
                overflow: 'hidden',
              }}
            >
              {/* Handle */}
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

              {/*
                Content: flex-1 + overflow-y-auto.
                Vì parent có overflow:hidden + maxHeight, flex-1 sẽ bị ràng buộc
                → overflow-y-auto mới hoạt động đúng.
                touchAction: pan-y → browser biết đây là scroll zone, không cancel touch.
              */}
              <div
                className="flex-1 overflow-y-auto overscroll-contain"
                style={{
                  touchAction: 'pan-y',
                  WebkitOverflowScrolling: 'touch',
                  paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
                  // minHeight: 0 bắt buộc để flex-1 shrink được trong flex column
                  minHeight: 0,
                }}
              >
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
