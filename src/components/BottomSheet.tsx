import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls, useMotionValue, useTransform } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string;   // mặc định '88vh'
  title?: string;
}

export default function BottomSheet({ isOpen, onClose, children, height = '88vh', title }: Props) {
  const dragControls = useDragControls();
  const y = useMotionValue(0);

  // Opacity backdrop giảm khi kéo xuống
  const backdropOpacity = useTransform(y, [0, 300], [0.55, 0.1]);

  // Khoá scroll body khi mở
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Đóng sheet khi kéo xuống quá 120px
  const handleDragEnd = (_: any, info: { offset: { y: number } }) => {
    if (info.offset.y > 120) onClose();
    else y.set(0); // spring back
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
            transition={{ duration: 0.22 }}
            style={{ opacity: backdropOpacity }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            drag="y"
            dragControls={dragControls}
            dragListener={false}        // chỉ drag từ handle
            dragConstraints={{ top: 0 }} // không kéo lên quá đỉnh
            dragElastic={{ top: 0.05, bottom: 0.35 }}
            style={{ y }}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.9 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] flex flex-col overflow-hidden"
            style={{ maxHeight: height, y }}
          >
            {/* ── Drag handle — kéo tại đây để dismiss ── */}
            <div
              className="flex-shrink-0 flex flex-col items-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
              onPointerDown={e => {
                e.preventDefault();
                dragControls.start(e);
              }}
            >
              {/* Thanh kéo rõ ràng */}
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-1" />
              <p className="text-xs text-gray-400 select-none">Kéo xuống để đóng</p>
            </div>

            {/* Header tuỳ chọn */}
            {title && (
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                <button
                  onClick={onClose}
                  className="bg-gray-100 hover:bg-gray-200 transition-colors rounded-full p-2"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            )}

            {/* Nội dung scroll */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
