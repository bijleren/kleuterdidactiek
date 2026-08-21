import { ReactNode, useEffect, useState, FormEvent } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdrop?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-100">
            <h2 className="text-2xl font-baloo text-deep-purple">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Bevestigen',
  cancelText = 'Annuleren',
  confirmColor = 'bg-grass-green',
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" closeOnBackdrop={false}>
      <div className="text-center">
        <h3 className="text-xl font-baloo text-deep-purple mb-4">{title}</h3>
        <p className="text-gray-700 mb-6 whitespace-pre-wrap">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-full font-baloo bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-3 rounded-full font-baloo text-white ${confirmColor} hover:scale-105 transition-transform shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  submitText?: string;
  cancelText?: string;
}

export function PromptModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  message,
  placeholder = '',
  submitText = 'OK',
  cancelText = 'Annuleren',
}: PromptModalProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(value);
    setValue('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" closeOnBackdrop={false}>
      <form onSubmit={handleSubmit}>
        <div className="text-center">
          <h3 className="text-xl font-baloo text-deep-purple mb-4">{title}</h3>
          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{message}</p>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-sky-blue resize-none"
            rows={4}
            autoFocus
          />
          <div className="flex gap-3 justify-center mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-full font-baloo bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-full font-baloo text-white bg-sky-blue hover:scale-105 transition-transform shadow-lg"
            >
              {submitText}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  buttonText?: string;
}

export function AlertModal({
  isOpen,
  onClose,
  title = 'Melding',
  message,
  buttonText = 'OK',
}: AlertModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" closeOnBackdrop={false}>
      <div className="text-center">
        {title && <h3 className="text-xl font-baloo text-deep-purple mb-4">{title}</h3>}
        <p className="text-gray-700 mb-6 whitespace-pre-wrap">{message}</p>
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-full font-baloo text-white bg-grass-green hover:scale-105 transition-transform shadow-lg"
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
}
