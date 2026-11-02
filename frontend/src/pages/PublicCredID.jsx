import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import Badge from '../components/Badge';
import { 
  ShieldCheck, 
  CheckCircle, 
  FileCheck2, 
  MapPin, 
  Award, 
  Calendar, 
  Share2, 
  ExternalLink,
  Lock,
  Star,
  Check
} from 'lucide-react';

export default function PublicCredID() {
  const { cred_id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPublicProfile() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getPublicCredID(cred_id);
        setProfile(data);
      } catch (err) {
        console.error('Failed to load public CredID', err);
        setError(err.message || 'CredID record not found');
      } finally {
        setLoading(false);
      }
    }
    loadPublicProfile();
  }, [cred_id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        <p>Loading portable credential record...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '480px', textAlign: 'center' }}>
          <h3 style={{ color: '#ef4444', marginBottom: '0.75rem' }}>CredID Record Not Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            No verified record exists for CredID identifier <code>{cred_id}</code>.
          </p>
          <Link to="/" className="btn-primary">Return to Directory</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2.5rem 1.5rem', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        {/* Top Portable Header Brand */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="sidebar-logo-icon" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>C</div>
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>CredID</h1>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Verified Work. Portable Credibility.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(16, 185, 129, 0.25)', fontWeight: 600 }}>
              ✓ Authenticated Credential
            </span>
            <button className="btn-secondary" onClick={handleCopy} style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
              {copied ? <Check size={12} color="#10b981" /> : <Share2 size={12} />}
              {copied ? 'Copied' : 'Share Profile'}
            </button>
          </div>
        </div>

        {/* Worker Identity Card */}
        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--border-focus)', background: 'linear-gradient(180deg, #181d27, #131720)' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <img
              src={profile.photo}
              alt={profile.name}
              style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-amber)' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 700 }}>{profile.name}</h2>
                  <p style={{ fontSize: '1rem', color: 'var(--accent-amber)', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.04em' }}>
                    {profile.cred_id}
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {profile.role} • {profile.location}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                  <Badge type={profile.credibility_confidence} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status: {profile.verification_status}</span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.85rem', lineHeight: 1.5 }}>
                {profile.bio}
              </p>
            </div>
          </div>

          {/* Distinguish claimed vs verified */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Claimed Experience:</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{profile.claimed_experience_years} Years</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Worker-provided history</span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Verified Service Jobs:</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>{profile.verified_jobs_count} Confirmed</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Customer attested</span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Evidence-Backed Jobs:</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>{profile.evidence_supported_count} Jobs</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Photo & document proof</span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Average Rating:</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                {profile.average_rating ? `${profile.average_rating} ★` : 'N/A'}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Customer feedback</span>
            </div>
          </div>
        </div>

        {/* Explainable Confidence Statement */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>Credibility Assessment</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {profile.confidence_explanation}
          </p>
        </div>

        {/* Verified Work History Timeline */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title">
            <span>Verified Work History ({profile.verified_work_history.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.75rem' }}>
            {profile.verified_work_history.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No verified jobs completed yet.</p>
            )}
            {profile.verified_work_history.map((job, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                      {job.job_id}
                    </span>
                    <Badge type={job.verification_level} />
                  </div>
                  <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>{job.service_type}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {job.location_general} • Completed {job.completed_date} • Confirmed by {job.customer_initials}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {job.rating && (
                    <span style={{ fontSize: '0.9rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                      {job.rating} ★ Rating
                    </span>
                  )}
                  {job.has_evidence && (
                    <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                      ✓ {job.evidence_count} Attached Proof(s)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy & Portability Statement */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '0.25rem' }}>
            <Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Privacy Notice: Private customer contact numbers and addresses are strictly concealed on public credentials.
          </p>
          <p>{profile.portable_verification_statement}</p>
        </div>
      </div>
    </div>
  );
}
