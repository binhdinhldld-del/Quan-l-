import React from 'react';
import { AlertTriangle, Info, Trash2, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ConfirmModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isAlertOnly?: boolean; // If true, only show OK button (replaces alert)
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  onConfirm,
  onCancel,
  isAlertOnly = false
}: ConfirmModalConfig & { onClose: () => void }) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="text-red-600 w-6 h-6" />;
      case 'success':
        return <CheckCircle className="text-emerald-600 w-6 h-6" />;
      case 'info':
        return <Info className="text-blue-650 w-6 h-6" />;
      default:
        return <AlertTriangle className="text-amber-650 w-6 h-6" />;
    }
  };

  const getHeaderBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 text-red-800 border-red-100';
      case 'success':
        return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-100';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-100';
    }
  };

  const getConfirmButtonClasses = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
      default:
        return 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => {
          if (onCancel) {
            onCancel();
          } else {
            onConfirm(); // If alert only, background clicking can count as close/ok
          }
        }}
      />

      {/* dialog content */}
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-w-md w-full relative z-10 p-5 space-y-4 transform transition-all duration-300 scale-100">
        <div className={`p-3 rounded-lg border flex gap-3 items-start ${getHeaderBg()}`}>
          <div className="shrink-0 p-1.5 bg-white rounded-md shadow-xs">
            {getIcon()}
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">{title}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end text-xs font-semibold">
          {!isAlertOnly && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer font-bold ${getConfirmButtonClasses()}`}
          >
            {isAlertOnly ? 'Đồng ý' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
