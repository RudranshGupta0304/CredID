import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import Modal from './Modal';
import { RotateCcw, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';

export default function Topbar() {
  const { currentRole, setCurrentRole, showNotification, triggerRefresh, t } = useApp();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    try {
      setResetting(true);
      await api.resetDatabase();
      showNotification('Demo database restored to clean initial seed data.', 'success');
      triggerRefresh();
      setShowResetModal(false);
    } catch (err) {
      showNotification(`Reset failed: ${err.message}`, 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-badge">
            <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
            {t('prototype')}
          </span>
        </div>

        <div className="topbar-right">
          {/* Active Persona / Role Switcher */}
          <div className="role-switcher" title="Switch viewpoint for demonstration">
            <button
              className={`role-btn ${currentRole === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentRole('admin')}
            >
              {t('adminView')}
            </button>
            <button
              className={`role-btn ${currentRole === 'worker' ? 'active' : ''}`}
              onClick={() => setCurrentRole('worker')}
            >
              {t('workerView')}
            </button>
            <button
              className={`role-btn ${currentRole === 'customer' ? 'active' : ''}`}
              onClick={() => setCurrentRole('customer')}
            >
              {t('customerView')}
            </button>
          </div>

          {/* Reset Demo Button */}
          <button
            className="btn-reset-demo"
            onClick={() => setShowResetModal(true)}
            title="Reset to default seeded demo state"
          >
            <RotateCcw size={13} />
            {t('resetDemo')}
          </button>
        </div>
      </header>

      {/* Confirmation Modal for Reset */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset demo database"
        maxWidth="460px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', color: '#f87171' }}>
            <AlertTriangle size={28} style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
                Restore Seeded Prototype State?
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                This will wipe any newly created test jobs, disputes, or evidence, and re-seed the initial records for Amit Sharma (CRD-ELC-20481) and peers.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              className="btn-secondary"
              onClick={() => setShowResetModal(false)}
              disabled={resetting}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              style={{ background: '#dc2626', color: '#fff' }}
              onClick={handleReset}
              disabled={resetting}
            >
              {resetting ? 'Resetting...' : 'Confirm Reset'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
