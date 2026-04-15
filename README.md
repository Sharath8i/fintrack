# Sharath — Round 1 Submission

## Problem Statement
I chose: PS3 — Personal Finance Tracker with AI Agent

## Tools & Stack
- **React.js & Vite** — Chosen for an ultra-fast, modular, and dynamic Single Page Application (SPA).
- **Node.js & Express.js** — Fast, robust, and asynchronous backend API framework.
- **MongoDB & Mongoose** — Flexible NoSQL database chosen for resilient schema modeling and entity extraction operations.
- **Google Generative AI (Gemini 1.5)** — Powers the NLP engine, context-aware chatbot interface, and automated expense categorization.
- **Lucide-React** — Crisp, performant, SVG UI iconography.
- **Tailwind / Custom CSS CSS** — Specifically styled using the high-contrast "Midnight Editorial" system for premium user aesthetics.

## How to View the Demo
Live link: https://fintrack-ps3.vercel.app/ *(Assuming Vercel Deployment)*
Screen recording: `/docs/demo-recording.mp4`

Setup steps (if running locally):
1. Clone the repository: `git clone https://github.com/Sharath8i/fintrack.git`
2. Open the directory: `cd fintrack`
3. Terminal 1 (Backend Initialization):
   - `cd backend`
   - `npm install`
   - Provide your `.env` variables (`MONGO_URI`, `PORT=5000`, `GEMINI_API_KEY`)
   - `npm start`
4. Terminal 2 (Frontend Initialization):
   - `cd frontend`
   - `npm install`
   - `npm run dev`
5. Access the Precision Ledger node securely at: `http://localhost:5173`

## Architecture Overview
Full design document: `/docs/design-doc.pdf`
Flow diagram: `/docs/flow-diagram.pdf`

The application revolves around an immutable MERN stack architecture integrated deeply with an AI Logic Controller:
- **Presentation Layer (React):** A contextual, tab-based dashboard manages UI state (Chat, Analytics, History, Operations, FAQ) entirely client-side. Global events handles cross-component routing smoothly.
- **AI Controller (Express / Gemini Engine):** Client queries are pre-filtered via robust regex, routed to the Google Gemini API, where NLP identifies context ("CreateExpense", "GeneralQuery"). The engine extracts entities (`amount`, `category`, `description`) into structured JSON payloads.
- **Ledger Model (MongoDB):** Verified transactions are permanently committed to the backend ledger. Analytics aggregation loops independently process and format spending trajectories.

## 🛠️ API & Endpoint Definitions
The Precision Ledger node communicates via a secure RESTful API. Key endpoints include:

| Verb | Endpoint | Description |
| :-- | :-- | :-- |
| `POST` | `/api/chat` | AI Intent Detection & Transaction Entity Extraction. |
| `GET` | `/api/expenses` | Retrieves user-specific ledger records with full filters. |
| `PUT` | `/api/expenses/:id` | **Entity Amendment:** Updates existing record attributes. |
| `DELETE` | `/api/expenses/:id` | Permanent removal of a ledger entry. |
| `GET` | `/api/analytics` | Statistical aggregation of spending trajectories. |

## 🤖 AI Logic & Intelligence
The system utilizes advanced NLP strategies to manage complex conversational states:

- **Entity Amendment:** Users can modify specific fields during the draft process without restarting. Typing *"Change amount to 1500"* or *"Update category to Transport"* triggers the AI to update the high-fidelity draft card in real-time.
- **Co-referencing Support:** The AI maintains a 10-message context window. It understands relative pronouns; for example, after viewing an expense, typing *"Delete **it**"* or *"Modify **that one**"* correctly identifies the active record in the session.
- **Auto-Categorization:** Natural language inputs like *"Grabbed a coffee"* are automatically mapped to the `Food` category using semantic weight matching.

## ⚠️ Known Limitations
- **Token Latency:** Response speed is dependent on Google Gemini API availability. 
- **Language Support:** Currently optimized for English; multi-lingual extraction is in the experimental phase.
- **Multi-Split Edge Cases:** Handling more than 4 simultaneous categories in a single sentence (e.g., splitting a single bill across 5 distinct categories) may require manual refinement.

## 📂 Submission Deliverables
- [x] **Source Code:** Full MERN stack implementation in `/backend` and `/frontend`.
- [x] **Screenshots:** Descriptive assets in `/screenshots` showing extraction, amendment, and insights.
- [x] **Docs:** Architecture Design (3+ pages) and Flow Diagram in `/docs`.
- [x] **Tests:** Batch CSV test results and engine performance report in `/tests`.
- [x] **README:** Complete technical specification and setup guide.
