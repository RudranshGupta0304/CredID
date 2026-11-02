import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { CheckCircle, Clock, AlertTriangle, ShieldCheck, Check, Eye } from 'lucide-react';

export default function Verification() {
  const { refreshKey, showNotification, triggerRefresh } = useApp();
  const [verifications, setVerifications] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedVerif, setSelectedVerif] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVerifications() {
      try {
        setLoading(true);
        const params = activeTab === 'All' ? {} : { status: activeTab };
        const data = await api.getVerifications(params);
        setVerifications(data);
      } catch (err) {
        console.error('Error fetching verifications', err);
      } finally {
        setLoading(false);
      }
    }
    loadVerifications();
  }, [activeTab, refreshKey]);

  const handleReview = async (newStatus) => {
    if (!selectedVerif) return;
    try {
      await api.reviewVerification(selectedVerif.id, {
        status: newStatus,
        notes: reviewNotes || `Admin marked as ${newStatus}`,
        reviewer: 'Admin'
      });
      showNotification(`Verification record updated to '${newStatus}'`, 'success');
      setSelectedVerif(null);
      setReviewNotes('');
      triggerRefresh();
    } catch (err) {
      showNotification(`Review failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Verification Operations Queue</h2>
          <p className="page-subtitle">
            Administer customer interaction confirmations, photo proof reviews, and suspicious pattern investigations.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
        {['All', 'Pending', 'Interaction Verified', 'Evidence Supported', 'Needs Review'].map((tab) => (
          <button
            key={tab}
            className={`role-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Verification Records Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Verification ID</th>
              <th>Status</th>
              <th>Method</th>
              <th>Verified At</th>
              <th>Admin / Audit Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {verifications.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No verification items under this filter.
                </td>
              </tr>
            )}
            {verifications.map((v) => (
              <tr key={v.id}>
                <td>
                  <span style={{ fontWeight: 600, color: '#fff', fontFamily: 'monospace' }}>
                    {v.verification_id}
                  </span>
                </td>
                <td>
                  <Badge type={v.status} />
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {v.verification_method}
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {v.verified_at ? new Date(v.verified_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {v.notes || 'No review notes'}
                </td>
                <td>
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                    onClick={() => { setSelectedVerif(v); setReviewNotes(v.notes || ''); }}
                  >
                    Review / Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Verification Review Modal */}
      <Modal
        isOpen={!!selectedVerif}
        onClose={() => setSelectedVerif(null)}
        title={selectedVerif ? `Review Verification: ${selectedVerif.verification_id}` : ''}
        maxWidth="500px"
      >
        {selectedVerif && (
          <div>
            <div style={{ marginBottom: '1rem', background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Current Status:</p>
              <div style={{ marginTop: '0.25rem' }}>
                <Badge type={selectedVerif.status} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Review Notes / Attestation Explanation</label>
              <textarea
                rows="3"
                className="form-textarea"
                placeholder="Enter audit or verification notes..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Select target status to update this interaction:
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                className="btn-action-teal"
                onClick={() => handleReview('Interaction Verified')}
              >
                Mark Interaction Verified
              </button>
              <button
                className="btn-primary"
                onClick={() => handleReview('Evidence Supported')}
              >
                Mark Evidence Supported
              </button>
              <button
                className="btn-secondary"
                style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                onClick={() => handleReview('Needs Review')}
              >
                Flag Needs Review
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
