# CredID — Verified Work. Portable Credibility.

> A professional reputation and verification system for informal skilled workers (electricians, plumbers, carpenters, etc.) developed for the **SEVA FIRST Innovation Challenge**.

---

## 1. Product Overview

Many informal skilled workers have years of genuine practical experience and skill, but lack a trustworthy, portable credential to prove their professional track record. When seeking new jobs or moving between platforms, customers typically rely on informal word-of-mouth or WhatsApp groups, while workers struggle to take their hard-earned reputation with them.

**CredID** solves this by creating a **portable professional credential** founded on verified customer interactions, attached technical evidence, structured feedback, and tamper-evident reputation histories.

---

## 2. Key Product Principles

1. **Clear Credibility Distinction**:
   - **Claimed Experience**: Worker-stated career years (e.g. *"7 years claimed experience"*).
   - **Interaction Verified**: Customer verifies that the service interaction took place.
   - **Evidence Supported**: Photographic or invoice proof attached to the job record.
   - **Reputation Recorded**: Traceable reputation events created from verified customer feedback.
   - **Customer Confirmation ≠ Work Quality**: Confirmation proves an interaction occurred; quality is derived from structured metrics and history.
2. **Transparent & Explainable Confidence**:
   - Categorized as `High Confidence`, `Medium Confidence`, `Limited History`, or `Needs Review`.
   - No fake AI black box scores or unsupported cryptographic blockchain claims.
3. **Privacy First**:
   - Public portable credentials (`/credid/:cred_id/public`) conceal customer phone numbers and private addresses, showing only anonymized initials and general districts.
4. **Append-Only Activity Audit Trail**:
   - History is never silently overwritten. Disputes and resolutions generate new chronological audit events.

---

## 3. Full-Stack Architecture

```text
React Frontend (Vite + React Router + Dark-First Design System)
      ↓
Frontend API Service Layer (src/services/api.js)
      ↓
FastAPI REST Backend (Python + Pydantic + SQLAlchemy)
      ↓
SQLite Database (Relational Foreign Keys & Append-Only Audit Logs)
```

---

## 4. Directory Structure

```text
CredID/
├── backend/
│   ├── app/
│   │   ├── database.py                 # SQLite engine & session setup
│   │   ├── models.py                   # SQLAlchemy ORM models & foreign keys
│   │   ├── schemas.py                  # Pydantic schemas for validation & serialization
│   │   ├── seed.py                     # Realistic initial seed records (Amit Sharma & peers)
│   │   ├── main.py                     # FastAPI application entrypoint with CORS
│   │   ├── services/
│   │   │   ├── activity_service.py     # Append-only activity logger
│   │   │   └── reputation_service.py   # Explainable rule-based reputation engine
│   │   └── routers/
│   │       ├── workers.py              # Worker directory & profiles
│   │       ├── customers.py            # Customer directory
│   │       ├── jobs.py                 # Job lifecycle (create, confirm, complete)
│   │       ├── evidence.py             # Evidence library & attachment
│   │       ├── feedback.py             # Structured customer rating & reviews
│   │       ├── verifications.py        # Verification queue management
│   │       ├── reputation.py           # Reputation events & metrics
│   │       ├── disputes.py             # Dispute tracking & resolution
│   │       ├── activity.py             # Append-only audit history
│   │       ├── credid.py               # Authenticated & Public CredID profiles
│   │       ├── analytics.py            # Live database aggregate analytics
│   │       └── dev.py                  # Dev reset endpoint (re-seeds demo data)
│   ├── tests/
│   │   └── test_backend.py             # Automated pytest suite covering complete workflow
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/                 # Topbar, Sidebar, Badge, Modal, Toast
│   │   ├── context/AppContext.jsx      # Role switcher (Admin / Worker / Customer)
│   │   ├── pages/
│   │   │   ├── Overview.jsx            # Trust flow & live dashboard
│   │   │   ├── Workers.jsx             # Filterable worker directory
│   │   │   ├── Jobs.jsx                # Multi-step job creation & confirmation
│   │   │   ├── Reputation.jsx          # Transparent reputation rules & timeline
│   │   │   ├── Verification.jsx        # Verification queue & status review
│   │   │   ├── Evidence.jsx            # Evidence library & attachment
│   │   │   ├── Disputes.jsx            # Formal dispute logging & resolution
│   │   │   ├── ActivityHistory.jsx     # Chronological append-only audit trail
│   │   │   ├── Analytics.jsx           # Dynamic prototype analytics
│   │   │   ├── MyCredID.jsx            # Worker-facing view with QR card
│   │   │   ├── PublicCredID.jsx        # Standalone portable public credential
│   │   │   └── Settings.jsx            # Demo reset & system controls
│   │   ├── services/api.js             # Centralized API service layer
│   │   ├── index.css                   # Modern dark-first design system
│   │   └── App.jsx                     # Router & layout assembly
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 5. Setup & Running Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend Setup & Run
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base URL: `http://127.0.0.1:8000/api`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### Frontend Setup & Run
```bash
cd frontend
npm install
npm run dev
```
- Frontend application will be available at: `http://localhost:5173`

---

## 6. Demo Workflows to Try

1. **Overview Dashboard**:
   - Inspect the interactive **Trust Flow diagram**.
   - Note key metrics calculated dynamically from database records.
2. **Worker Directory**:
   - Filter by trade (*Electricians*, *Plumbers*, *Carpenters*).
   - Notice Amit Sharma (`CRD-ELC-20481`): 7 years claimed experience vs actual verified jobs count.
3. **Record & Verify a Job**:
   - Click **Record Verified Job** in the Jobs tab.
   - Enter service details (e.g. Submeter Rewiring).
   - Once created in `Pending Confirmation`, click **Confirm** as the customer to attest the interaction occurred.
   - Attach a completion photo via **Evidence**.
   - Submit a structured 1-5 rating via **Review**.
   - Check **Reputation History** and **Activity History** to watch the real-time audit event appear.
4. **Portable CredID Representation**:
   - Click **Public CredID (Amit)** in the sidebar to open the shareable portable profile.
   - Verify that private customer contact information is protected while verified jobs and credibility confidence are proudly highlighted.
5. **Dispute Handling**:
   - Open a dispute from the Jobs page or Disputes page.
   - Verify the worker's status transitions to `Needs Review` while past activity remains intact.
   - Resolve the dispute and observe the resolution event logged.
6. **Reset Demo Data**:
   - Click **Reset Demo Data** in the top navigation or Settings tab to restore clean initial seed data at any time.

---

## 7. Automated Testing

Run the pytest suite to verify all backend API contracts and lifecycle workflows:

```bash
cd backend
python -m pytest tests/test_backend.py -v
```

All 5 test suites validate:
- Health check & database initialization
- Worker directory filtering and CredID lookups
- End-to-end Job creation → Customer Confirmation → Evidence Attachment → Structured Feedback → Reputation Event → Public CredID verification
- Dispute creation and resolution with audit preservation.

---

## 8. SEVA FIRST Innovation Alignment

- **Problem Authenticity**: Skilled informal workers in India have no portable way to prove their track record across employers, neighborhoods, or platforms.
- **Innovation**: Ground-truth credentialing separating interaction attestations from evidence support and reputation events.
- **Feasibility & Affordability**: Built on standard open-source web technologies (React, FastAPI, SQLite) without requiring expensive hardware or proprietary blockchain gas fees.
- **Scalability**: Clean modular API service architecture easily migrates from SQLite to PostgreSQL / cloud object stores for enterprise deployment.

## Security, Integrity, Theme and Language Updates

CredID now includes:

- Persistent dark/light theme preference.
- English/Hindi interface preference using a centralized translation layer.
- Backend-authoritative validation and role checks.
- JWT authentication support; demo role switching is only available when `DEMO_MODE=true`.
- Password hashing with bcrypt.
- CORS restricted through `CORS_ORIGINS`.
- SHA-256 canonical record hashing for important job/reputation integrity records.
- Append-only security/activity events for important operations.
- Optional real EVM testnet anchoring when `BLOCKCHAIN_RPC_URL`, `BLOCKCHAIN_PRIVATE_KEY` and `BLOCKCHAIN_ANCHOR_ADDRESS` are configured on the server.
- A clearly labelled local integrity anchor when a real blockchain is not configured. The prototype never fabricates a blockchain transaction hash.
- No customer phone numbers, addresses or private evidence are written to the blockchain anchor payload.

### Important security boundary

Blockchain anchoring proves the integrity of an anchored record after the anchor is created. It does **not** prove that a real-world job occurred, that a customer review is truthful, or that a worker is automatically trustworthy. Those properties depend on CredID's identity, job confirmation, evidence, reputation and dispute workflows.

### Real testnet configuration

Copy `backend/.env.example` to the deployment environment and configure the blockchain variables only on the backend. Never expose `BLOCKCHAIN_PRIVATE_KEY` to React or commit it to source control.
