import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { AlertCircle, Plus, CheckCircle, ShieldAlert, History } from 'lucide-react';

export default function Disputes() {
  const { refreshKey, showNotification, triggerRefresh } = useApp();
  const [disputes, setDisputes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [loading, setLoading] = useState(true);

  // Form
  const [formData, setFormData] = useState({
    job_id: '',
    reason: '',
    description: '',
    raised_by: 'customer'
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const params = statusFilter ? { status: statusFilter } : {};
        const [disputesData, jobsData] = await Promise.all([
          api.getDisputes(params),
          api.getJobs()
        ]);
        setDisputes(disputesData);
        setJobs(jobsData);
        if (jobsData.length > 0 && !formData.job_id) {
          setFormData((prev) => ({ ...prev, job_id: jobsData[0].id }));
        }
      } catch (err) {
        console.error('Error fetching disputes', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [statusFilter, refreshKey]);

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    const targetJob = jobs.find((j) => j.id === parseInt(formData.job_id));
    if (!targetJob) return;

    try {
      await api.createDispute({
        job_id: targetJob.id,
        worker_id: targetJob.worker_id,
        customer_id: targetJob.customer_id,
        ...formData
      });
      showNotification(`Dispute opened on ${targetJob.job_id}. Historical audit log preserved.`, 'warning');
      setShowRaiseModal(false);
      setFormData({
        job_id: jobs[0]?.id || '',
        reason: '',
        description: '',
        raised_by: 'customer'
      });
      triggerRefresh();
    } catch (err) {
      showNotification(`Failed: ${err.message}`, 'error');
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    try {
      await api.resolveDispute(selectedDispute.id, {
        resolution: resolutionText,
        status: 'Resolved',
        resolved_by: 'Admin'
      });
      showNotification(`Dispute ${selectedDispute.dispute_id} resolved! Resolution recorded in activity trail.`, 'success');
      setSelectedDispute(null);
      setResolutionText('');
      triggerRefresh();
    } catch (err) {
      showNotification(`Failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dispute Resolution & Audit Integrity</h2>
          <p className="page-subtitle">
            Preserves tamper-evident interaction history while recording formal complaints and verified resolutions.
          </p>
        </div>
        <button className="btn-primary" style={{ background: '#dc2626' }} onClick={() => setShowRaiseModal(true)}>
          <Plus size={16} /> Open Dispute
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          className={`role-btn ${statusFilter === '' ? 'active' : ''}`}
          onClick={() => setStatusFilter('')}
        >
          All Disputes
        </button>
        <button
          className={`role-btn ${statusFilter === 'Open' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Open')}
        >
          Open
        </button>
        <button
          className={`role-btn ${statusFilter === 'Resolved' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Resolved')}
        >
          Resolved
        </button>
      </div>

      {/* Disputes Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Dispute ID</th>
              <th>Raised By</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Date Opened</th>
              <th>Resolution Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {disputes.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No disputes recorded under this status.
                </td>
              </tr>
            )}
            {disputes.map((d) => (
              <tr key={d.id}>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--accent-amber)', fontFamily: 'monospace' }}>
                    {d.dispute_id}
                  </span>
                </td>
                <td>
                  <span style={{ textTransform: 'capitalize' }}>{d.raised_by}</span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: '#fff' }}>{d.reason}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{d.description}</div>
                </td>
                <td>
                  <Badge type={d.status} />
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(d.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {d.resolution || 'Pending formal review'}
                </td>
                <td>
                  {d.status !== 'Resolved' ? (
                    <button
                      className="btn-action-teal"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                      onClick={() => { setSelectedDispute(d); setResolutionText(d.resolution || ''); }}
                    >
                      Resolve Dispute
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>Resolved</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resolve Dispute Modal */}
      <Modal
        isOpen={!!selectedDispute}
        onClose={() => setSelectedDispute(null)}
        title={selectedDispute ? `Resolve Dispute: ${selectedDispute.dispute_id}` : ''}
        maxWidth="520px"
      >
        {selectedDispute && (
          <form onSubmit={handleResolveDispute}>
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '0.25rem' }}>
                Reason: {selectedDispute.reason}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {selectedDispute.description}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Resolution Summary / Agreed Rectification</label>
              <textarea
                required
                rows="3"
                className="form-textarea"
                placeholder="Detail the agreed rectification, part warranty, or settlement..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
              />
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Resolving updates the job status, generates a resolution reputation event, and leaves historical activity intact.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setSelectedDispute(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-action-teal">
                Record Resolution
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Open Dispute Modal */}
      <Modal
        isOpen={showRaiseModal}
        onClose={() => setShowRaiseModal(false)}
        title="Open Service Dispute"
        maxWidth="500px"
      >
        <form onSubmit={handleRaiseDispute}>
          <div className="form-group">
            <label className="form-label">Service Job</label>
            <select
              className="form-select"
              value={formData.job_id}
              onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}
              required
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.job_id} — {j.service_type} ({j.worker_name})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Dispute Reason</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Incomplete installation or recurring defect"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description of Issue</label>
            <textarea
              required
              rows="3"
              className="form-textarea"
              placeholder="Provide exact factual description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowRaiseModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ background: '#dc2626', color: '#fff' }}>
              Submit Formal Dispute
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
