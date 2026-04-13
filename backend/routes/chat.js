const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const auth = require('../middleware/authMiddleware');

const sessions = {};

// --- 5 FAQ Responses (inline, no dialog triggered) ---
const FAQS = [
    {
        keywords: ['how to add expense', 'add expense', 'create expense', 'new expense', 'log expense'],
        response: 'To add an expense, simply type it naturally like "Spent 500 on dinner using debit card today" or select "CREATE EXPENSE" from the menu. I will guide you through any missing details.'
    },
    {
        keywords: ['what categories', 'allowed categories', 'categories allowed', 'support categories'],
        response: 'I support three main categories:\n• **Transport** (Bus, Taxi, Fuel, Flights, etc.)\n• **Shopping** (Clothes, Electronics, Groceries, Amazon, etc.)\n• **Food** (Restaurant, Snacks, Swiggy, Zomato, etc.)'
    },
    {
        keywords: ['can i edit', 'edit expense', 'modify expense', 'change expense', 'delete expense'],
        response: 'Yes! You can modify or delete expenses via the "MODIFY/DELETE" option in the menu. You can also edit details during the confirmation step by saying "change [field] to [value]".'
    },
    {
        keywords: ['how is total calculated', 'calculation', 'total spending', 'total total'],
        response: 'Total spending is calculated by summing up all your recorded expenses for the current month or specific categories. You can see this in the Analytics tab or by asking me "how much did I spend?".'
    },
    {
        keywords: ['is my data secure', 'safe', 'privacy', 'security'],
        response: 'Your data is highly secure. We use industry-standard encryption and secure authentication protocols to ensure your transaction history and profile details remain private and protected.'
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

    const amendPhone = message.match(/change\s+contact\s+to\s+(\+?\d+)/i);
    if (amendPhone) { data.contactNumber = amendPhone[1]; delete data._phoneError; return data; }

    const amendEmail = message.match(/change\s+email\s+to\s+([\w.-]+@[\w.-]+\.\w+)/i);
    if (amendEmail) { data.email = amendEmail[1]; delete data._emailError; return data; }

    const amendName = message.match(/change\s+name\s+to\s+([A-Za-z]+\s+[A-Za-z]+)/i);
    if (amendName) { data.fullName = amendName[1]; delete data._nameError; return data; }

    // --- Amount ---
    if (!data.amount) {
        const amtMatch = message.match(/(?:rs\.?|inr|₹|amount|spent|paid)\s*(\d+(\.\d{1,2})?)/i) || 
                         message.match(/(\d+(\.\d{1,2})?)\s*(?:rupees|rs\.?|inr|₹)/i);
        if (amtMatch) data.amount = parseFloat(amtMatch[1]);
        else if (lastPrompt === 'amount') {
            const numMatch = message.match(/(\d+(\.\d{1,2})?)/);
            if (numMatch) data.amount = parseFloat(numMatch[1]);
        }
    }

    // --- Category Mapping (Strict but Intelligent) ---
    const transportKws = ['bus', 'taxi', 'cab', 'uber', 'ola', 'auto', 'metro', 'train', 'railway', 'flight', 'airplane', 'ticket', 'tickets', 'booking', 'booked', 'reservation', 'reserved', 'travel', 'travelling', 'commute', 'commuting', 'petrol', 'diesel', 'fuel', 'gas', 'refill', 'refueled', 'fuelled', 'parking', 'toll', 'fare', 'charges', 'bike', 'scooter', 'car', 'vehicle', 'ride', 'trip', 'journey', 'drop', 'pickup', 'transport', 'transportation', 'travel expense', 'mileage', 'rental', 'rent', 'rented', 'car rent', 'vehicle rent', 'transit', 'shuttle', 'road trip', 'highway', 'pass', 'travel pass', 'cab fare', 'fuel expense'];
    const shoppingKws = ['buy', 'bought', 'purchase', 'purchased', 'purchasing', 'order', 'ordered', 'ordering', 'shopping', 'shopped', 'got', 'taken', 'picked up', 'pickup', 'grabbed', 'collect', 'collected', 'clothes', 'clothing', 'shirt', 't-shirt', 'jeans', 'pants', 'dress', 'shoes', 'sandals', 'watch', 'mobile', 'phone', 'smartphone', 'laptop', 'charger', 'electronics', 'gadget', 'accessories', 'bag', 'groceries', 'grocery', 'items', 'stuff', 'products', 'goods', 'amazon', 'flipkart', 'myntra', 'ajio', 'mall', 'store', 'shop', 'showroom', 'outlet', 'supermarket', 'hypermarket', 'market', 'sale', 'offer', 'discount', 'deal', 'combo', 'purchase item', 'billing', 'checkout', 'payment', 'invoice', 'receipt', 'retail', 'brand', 'online order', 'offline purchase'];
    const foodKws = ['food', 'lunch', 'dinner', 'breakfast', 'brunch', 'snacks', 'snack', 'tea', 'coffee', 'juice', 'soft drink', 'cold drink', 'water', 'restaurant', 'hotel', 'cafe', 'canteen', 'mess', 'meal', 'eating', 'ate', 'dine', 'dining', 'takeaway', 'takeout', 'parcel', 'ordered food', 'had food', 'had lunch', 'had dinner', 'had breakfast', 'fast food', 'street food', 'cuisine', 'dish', 'biryani', 'pizza', 'burger', 'sandwich', 'dosa', 'idli', 'noodles', 'pasta', 'rice', 'curry', 'thali', 'sweets', 'dessert', 'ice cream', 'chocolate', 'bakery', 'cake', 'pastry', 'beverage', 'drink'];

    if (!data.category) {
        // 1. Match action + object / Intent phrases / Loose natural language
        if (lower.includes('went for dinner') || lower.includes('had food') || lower.includes('had something to eat') || lower.includes('meal') || lower.includes('dish')) {
            data.category = 'Food';
        } else if (lower.includes('booked tickets') || lower.includes('paid for ride') || lower.includes('fare') || lower.includes('ticket') || lower.includes('fuel')) {
            data.category = 'Transport';
        } else if (lower.includes('did shopping') || lower.includes('spent on random stuff') || lower.includes('invoice') || lower.includes('checkout')) {
            data.category = 'Shopping';
        } 
        
        // 2. Object-based meaning (strong indicators)
        else if (['pizza', 'coffee'].some(obj => lower.includes(obj))) data.category = 'Food';
        else if (['shirt', 'laptop'].some(obj => lower.includes(obj))) data.category = 'Shopping';
        else if (['cab', 'fuel'].some(obj => lower.includes(obj))) data.category = 'Transport';

        // 3. Match keywords (Fallback)
        else if (transportKws.some(kw => lower.includes(kw))) data.category = 'Transport';
        else if (shoppingKws.some(kw => lower.includes(kw))) data.category = 'Shopping';
        else if (foodKws.some(kw => lower.includes(kw))) data.category = 'Food';

        if (lastPrompt === 'category') {
            if (lower.includes('1') || lower.includes('transport')) data.category = 'Transport';
            else if (lower.includes('2') || lower.includes('shopping')) data.category = 'Shopping';
            else if (lower.includes('3') || lower.includes('food')) data.category = 'Food';
        }
    }

    // --- Card Type ---
    if (!data.cardType) {
        if (lower.includes('debit')) data.cardType = 'Debit Card';
        else if (lower.includes('credit')) data.cardType = 'Credit Card';
        else if (lastPrompt === 'cardType') {
            if (lower.includes('1') || lower.includes('debit')) data.cardType = 'Debit Card';
            else if (lower.includes('2') || lower.includes('credit')) data.cardType = 'Credit Card';
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
        } else if (lastPrompt === 'date') {
            data._dateError = "Must be DD-MM-YYYY format.";
        }
    }

    // --- Contact Number ---
    if (!data.contactNumber) {
        const phoneMatch = message.match(/(\+\d{1,4}\s?\d{10})/);
        if (phoneMatch) {
            data.contactNumber = phoneMatch[1].replace(/\s/g, '');
            delete data._phoneError;
        } else if (lastPrompt === 'contactNumber') {
            const bareDigits = message.replace(/\D/g, '');
            if (bareDigits.length >= 10) {
                const last10 = bareDigits.slice(-10);
                const prefix = bareDigits.length > 10 ? '+' + bareDigits.slice(0, bareDigits.length - 10) : '+91';
                data.contactNumber = prefix + last10;
            } else {
                data._phoneError = "Country code + exactly 10 digits required.";
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
            data._emailError = "Valid email format required.";
        }
    }

    // --- Full Name ---
    if (!data.fullName) {
        const nameMatch = message.match(/(?:my name is|name is|i am|i'm)\s+([A-Za-z]+\s+[A-Za-z]+)/i);
        if (nameMatch) {
            data.fullName = nameMatch[1].trim();
            delete data._nameError;
        } else if (lastPrompt === 'fullName') {
            const parts = message.trim().split(/\s+/);
            if (parts.length >= 2) data.fullName = message.trim();
            else data._nameError = "First + Last name required.";
        }
    }

    // --- Description ---
    if (!data.description) {
        if (lastPrompt === 'description') {
            data.description = message.trim();
        } else {
            // Auto-generate if object detected
            const objects = [...transportKws, ...shoppingKws, ...foodKws];
            const foundObject = objects.find(obj => lower.includes(obj));
            if (foundObject) {
                data.description = `Bought ${foundObject}`;
            } else {
                const forMatch = message.match(/\bfor\s+([a-zA-Z][\w\s]{1,30}?)(?:\s+(?:with|using|via|on|today|yesterday)|\s*$)/i);
                if (forMatch) data.description = forMatch[1].trim();
            }
        }
    }

    return data;
}

// --- Sequential missing field prompts ---
function getMissingFieldPrompt(data) {
    const missing = [];
    if (!data.fullName) missing.push("Full Name");
    if (!data.amount) missing.push("Amount");
    if (!data.category) missing.push("Category");
    if (!data.cardType) missing.push("Card Type");
    if (!data.contactNumber) missing.push("Contact Number");
    if (!data.email) missing.push("Email");
    if (!data.description) missing.push("Description");
    if (!data.date) missing.push("Date");

    if (missing.length === 0) return null;

    // If it's a validation error, prioritize it
    if (data._nameError) return { field: 'fullName', prompt: `⚠️ ${data._nameError}` };
    if (data._phoneError) return { field: 'contactNumber', prompt: `⚠️ ${data._phoneError}` };
    if (data._emailError) return { field: 'email', prompt: `⚠️ ${data._emailError}` };
    if (data._dateError) return { field: 'date', prompt: `⚠️ ${data._dateError}` };

    // Otherwise, show detected fields and ask for the rest
    const detected = [];
    if (data.amount) detected.push(`Amount: ${data.amount}`);
    if (data.category) detected.push(`Category: ${data.category}`);
    if (data.description) detected.push(`Description: ${data.description}`);

    const replyArr = [];
    if (detected.length > 0) {
        replyArr.push("✅ **Detected Details**:");
        detected.forEach(d => replyArr.push(`• ${d}`));
        replyArr.push("");
    }
    
    // Use the first missing field as the target for the next input, but list all
    const firstMissingField = (function() {
        if (!data.fullName) return 'fullName';
        if (!data.contactNumber) return 'contactNumber';
        if (!data.email) return 'email';
        if (!data.cardType) return 'cardType';
        if (!data.category) return 'category';
        if (!data.amount) return 'amount';
        if (!data.description) return 'description';
        if (!data.date) return 'date';
        return null;
    })();

    replyArr.push(`Please provide remaining details: **${missing.join(', ')}**`);
    
    return { field: firstMissingField, prompt: replyArr.join('\n') };
}

function formatSummary(d) {
    return `**Transaction Detected**
Please review the details below:
• **Full Name**: ${d.fullName}
• **Amount**: ₹${d.amount}
• **Category**: ${d.category}
• **Description**: ${d.description}
• **Date**: ${d.date}
• **Card Type**: ${d.cardType}
• **Contact Number**: ${d.contactNumber}
• **Email**: ${d.email}

**Do you want to save or modify any field?**`;
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
