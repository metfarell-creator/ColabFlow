import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-app-fg/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-colors duration-300"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-app-bg border border-app-fg w-full max-w-md overflow-hidden relative shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] transition-colors duration-300"
            >
              {/* Header */}
              <div className="border-b border-app-fg px-6 py-4 flex items-center justify-between">
                <h3 className="font-serif italic text-lg">{title}</h3>
                <button 
                  onClick={onClose}
                  className="p-1 hover:bg-app-fg hover:text-app-bg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
