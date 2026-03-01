import { useEffect } from 'react';
import { motion, AnimatePresence, useDragControls, useMotionValue, useTransform } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string;
  title?: string;
}

export default function BottomSheet({ isOpen, onClose, children, height = '90vh', title }: Props) {
  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 260], [0.48, 0.04]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => { if (isOpen) y.set(0); }, [isOpen]);

  const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 110 || info.velocity.y > 450) onClose();
  };

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

          <motion.div
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.02, bottom: 0.4 }}
            style={{ y, maxHeight: height }}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32, mass: 0.85 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col overflow-hidden"
          >
            {/* Handle — CHỈ kéo từ đây */}
            <div
              className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none' }}   /* ← chặn scroll native ở handle, cho drag hoạt động */
              onPointerDown={e => {
                e.preventDefault();
                dragControls.start(e);
              }}
            >
              <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {title && (
              <div className="flex-shrink-0 px-5 py-2.5 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
              </div>
            )}

            {/* Content scroll — touch-action: pan-y cho phép swipe dọc cuộn tự do */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{
                paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
                touchAction: 'pan-y',     /* ← QUAN TRỌNG: cho phép scroll dọc native */
                WebkitOverflowScrolling: 'touch',
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
