# 🚀 Sharath — Round 1 Submission

## 🧠 Problem Statement

**PS[3] — Personal Finance Tracker with AI Agent**

---

## 🛠️ Tech Stack

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

## ⚙️ How to Run the Project (Local Setup)

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
  👉 `http://localhost:5173`

---

## 🏗️ Architecture Overview

This project follows a **MERN architecture with clear separation of concerns**:

* **Frontend (React)** handles UI and sends requests
* **Backend (Express)** processes logic and manages conversations
* **MongoDB** stores user data and expenses

---

## 🤖 Conversational AI Engine

The backend includes a **Dialog Manager (state machine)** that tracks conversation flow:

### States:

* MENU
* DATA COLLECTION
* MODIFICATION
* CONFIRMATION

---

### 🧩 NLP Engine (Custom)

A RegEx-based parser (`extractEntities`) extracts data from natural language:

Example:

> “I spent ₹50 on food today using debit card”

Extracted:

* Amount → 50
* Category → Food
* Date → Today
* Card Type → Debit Card

---

## ✨ Smart Conversational Features

### 🔁 Entity Amendment

Users can update inputs mid-conversation:

* “change amount to 75”
* “change category to shopping”
* “change name to John Doe”

---

### 🔗 Co-referencing

Single message extracts multiple entities:

> “I spent ₹100 on transport using credit card today”

---

## 📊 API Endpoints

| Method | Endpoint                       | Description             |
| ------ | ------------------------------ | ----------------------- |
| POST   | `/api/expenses`                | Create new expense      |
| GET    | `/api/expenses?contactNumber=` | Fetch user expenses     |
| PUT    | `/api/expenses/:id`            | Update expense          |
| DELETE | `/api/expenses/:id`            | Delete expense          |
| GET    | `/api/analytics`               | Get dashboard insights  |
| POST   | `/api/chat`                    | AI conversation handler |

---

## ✅ Validation Rules

* **Full Name** → Must contain first & last name
* **Contact Number** → Country code + 10 digits
* **Email** → Standard email format
* **Card Type** → Debit Card / Credit Card
* **Category** → Transport / Shopping / Food
* **Amount** → Positive number
* **Date** → Format `DD-MM-YYYY`
* **All fields required**

---

## 📁 Project Structure

```
project-root/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   └── server.js
│
├── frontend/
│   ├── components/
│   ├── pages/
│   └── main.jsx
│
├── docs/
│   ├── design_document.md
│   └── flow_diagram.md
│
├── screenshots/
├── batch_test_results.csv
└── README.md
```

---

## ⚠️ Known Limitations

* NLP is RegEx-based (not LLM-powered)
* Limited flexibility for complex sentences
* Description parsing depends on “for XYZ” format
* Sessions stored in-memory (reset on restart)
* Budget alerts trigger only on save

---

## 📸 Additional Resources

* 📄 Design Document → `/docs/design_document.md`
* 🔁 Flow Diagram → `/docs/flow_diagram.md`
* 🧪 Test Results → `/batch_test_results.csv`
* 📷 Screenshots → `/screenshots/`

---

## ✅ Submission Checklist

* [x] Backend & Frontend code included
* [x] API endpoints documented
* [x] Validation rules implemented
* [x] Conversational AI features included
* [x] No `.env` or sensitive data exposed
* [x] README fully structured and complete
* [x] Supporting docs included

---

## 🎯 Final Note

This project demonstrates:

* Full-stack development (MERN)
* AI-inspired conversational interface
* Structured architecture
* Real-world validation & analytics

---

💡 *Built with focus on usability, scalability, and intelligent interaction.*
