const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const authToken = () => localStorage.getItem('credid_access_token');

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken() ? { Authorization: `Bearer ${authToken()}` } : {}),
      'X-CredID-Role': localStorage.getItem('credid_role') || 'admin',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch (e) {
        // Fallback to status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
}

// Centralized API Service Layer
export const api = {
  // Workers
  getWorkers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/workers${query ? `?${query}` : ''}`);
  },
  getWorker: (id) => request(`/workers/${id}`),
  createWorker: (data) => request('/workers', { method: 'POST', body: JSON.stringify(data) }),
  updateWorker: (id, data) => request(`/workers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Customers
  getCustomers: () => request('/customers'),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),

  // Jobs
  getJobs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/jobs${query ? `?${query}` : ''}`);
  },
  getJob: (id) => request(`/jobs/${id}`),
  createJob: (data) => request('/jobs', { method: 'POST', body: JSON.stringify(data) }),
  confirmJob: (id) => request(`/jobs/${id}/confirm`, { method: 'POST' }),
  completeJob: (id) => request(`/jobs/${id}/complete`, { method: 'POST' }),

  // Evidence
  getEvidence: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/evidence${query ? `?${query}` : ''}`);
  },
  getEvidenceItem: (id) => request(`/evidence/${id}`),
  createEvidence: (data) => request('/evidence', { method: 'POST', body: JSON.stringify(data) }),

  // Feedback
  getFeedback: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/feedback${query ? `?${query}` : ''}`);
  },
  submitFeedback: (data) => request('/feedback', { method: 'POST', body: JSON.stringify(data) }),

  // Verifications
  getVerifications: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/verifications${query ? `?${query}` : ''}`);
  },
  getVerification: (id) => request(`/verifications/${id}`),
  reviewVerification: (id, data) => request(`/verifications/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),

  // Reputation
  getReputationEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reputation${query ? `?${query}` : ''}`);
  },
  getWorkerReputation: (workerId) => request(`/reputation/workers/${workerId}`),

  // Disputes
  getDisputes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/disputes${query ? `?${query}` : ''}`);
  },
  getDispute: (id) => request(`/disputes/${id}`),
  createDispute: (data) => request('/disputes', { method: 'POST', body: JSON.stringify(data) }),
  resolveDispute: (id, data) => request(`/disputes/${id}/resolve`, { method: 'PUT', body: JSON.stringify(data) }),

  // Activity History (Append-only audit trail)
  getActivity: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/activity${query ? `?${query}` : ''}`);
  },
  getEntityActivity: (entityType, entityId) => request(`/activity/${entityType}/${entityId}`),

  // CredID Profiles
  getCredID: (credId) => request(`/credid/${credId}`),
  getPublicCredID: (credId) => request(`/credid/${credId}/public`),

  // Analytics
  getAnalytics: () => request('/analytics'),

  // Blockchain integrity
  getBlockchainAnchors: (params = {}) => { const query = new URLSearchParams(params).toString(); return request(`/blockchain/anchors${query ? `?${query}` : ''}`); },
  verifyJobIntegrity: (jobId) => request(`/blockchain/verify/job/${jobId}`),
  anchorJobIntegrity: (jobId) => request(`/blockchain/anchor/job/${jobId}`, { method: 'POST' }),

  // Authentication
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Development / Demo Reset
  resetDatabase: () => request('/dev/reset', { method: 'POST' }),
};
