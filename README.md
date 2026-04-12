#  Sharath — Round 1 Submission

##  Problem Statement

**PS[3] — Personal Finance Tracker with AI Agent**

---

##  Tech Stack

### Frontend

* **React.js (Vite)** — Fast, modern SPA with dynamic UI (Chat Widget, Analytics Dashboard, History Viewer)
* **Chart.js + react-chartjs-2** — Interactive data visualization
* **Lucide React** — Icon library
* **Vanilla CSS** — Custom glassmorphic dark theme

### Backend

* **Node.js + Express.js** — REST API server and conversational engine
* **MongoDB + Mongoose** — Persistent database for expenses and budgets

### Communication

* **Axios** — API communication between frontend and backend

---

##  How to Run the Project (Local Setup)

### Prerequisites

* Node.js (v16+ recommended)
* MongoDB (Local or Atlas)

---

### 🔹 Step 1: Clone the Repository

```bash
git clone <your-repo-link>
cd <project-folder>
```

---

### 🔹 Step 2: Start Backend Server

```bash
cd backend
npm install
node server.js
```

* Server runs on: `http://localhost:5001`

---

### 🔹 Step 3: Start Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

* Open browser:
   `http://localhost:5173`

---

## API Definitions (Full CRUD)
The application endpoints follow standard REST architecture.
- **POST `/api/expenses`** or **`/api/chat`** — Creates a new expense log computationally (or parses it dynamically via the AI agent).
- **GET `/api/expenses?contactNumber=...`** — Retrieves records explicitly mapped to a mobile number to ensure user isolation.
- **PUT `/api/expenses/:id`** — Updates explicitly targeted properties on an existing transaction history element (e.g. changing the date).
- **DELETE `/api/expenses/:id`** — Removes a record completely by its explicit ID, effectively triggering a financial "undo" operation.

## Advanced AI Features
**Co-Referencing:** The local parsing engine is configured to identify multiple overlapping entity values in a single conversational blast. For example: *"I spent Rs 50 on food today"* successfully groups Amount (50), Category (Food), and Date (Today) without needing individual step-by-step interrogation.

**Entity Amendment:** If you misspeak or change your mind mid-conversation, you can freely perform mid-flow corrections. You do not need to cancel or restart. Stating *"change amount to 75"* retroactively updates the live contextual memory buffer perfectly before finalizing a `POST` transaction.

## Architecture Overview

This project follows a **MERN architecture with clear separation of concerns**:

* **Frontend (React)** handles UI and sends requests
* **Backend (Express)** processes logic and manages conversations
* **MongoDB** stores user data and expenses

---

##  Conversational AI Engine

The backend includes a **Dialog Manager (state machine)** that tracks conversation flow:

### States:

* MENU
* DATA COLLECTION
* MODIFICATION
* CONFIRMATION

---

###  NLP Engine (Custom)

A RegEx-based parser (`extractEntities`) extracts data from natural language:

Example:

> “I spent ₹50 on food today using debit card”

Extracted:

* Amount → 50
* Category → Food
* Date → Today
* Card Type → Debit Card

---

##  Smart Conversational Features

###  Entity Amendment

Users can update inputs mid-conversation:

* “change amount to 75”
* “change category to shopping”
* “change name to John Doe”

---

### Co-referencing

Single message extracts multiple entities:

> “I spent ₹100 on transport using credit card today”

---

##  API Endpoints

| Method | Endpoint                       | Description             |
| ------ | ------------------------------ | ----------------------- |
| POST   | `/api/expenses`                | Create new expense      |
| GET    | `/api/expenses?contactNumber=` | Fetch user expenses     |
| PUT    | `/api/expenses/:id`            | Update expense          |
| DELETE | `/api/expenses/:id`            | Delete expense          |
| GET    | `/api/analytics`               | Get dashboard insights  |
| POST   | `/api/chat`                    | AI conversation handler |

---

##  Validation Rules

* **Full Name** → Must contain first & last name
* **Contact Number** → Country code + 10 digits
* **Email** → Standard email format
* **Card Type** → Debit Card / Credit Card
* **Category** → Transport / Shopping / Food
* **Amount** → Positive number
* **Date** → Format `DD-MM-YYYY`
* **All fields required**

---

##  Known Limitations

* NLP is RegEx-based (not LLM-powered)
* Limited flexibility for complex sentences
* Description parsing depends on “for XYZ” format
* Sessions stored in-memory (reset on restart)
* Budget alerts trigger only on save

---

## Additional Resources

* 📄 Design Document → `/docs/design_document.md`
* 🔁 Flow Diagram → `/docs/flow_diagram.md`
* 🧪 Test Results → `/batch_test_results.csv`
* 📷 Screenshots → `/screenshots/`

---

##  Submission Checklist

- [x] Folder created inside submissions/
- [x] All source code committed to frontend & backend directories
- [x] Flow diagram in /docs
- [x] Design document in /docs
- [x] Required screenshots in /screenshots
- [x] No .env files or API keys committedive data exposed
* [x] README fully structured and complete
* [x] Supporting docs included

---


