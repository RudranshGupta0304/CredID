import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import Badge from '../components/Badge';
import { Award, ShieldCheck, CheckCircle2, AlertTriangle, Info, TrendingUp } from 'lucide-react';

export default function Reputation() {
  const { refreshKey } = useApp();
  const [events, setEvents] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReputation() {
      try {
        setLoading(true);
        const [eventsData, workersData] = await Promise.all([
          api.getReputationEvents(selectedWorkerId ? { worker_id: selectedWorkerId } : {}),
          api.getWorkers()
        ]);
        setEvents(eventsData);
        setWorkers(workersData);
      } catch (err) {
        console.error('Error loading reputation', err);
      } finally {
        setLoading(false);
      }
    }
    loadReputation();
  }, [selectedWorkerId, refreshKey]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Explainable Reputation Engine</h2>
          <p className="page-subtitle">
            Ground-truth credibility derived from verified interactions and evidence. Zero unexplained AI scores.
          </p>
        </div>
      </div>

      {/* Confidence Criteria Explainer Card */}
      <div className="card" style={{ marginBottom: '1.75rem', background: 'linear-gradient(180deg, #181d27, #131720)' }}>
        <div className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--accent-amber)" />
            How Credibility Confidence is Calculated
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Badge type="High Confidence" />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Requires at least 3 customer-verified jobs, 2 attached evidence items, 4.0+ rating, and zero open disputes.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Badge type="Medium Confidence" />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              At least 1-2 customer-confirmed service interactions with positive initial track record.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Badge type="Limited History" />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              New worker profile with claimed experience but awaiting completed customer verification loops.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Badge type="Needs Review" />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Triggered when unresolved disputes or abnormal identical feedback bursts are recorded.
            </p>
          </div>
        </div>
      </div>

      {/* Filter by Worker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>Chronological Reputation Events</h3>
        <select
          className="form-select"
          value={selectedWorkerId}
          onChange={(e) => setSelectedWorkerId(e.target.value)}
          style={{ maxWidth: '280px' }}
        >
          <option value="">All Workers</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.cred_id})
            </option>
          ))}
        </select>
      </div>

      {/* Events List */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Date</th>
              <th>Event Type</th>
              <th>Summary & Traceable Interaction</th>
              <th>Impact</th>
              <th>Confidence Level</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No reputation events recorded.
                </td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id}>
                <td>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-amber)' }}>
                    {e.reputation_event_id}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                  {new Date(e.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{e.event_type}</span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {e.summary}
                </td>
                <td>
                  <Badge type={e.impact} text={e.impact} />
                </td>
                <td>
                  <Badge type={e.confidence} text={e.confidence} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
