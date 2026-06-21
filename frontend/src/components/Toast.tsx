import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Icon } from './UI';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  title?: string;
  message: string;
  tone?: ToastTone;
  duration?: number;
}

interface ToastEntry extends Required<Omit<ToastOptions, 'title'>> {
  id: number;
  title?: string;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_META: Record<ToastTone, { icon: string; accent: string; ring: string }> = {
  success: { icon: 'check_circle', accent: '#16a34a', ring: '#bbf7d0' },
  error:   { icon: 'error',         accent: '#dc2626', ring: '#fecaca' },
  info:    { icon: 'info',          accent: '#2563eb', ring: '#bfdbfe' },
  warning: { icon: 'warning',       accent: '#d97706', ring: '#fde68a' },
};

let nextId = 1;

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timersRef = useRef<Record<number, number>>({});

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const handle = timersRef.current[id];
    if (handle) {
      window.clearTimeout(handle);
      delete timersRef.current[id];
    }
  }, []);

  const show = useCallback((options: ToastOptions) => {
    const id = nextId++;
    const entry: ToastEntry = {
      id,
      title: options.title,
      message: options.message,
      tone: options.tone ?? 'info',
      duration: options.duration ?? 4200,
    };
    setToasts(prev => [...prev, entry]);
    timersRef.current[id] = window.setTimeout(() => remove(id), entry.duration);
  }, [remove]);

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(handle => window.clearTimeout(handle));
      timersRef.current = {};
    };
  }, []);

  const helpers: ToastContextValue = {
    show,
    success: (message, title) => show({ message, title, tone: 'success' }),
    error:   (message, title) => show({ message, title, tone: 'error' }),
    info:    (message, title) => show({ message, title, tone: 'info' }),
    warning: (message, title) => show({ message, title, tone: 'warning' }),
  };

  return (
    <ToastContext.Provider value={helpers}>
      {children}
      <div className="gc-toast-stack" role="region" aria-live="polite">
        {toasts.map(toast => {
          const meta = TONE_META[toast.tone];
          return (
            <div
              key={toast.id}
              className={`gc-toast gc-toast--${toast.tone}`}
              style={{ borderColor: meta.ring }}
            >
              <div className="gc-toast__icon" style={{ background: `${meta.accent}1a`, color: meta.accent }}>
                <Icon name={meta.icon} size={18} color={meta.accent} />
              </div>
              <div className="gc-toast__body">
                {toast.title ? <strong>{toast.title}</strong> : null}
                <span>{toast.message}</span>
              </div>
              <button
                className="gc-toast__close"
                onClick={() => remove(toast.id)}
                aria-label="Dismiss"
              >
                <Icon name="close" size={14} color="#475569" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
};
