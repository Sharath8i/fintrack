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

## Validation Rules Implemented
- **AI Missing Field Handlers:** The NLP controller rigorously rejects transaction saves structurally missing a `category` or `amount` integer.
- **Regex Query Filtration:** Raw AI chatbot input is validated defensively against script injection payloads before parsing.
- **Google OAuth / JWT Gate:** Authenticated endpoints strictly reject unauthorized sessions attempting to hit ledger routes.
- **Client-Side Float Constraints:** Data tables validate `amount` inputs to strict 2nd-decimal precision limits, locking out invalid datatype insertions.

## Known Limitations
- The integrated system relies heavily on the response speed of the Google API engine; network latency can temporarily delay the chatbot.
- Voice-to-Text capability is securely limited to WebKit/browser-supported speech recognition boundaries.
- Currently, single-line multi-ledger generation (e.g., "Add 50 for food and 20 for transport in one click") splits unpredictably.

## Submission Checklist
- [x] Folder created inside submissions/
- [x] All source code committed to /src
- [x] Flow diagram in /docs
- [x] Design document in /docs
- [x] Required screenshots in /screenshots
- [x] No .env files or API keys committed
- [x] This README is fully filled in
- [x] Final push made before deadline
