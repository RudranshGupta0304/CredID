import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const { notification } = useApp();
  if (!notification) return null;

  const isSuccess = notification.type === 'success';
  const isError = notification.type === 'error';

  return (
    <div 
      className="toast-container"
      style={{
        borderColor: isSuccess ? '#10b981' : isError ? '#ef4444' : 'var(--accent-amber)',
      }}
    >
      {isSuccess && <CheckCircle size={18} color="#10b981" />}
      {isError && <AlertCircle size={18} color="#ef4444" />}
      {!isSuccess && !isError && <Info size={18} color="var(--accent-amber)" />}
      <span>{notification.message}</span>
    </div>
  );
}
