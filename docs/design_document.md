# Design Document: Personal Finance Tracker AI Agent

## Architecture Overview
The Personal Finance Tracker relies on a decoupled Client-Server architecture utilizing the robust MERN stack.

1. **Frontend (Client):** A React.js Single Page Application scaffolded via Vite. It communicates asynchronously using Axios to the Node.js API. The UI showcases vanilla CSS styled with "Rich Modern Aesthetics" emphasizing glassmorphism and real-time updates.
2. **Backend (Server):** An Express.js application layered over a MongoDB database (via Mongoose ODM).
3. **Dialog System (AI Agent Core):** The backend hosts a dedicated route (`/api/chat`) implementing a state-machine driven intent router. It utilizes a custom Regex-based Natural Language rule engine as an alternative to external LLM calls to ensure offline stability, immediate entity extraction capabilities (co-referencing), and deterministic conversational states (entity amendment).

## API Schema Definition

**Model: Expense**
- `fullName`: String, required
- `cardType`: String ("Debit Card" or "Credit Card")
- `category`: String ("Transport", "Shopping", "Food")
- `amount`: Number, >0
- `description`: String
- `date`: String, DD-MM-YYYY format
- `contactNumber`: String, Country Code + 10 Digits
- `email`: String, Valid email format

## Tool Choices & Rationales
- **React.js + Vite:** Chosen for lightning-fast HMR and simplified component lifecycle handling compared to traditional Create React App.
- **Vanilla CSS:** Chosen per restrictions on TailwindCSS, optimized for granular control over flexbox, glass filters, and gradient clipping for chart metrics.
- **MongoDB / Mongoose:** The document-object structure fits perfectly with dynamic tracking of conversational schemas and enables fast regex text-queries on mobile numbers for data retrieval.
- **React-ChartJS-2:** Leveraged to provide an instantaneous, beautiful interactive analytics doughnut chart for category breakdown comparisons.
