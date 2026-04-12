const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const auth = require('../middleware/authMiddleware');

const sessions = {};

const FAQS = [
    {
        keywords: ['purpose', 'who are you', 'what are you', 'what do you do', 'help'],
        response: 'I am the Precision Ledger AI Assistant. I can rapidly draft new expenses, analyze your historical spending velocity, and precisely delete or modify past entries.'
    },
    {
        keywords: ['categories', 'what category', 'tags', 'types of expenses'],
        response: 'Currently, the engine supports exactly three rigorous metric categories: Transport, Shopping, and Food.'
    },
    {
        keywords: ['security', 'safe', 'privacy', 'encryption'],
        response: 'Your ledger operates under End-to-End Secure mode. Transactions are safely isolated within your personal account.'
    },
    {
        keywords: ['export', 'download', 'csv', 'excel'],
        response: 'Yes! You can instantly export your filtered transaction history as a CSV file by clicking the "DOWNLOAD BATCH CSV & REPORT" button inside the History tab.'
    }
];

function checkFAQ(message) {
    const lowerMessage = message.toLowerCase();
    for (const faq of FAQS) {
        for (const keyword of faq.keywords) {
            if (lowerMessage.includes(keyword)) return faq.response;
        }
    }
    return null;
}

function extractEntities(message, currentData = {}, lastPrompt = null) {
    const data = { ...currentData };
    const lower = message.toLowerCase();

    // Amount
    const explicitAmount = message.match(/(?:spend|spent|cost|paid|amount is)\s*(?:rs\.?|inr|₹)?\s*(\d+(\.\d{1,2})?)/i);
    if (explicitAmount) data.amount = parseFloat(explicitAmount[1]);
    else if (lastPrompt === 'amount') {
        const numMatch = message.match(/(\d+(\.\d{1,2})?)/);
        if (numMatch) data.amount = parseFloat(numMatch[1]);
    }

    // Category
    if (!data.category) {
        if (lower.includes('transport')) data.category = 'Transport';
        else if (lower.includes('shopping')) data.category = 'Shopping';
        else if (lower.includes('food')) data.category = 'Food';
    }

    // Date
    if (!data.date) {
        const dateMatch = message.match(/(\d{2}-\d{2}-\d{4})/);
        if (dateMatch) data.date = dateMatch[1];
        else if (lower.includes('today')) {
            const d = new Date();
            data.date = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
        }
    }

    // Description
    if (lastPrompt === 'description') {
        data.description = message.trim();
    } else if (!data.description && lower.includes('for ')) {
        data.description = lower.split('for ')[1].split(' ')[0] + ' ' + (lower.split('for ')[1].split(' ')[1] || '');
    }

    return data;
}

function getMissingFieldPrompt(data) {
    if (!data.amount) return { field: 'amount', prompt: "How much did you spend?" };
    if (!data.category) return { field: 'category', prompt: "Which category? (Transport, Shopping, Food)" };
    if (!data.description) return { field: 'description', prompt: "What was this for? (e.g., 'lunch')" };
    if (!data.date) return { field: 'date', prompt: "When was this? (DD-MM-YYYY or 'today')" };
    return null;
}

router.post('/', auth, async (req, res) => {
    const { sessionId, message } = req.body;
    const userId = req.userId;
    
    if (!sessions[sessionId]) {
        sessions[sessionId] = { state: 'MENU', data: {} };
    }

    const session = sessions[sessionId];
    const lowerMsg = message.toLowerCase();

    if (['cancel', 'exit', 'quit'].includes(lowerMsg.trim())) {
        session.state = 'MENU';
        session.data = {};
        return res.json({ reply: "Back to menu. 1. Create, 2. View, 3. Delete", state: 'MENU' });
    }

    switch (session.state) {
        case 'MENU':
            if (lowerMsg.includes('1') || lowerMsg.includes('create')) {
                session.state = 'CREATE_GATHER';
                session.data = extractEntities(message, {}, null);
                const missing = getMissingFieldPrompt(session.data);
                res.json({ reply: missing ? missing.prompt : "Confirm?", state: 'CREATE' });
            } else if (lowerMsg.includes('how much')) {
                const expenses = await Expense.find({ userId });
                const total = expenses.reduce((s, e) => s + e.amount, 0);
                res.json({ reply: `Total spent: Rs ${total}`, state: 'MENU' });
            } else {
                res.json({ reply: "Hi! 1. Create Expense, 2. Analysis, 3. Export", state: 'MENU' });
            }
            break;

        case 'CREATE_GATHER':
            session.data = extractEntities(message, session.data, session.lastPrompt);
            const missing = getMissingFieldPrompt(session.data);
            if (missing) {
                session.lastPrompt = missing.field;
                res.json({ reply: missing.prompt });
            } else {
                const newExp = new Expense({ ...session.data, userId });
                await newExp.save();
                session.state = 'MENU';
                session.data = {};
                res.json({ reply: "Saved successfully! ✅", requiresAction: "REFRESH" });
            }
            break;

        default:
            session.state = 'MENU';
            res.json({ reply: "Let's start over." });
    }
});

module.exports = router;

});

module.exports = router;
