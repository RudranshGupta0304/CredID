import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { FileCheck, Image, FileText, Plus, ExternalLink } from 'lucide-react';

export default function EvidencePage() {
  const { refreshKey, showNotification, triggerRefresh } = useApp();
  const [evidenceList, setEvidenceList] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form
  const [formData, setFormData] = useState({
    job_id: '',
    type: 'completion_photo',
    title: '',
    description: '',
    file_reference: 'evidence/work_completion_photo.jpg'
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const params = typeFilter ? { evidence_type: typeFilter } : {};
        const [evData, jobsData] = await Promise.all([
          api.getEvidence(params),
          api.getJobs()
        ]);
        setEvidenceList(evData);
        setJobs(jobsData);
        if (jobsData.length > 0 && !formData.job_id) {
          setFormData((prev) => ({ ...prev, job_id: jobsData[0].id }));
        }
      } catch (err) {
        console.error('Error fetching evidence', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [typeFilter, refreshKey]);

  const handleAddEvidence = async (e) => {
    e.preventDefault();
    const targetJob = jobs.find((j) => j.id === parseInt(formData.job_id));
    if (!targetJob) return;

    try {
      await api.createEvidence({
        job_id: targetJob.id,
        worker_id: targetJob.worker_id,
        ...formData
      });
      showNotification(`Evidence item '${formData.title}' attached to ${targetJob.job_id}!`, 'success');
      setShowAddModal(false);
      setFormData({
        job_id: jobs[0]?.id || '',
        type: 'completion_photo',
        title: '',
        description: '',
        file_reference: 'evidence/work_completion_photo.jpg'
      });
      triggerRefresh();
    } catch (err) {
      showNotification(`Failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Evidence Library</h2>
          <p className="page-subtitle">
            Grounding service claims in photographic records, invoices, and diagnostic receipts.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Attach Evidence
        </button>
      </div>

      {/* Filter by Type */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className={`role-btn ${typeFilter === '' ? 'active' : ''}`}
          onClick={() => setTypeFilter('')}
        >
          All Types
        </button>
        <button
          className={`role-btn ${typeFilter === 'completion_photo' ? 'active' : ''}`}
          onClick={() => setTypeFilter('completion_photo')}
        >
          Completion Photos
        </button>
        <button
          className={`role-btn ${typeFilter === 'invoice_reference' ? 'active' : ''}`}
          onClick={() => setTypeFilter('invoice_reference')}
        >
          Invoices & Slips
        </button>
        <button
          className={`role-btn ${typeFilter === 'supporting_document' ? 'active' : ''}`}
          onClick={() => setTypeFilter('supporting_document')}
        >
          Technical Documents
        </button>
      </div>

      {/* Evidence Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {evidenceList.map((item) => (
          <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-amber)', fontSize: '0.85rem' }}>
                  {item.evidence_id}
                </span>
                <Badge type={item.verification_status} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {item.type === 'completion_photo' ? <Image size={18} color="#38bdf8" /> : <FileText size={18} color="var(--accent-amber)" />}
                <h4 style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>{item.title}</h4>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                {item.description || 'Verified job documentation record.'}
              </p>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>File Reference: </span>
                <code style={{ color: '#fff' }}>{item.file_reference}</code>
              </div>
            </div>

            <div style={{ paddingTop: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Job #{item.job_id}</span>
              <span>{new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Attach Evidence Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Attach Evidence Record"
        maxWidth="500px"
      >
        <form onSubmit={handleAddEvidence}>
          <div className="form-group">
            <label className="form-label">Target Job</label>
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
            <label className="form-label">Evidence Type</label>
            <select
              className="form-select"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="completion_photo">Work Completion Photo</option>
              <option value="invoice_reference">Invoice / Part Replacement Slip</option>
              <option value="service_description">Technical Service Specification</option>
              <option value="supporting_document">Warranty / Compliance Certificate</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Submeter Calibration Readout"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Technical Description</label>
            <textarea
              rows="2"
              className="form-textarea"
              placeholder="Key technical details recorded..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">File Reference (Local / Cloud Object)</label>
            <input
              type="text"
              className="form-input"
              value={formData.file_reference}
              onChange={(e) => setFormData({ ...formData, file_reference: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Attach Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
