import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { 
  QrCode, 
  Share2, 
  ExternalLink, 
  Briefcase, 
  CheckCircle, 
  Star, 
  MapPin, 
  ShieldCheck,
  FileCheck2,
  Copy,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyCredID() {
  const { activeWorkerCredId, refreshKey, showNotification } = useApp();
  const [integrity, setIntegrity] = useState({});
  const [profile, setProfile] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkerProfile() {
      try {
        setLoading(true);
        const data = await api.getCredID(activeWorkerCredId);
        setProfile(data);
      } catch (err) {
        console.error('Error loading worker profile', err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkerProfile();
  }, [activeWorkerCredId, refreshKey]);

  useEffect(() => {
    if (!profile?.jobs?.length) return;
    Promise.all(profile.jobs.slice(0, 5).map(j => api.verifyJobIntegrity(j.job_id).then(r => ({ id: j.job_id, ...r })).catch(() => ({ id: j.job_id, status: 'Not Anchored' }))))
      .then(results => setIntegrity(Object.fromEntries(results.map(r => [r.id, r]))));
  }, [profile]);

  if (!profile) return <div className="page-container"><p>Loading CredID profile...</p></div>;

  const { worker, metrics, jobs, evidence, feedback, reputation_events } = profile;
  const shareableUrl = `${window.location.origin}/credid/${worker.cred_id}/public`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    showNotification('Shareable CredID link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="page-container">
      {/* Simple, intuitive worker header */}
      <div style={{ background: 'linear-gradient(135deg, #181d27, #131720)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <img
            src={worker.photo}
            alt={worker.name}
            style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-amber)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 700 }}>{worker.name}</h2>
              <Badge type={metrics.credibility_confidence} />
            </div>
            <p style={{ color: 'var(--accent-amber)', fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.05em' }}>
              {worker.cred_id}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {worker.role} • {worker.location}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setShowShareModal(true)}>
            <QrCode size={16} /> Portable QR Card
          </button>
          <Link to={`/credid/${worker.cred_id}/public`} target="_blank" className="btn-primary">
            <ExternalLink size={16} /> Open Public View
          </Link>
        </div>
      </div>

      {/* Key Stats for Worker */}
      <div className="grid-cols-4">
        <div className="stat-card">
          <span className="stat-label">Claimed Experience</span>
          <span className="stat-value">{worker.experience_years} Years</span>
          <span className="stat-subtext">Worker-stated career background</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Verified Customer Jobs</span>
          <span className="stat-value" style={{ color: '#10b981' }}>{metrics.verified_jobs_count}</span>
          <span className="stat-subtext">Customer attested interactions</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Evidence-Supported</span>
          <span className="stat-value" style={{ color: '#38bdf8' }}>{metrics.evidence_supported_jobs_count}</span>
          <span className="stat-subtext">Photos & invoices attached</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average Rating</span>
          <span className="stat-value" style={{ color: 'var(--accent-amber)' }}>
            {metrics.average_rating ? `${metrics.average_rating} ★` : 'N/A'}
          </span>
          <span className="stat-subtext">From structured customer reviews</span>
        </div>
      </div>

      {/* Skills Showcase */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">
          <span>Registered Skill Matrix</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
          {worker.skills.map((skill, idx) => (
            <span
              key={idx}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 500
              }}
            >
              ✓ {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Integrity Layer */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title"><span style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><ShieldCheck size={18}/> Blockchain-backed Integrity</span></div>
        <p style={{ fontSize: '.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          CredID hashes important reputation records and checks them against their integrity anchor. This detects later record changes; it does not prove that a real-world job occurred.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '.75rem' }}>
          {jobs.slice(0, 4).map(j => { const r = integrity[j.job_id]; const ok = r?.status === 'Integrity Verified'; return (
            <div className="security-integrity-card" key={j.job_id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}><strong style={{ fontFamily: 'monospace' }}>{j.job_id}</strong><span className={`security-integrity-status ${ok ? 'ok' : 'warn'}`}>{ok ? '✓ Verified' : (r?.status || 'Checking')}</span></div>
              {r?.transaction_reference && <p style={{ marginTop: '.45rem', fontSize: '.72rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{r.transaction_reference}</p>}
            </div>
          ); })}
        </div>
      </div>

      {/* Verified Job History */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">
          <span>My Verified Service History</span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Service Done</th>
                <th>Customer Name</th>
                <th>Scheduled / Completed</th>
                <th>Verification State</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-amber)' }}>
                      {j.job_id}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500, color: '#fff' }}>{j.service_type}</td>
                  <td>{j.customer_name}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {j.completed_at ? new Date(j.completed_at).toLocaleDateString() : j.scheduled_date}
                  </td>
                  <td>
                    <Badge type={j.interaction_verification_status} />
                  </td>
                  <td>
                    <Badge type={j.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shareable QR Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Portable CredID Card"
        maxWidth="440px"
      >
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          {/* Simulated QR Code Canvas */}
          <div style={{ width: '180px', height: '180px', margin: '0 auto 1.25rem', background: '#fff', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
            <div style={{ width: '100%', height: '100%', border: '4px solid #000', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', padding: '6px', background: '#f8fafc' }}>
              <div style={{ background: '#000' }}></div>
              <div style={{ background: '#000' }}></div>
              <div></div>
              <div style={{ background: '#000' }}></div>
              <div style={{ background: '#000' }}></div>
              <div style={{ background: '#000' }}></div>
              <div></div>
              <div style={{ background: '#000' }}></div>
              <div></div>
              <div style={{ background: '#000' }}></div>
              <div></div>
              <div style={{ background: '#000' }}></div>
              <div style={{ background: 'var(--accent-amber)' }}></div>
              <div style={{ background: '#000' }}></div>
              <div></div>
              <div style={{ background: '#000' }}></div>
              <div></div>
              <div style={{ background: '#000' }}></div>
              <div></div>
              <div style={{ background: '#000' }}></div>
              <div style={{ background: '#000' }}></div>
              <div style={{ background: '#000' }}></div>
              <div></div>
              <div style={{ background: '#000' }}></div>
              <div style={{ background: '#000' }}></div>
            </div>
          </div>

          <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{worker.name}</h4>
          <p style={{ color: 'var(--accent-amber)', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            {worker.cred_id}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', padding: '0 1rem' }}>
            Show this QR code to customers, contractors, or platforms to verify your completed work history.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={handleCopyLink} style={{ fontSize: '0.82rem' }}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Public Link'}
            </button>
            <Link to={`/credid/${worker.cred_id}/public`} target="_blank" className="btn-primary" style={{ fontSize: '0.82rem' }}>
              Open Profile →
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
