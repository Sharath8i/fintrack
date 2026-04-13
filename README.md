# FinTrack.AI — Precision Ledger AI (PS[3])

**FinTrack.AI** is a high-fidelity, session-aware financial management platform that combines a professional institutional design with an advanced conversational AI agent. It allows for seamless expense tracking, deep data insights, and rigorous auditing via a MERN-stack architecture.

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js** (v18.x or higher)
- **MongoDB** (Local instance or Atlas connection string)
- **Git**

### 2. Installation & Execution
```bash
# Clone the repository
git clone <repository-link>
cd Sharath8i/fintrack-ai

# Backend Setup
cd backend
npm install
node server.js

# Frontend Setup (In a new terminal)
cd ../frontend
npm install --legacy-peer-deps
npm run dev
```
- **Backend API:** `http://localhost:5001`
- **Frontend App:** `http://localhost:5173`

---

## 🛠 Tech Stack Architecture
- **Frontend:** React.js (Vite) + Chart.js (Interactive Analytics) + Vanilla CSS (Custom Design System).
- **Backend:** Node.js + Express (Dialog State Engine).
- **Database:** MongoDB (Mongoose Schemas with strict validation).

---

## 🧠 Advanced AI Interaction Features

### 1. Entity Co-Referencing
The system can extract multiple overlapping data points from a single natural language input. This reduces the need for cumbersome step-by-step forms.
- **Example:** *"I spent 500 on Shopping today using my Credit Card"*
- **Status:** Captures `Amount: 500`, `Category: Shopping`, `Date: [Today's Date]`, and `Method: Credit Card` simultaneously.
- **Visual Evidence:** See `screenshots/coref_1.png` and `screenshots/coref_2.png`.

### 2. Mid-flow Entity Amendment
Users can correct any field at any time before final confirmation without restarting the conversation.
- **Example:** *"Wait, change the amount to 450"*
- **Status:** Contextual buffer is updated instantly, and a refreshed summary is presented to the user.
- **Visual Evidence:** See `screenshots/amend_1.png` and `screenshots/amend_2.png`.

---

## 📡 API Documentation (RESTful CRUD)

| Verb    | Endpoint                       | Description                                                                 |
| :------ | :----------------------------- | :-------------------------------------------------------------------------- |
| `POST`  | `/api/expenses`                | Explicitly creates a new transaction record in the ledger.                  |
| `GET`   | `/api/expenses?contactNumber=` | Fetches full transactional history filtered by user mobile for context.      |
| `PUT`   | `/api/expenses/:id`            | Performs single-record updates on existing ledger entries.                  |
| `DELETE`| `/api/expenses/:id`            | Triggers a financial "undo," removing a record permanently from the DB.     |
| `POST`  | `/api/chat`                    | The primary entry point for the session-aware AI Agent.                     |
| `GET`   | `/api/analytics`               | Returns aggregated data for trend analysis and category distribution.       |

---

## ⚠️ Known Limitations
- **NLP Implementation:** Uses a high-performance RegEx-based parser tailored for finance instead of a non-deterministic LLM.
- **Session Lifespan:** Conversational memory is session-bound (in-memory) and resets on deep browser refresh.
- **Description Mapping:** Descriptions are most accurately parsed when prefixed with "for" (e.g., *"spent 50 for breakfast"*).
- **Alert Logic:** Budget threshold alerts are triggered immediately after a successful save operation.

---

## 📁 Repository Structure
- `/backend`: Node.js/Express server and Dialog State Machine logic.
- `/frontend`: React source code and the "Precision Ledger" Design System.
- `/docs`: Functional Flow Diagrams (Mermaid) and Architectural Design Documents.
- `/screenshots`: Visual evidence of Rubric feature compliance.
- `/scripts`: Automated batch testing and performance utility scripts.

---

## 🏆 Submission Deliverables Checklist
- [x] **README.md** (Fully completed with API docs)
- [x] **Flow Diagram** (`/docs/flow_diagram.md`)
- [x] **Design Document** (`/docs/design_document.md`)
- [x] **Batch Test Results** (`/batch_test_results.csv`)
- [x] **Feature Screenshots** (Amendment & Co-referencing)

---
© 2026 Sharath - Final submission version
