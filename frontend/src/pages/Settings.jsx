import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { RotateCcw, ShieldCheck, Database, Server, Info, AlertTriangle, Moon, Sun, Globe2, LockKeyhole, Link2, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const { currentRole, setCurrentRole, activeWorkerCredId, setActiveWorkerCredId, showNotification, triggerRefresh, theme, setTheme, language, setLanguage, t } = useApp();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    try {
      setResetting(true);
      await api.resetDatabase();
      showNotification('Prototype database successfully reset to clean seed data.', 'success');
      triggerRefresh();
      setShowResetModal(false);
    } catch (err) {
      showNotification(`Reset failed: ${err.message}`, 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Prototype Settings & Controls</h2>
          <p className="page-subtitle">
            Environment parameters, active test personas, and development reset controls.
          </p>
        </div>
      </div>

      {/* User Preferences */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title"><span>{t('appearance')} & {t('language')}</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div className="security-integrity-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}><Sun size={17}/><strong>{t('appearance')}</strong></div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button className={theme === 'dark' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTheme('dark')}><Moon size={15}/> {t('dark')}</button>
              <button className={theme === 'light' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTheme('light')}><Sun size={15}/> {t('light')}</button>
            </div>
            <p style={{ fontSize: '.76rem', color: 'var(--text-muted)', marginTop: '.6rem' }}>Saved locally and applied across the entire application.</p>
          </div>
          <div className="security-integrity-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}><Globe2 size={17}/><strong>{t('language')}</strong></div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button className={language === 'en' ? 'btn-primary' : 'btn-secondary'} onClick={() => setLanguage('en')}>{t('english')}</button>
              <button className={language === 'hi' ? 'btn-primary' : 'btn-secondary'} onClick={() => setLanguage('hi')}>{t('hindi')}</button>
            </div>
            <p style={{ fontSize: '.76rem', color: 'var(--text-muted)', marginTop: '.6rem' }}>Core CredID interface supports English and Hindi.</p>
          </div>
        </div>
      </div>

      {/* Security & Integrity */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title"><span style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><LockKeyhole size={18}/> Security & Integrity</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="security-integrity-card"><strong>Backend security</strong><p style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginTop: '.4rem' }}>FastAPI remains authoritative for validation, roles, reputation state and protected operations.</p></div>
          <div className="security-integrity-card"><strong>Audit history</strong><p style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginTop: '.4rem' }}>Security-sensitive actions are recorded in the append-only activity history.</p></div>
          <div className="security-integrity-card"><strong>Blockchain integrity</strong><p style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginTop: '.4rem' }}>Important records can be hashed and anchored. No customer PII is placed on-chain.</p></div>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem', alignItems: 'center', fontSize: '.8rem', color: 'var(--text-secondary)' }}><CheckCircle2 size={16} color="var(--accent-teal)"/> Integrity anchoring is an additional tamper-evidence layer, not proof that a real-world job occurred.</div>
      </div>

      {/* Role Switching */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">
          <span>Active Demonstration Persona</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Simulates the CredID application experience from the perspective of different platform participants.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div
            onClick={() => setCurrentRole('admin')}
            style={{
              cursor: 'pointer',
              background: currentRole === 'admin' ? 'var(--accent-amber-subtle)' : 'var(--bg-surface-elevated)',
              border: `1px solid ${currentRole === 'admin' ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
              padding: '1rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.25rem' }}>Administrator</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Full access to verification queues, dispute reviews, worker management, and system analytics.
            </p>
          </div>

          <div
            onClick={() => setCurrentRole('worker')}
            style={{
              cursor: 'pointer',
              background: currentRole === 'worker' ? 'var(--accent-amber-subtle)' : 'var(--bg-surface-elevated)',
              border: `1px solid ${currentRole === 'worker' ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
              padding: '1rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.25rem' }}>Worker (Amit Sharma)</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Worker-facing experience: logs jobs, attaches photos, views reputation milestones, and shares CredID.
            </p>
          </div>

          <div
            onClick={() => setCurrentRole('customer')}
            style={{
              cursor: 'pointer',
              background: currentRole === 'customer' ? 'var(--accent-amber-subtle)' : 'var(--bg-surface-elevated)',
              border: `1px solid ${currentRole === 'customer' ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
              padding: '1rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.25rem' }}>Customer (Sunita Verma)</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Client experience: confirms service interaction, submits structured quality review, or flags disputes.
            </p>
          </div>
        </div>
      </div>

      {/* System & Architecture Info */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">
          <span>Full-Stack Architecture Diagnostics</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Frontend:</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>React + Vite + Modern CSS</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Service Layer:</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>Centralized REST Service (api.js)</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Backend:</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>FastAPI (Python) + Pydantic</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Database:</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>SQLite (SQLAlchemy ORM)</span>
          </div>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div className="card-title" style={{ color: '#f87171' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            Reset Prototype Database
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Safely drops and recreates the SQLite schema and reseeds the original interconnected records (Amit Sharma, Rajesh Kumar, Priya Patel, etc.)
        </p>
        <button
          className="btn-primary"
          style={{ background: '#dc2626', color: '#fff' }}
          onClick={() => setShowResetModal(true)}
        >
          <RotateCcw size={16} /> Reset to Initial Seed Data
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Confirm Database Reset"
        maxWidth="460px"
      >
        <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          Are you sure you want to re-seed the SQLite database? All newly recorded jobs, feedback, and disputes will be restored to the clean prototype demo state.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setShowResetModal(false)} disabled={resetting}>
            Cancel
          </button>
          <button className="btn-primary" style={{ background: '#dc2626', color: '#fff' }} onClick={handleReset} disabled={resetting}>
            {resetting ? 'Resetting...' : 'Yes, Reset Now'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
