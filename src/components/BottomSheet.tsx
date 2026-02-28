import { useEffect } from 'react';
import { motion, AnimatePresence, useDragControls, useMotionValue, useTransform } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string;   // default '90vh'
  title?: string;
}

export default function BottomSheet({ isOpen, onClose, children, height = '90vh', title }: Props) {
  const dragControls = useDragControls();
  const y = useMotionValue(0);

  // Backdrop mờ dần khi kéo xuống
  const backdropOpacity = useTransform(y, [0, 280], [0.5, 0.05]);

  // Khoá scroll body
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset y mỗi lần mở
  useEffect(() => { if (isOpen) y.set(0); }, [isOpen]);

  const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    // Đóng nếu kéo xuống > 120px HOẶC velocity > 500
    if (info.offset.y > 120 || info.velocity.y > 500) {
      onClose();
    } else {
      // Spring back
      y.set(0);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ opacity: backdropOpacity }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            drag="y"
            dragControls={dragControls}
            dragListener={false}          // chỉ drag từ handle bar
            dragConstraints={{ top: 0 }}  // không kéo lên quá đỉnh
            dragElastic={{ top: 0.03, bottom: 0.4 }}
            style={{ y }}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34, mass: 0.85 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col"
            style={{ maxHeight: height, y }}
          >
            {/* ── Drag handle — kéo vùng này để dismiss ── */}
            <div
              className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onPointerDown={e => { e.preventDefault(); dragControls.start(e); }}
            >
              <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header tuỳ chọn */}
            {title && (
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
              </div>
            )}

            {/* Scrollable content */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
