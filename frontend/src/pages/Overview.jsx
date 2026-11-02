import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import Badge from '../components/Badge';
import { 
  Users, 
  CheckCircle, 
  Briefcase, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  FileCheck,
  MessageSquare,
  Sparkles,
  QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Overview() {
  const { refreshKey } = useApp();
  const [metrics, setMetrics] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [analyticsRes, jobsRes, verifRes, activityRes] = await Promise.all([
          api.getAnalytics(),
          api.getJobs(),
          api.getVerifications({ status: 'Pending' }),
          api.getActivity({ limit: 6 })
        ]);
        setMetrics(analyticsRes.metrics);
        setRecentJobs(jobsRes.slice(0, 5));
        setPendingVerifications(verifRes.slice(0, 4));
        setRecentActivity(activityRes);
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">CredID Reputation Engine</h2>
          <p className="page-subtitle">
            Verified interactions, customer attestations, and portable reputation records for informal skilled workers.
          </p>
        </div>
      </div>

      {/* Trust Flow Visualization */}
      <div className="trust-flow-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>The CredID Trust Flow</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Separates interaction confirmation from evidence support and quality reputation.
            </p>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', background: 'var(--accent-amber-subtle)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            Deterministic State Pipeline
          </span>
        </div>

        <div className="flow-steps">
          <div className="flow-step active">
            <div className="flow-step-icon"><Users size={20} /></div>
            <span className="flow-step-title">1. Worker Identity</span>
            <span className="flow-step-desc">Claimed Experience</span>
          </div>
          <span className="flow-arrow"><ArrowRight size={16} /></span>
          
          <div className="flow-step active">
            <div className="flow-step-icon"><Briefcase size={20} /></div>
            <span className="flow-step-title">2. Job Interaction</span>
            <span className="flow-step-desc">Service Recorded</span>
          </div>
          <span className="flow-arrow"><ArrowRight size={16} /></span>

          <div className="flow-step active">
            <div className="flow-step-icon"><FileCheck size={20} /></div>
            <span className="flow-step-title">3. Evidence</span>
            <span className="flow-step-desc">Photos & Invoices</span>
          </div>
          <span className="flow-arrow"><ArrowRight size={16} /></span>

          <div className="flow-step active">
            <div className="flow-step-icon"><CheckCircle size={20} /></div>
            <span className="flow-step-title">4. Customer Confirmed</span>
            <span className="flow-step-desc">Attested Interaction</span>
          </div>
          <span className="flow-arrow"><ArrowRight size={16} /></span>

          <div className="flow-step active">
            <div className="flow-step-icon"><MessageSquare size={20} /></div>
            <span className="flow-step-title">5. Feedback</span>
            <span className="flow-step-desc">Structured Rating</span>
          </div>
          <span className="flow-arrow"><ArrowRight size={16} /></span>

          <div className="flow-step active">
            <div className="flow-step-icon"><Sparkles size={20} /></div>
            <span className="flow-step-title">6. Reputation Event</span>
            <span className="flow-step-desc">Audit Record</span>
          </div>
          <span className="flow-arrow"><ArrowRight size={16} /></span>

          <div className="flow-step active">
            <div className="flow-step-icon"><QrCode size={20} /></div>
            <span className="flow-step-title">7. Portable CredID</span>
            <span className="flow-step-desc">Shareable Credential</span>
          </div>
        </div>
      </div>

      {/* Database-Driven Key Metrics */}
      <div className="grid-cols-4">
        <div className="stat-card">
          <span className="stat-label">Total Workers</span>
          <span className="stat-value">{metrics ? metrics.total_workers : '-'}</span>
          <span className="stat-subtext">Registered across professions</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Verified Workers</span>
          <span className="stat-value" style={{ color: '#10b981' }}>{metrics ? metrics.verified_workers : '-'}</span>
          <span className="stat-subtext">Profiles with confirmed records</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Verified Jobs</span>
          <span className="stat-value" style={{ color: 'var(--accent-amber)' }}>{metrics ? metrics.verified_jobs : '-'}</span>
          <span className="stat-subtext">{metrics ? metrics.evidence_supported_jobs : '-'} evidence-supported</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Pending Verifications</span>
          <span className="stat-value" style={{ color: '#f59e0b' }}>{metrics ? metrics.pending_verifications : '-'}</span>
          <span className="stat-subtext">{metrics ? metrics.open_disputes : '-'} open disputes</span>
        </div>
      </div>

      {/* Main Grid: Recent Jobs + Pending Queue */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Recent Jobs */}
        <div className="card">
          <div className="card-title">
            <span>Recent Service Interactions</span>
            <Link to="/jobs" style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>View All Jobs →</Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Worker</th>
                  <th>Service</th>
                  <th>Verification Level</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No jobs found</td></tr>
                )}
                {recentJobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{job.job_id}</span>
                    </td>
                    <td>{job.worker_name}</td>
                    <td>{job.service_type}</td>
                    <td>
                      <Badge type={job.interaction_verification_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Queue */}
        <div className="card">
          <div className="card-title">
            <span>Pending Verification Queue</span>
            <Link to="/verification" style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>Review Queue →</Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Verification ID</th>
                  <th>Status</th>
                  <th>Verification Method</th>
                </tr>
              </thead>
              <tbody>
                {pendingVerifications.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>All verifications current</td></tr>
                )}
                {pendingVerifications.map((v) => (
                  <tr key={v.id}>
                    <td><span style={{ fontWeight: 600 }}>{v.verification_id}</span></td>
                    <td><Badge type={v.status} /></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v.verification_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Append-Only Recent Activity Log */}
      <div className="card">
        <div className="card-title">
          <span>Append-Only Activity Audit Trail</span>
          <Link to="/activity" style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>Full Audit History →</Link>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Event Type</th>
                <th>Entity</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((act) => (
                <tr key={act.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(act.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'var(--bg-surface-elevated)' }}>
                      {act.actor}
                    </span>
                  </td>
                  <td><span style={{ fontWeight: 500 }}>{act.event_type}</span></td>
                  <td><span style={{ color: 'var(--accent-amber)', fontSize: '0.82rem' }}>{act.entity_id}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{act.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
