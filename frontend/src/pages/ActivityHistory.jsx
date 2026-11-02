import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { History, User, ShieldCheck, CheckCircle2, FileText, AlertCircle } from 'lucide-react';

export default function ActivityHistory() {
  const { refreshKey } = useApp();
  const [activities, setActivities] = useState([]);
  const [entityFilter, setEntityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      try {
        setLoading(true);
        const params = entityFilter ? { entity_type: entityFilter, limit: 100 } : { limit: 100 };
        const data = await api.getActivity(params);
        setActivities(data);
      } catch (err) {
        console.error('Error loading activity', err);
      } finally {
        setLoading(false);
      }
    }
    loadActivity();
  }, [entityFilter, refreshKey]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Append-Only Activity Audit Log</h2>
          <p className="page-subtitle">
            Tamper-evident chronological timeline of every interaction, confirmation, evidence attachment, and dispute.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['', 'job', 'worker', 'evidence', 'feedback', 'dispute', 'reputation', 'verification'].map((entity) => (
          <button
            key={entity}
            className={`role-btn ${entityFilter === entity ? 'active' : ''}`}
            onClick={() => setEntityFilter(entity)}
            style={{ textTransform: 'capitalize' }}
          >
            {entity ? `${entity}s` : 'All Activity'}
          </button>
        ))}
      </div>

      {/* Timeline Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Entity Type</th>
              <th>Entity ID</th>
              <th>Event Type</th>
              <th>Audit Description</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No activity logged.
                </td>
              </tr>
            )}
            {activities.map((act) => (
              <tr key={act.id}>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(act.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                    {act.actor}
                  </span>
                </td>
                <td style={{ textTransform: 'capitalize', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {act.entity_type}
                </td>
                <td>
                  <span style={{ fontFamily: 'monospace', color: 'var(--accent-amber)', fontWeight: 600 }}>
                    {act.entity_id}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{act.event_type}</span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {act.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
