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

    // Mapping camelCase (internal/DB) to snake_case (API/Prompt)
    const getVal = (k) => data[k];
    const setVal = (k, v) => data[k] = v;

    // --- Amendment Hooks (Entity Amendment) ---
    const amendAmount = message.match(/change\s+amount\s+to\s+(\d+(\.\d{1,2})?)/i);
    if (amendAmount) { setVal('amount', parseFloat(amendAmount[1])); return data; }

    const amendCat = message.match(/change\s+category\s+to\s+(transport|shopping|food)/i);
    if (amendCat) { setVal('category', amendCat[1].charAt(0).toUpperCase() + amendCat[1].slice(1).toLowerCase()); return data; }

    const amendDate = message.match(/change\s+date\s+to\s+(\d{2}-\d{2}-\d{4})/i);
    if (amendDate) { setVal('date', amendDate[1]); delete data._dateError; return data; }

    const amendCard = message.match(/change\s+card\s+to\s+(debit|credit)/i);
    if (amendCard) { setVal('card_type', amendCard[1].charAt(0).toUpperCase() + amendCard[1].slice(1).toLowerCase() + ' Card'); return data; }

    const amendDesc = message.match(/change\s+description\s+to\s+(.+)/i);
    if (amendDesc) { setVal('description', amendDesc[1].trim()); return data; }

    const amendPhone = message.match(/change\s+contact\s+to\s+(\+?\d+)/i);
    if (amendPhone) { setVal('contact_number', amendPhone[1]); delete data._phoneError; return data; }

    const amendEmail = message.match(/change\s+email\s+to\s+([\w.-]+@[\w.-]+\.\w+)/i);
    if (amendEmail) { setVal('email', amendEmail[1]); delete data._emailError; return data; }

    const amendName = message.match(/change\s+name\s+to\s+([A-Za-z]+\s+[A-Za-z]+)/i);
    if (amendName) { setVal('full_name', amendName[1]); delete data._nameError; return data; }

    // --- Amount ---
    if (!getVal('amount')) {
        const amtMatch = message.match(/(?:rs\.?|inr|₹|amount|spent|paid)\s*(\d+(\.\d{1,2})?)/i) || 
                         message.match(/(\d+(\.\d{1,2})?)\s*(?:rupees|rs\.?|inr|₹)/i);
        if (amtMatch) setVal('amount', parseFloat(amtMatch[1]));
        else if (lastPrompt === 'amount') {
            const numMatch = message.match(/(\d+(\.\d{1,2})?)/);
            if (numMatch) setVal('amount', parseFloat(numMatch[1]));
        }
    }

    // --- Category Mapping ---
    const transportKws = ['bus', 'taxi', 'cab', 'uber', 'ola', 'auto', 'metro', 'train', 'railway', 'flight', 'airplane', 'ticket', 'tickets', 'booking', 'booked', 'reservation', 'reserved', 'travel', 'travelling', 'commute', 'commuting', 'petrol', 'diesel', 'fuel', 'gas', 'refill', 'refueled', 'fuelled', 'parking', 'toll', 'fare', 'charges', 'bike', 'scooter', 'car', 'vehicle', 'ride', 'trip', 'journey', 'drop', 'pickup', 'transport', 'transportation', 'travel expense', 'mileage', 'rental', 'rent', 'rented', 'car rent', 'vehicle rent', 'transit', 'shuttle', 'road trip', 'highway', 'pass', 'travel pass', 'cab fare', 'fuel expense'];
    const shoppingKws = ['buy', 'bought', 'purchase', 'purchased', 'purchasing', 'order', 'ordered', 'ordering', 'shopping', 'shopped', 'got', 'taken', 'picked up', 'pickup', 'grabbed', 'collect', 'collected', 'clothes', 'clothing', 'shirt', 't-shirt', 'jeans', 'pants', 'dress', 'shoes', 'sandals', 'watch', 'mobile', 'phone', 'smartphone', 'laptop', 'charger', 'electronics', 'gadget', 'accessories', 'bag', 'groceries', 'grocery', 'items', 'stuff', 'products', 'goods', 'amazon', 'flipkart', 'myntra', 'ajio', 'mall', 'store', 'shop', 'showroom', 'outlet', 'supermarket', 'hypermarket', 'market', 'sale', 'offer', 'discount', 'deal', 'combo', 'purchase item', 'billing', 'checkout', 'payment', 'invoice', 'receipt', 'retail', 'brand', 'online order', 'offline purchase'];
    const foodKws = ['food', 'lunch', 'dinner', 'breakfast', 'brunch', 'snacks', 'snack', 'tea', 'coffee', 'juice', 'soft drink', 'cold drink', 'water', 'restaurant', 'hotel', 'cafe', 'canteen', 'mess', 'meal', 'eating', 'ate', 'dine', 'dining', 'takeaway', 'takeout', 'parcel', 'ordered food', 'had food', 'had lunch', 'had dinner', 'had breakfast', 'fast food', 'street food', 'cuisine', 'dish', 'biryani', 'pizza', 'burger', 'sandwich', 'dosa', 'idli', 'noodles', 'pasta', 'rice', 'curry', 'thali', 'sweets', 'dessert', 'ice cream', 'chocolate', 'bakery', 'cake', 'pastry', 'beverage', 'drink'];

    if (!getVal('category')) {
        if (lower.includes('went for dinner') || lower.includes('had food') || lower.includes('had something to eat') || lower.includes('meal') || lower.includes('dish')) {
            setVal('category', 'Food');
        } else if (lower.includes('booked tickets') || lower.includes('paid for ride') || lower.includes('fare') || lower.includes('ticket') || lower.includes('fuel')) {
            setVal('category', 'Transport');
        } else if (lower.includes('did shopping') || lower.includes('spent on random stuff') || lower.includes('invoice') || lower.includes('checkout')) {
            setVal('category', 'Shopping');
        } 
        else if (['pizza', 'coffee'].some(obj => lower.includes(obj))) setVal('category', 'Food');
        else if (['shirt', 'laptop'].some(obj => lower.includes(obj))) setVal('category', 'Shopping');
        else if (['cab', 'fuel'].some(obj => lower.includes(obj))) setVal('category', 'Transport');
        else if (transportKws.some(kw => lower.includes(kw))) setVal('category', 'Transport');
        else if (shoppingKws.some(kw => lower.includes(kw))) setVal('category', 'Shopping');
        else if (foodKws.some(kw => lower.includes(kw))) setVal('category', 'Food');

        if (lastPrompt === 'category') {
            if (lower.includes('1') || lower.includes('transport')) setVal('category', 'Transport');
            else if (lower.includes('2') || lower.includes('shopping')) setVal('category', 'Shopping');
            else if (lower.includes('3') || lower.includes('food')) setVal('category', 'Food');
        }
    }

    // --- Card Type ---
    if (!getVal('card_type')) {
        if (lower.includes('debit')) setVal('card_type', 'Debit Card');
        else if (lower.includes('credit')) setVal('card_type', 'Credit Card');
        else if (lastPrompt === 'card_type') {
            if (lower.includes('1') || lower.includes('debit')) setVal('card_type', 'Debit Card');
            else if (lower.includes('2') || lower.includes('credit')) setVal('card_type', 'Credit Card');
        }
    }

    // --- Date ---
    if (!getVal('date')) {
        const dateMatch = message.match(/(\d{2}-\d{2}-\d{4})/);
        if (dateMatch) {
            setVal('date', dateMatch[1]);
            delete data._dateError;
        } else if (lower.includes('today')) {
            const d = new Date();
            setVal('date', `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`);
        } else if (lower.includes('yesterday')) {
            const d = new Date(Date.now() - 86400000);
            setVal('date', `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`);
        } else if (lastPrompt === 'date') {
            data._dateError = "Must be DD-MM-YYYY format.";
        }
    }

    // --- Contact Number ---
    if (!getVal('contact_number')) {
        const phoneMatch = message.match(/(\+\d{1,4}\s?\d{10})/);
        if (phoneMatch) {
            setVal('contact_number', phoneMatch[1].replace(/\s/g, ''));
            delete data._phoneError;
        } else if (lastPrompt === 'contact_number') {
            const bareDigits = message.replace(/\D/g, '');
            if (bareDigits.length >= 10) {
                const last10 = bareDigits.slice(-10);
                const prefix = bareDigits.length > 10 ? '+' + bareDigits.slice(0, bareDigits.length - 10) : '+91';
                setVal('contact_number', prefix + last10);
            } else {
                data._phoneError = "Country code + 10 digits required.";
            }
        }
    }

    // --- Email ---
    if (!getVal('email')) {
        const emailMatch = message.match(/([\w.-]+@[\w.-]+\.\w+)/);
        if (emailMatch) {
            setVal('email', emailMatch[1]);
            delete data._emailError;
        } else if (lastPrompt === 'email') {
            data._emailError = "Valid email required.";
        }
    }

    // --- Full Name ---
    if (!getVal('full_name')) {
        const nameMatch = message.match(/(?:my name is|name is|i am|i'm)\s+([A-Za-z]+\s+[A-Za-z]+)/i);
        if (nameMatch) {
            setVal('full_name', nameMatch[1].trim());
            delete data._nameError;
        } else if (lastPrompt === 'full_name') {
            const parts = message.trim().split(/\s+/);
            if (parts.length >= 2) setVal('full_name', message.trim());
            else data._nameError = "First+Last name required.";
        }
    }

    // --- Description ---
    if (!getVal('description')) {
        if (lastPrompt === 'description') {
            setVal('description', message.trim());
        } else {
            const objects = [...transportKws, ...shoppingKws, ...foodKws];
            const foundObject = objects.find(obj => lower.includes(obj));
            if (foundObject) {
                setVal('description', `Bought ${foundObject}`);
            } else {
                const forMatch = message.match(/\bfor\s+([a-zA-Z][\w\s]{1,30}?)(?:\s+(?:with|using|via|on|today|yesterday)|\s*$)/i);
                if (forMatch) setVal('description', forMatch[1].trim());
            }
        }
    }

    return data;
}

// --- Sequential missing field prompts ---
function getMissingFieldPrompt(data) {
    const missing = [];
    if (!data.full_name) missing.push("Full Name");
    if (!data.amount) missing.push("Amount");
    if (!data.category) missing.push("Category");
    if (!data.card_type) missing.push("Card Type");
    if (!data.contact_number) missing.push("Contact Number");
    if (!data.email) missing.push("Email");
    if (!data.description) missing.push("Description");
    if (!data.date) missing.push("Date");

    if (missing.length === 0) return null;

    // If it's a validation error, prioritize it
    if (data._nameError) return { field: 'full_name', prompt: `⚠️ ${data._nameError}` };
    if (data._phoneError) return { field: 'contact_number', prompt: `⚠️ ${data._phoneError}` };
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
        if (!data.full_name) return 'full_name';
        if (!data.contact_number) return 'contact_number';
        if (!data.email) return 'email';
        if (!data.card_type) return 'card_type';
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
• **Full Name**: ${d.full_name}
• **Amount**: ₹${d.amount}
• **Category**: ${d.category}
• **Description**: ${d.description}
• **Date**: ${d.date}
• **Card Type**: ${d.card_type}
• **Contact Number**: ${d.contact_number}
• **Email**: ${d.email}

**Do you want to save or modify any field?**`;
}

// --- Main Chat Router ---
router.post('/', auth, async (req, res) => {
    const { sessionId, message, userContext } = req.body;
    const userId = req.userId;

    // Injected User Context (retrieved from profile/auth)
    const injectedData = {
        full_name: userContext?.name || "Guest User",
        contact_number: userContext?.phone || "+910000000000",
        email: userContext?.email || "user@example.com",
        date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-') // DD-MM-YYYY
    };

    if (!sessions[sessionId]) {
        sessions[sessionId] = { 
            state: 'MENU', 
            data: { ...injectedData }, 
            intent: 'GeneralQuery' 
        };
    }

    const session = sessions[sessionId];
    const lowerMsg = message.toLowerCase().trim();

    // Reset / Menu logic
    if (['cancel', 'exit', 'quit', 'back', 'menu'].includes(lowerMsg)) {
        session.state = 'MENU';
        session.data = { ...injectedData };
        session.intent = 'GeneralQuery';
        return res.json({
            intent: "GeneralQuery",
            is_ready_for_api: false,
            bot_reply: "Returned to main menu. How can I help you? (Create, View, Modify, or Delete)",
            extracted_data: session.data,
            missing_fields: []
        });
    }

    // FAQ check
    const faqReply = checkFAQ(message);
    if (faqReply && session.state === 'MENU') {
        return res.json({
            intent: "GeneralQuery",
            is_ready_for_api: false,
            bot_reply: faqReply,
            extracted_data: session.data,
            missing_fields: []
        });
    }

    // Step 1: Extract Entities & Update Internal State
    // Note: extractEntities now updates the existing session.data
    session.data = extractEntities(message, session.data, session.lastPrompt);

    // Step 2: Intent Routing
    const createIntents = ['create', 'add', 'spent', 'paid', 'bought', 'purchase', 'log'];
    const modifyIntents = ['modify', 'change', 'edit', 'update'];
    const deleteIntents = ['delete', 'remove'];

    if (modifyIntents.some(k => lowerMsg.includes(k))) session.intent = 'ModifyExpense';
    else if (deleteIntents.some(k => lowerMsg.includes(k))) session.intent = 'DeleteExpense';
    else if (createIntents.some(k => lowerMsg.includes(k)) || session.state === 'CREATE_GATHER') session.intent = 'CreateExpense';

    // RESPONSE OBJECT TEMPLATE
    let response = {
        intent: session.intent,
        is_ready_for_api: false,
        bot_reply: "",
        extracted_data: session.data,
        missing_fields: []
    };

    // ==========================================
    // INTENT: CreateExpense
    // ==========================================
    if (session.intent === 'CreateExpense') {
        session.state = 'CREATE_GATHER';
        const requiredFields = ['amount', 'description', 'category', 'card_type', 'date', 'full_name', 'contact_number', 'email'];
        
        response.missing_fields = requiredFields.filter(f => !session.data[f]);

        if (response.missing_fields.length > 0) {
            const missingPrompt = getMissingFieldPrompt(session.data);
            session.lastPrompt = missingPrompt.field;
            response.bot_reply = missingPrompt.prompt;
            return res.json(response);
        }

        // All fields present - Move to confirmation
        if (lowerMsg === 'yes' || lowerMsg === 'confirm' || lowerMsg === 'save') {
             try {
                // Map snake_case to camelCase for Mongoose Model
                const dbData = {
                    userId,
                    amount: session.data.amount,
                    description: session.data.description,
                    category: session.data.category,
                    date: session.data.date,
                    email: session.data.email,
                    fullName: session.data.full_name,
                    contactNumber: session.data.contact_number,
                    cardType: session.data.card_type
                };

                const newExp = new Expense(dbData);
                const saved = await newExp.save();
                session.state = 'MENU';
                session.data = { ...injectedData };
                response.is_ready_for_api = true;
                response.bot_reply = `✅ Transaction entry successful! ID: ${saved.shortId}`;
                return res.json(response);
            } catch (err) {
                response.bot_reply = `❌ Error saving: ${err.message}`;
                return res.json(response);
            }
        }

        response.bot_reply = formatSummary(session.data);
        return res.json(response);
    }

    // ==========================================
    // INTENT: ModifyExpense / DeleteExpense
    // ==========================================
    if (session.intent === 'ModifyExpense' || session.intent === 'DeleteExpense') {
        // Find target if not already known
        if (!session.data.target_expense) {
            const idMatch = message.match(/([A-Z0-9]{6})/);
            if (idMatch) session.data.target_expense = idMatch[1].toUpperCase();
            else {
                response.bot_reply = "Please provide the Short ID or identifiable description of the expense you'd like to update/remove.";
                return res.json(response);
            }
        }

        if (lowerMsg === 'yes' || lowerMsg === 'confirm') {
            try {
                if (session.intent === 'DeleteExpense') {
                    await Expense.findOneAndDelete({ shortId: session.data.target_expense, userId });
                    response.bot_reply = "✅ Expense deleted successfully.";
                } else {
                    // Modification logic
                    const updateData = {};
                    if (session.data.amount) updateData.amount = session.data.amount;
                    if (session.data.date) updateData.date = session.data.date;
                    if (session.data.category) updateData.category = session.data.category;
                    
                    await Expense.findOneAndUpdate({ shortId: session.data.target_expense, userId }, updateData);
                    response.bot_reply = "✅ Expense updated successfully.";
                }
                session.state = 'MENU';
                session.data = { ...injectedData };
                response.is_ready_for_api = true;
                return res.json(response);
            } catch (err) {
                response.bot_reply = `❌ Operation failed: ${err.message}`;
                return res.json(response);
            }
        }

        response.bot_reply = session.intent === 'DeleteExpense' 
            ? `⚠️ Are you sure you want to delete expense **${session.data.target_expense}**?`
            : `Are you sure you want to update the details for **${session.data.target_expense}**?`;
        
        return res.json(response);
    }

    // Default: General Query / Menu
    response.bot_reply = `Hi ${injectedData.full_name}! I'm your Finance AI Agent. I've strictly validated your profile details and I'm ready to help.\n\nType "spent 200 on lunch" to log an expense, or ask me a question about your spending.`;
    return res.json(response);
});

module.exports = { 
    router, 
    extractEntities, 
    checkFAQ 
};

module.exports = { 
    router, 
    extractEntities, 
    checkFAQ 
};
