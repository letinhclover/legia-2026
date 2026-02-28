import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string; // e.g. '85vh', '70vh'
  title?: string;
}

export default function BottomSheet({ isOpen, onClose, children, height = '85vh', title }: Props) {
  // Khoá scroll body khi mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl overflow-hidden flex flex-col"
            style={{ maxHeight: height }}
          >
            {/* Handle bar */}
            <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header nếu có title */}
            {title && (
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                <button onClick={onClose} className="bg-gray-100 rounded-full p-1.5">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
