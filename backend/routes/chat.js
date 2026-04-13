const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const auth = require('../middleware/authMiddleware');

const sessions = {};

// --- 5 FAQ Responses (inline, no dialog triggered) ---
const FAQS = [
    {
        keywords: ['who are you', 'how to use', 'help', 'features', 'what can you do'],
        response: 'I am the Precision Ledger AI. You can log expenses by chatting naturally (e.g., "Spent 500 on food today"), track budgets, and view detailed analytical dashboards.'
    },
    {
        keywords: ['all at once', 'multi', 'detection', 'co-referencing', 'natural', 'complex'],
        response: 'My engineering supports **Co-referencing**: you can define amount, category, card type, description, and date all in a single sentence. I will extract all entities automatically for your review.'
    },
    {
        keywords: ['mistake', 'wrong', 'change', 'edit', 'amend', 'correction', 'amendment'],
        response: 'You can perform **Entity Amendment** at any time. Simply say "change amount to 200" or "change description to Dinner" while reviewing a draft to update it instantly.'
    },
    {
        keywords: ['profile', 'identity', 'my info', 'auto', 'automatic', 'recovery'],
        response: 'I have secure access to your profile. I automatically retrieve your registered name, email, and phone number to pre-fill transaction logs, ensuring your identity is always consistent.'
    },
    {
        keywords: ['excel', 'csv', 'report', 'download', 'analytics', 'data'],
        response: 'You can export all transaction history to Excel-ready CSV files via the "Ledger History" tab. For deep insights, visit the "Data Insights" page for real-time trend analysis.'
    }
];

function checkFAQ(message) {
    const lower = message.toLowerCase();
    // Don't treat short numeric strings as FAQs
    if (/^\d+$/.test(message.trim())) return null;
    for (const faq of FAQS) {
        for (const kw of faq.keywords) {
            if (lower.includes(kw)) return faq.response;
        }
    }
    return null;
}

async function checkAnalyticalQuery(message, userId) {
    const lower = message.toLowerCase();
    if (!lower.includes('spend') && !lower.includes('total') && !lower.includes('how much')) return null;

    let category = null;
    if (lower.includes('transport')) category = 'Transport';
    else if (lower.includes('shopping')) category = 'Shopping';
    else if (lower.includes('food')) category = 'Food';

    let startDate = new Date(0); // Default: all time
    let timeLabel = "in total";

    if (lower.includes('today')) {
        startDate = new Date();
        startDate.setHours(0,0,0,0);
        timeLabel = "today";
    } else if (lower.includes('this week')) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        timeLabel = "this week";
    } else if (lower.includes('this month')) {
        startDate = new Date();
        startDate.setDate(1);
        startDate.setHours(0,0,0,0);
        timeLabel = "this month";
    }

    const query = { userId, createdAt: { $gte: startDate } };
    if (category) query.category = category;

    try {
        const expenses = await Expense.find(query);
        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        const catLabel = category ? `on **${category}**` : "across all categories";
        return `You have spent a total of **₹${total.toFixed(2)}** ${catLabel} ${timeLabel}.`;
    } catch (err) {
        return null;
    }
}

// --- Entity Extraction (Co-referencing: extracts multiple fields from one message) ---
function extractEntities(message, currentData = {}, lastPrompt = null) {
    const data = { ...currentData };
    const lower = message.toLowerCase().trim();

    // --- Amendment Hooks (Entity Amendment) ---
    const amendAmount = message.match(/change\s+amount\s+to\s+(\d+(\.\d{1,2})?)/i);
    if (amendAmount) { data.amount = parseFloat(amendAmount[1]); return data; }

    const amendCat = message.match(/change\s+category\s+to\s+(transport|shopping|food)/i);
    if (amendCat) { data.category = amendCat[1].charAt(0).toUpperCase() + amendCat[1].slice(1).toLowerCase(); return data; }

    const amendDate = message.match(/change\s+date\s+to\s+(\d{2}-\d{2}-\d{4})/i);
    if (amendDate) { data.date = amendDate[1]; delete data._dateError; return data; }

    const amendCard = message.match(/change\s+card\s+to\s+(debit|credit)/i);
    if (amendCard) { data.cardType = amendCard[1].charAt(0).toUpperCase() + amendCard[1].slice(1).toLowerCase() + ' Card'; return data; }

    const amendDesc = message.match(/change\s+description\s+to\s+(.+)/i);
    if (amendDesc) { data.description = amendDesc[1].trim(); return data; }

    // --- Amount (Indian currency formats) ---
    if (!data.amount) {
        const amtPatterns = [
            /(?:rs\.?|inr|₹)\s*(\d+(\.\d{1,2})?)/i,
            /(\d+(\.\d{1,2})?)\s*(?:rupees|rs\.?|inr|₹)/i,
            /(?:spend|spent|cost|paid|amount is|pay)\s*(?:rs\.?|inr|₹)?\s*(\d+(\.\d{1,2})?)/i,
        ];
        for (const pat of amtPatterns) {
            const m = message.match(pat);
            if (m) { data.amount = parseFloat(m[1]); break; }
        }
        if (!data.amount && lastPrompt === 'amount') {
            const numMatch = message.match(/(\d+(\.\d{1,2})?)/);
            if (numMatch) data.amount = parseFloat(numMatch[1]);
        }
    }

    // --- Category ---
    if (!data.category) {
        if (lower.includes('transport')) data.category = 'Transport';
        else if (lower.includes('shopping')) data.category = 'Shopping';
        else if (lower.includes('food')) data.category = 'Food';
        else if (lastPrompt === 'category') {
            if (lower.includes('1')) data.category = 'Transport';
            else if (lower.includes('2')) data.category = 'Shopping';
            else if (lower.includes('3')) data.category = 'Food';
        }
    }

    // --- Card Type ---
    if (!data.cardType) {
        if (lower.includes('debit')) data.cardType = 'Debit Card';
        else if (lower.includes('credit')) data.cardType = 'Credit Card';
        else if (lastPrompt === 'cardType') {
            if (lower.includes('1')) data.cardType = 'Debit Card';
            else if (lower.includes('2')) data.cardType = 'Credit Card';
        }
    }

    // --- Date ---
    if (!data.date) {
        const dateMatch = message.match(/(\d{2}-\d{2}-\d{4})/);
        if (dateMatch) {
            data.date = dateMatch[1];
            delete data._dateError;
        } else if (lower.includes('today')) {
            const d = new Date();
            data.date = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
        } else if (lower.includes('yesterday')) {
            const d = new Date(Date.now() - 86400000);
            data.date = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
        } else if (lastPrompt === 'date' || message.match(/\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/)) {
            data._dateError = "Invalid date format. Please use **DD-MM-YYYY** exactly.";
        }
    }

    // --- Contact Number ---
    if (!data.contactNumber) {
        const phoneMatch = message.match(/(\+\d{1,4}\s?\d{10})/);
        if (phoneMatch) {
            const digitsOnly = phoneMatch[1].replace(/\D/g, '').slice(-10);
            if (digitsOnly.length === 10) {
                data.contactNumber = phoneMatch[1].replace(/\s/g, '');
                delete data._phoneError;
            } else {
                data._phoneError = "The number must have exactly 10 digits after the country code.";
            }
        } else if (lastPrompt === 'contactNumber') {
            const bareDigits = message.replace(/\D/g, '');
            if (bareDigits.length >= 10) {
                data.contactNumber = '+' + bareDigits;
                if (!/^\+\d{1,4}\d{10}$/.test(data.contactNumber)) {
                    data.contactNumber = null;
                    data._phoneError = "Invalid format. Use country code + 10 digits (e.g., +919876543210).";
                }
            } else {
                data._phoneError = "Please enter country code followed by exactly 10 digits.";
            }
        }
    }

    // --- Email ---
    if (!data.email) {
        const emailMatch = message.match(/([\w.-]+@[\w.-]+\.\w+)/);
        if (emailMatch) {
            data.email = emailMatch[1];
            delete data._emailError;
        } else if (lastPrompt === 'email') {
            data._emailError = "Please enter a valid email address.";
        }
    }

    // --- Full Name ---
    if (!data.fullName) {
        const namePattern = message.match(/(?:my name is|name is|i[''']?m)\s+([A-Za-z]+ [A-Za-z]+)/i);
        if (namePattern) {
            data.fullName = namePattern[1].trim();
            delete data._nameError;
        } else if (lastPrompt === 'fullName') {
            const parts = message.trim().split(/\s+/);
            if (parts.length >= 2) {
                data.fullName = message.trim();
                delete data._nameError;
            } else {
                data._nameError = "First and Last name both required. Please enter correctly.";
            }
        }
    }

    // --- Description ---
    if (!data.description) {
        if (lastPrompt === 'description') {
            data.description = message.trim();
        } else {
            const forMatch = message.match(/\bfor\s+([a-zA-Z][\w\s]{1,30}?)(?:\s+(?:with|using|via|on|today|yesterday)|\s*$)/i);
            if (forMatch) data.description = forMatch[1].trim();
        }
    }

    return data;
}

// --- Sequential missing field prompts ---
function getMissingFieldPrompt(data) {
    if (data._nameError)      return { field: 'fullName',       prompt: `⚠️ ${data._nameError}` };
    if (!data.fullName)       return { field: 'fullName',       prompt: "What is your full name? (First and Last name required)" };
    
    if (data._phoneError)     return { field: 'contactNumber',  prompt: `⚠️ ${data._phoneError}` };
    if (!data.contactNumber)  return { field: 'contactNumber',  prompt: "What is your contact number? (Include country code, e.g. +91 9876543210)" };
    
    if (data._emailError)     return { field: 'email',          prompt: `⚠️ ${data._emailError}` };
    if (!data.email)          return { field: 'email',          prompt: "What is your email address?" };
    
    if (!data.cardType)       return { field: 'cardType',       prompt: "Which card type? (1. Debit Card  2. Credit Card)" };
    if (!data.category)       return { field: 'category',       prompt: "Which category? (1. Transport  2. Shopping  3. Food)" };
    if (!data.amount)         return { field: 'amount',         prompt: "How much did you spend? (Amount in ₹)" };
    if (!data.description)    return { field: 'description',    prompt: "What was this expense for? (Brief description)" };
    
    if (data._dateError)      return { field: 'date',           prompt: `⚠️ ${data._dateError}` };
    if (!data.date)           return { field: 'date',           prompt: "What was the date? (DD-MM-YYYY or say 'today')" };
    
    return null;
}

function formatSummary(d) {
    return `Transaction detected. Please review the draft details below:`;
}

// --- Main Chat Router ---
router.post('/', auth, async (req, res) => {
    const { sessionId, message, userContext } = req.body;
    const userId = req.userId;

    // Build a profile seed from logged-in user context
    const profileSeed = {};
    if (userContext?.name && userContext.name.trim().split(' ').length >= 2) {
        profileSeed.fullName = userContext.name.trim();
    }
    if (userContext?.email) profileSeed.email = userContext.email;
    if (userContext?.phone) {
        const digits = userContext.phone.replace(/\D/g, '').slice(-10);
        if (digits.length === 10) profileSeed.contactNumber = userContext.phone;
    }

    if (!sessions[sessionId]) {
        sessions[sessionId] = { state: 'MENU', data: {}, lastPrompt: null };
    }

    const session = sessions[sessionId];
    const lowerMsg = message.toLowerCase().trim();

    // Global cancel
    if (['cancel', 'exit', 'quit', 'back', 'menu'].includes(lowerMsg)) {
        session.state = 'MENU';
        session.data = {};
        session.lastPrompt = null;
        return res.json({ reply: "Returned to main menu.\n\n1. Create Expense\n2. View Expenses\n3. Modify / Delete Expense", state: 'MENU' });
    }

    // FAQ check (only in MENU state to avoid interrupting flows)
    if (session.state === 'MENU') {
        // Check FAQs first
        const faqReply = checkFAQ(message);
        if (faqReply) return res.json({ reply: faqReply, state: session.state });

        const analyticalReply = await checkAnalyticalQuery(message, userId);
        if (analyticalReply) return res.json({ reply: analyticalReply, state: session.state });
    }

    switch (session.state) {

        // ===================== MENU =====================
        case 'MENU': {
            const isExpenseIntent = /(?:spend|spent|cost|paid|pay|purchase|bought|rs\.?|inr|₹)\s*\d+|\d+\s*(?:rupees|rs\.?|inr|₹)/i.test(message);

            if (lowerMsg.includes('1') || lowerMsg.includes('create') || lowerMsg.includes('add') || lowerMsg.includes('new') || isExpenseIntent) {
                session.state = 'CREATE_GATHER';
                // Seed known profile data first, then extract from message
                session.data = extractEntities(message, { ...profileSeed }, null);
                session.lastPrompt = null;
                const missing = getMissingFieldPrompt(session.data);
                if (missing) {
                    session.lastPrompt = missing.field;
                    const prefilled = Object.keys(profileSeed).length > 0
                        ? `\n\n🔒 I already have your profile details on file — your identity and contact information have been securely retrieved.`
                        : '';
                    return res.json({ reply: `Let's log a new expense!${prefilled}\n\n${missing.prompt}`, state: 'CREATE_GATHER' });
                }
                session.state = 'CONFIRM_SAVE';
                if (!session.data.shortId) {
                    session.data.shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
                }
                return res.json({ 
                    reply: formatSummary(session.data), 
                    state: 'CONFIRM_SAVE',
                    draftData: session.data 
                });
            }

            if (lowerMsg.includes('2') || lowerMsg.includes('view') || lowerMsg.includes('history') || lowerMsg.includes('show')) {
                // If profile has phone, skip the prompt and query directly
                if (profileSeed.contactNumber) {
                    const digits = profileSeed.contactNumber.replace(/\D/g, '').slice(-10);
                    try {
                        const expenses = await Expense.find({ userId, contactNumber: { $regex: new RegExp(digits + '$') } }).sort({ createdAt: -1 });
                        if (!expenses.length) {
                            return res.json({ reply: `No expenses found for ${profileSeed.contactNumber}. Type 'menu' to go back.`, requiresAction: 'LOAD_HISTORY', state: 'MENU' });
                        }
                        const lines = expenses.map(e => `• [${e.shortId}] ${e.date} | ${e.category} | ₹${e.amount} | ${e.description}`).join('\n');
                        return res.json({ reply: `Found ${expenses.length} expense(s) for ${profileSeed.contactNumber}:\n\n${lines}`, requiresAction: 'LOAD_HISTORY', state: 'MENU' });
                    } catch { }
                }
                session.state = 'VIEW_ASK_MOBILE';
                return res.json({ reply: "Please provide your registered contact number (with country code) to retrieve your expenses.", state: 'VIEW_ASK_MOBILE' });
            }

            if (lowerMsg.includes('3') || lowerMsg.includes('modify') || lowerMsg.includes('delete') || lowerMsg.includes('edit') || lowerMsg.includes('change') || lowerMsg.includes('update')) {
                // If profile has phone, skip prompt and load directly
                if (profileSeed.contactNumber) {
                    const digits = profileSeed.contactNumber.replace(/\D/g, '').slice(-10);
                    try {
                        const expenses = await Expense.find({ userId, contactNumber: { $regex: new RegExp(digits + '$') } }).sort({ createdAt: -1 });
                        if (!expenses.length) {
                            return res.json({ reply: `No expenses found for ${profileSeed.contactNumber}. Type 'menu' to go back.`, state: 'MENU' });
                        }
                        const lines = expenses.map(e => `• **${e.shortId}** | ${e.date} | ${e.category} | ₹${e.amount} | ${e.description}`).join('\n');
                        session.state = 'MODIFY_ACTION';
                        session.modifyExpenses = expenses;
                        return res.json({ reply: `Found ${expenses.length} expense(s):\n\n${lines}\n\nSay:\n• "delete [ID]" to remove\n• "change date [ID] to DD-MM-YYYY" to update`, requiresAction: 'LOAD_MODIFY', state: 'MODIFY_ACTION' });
                    } catch { }
                }
                session.state = 'MODIFY_ASK_MOBILE';
                return res.json({ reply: "Please share your contact number to look up your expenses.", state: 'MODIFY_ASK_MOBILE' });
            }

            if (lowerMsg.includes('undo') || lowerMsg.includes('last expense')) {
                if (session.lastSavedId) {
                    try {
                        await Expense.findOneAndDelete({ _id: session.lastSavedId, userId });
                        session.lastSavedId = null;
                        return res.json({ reply: "✅ Your last saved expense has been deleted.", requiresAction: 'REFRESH_ANALYTICS', state: 'MENU' });
                    } catch { }
                }
                return res.json({ reply: "No recent expense to undo.", state: 'MENU' });
            }

            return res.json({
                reply: "Hi! I'm your Precision Ledger AI.\n\n1. Create Expense\n2. View Expenses\n3. Modify / Delete Expense\n\nOr ask me anything — what categories do you support? How is my data kept secure?",
                state: 'MENU'
            });
        }

        // ===================== CREATE_GATHER =====================
        case 'CREATE_GATHER': {
            session.data = extractEntities(message, session.data, session.lastPrompt);
            const missing = getMissingFieldPrompt(session.data);
            if (missing) {
                session.lastPrompt = missing.field;
                return res.json({ reply: missing.prompt, state: 'CREATE_GATHER' });
            }
            session.state = 'CONFIRM_SAVE';
            session.lastPrompt = null;
            if (!session.data.shortId) {
                session.data.shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
            }
            return res.json({ 
                reply: formatSummary(session.data), 
                state: 'CONFIRM_SAVE',
                draftData: session.data 
            });
        }

        // ===================== CONFIRM_SAVE =====================
        case 'CONFIRM_SAVE': {
            // Amendment at confirmation stage
            if (lowerMsg.startsWith('change ')) {
                session.data = extractEntities(message, session.data, null);
                return res.json({ 
                    reply: "Details updated. Please review the new draft:", 
                    state: 'CONFIRM_SAVE',
                    draftData: session.data 
                });
            }

            if (lowerMsg === 'yes' || lowerMsg === 'confirm' || lowerMsg === 'save' || lowerMsg === 'ok') {
                try {
                    const newExp = new Expense({ ...session.data, userId });
                    const saved = await newExp.save();
                    session.lastSavedId = saved._id;

                    // Budget alert check
                    let alertMsg = '';
                    try {
                        const budget = await Budget.findOne({ userId, category: session.data.category });
                        if (budget) {
                            const d = new Date();
                            const monthKey = `${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
                            const all = await Expense.find({ userId, category: session.data.category });
                            const monthSpend = all.filter(e => e.date && e.date.endsWith(monthKey.split('-')[1])).reduce((s, e) => s + e.amount, 0);
                            if (monthSpend >= budget.threshold) alertMsg = `\n\n⚠️ Budget Alert: You have exceeded your ₹${budget.threshold} limit for ${session.data.category}!`;
                        }
                    } catch { }

                    session.state = 'MENU';
                    session.data = {};
                    return res.json({ reply: `✅ Expense saved successfully! Your Short ID is **${saved.shortId}**${alertMsg}\n\n1. Create Expense  2. View Expenses  3. Modify / Delete`, requiresAction: 'REFRESH_ANALYTICS', state: 'MENU' });
                } catch (err) {
                    const errMsg = err.errors ? Object.values(err.errors).map(e => e.message).join(', ') : err.message;
                    return res.json({ reply: `❌ Could not save: ${errMsg}. Please correct and try again.`, state: 'CONFIRM_SAVE' });
                }
            }

            return res.json({ 
                reply: "Type **yes** to save, **cancel** to abort, or say \"change [field] to [value]\" to amend.", 
                state: 'CONFIRM_SAVE',
                draftData: session.data
            });
        }

        // ===================== VIEW_ASK_MOBILE =====================
        case 'VIEW_ASK_MOBILE': {
            const phoneMatch = message.match(/(\+?\d[\d\s\-]{9,14})/);
            if (!phoneMatch) {
                return res.json({ reply: "That doesn't look like a valid contact number. Please try again (e.g. +91 9876543210).", state: 'VIEW_ASK_MOBILE' });
            }
            const digitsOnly = phoneMatch[1].replace(/\D/g, '').slice(-10);
            if (digitsOnly.length !== 10) {
                return res.json({ reply: "Contact number must have exactly 10 digits after the country code. Please re-enter.", state: 'VIEW_ASK_MOBILE' });
            }
            try {
                const expenses = await Expense.find({ userId, contactNumber: { $regex: new RegExp(digitsOnly + '$') } }).sort({ createdAt: -1 });
                if (!expenses.length) {
                    return res.json({ reply: "No expenses found for that number. Is it the correct number? You can try again or type 'menu' to go back.", state: 'VIEW_ASK_MOBILE' });
                }
                const lines = expenses.map(e => `• [${e.shortId}] ${e.date} | ${e.category} | ₹${e.amount} | ${e.description}`).join('\n');
                session.state = 'MENU';
                return res.json({ reply: `Found ${expenses.length} expense(s):\n\n${lines}\n\nType 'menu' to return.`, requiresAction: 'LOAD_HISTORY', state: 'MENU' });
            } catch (err) {
                return res.json({ reply: "Error retrieving expenses. Please try again.", state: 'VIEW_ASK_MOBILE' });
            }
        }

        // ===================== MODIFY_ASK_MOBILE =====================
        case 'MODIFY_ASK_MOBILE': {
            const phoneMatch = message.match(/(\+?\d[\d\s\-]{9,14})/);
            if (!phoneMatch) {
                return res.json({ reply: "Invalid number. Please provide a contact number with country code.", state: 'MODIFY_ASK_MOBILE' });
            }
            const digitsOnly = phoneMatch[1].replace(/\D/g, '').slice(-10);
            if (digitsOnly.length !== 10) {
                return res.json({ reply: "Contact number must have exactly 10 digits. Please re-enter.", state: 'MODIFY_ASK_MOBILE' });
            }
            try {
                const expenses = await Expense.find({ userId, contactNumber: { $regex: new RegExp(digitsOnly + '$') } }).sort({ createdAt: -1 });
                if (!expenses.length) {
                    return res.json({ reply: "No expenses found for that number. Try again or type 'menu'.", state: 'MODIFY_ASK_MOBILE' });
                }
                const lines = expenses.map(e => `• **${e.shortId}** | ${e.date} | ${e.category} | ₹${e.amount} | ${e.description}`).join('\n');
                session.state = 'MODIFY_ACTION';
                session.modifyExpenses = expenses;
                return res.json({
                    reply: `Found ${expenses.length} expense(s):\n\n${lines}\n\nSay:\n• "delete [ID]" to remove\n• "change date [ID] to DD-MM-YYYY" to update`,
                    requiresAction: 'LOAD_MODIFY',
                    state: 'MODIFY_ACTION'
                });
            } catch (err) {
                return res.json({ reply: "Error retrieving expenses.", state: 'MODIFY_ASK_MOBILE' });
            }
        }

        // ===================== MODIFY_ACTION =====================
        case 'MODIFY_ACTION': {
            const deleteMatch = message.match(/delete\s+([A-Z0-9]+)/i);
            const changeDateMatch = message.match(/change\s+date\s+([A-Z0-9]+)\s+to\s+(\d{2}-\d{2}-\d{4})/i);

            if (deleteMatch) {
                const shortId = deleteMatch[1].toUpperCase();
                const expense = (session.modifyExpenses || []).find(e => e.shortId === shortId);
                if (!expense) return res.json({ reply: `No expense found with ID ${shortId}. Please check and try again.`, state: 'MODIFY_ACTION' });
                session.pendingAction = { type: 'delete', id: expense._id, shortId };
                session.state = 'MODIFY_CONFIRM';
                return res.json({ reply: `Are you sure you want to DELETE expense **${shortId}** (₹${expense.amount} - ${expense.description})? Type **yes** to confirm or **cancel** to abort.`, state: 'MODIFY_CONFIRM' });
            }

            if (changeDateMatch) {
                const shortId = changeDateMatch[1].toUpperCase();
                const newDate = changeDateMatch[2];
                const expense = (session.modifyExpenses || []).find(e => e.shortId === shortId);
                if (!expense) return res.json({ reply: `No expense found with ID ${shortId}.`, state: 'MODIFY_ACTION' });
                session.pendingAction = { type: 'update_date', id: expense._id, shortId, newDate };
                session.state = 'MODIFY_CONFIRM';
                return res.json({ reply: `Change date of **${shortId}** to **${newDate}**? Type **yes** to confirm or **cancel** to abort.`, state: 'MODIFY_CONFIRM' });
            }

            return res.json({ reply: "Please say \"delete [ID]\" or \"change date [ID] to DD-MM-YYYY\".", state: 'MODIFY_ACTION' });
        }

        // ===================== MODIFY_CONFIRM =====================
        case 'MODIFY_CONFIRM': {
            if (lowerMsg === 'yes' || lowerMsg === 'confirm') {
                const action = session.pendingAction;
                try {
                    if (action.type === 'delete') {
                        await Expense.findOneAndDelete({ _id: action.id, userId });
                        session.state = 'MENU';
                        session.pendingAction = null;
                        return res.json({ reply: `✅ Expense **${action.shortId}** has been deleted.`, requiresAction: 'REFRESH_ANALYTICS', state: 'MENU' });
                    }
                    if (action.type === 'update_date') {
                        await Expense.findOneAndUpdate({ _id: action.id, userId }, { date: action.newDate }, { new: true, runValidators: true });
                        session.state = 'MENU';
                        session.pendingAction = null;
                        return res.json({ reply: `✅ Date updated to **${action.newDate}** for expense **${action.shortId}**.`, requiresAction: 'REFRESH_ANALYTICS', state: 'MENU' });
                    }
                } catch (err) {
                    return res.json({ reply: `❌ Operation failed: ${err.message}`, state: 'MENU' });
                }
            }
            session.state = 'MENU';
            session.pendingAction = null;
            return res.json({ reply: "Operation cancelled. Back to main menu.\n\n1. Create  2. View  3. Modify/Delete", state: 'MENU' });
        }

        default:
            session.state = 'MENU';
            return res.json({ reply: "Hi! 1. Create Expense  2. View Expenses  3. Modify / Delete Expense", state: 'MENU' });
    }
});

module.exports = { 
    router, 
    extractEntities, 
    checkFAQ 
};
