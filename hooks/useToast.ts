import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

export interface Toast {
  id: number;
  message: string;
  type: 'error' | 'success';
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: 'error' | 'success') => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    const newToast = {
      id: Date.now() + Math.random(),
      message,
      type,
    };
    setToasts(prevToasts => [...prevToasts, newToast]);
    
    setTimeout(() => {
      removeToast(newToast.id);
    }, 5000); // Toasts disappear after 5 seconds
  }, [removeToast]);

  // FIX: Replaced JSX with React.createElement to fix parsing errors in a .ts file.
  return React.createElement(ToastContext.Provider, { value: { toasts, showToast, removeToast } }, children);
};
