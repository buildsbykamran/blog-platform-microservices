import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback((message, type = 'info', duration = 4500) => {
    if (!message) return;
    const id = idCounter += 1;

    setToasts((current) => [...current, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);

    return id;
  }, [dismiss]);

  const value = useMemo(() => ({
    toasts,
    dismiss,
    success: (message, duration) => push(message, 'success', duration),
    error: (message, duration) => push(message, 'error', duration),
    info: (message, duration) => push(message, 'info', duration)
  }), [toasts, dismiss, push]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};
