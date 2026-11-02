import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { 
  Plus, 
  Search, 
  CheckCircle, 
  FilePlus2, 
  MessageSquare, 
  AlertTriangle, 
  Check, 
  Clock, 
  MapPin, 
  IndianRupee,
  ShieldCheck,
  Calendar
} from 'lucide-react';

export default function Jobs() {
  const { currentRole, refreshKey, showNotification, triggerRefresh } = useApp();
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Action Modals
  const [confirmModalJob, setConfirmModalJob] = useState(null);
  const [evidenceModalJob, setEvidenceModalJob] = useState(null);
  const [feedbackModalJob, setFeedbackModalJob] = useState(null);
  const [disputeModalJob, setDisputeModalJob] = useState(null);

  // Create Job Form
  const [jobForm, setJobForm] = useState({
    worker_id: '',
    customer_id: '',
    service_type: '',
    description: '',
    location: '',
    amount: 1500,
    scheduled_date: new Date().toISOString().split('T')[0],
    evidence_title: '',
    evidence_file: ''
  });

  // Evidence Form
  const [evidenceForm, setEvidenceForm] = useState({
    type: 'completion_photo',
    title: '',
    description: '',
    file_reference: 'evidence/work_record.jpg'
  });

  // Feedback Form
  const [feedbackForm, setFeedbackForm] = useState({
    quality: 5,
    reliability: 5,
    timeliness: 5,
    professionalism: 5,
    comment: ''
  });

  // Dispute Form
  const [disputeForm, setDisputeForm] = useState({
    reason: '',
    description: '',
    raised_by: 'customer'
  });

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        const params = {};
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        if (verificationFilter) params.verification_status = verificationFilter;

        const [jobsData, workersData, customersData] = await Promise.all([
          api.getJobs(params),
          api.getWorkers(),
          api.getCustomers()
        ]);
        setJobs(jobsData);
        setWorkers(workersData);
        setCustomers(customersData);

        if (workersData.length > 0 && !jobForm.worker_id) {
          setJobForm((prev) => ({
            ...prev,
            worker_id: workersData[0].id,
            customer_id: customersData[0]?.id || ''
          }));
        }
      } catch (err) {
        console.error('Error fetching jobs', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [search, statusFilter, verificationFilter, refreshKey]);

  // Step 6: Create Job on Backend
  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...jobForm,
        worker_id: parseInt(jobForm.worker_id),
        customer_id: parseInt(jobForm.customer_id),
        amount: parseFloat(jobForm.amount) || 0
      };
      const created = await api.createJob(payload);
      showNotification(`Job ${created.job_id} created in 'Pending Confirmation' status!`, 'success');
      setShowCreateModal(false);
      setCreateStep(1);
      triggerRefresh();
    } catch (err) {
      showNotification(`Failed to create job: ${err.message}`, 'error');
    }
  };

  // Customer Confirms Job
  const handleConfirmJob = async () => {
    if (!confirmModalJob) return;
    try {
      const res = await api.confirmJob(confirmModalJob.id);
      showNotification(
        `Job ${res.job_id} interaction verified! Note: Customer confirmation verifies the interaction occurred, not overall work quality.`,
        'success'
      );
      setConfirmModalJob(null);
      triggerRefresh();
    } catch (err) {
      showNotification(`Confirmation failed: ${err.message}`, 'error');
    }
  };

  // Add Evidence
  const handleAddEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceModalJob) return;
    try {
      await api.createEvidence({
        job_id: evidenceModalJob.id,
        worker_id: evidenceModalJob.worker_id,
        ...evidenceForm
      });
      showNotification(`Evidence attached to ${evidenceModalJob.job_id}. Status updated to Evidence Supported!`, 'success');
      setEvidenceModalJob(null);
      setEvidenceForm({ type: 'completion_photo', title: '', description: '', file_reference: 'evidence/work_record.jpg' });
      triggerRefresh();
    } catch (err) {
      showNotification(`Failed to attach evidence: ${err.message}`, 'error');
    }
  };

  // Submit Feedback
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackModalJob) return;
    try {
      await api.submitFeedback({
        job_id: feedbackModalJob.id,
        worker_id: feedbackModalJob.worker_id,
        customer_id: feedbackModalJob.customer_id,
        ...feedbackForm
      });
      showNotification(`Structured feedback recorded. Reputation event created!`, 'success');
      setFeedbackModalJob(null);
      setFeedbackForm({ quality: 5, reliability: 5, timeliness: 5, professionalism: 5, comment: '' });
      triggerRefresh();
    } catch (err) {
      showNotification(`Failed to submit feedback: ${err.message}`, 'error');
    }
  };

  // Raise Dispute
  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!disputeModalJob) return;
    try {
      await api.createDispute({
        job_id: disputeModalJob.id,
        worker_id: disputeModalJob.worker_id,
        customer_id: disputeModalJob.customer_id,
        ...disputeForm
      });
      showNotification(`Dispute opened. Status marked as Needs Review and history preserved.`, 'warning');
      setDisputeModalJob(null);
      setDisputeForm({ reason: '', description: '', raised_by: 'customer' });
      triggerRefresh();
    } catch (err) {
      showNotification(`Failed to raise dispute: ${err.message}`, 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Service Jobs & Interaction Verification</h2>
          <p className="page-subtitle">
            Records real service encounters with clear separation between customer confirmation, evidence, and feedback.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Record Verified Job
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by Job ID, service description, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          value={verificationFilter}
          onChange={(e) => setVerificationFilter(e.target.value)}
          style={{ minWidth: '180px' }}
        >
          <option value="">All Verification States</option>
          <option value="Pending">Pending Confirmation</option>
          <option value="Interaction Verified">Interaction Verified</option>
          <option value="Evidence Supported">Evidence Supported</option>
          <option value="Needs Review">Needs Review</option>
        </select>

        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ minWidth: '150px' }}
        >
          <option value="">All Job Statuses</option>
          <option value="Pending Confirmation">Pending Confirmation</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="Disputed">Disputed</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      {/* Jobs Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Worker</th>
              <th>Customer</th>
              <th>Service Details</th>
              <th>Scheduled</th>
              <th>Interaction Status</th>
              <th>Job Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No matching jobs found.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>
                  <span style={{ fontWeight: 700, color: 'var(--accent-amber)', fontFamily: 'monospace' }}>
                    {job.job_id}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{job.worker_name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{job.worker_cred_id}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{job.customer_name}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 500, color: '#fff' }}>{job.service_type}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{job.location} • ₹{job.amount}</div>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {job.scheduled_date || 'N/A'}
                </td>
                <td>
                  <Badge type={job.interaction_verification_status} />
                </td>
                <td>
                  <Badge type={job.status} />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {/* Action 1: Confirm Interaction */}
                    {job.status === 'Pending Confirmation' && (
                      <button
                        className="btn-action-teal"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                        onClick={() => setConfirmModalJob(job)}
                        title="Customer verifies the service interaction occurred"
                      >
                        <Check size={12} /> Confirm
                      </button>
                    )}

                    {/* Action 2: Add Evidence */}
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                      onClick={() => setEvidenceModalJob(job)}
                      title="Attach photographic or invoice evidence"
                    >
                      <FilePlus2 size={12} /> Evidence
                    </button>

                    {/* Action 3: Submit Feedback */}
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                      onClick={() => setFeedbackModalJob(job)}
                      title="Customer structured review"
                    >
                      <MessageSquare size={12} /> Review
                    </button>

                    {/* Action 4: Raise Dispute */}
                    {job.status !== 'Disputed' && (
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', color: '#f87171' }}
                        onClick={() => setDisputeModalJob(job)}
                        title="Flag issue or dispute"
                      >
                        <AlertTriangle size={12} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Multi-Step Create Verified Job Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setCreateStep(1); }}
        title="Record New Verified Service Job"
        maxWidth="600px"
      >
        <div>
          {/* Step indicators */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: createStep === 1 ? 'var(--accent-amber)' : 'var(--text-muted)', fontWeight: 600 }}>
              1. Worker & Customer
            </span>
            <span style={{ fontSize: '0.8rem', color: createStep === 2 ? 'var(--accent-amber)' : 'var(--text-muted)', fontWeight: 600 }}>
              2. Service Scope
            </span>
            <span style={{ fontSize: '0.8rem', color: createStep === 3 ? 'var(--accent-amber)' : 'var(--text-muted)', fontWeight: 600 }}>
              3. Evidence & Review
            </span>
          </div>

          <form onSubmit={handleCreateJob}>
            {createStep === 1 && (
              <div>
                <div className="form-group">
                  <label className="form-label">Select Worker</label>
                  <select
                    className="form-select"
                    value={jobForm.worker_id}
                    onChange={(e) => setJobForm({ ...jobForm, worker_id: e.target.value })}
                    required
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.cred_id}) — {w.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Customer</label>
                  <select
                    className="form-select"
                    value={jobForm.customer_id}
                    onChange={(e) => setJobForm({ ...jobForm, customer_id: e.target.value })}
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button type="button" className="btn-primary" onClick={() => setCreateStep(2)}>
                    Next: Service Scope →
                  </button>
                </div>
              </div>
            )}

            {createStep === 2 && (
              <div>
                <div className="form-group">
                  <label className="form-label">Service Type / Task</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Submeter Rewiring & Circuit Breaker Replacement"
                    value={jobForm.service_type}
                    onChange={(e) => setJobForm({ ...jobForm, service_type: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Service Description</label>
                  <textarea
                    required
                    rows="3"
                    className="form-textarea"
                    placeholder="Describe specific work performed..."
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Service Location</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Phase 2, Gurugram"
                      value={jobForm.location}
                      onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Service Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="form-input"
                      value={jobForm.amount}
                      onChange={(e) => setJobForm({ ...jobForm, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setCreateStep(1)}>
                    ← Back
                  </button>
                  <button type="button" className="btn-primary" onClick={() => setCreateStep(3)}>
                    Next: Evidence & Review →
                  </button>
                </div>
              </div>
            )}

            {createStep === 3 && (
              <div>
                <div className="form-group">
                  <label className="form-label">Optional Evidence Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Work Completion Photo / Signed Service Receipt"
                    value={jobForm.evidence_title}
                    onChange={(e) => setJobForm({ ...jobForm, evidence_title: e.target.value })}
                  />
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                  <p style={{ fontWeight: 600, color: '#fff', marginBottom: '0.35rem' }}>Workflow Rule Reminder:</p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Initial state will be <strong>Pending Confirmation</strong>. Customer must verify the service interaction before it counts towards verified jobs.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setCreateStep(2)}>
                    ← Back
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Job Record
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </Modal>

      {/* Customer Confirmation Modal */}
      <Modal
        isOpen={!!confirmModalJob}
        onClose={() => setConfirmModalJob(null)}
        title="Confirm Service Interaction"
        maxWidth="480px"
      >
        {confirmModalJob && (
          <div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Confirm that <strong>{confirmModalJob.worker_name}</strong> executed service <strong>"{confirmModalJob.service_type}"</strong> at {confirmModalJob.location}.
            </p>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#34d399' }}>
              <strong>Credibility Principle:</strong> Interaction verification proves that the service occurred between customer and worker. Quality ratings and evidence are recorded as distinct attributes.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn-secondary" onClick={() => setConfirmModalJob(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleConfirmJob}>
                Attest Interaction
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Evidence Modal */}
      <Modal
        isOpen={!!evidenceModalJob}
        onClose={() => setEvidenceModalJob(null)}
        title={evidenceModalJob ? `Attach Evidence for ${evidenceModalJob.job_id}` : ''}
        maxWidth="500px"
      >
        <form onSubmit={handleAddEvidence}>
          <div className="form-group">
            <label className="form-label">Evidence Type</label>
            <select
              className="form-select"
              value={evidenceForm.type}
              onChange={(e) => setEvidenceForm({ ...evidenceForm, type: e.target.value })}
            >
              <option value="completion_photo">Completion Photo</option>
              <option value="invoice_reference">Invoice / Part Replacement Slip</option>
              <option value="service_description">Detailed Service Spec Document</option>
              <option value="supporting_document">Warranty / Safety Certificate</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Document / Photo Title</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. MCB Panel After Clean Wiring"
              value={evidenceForm.title}
              onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Technical Notes</label>
            <textarea
              rows="2"
              className="form-textarea"
              placeholder="Key diagnostic or installation notes..."
              value={evidenceForm.description}
              onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setEvidenceModalJob(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Attach & Support Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Submit Feedback Modal */}
      <Modal
        isOpen={!!feedbackModalJob}
        onClose={() => setFeedbackModalJob(null)}
        title={feedbackModalJob ? `Submit Structured Feedback: ${feedbackModalJob.job_id}` : ''}
        maxWidth="520px"
      >
        <form onSubmit={handleSubmitFeedback}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Work Quality (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                required
                className="form-input"
                value={feedbackForm.quality}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, quality: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Reliability (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                required
                className="form-input"
                value={feedbackForm.reliability}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, reliability: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Timeliness (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                required
                className="form-input"
                value={feedbackForm.timeliness}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, timeliness: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Professionalism (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                required
                className="form-input"
                value={feedbackForm.professionalism}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, professionalism: parseInt(e.target.value) || 5 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Comments</label>
            <textarea
              rows="3"
              className="form-textarea"
              placeholder="Describe experience with this technician..."
              value={feedbackForm.comment}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setFeedbackModalJob(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Record Feedback & Event
            </button>
          </div>
        </form>
      </Modal>

      {/* Raise Dispute Modal */}
      <Modal
        isOpen={!!disputeModalJob}
        onClose={() => setDisputeModalJob(null)}
        title={disputeModalJob ? `Raise Dispute: ${disputeModalJob.job_id}` : ''}
        maxWidth="500px"
      >
        <form onSubmit={handleRaiseDispute}>
          <div className="form-group">
            <label className="form-label">Dispute Reason</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Leak recurred within 24 hours of service"
              value={disputeForm.reason}
              onChange={(e) => setDisputeForm({ ...disputeForm, reason: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description</label>
            <textarea
              required
              rows="3"
              className="form-textarea"
              placeholder="Provide specific details of the issue..."
              value={disputeForm.description}
              onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
            />
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#f87171' }}>
            Note: CredID preserves all historical activity. Raising a dispute places the job under review and updates credibility confidence without deleting past interactions.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setDisputeModalJob(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ background: '#dc2626', color: '#fff' }}>
              Submit Dispute
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
