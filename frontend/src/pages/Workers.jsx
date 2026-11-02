import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { 
  Search, 
  Filter, 
  UserCheck, 
  ExternalLink, 
  Briefcase, 
  Calendar, 
  MapPin, 
  Phone, 
  Star,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Workers() {
  const { refreshKey, showNotification, triggerRefresh, setActiveWorkerCredId } = useApp();
  const [workers, setWorkers] = useState([]);
  const [search, setSearch] = useState('');
  const [professionFilter, setProfessionFilter] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New worker form
  const [newWorker, setNewWorker] = useState({
    name: '',
    role: 'Electrician',
    skills: '',
    experience_years: 3,
    location: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    async function fetchWorkers() {
      try {
        setLoading(true);
        const params = {};
        if (search) params.search = search;
        if (professionFilter) params.profession = professionFilter;
        if (confidenceFilter) params.confidence = confidenceFilter;
        const data = await api.getWorkers(params);
        setWorkers(data);
      } catch (err) {
        console.error('Error fetching workers', err);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkers();
  }, [search, professionFilter, confidenceFilter, refreshKey]);

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    try {
      const created = await api.createWorker(newWorker);
      showNotification(`Worker ${created.name} registered with CredID ${created.cred_id}`, 'success');
      setShowCreateModal(false);
      setNewWorker({
        name: '',
        role: 'Electrician',
        skills: '',
        experience_years: 3,
        location: '',
        phone: '',
        bio: ''
      });
      triggerRefresh();
    } catch (err) {
      showNotification(`Failed to register worker: ${err.message}`, 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Workers Directory</h2>
          <p className="page-subtitle">
            Authentic professional credentials distinguishing claimed experience from verified jobs.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Register Worker
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by worker name, CredID, skills, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          value={professionFilter}
          onChange={(e) => setProfessionFilter(e.target.value)}
          style={{ minWidth: '160px' }}
        >
          <option value="">All Professions</option>
          <option value="electrician">Electricians</option>
          <option value="plumber">Plumbers</option>
          <option value="carpenter">Carpenters</option>
        </select>

        <select
          className="form-select"
          value={confidenceFilter}
          onChange={(e) => setConfidenceFilter(e.target.value)}
          style={{ minWidth: '180px' }}
        >
          <option value="">All Confidence Levels</option>
          <option value="high confidence">High Confidence</option>
          <option value="medium confidence">Medium Confidence</option>
          <option value="limited history">Limited History</option>
          <option value="needs review">Needs Review</option>
        </select>
      </div>

      {/* Workers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {workers.map((w) => (
          <div key={w.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <img
                  src={w.photo}
                  alt={w.name}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-subtle)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 600 }}>{w.name}</h3>
                    <Badge type={w.credibility_confidence} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', fontFamily: 'monospace', fontWeight: 600 }}>
                    {w.cred_id}
                  </span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{w.role}</p>
                </div>
              </div>

              {/* Distinguish Claimed vs Verified */}
              <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Claimed Experience:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{w.experience_years} years</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Verified Customer Jobs:</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{w.verified_jobs_count} confirmed</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Evidence-Supported:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{w.evidence_supported_jobs_count} jobs</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                {w.skills.split(',').slice(0, 3).map((skill, idx) => (
                  <span key={idx} style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.15rem 0.45rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setSelectedWorker(w)}
              >
                Inspect Profile
              </button>
              <Link
                to={`/credid/${w.cred_id}/public`}
                target="_blank"
                className="btn-action-teal"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                title="View portable credential representation"
              >
                <ExternalLink size={14} /> Public
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Worker Profile Detail Modal */}
      <Modal
        isOpen={!!selectedWorker}
        onClose={() => setSelectedWorker(null)}
        title={selectedWorker ? `${selectedWorker.name} — CredID Record` : ''}
        maxWidth="620px"
      >
        {selectedWorker && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
              <img
                src={selectedWorker.photo}
                alt={selectedWorker.name}
                style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <h3 style={{ color: '#fff', fontSize: '1.2rem' }}>{selectedWorker.name}</h3>
                <p style={{ color: 'var(--accent-amber)', fontFamily: 'monospace', fontWeight: 600 }}>
                  {selectedWorker.cred_id}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <Badge type={selectedWorker.credibility_confidence} />
                  <Badge type={selectedWorker.verification_status} />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                <strong>Credibility Confidence:</strong> {selectedWorker.credibility_confidence}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {selectedWorker.confidence_reason}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Location:</span>
                <span style={{ color: '#fff' }}>{selectedWorker.location}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Claimed Experience:</span>
                <span style={{ color: '#fff' }}>{selectedWorker.experience_years} years (worker-provided)</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Verified Jobs Count:</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>{selectedWorker.verified_jobs_count} confirmed jobs</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Active Disputes:</span>
                <span style={{ color: selectedWorker.active_disputes_count > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                  {selectedWorker.active_disputes_count} open
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'block', marginBottom: '0.3rem' }}>
                Skills & Specializations:
              </span>
              <p style={{ fontSize: '0.88rem', color: '#fff' }}>{selectedWorker.skills}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setActiveWorkerCredId(selectedWorker.cred_id);
                  showNotification(`Active demo worker set to ${selectedWorker.name}`, 'info');
                }}
              >
                Set as Active Worker View
              </button>
              <Link
                to={`/credid/${selectedWorker.cred_id}/public`}
                target="_blank"
                className="btn-primary"
              >
                Open Shareable CredID →
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* Register Worker Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Register Informal Skilled Worker"
        maxWidth="540px"
      >
        <form onSubmit={handleCreateWorker}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Mukesh Yadav"
              value={newWorker.name}
              onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Profession / Role</label>
              <select
                className="form-select"
                value={newWorker.role}
                onChange={(e) => setNewWorker({ ...newWorker, role: e.target.value })}
              >
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="Carpenter">Carpenter</option>
                <option value="Appliance Technician">Appliance Technician</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Claimed Experience (Years)</label>
              <input
                type="number"
                min="0"
                max="50"
                className="form-input"
                value={newWorker.experience_years}
                onChange={(e) => setNewWorker({ ...newWorker, experience_years: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Skills (comma-separated)</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Inverter Wiring, DB Dressing, Earthing Test"
              value={newWorker.skills}
              onChange={(e) => setNewWorker({ ...newWorker, skills: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Sector 18, Noida"
                value={newWorker.location}
                onChange={(e) => setNewWorker({ ...newWorker, location: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Contact</label>
              <input
                type="text"
                className="form-input"
                placeholder="+91 98XXX XXXXX"
                value={newWorker.phone}
                onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bio / Background</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Brief professional background..."
              value={newWorker.bio}
              onChange={(e) => setNewWorker({ ...newWorker, bio: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Generate CredID Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
