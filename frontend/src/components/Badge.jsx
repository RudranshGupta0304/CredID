import React from 'react';

export default function Badge({ type, text, icon }) {
  let badgeClass = 'badge-pending';
  const lower = (type || text || '').toLowerCase();

  if (lower.includes('evidence') || lower.includes('supported')) {
    badgeClass = 'badge-evidence';
  } else if (lower.includes('verified') || lower.includes('confirmed') || lower.includes('completed') || lower.includes('high')) {
    badgeClass = 'badge-verified';
  } else if (lower.includes('needs review') || lower.includes('warning') || lower.includes('suspicious')) {
    badgeClass = 'badge-needs-review';
  } else if (lower.includes('dispute') || lower.includes('negative') || lower.includes('flagged')) {
    badgeClass = 'badge-disputed';
  } else if (lower.includes('medium')) {
    badgeClass = 'badge-medium';
  } else if (lower.includes('limited')) {
    badgeClass = 'badge-limited';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      {text || type}
    </span>
  );
}
