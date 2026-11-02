import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { BarChart3, PieChart, ShieldAlert, CheckCircle, Briefcase, FileCheck, Users } from 'lucide-react';

export default function Analytics() {
  const { refreshKey } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await api.getAnalytics();
        setData(res);
      } catch (err) {
        console.error('Error fetching analytics', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [refreshKey]);

  if (!data) return <div className="page-container"><p>Loading prototype metrics...</p></div>;

  const { metrics, jobs_by_service, verification_breakdown } = data;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h2 className="page-title">Prototype Analytics</h2>
            <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 600 }}>
              Live SQLite Queries • Demo Data
            </span>
          </div>
          <p className="page-subtitle">
            Ground-truth aggregate statistics queried dynamically from active database records.
          </p>
        </div>
      </div>

      {/* Grid of Key Aggregates */}
      <div className="grid-cols-4">
        <div className="stat-card">
          <span className="stat-label">Total Workers</span>
          <span className="stat-value">{metrics.total_workers}</span>
          <span className="stat-subtext">{metrics.verified_workers} verified by interactions</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Recorded Jobs</span>
          <span className="stat-value" style={{ color: 'var(--accent-amber)' }}>{metrics.total_jobs}</span>
          <span className="stat-subtext">{metrics.verified_jobs} customer attested</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Evidence Records</span>
          <span className="stat-value" style={{ color: '#38bdf8' }}>{metrics.total_evidence_records}</span>
          <span className="stat-subtext">{metrics.evidence_supported_jobs} jobs with attached proof</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Reputation Events</span>
          <span className="stat-value" style={{ color: '#10b981' }}>{metrics.total_reputation_events}</span>
          <span className="stat-subtext">{metrics.open_disputes} open dispute(s)</span>
        </div>
      </div>

      {/* Breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Jobs by Service Type */}
        <div className="card">
          <div className="card-title">
            <span>Jobs by Service Domain</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
            {jobs_by_service.map((item, idx) => {
              const pct = Math.round((item.count / (metrics.total_jobs || 1)) * 100);
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#fff', fontWeight: 500 }}>{item.service}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.count} job(s) ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-amber), #ea580c)', borderRadius: '4px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verification Status Breakdown */}
        <div className="card">
          <div className="card-title">
            <span>Verification Status Distribution</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
            {verification_breakdown.map((item, idx) => {
              const totalVerifs = verification_breakdown.reduce((sum, v) => sum + v.count, 0) || 1;
              const pct = Math.round((item.count / totalVerifs) * 100);
              let barColor = 'var(--accent-amber)';
              if (item.status.includes('Verified')) barColor = '#10b981';
              if (item.status.includes('Evidence')) barColor = '#38bdf8';
              if (item.status.includes('Needs Review')) barColor = '#f97316';

              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#fff', fontWeight: 500 }}>{item.status}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.count} ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '4px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
