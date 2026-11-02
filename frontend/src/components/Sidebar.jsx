import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Award, 
  CheckCircle2, 
  FileCheck2, 
  AlertCircle, 
  History, 
  BarChart3, 
  UserCheck, 
  Settings,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { activeWorkerCredId, t } = useApp();

  const navItems = [
    { to: '/', label: t('overview'), icon: <LayoutDashboard size={18} /> },
    { to: '/workers', label: t('workers'), icon: <Users size={18} /> },
    { to: '/jobs', label: t('jobs'), icon: <Briefcase size={18} /> },
    { to: '/reputation', label: t('reputation'), icon: <Award size={18} /> },
    { to: '/verification', label: t('verification'), icon: <CheckCircle2 size={18} /> },
    { to: '/evidence', label: t('evidence'), icon: <FileCheck2 size={18} /> },
    { to: '/disputes', label: t('disputes'), icon: <AlertCircle size={18} /> },
    { to: '/activity', label: t('activity'), icon: <History size={18} /> },
    { to: '/analytics', label: t('analytics'), icon: <BarChart3 size={18} /> },
    { to: '/my-credid', label: t('myCredID'), icon: <UserCheck size={18} /> },
    { to: '/settings', label: t('settings'), icon: <Settings size={18} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">C</div>
        <div className="sidebar-brand">
          <h1>CredID</h1>
          <p>Verified Work. Portable Credibility.</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.to === '/'}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div style={{ margin: '1rem 0 0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.85rem 0.5rem' }}>{t('portable')}</p>
          <NavLink
            to={`/credid/${activeWorkerCredId}/public`}
            target="_blank"
            className="nav-item"
            style={{ color: 'var(--accent-amber)' }}
          >
            <ExternalLink size={16} />
            <span>{t('publicCredID')}</span>
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
          <span>FastAPI + SQLite Live</span>
        </div>
      </div>
    </aside>
  );
}
