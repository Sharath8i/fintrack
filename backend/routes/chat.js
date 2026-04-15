const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const auth = require('../middleware/authMiddleware');

const sessions = {};

// --- Exact Mapping to FAQView.jsx ---
const FAQ_DATA = [
    { q: "How do I add an expense using chat?", a: "Just type naturally! For example: \"Spent 500 on food today\" or \"Bought shoes for 2000\"." },
    { q: "Can I type expenses in normal English?", a: "Yes, the AI understands conversational phrases like \"Cost me 300 bucks for Uber\" or \"Paid 1200 for groceries\"." },
    { q: "Can I add multiple expenses in one sentence?", a: "Yes! You can say \"Spent 200 on snacks and 500 on auto\" and the AI will split them into separate ledger entries automatically." },
    { q: "How do I edit an expense before saving?", a: "When the AI generates a 'Transaction Draft', you can click the 'AMEND' button or simply chat \"change amount to 600\" before confirming." },
    { q: "What details are required to save an expense?", a: "The AI needs to detect an Amount. If Category or Description is missing, it will ask you or classify them automatically." },
    { q: "Why is my input rejected?", a: "Inputs are rejected if they lack numerical values, or if you input negative/zero amounts (e.g. \"Spent -500\")." },
    { q: "What insights can I see in analytics?", a: "You can view your Total Monthly Spend, Growth Trends (increase/decrease percentages), and beautiful visual breakdowns across categories." },
    { q: "How is my spending calculated?", a: "The Analytics engine securely aggregates all confirmed ledger entries for the current calendar month to determine averages and highest spends." },
    { q: "Can I view past transactions?", a: "Yes! Open the LEDGER_HISTORY tab to see a fully searchable, sortable list of all your archived expenses." },
    { q: "How do I download my expense report?", a: "Go to LEDGER_HISTORY and click the solid yellow 'EXPORT_RECORDS' button to download a structured Excel-ready CSV." },
    { q: "Hello, what can you do?", a: "I can log natural language expenses, update ledger metadata, perform multi-expense splits, and fetch rich financial analytics." }
];

// --- Global Keywords for extraction and analytics ---
const TRANSPORT_KWS = [
    'bus', 'taxi', 'cab', 'uber', 'ola', 'auto', 'metro', 'train', 'railway', 'flight', 'airplane',
    'ticket', 'tickets', 'booking', 'booked', 'travel', 'trip', 'journey', 'ride', 'commute',
    'petrol', 'diesel', 'fuel', 'gas', 'refill', 'parking', 'toll', 'fare', 'charges',
    'car', 'bike', 'scooter', 'vehicle', 'transport', 'transportation', 'shuttle'
];

const SHOPPING_KWS = [
    'buy', 'bought', 'purchase', 'purchased', 'order', 'ordered', 'shopping', 'shop', 'shopped',
    'clothes', 'shirt', 't-shirt', 'jeans', 'dress', 'shoes', 'watch',
    'laptop', 'mobile', 'phone', 'electronics', 'gadget', 'accessories',
    'amazon', 'flipkart', 'mall', 'store', 'shop', 'market', 'supermarket',
    'grocery', 'groceries', 'items', 'stuff', 'things', 'products',
    'brand', 'retail', 'sale', 'offer', 'discount', 'checkout', 'billing',
    'powder', 'milk', 'vegetables', 'rice', 'groceries'
];

const FOOD_KWS = [
    'food', 'lunch', 'dinner', 'breakfast', 'brunch', 'snacks', 'snack',
    'tea', 'coffee', 'juice', 'water', 'drink', 'beverage',
    'restaurant', 'hotel', 'cafe', 'meal', 'eat', 'ate', 'eating', 'dining',
    'pizza', 'burger', 'sandwich', 'biryani', 'dosa', 'idli', 'noodles', 'pasta',
    'swiggy', 'zomato', 'bakery', 'cake', 'dessert', 'ice cream'
];

function checkFAQ(message) {
    const lower = message.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    if (/^\d+$/.test(message.trim())) return null;

    for (const faq of FAQ_DATA) {
        // Strict mapping against the string question (ignoring punctuation/cases)
        const pureQ = faq.q.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();

        // Let's do exact mapping or 85%+ inclusion mapping
        if (lower === pureQ || lower.includes(pureQ)) {
            return faq.a;
        }

        // Additional fuzzy matching for conversational shifts
        const qWords = pureQ.split(' ').filter(w => w.length > 2);
        if (qWords.length > 0) {
            const matchCount = qWords.filter(w => lower.includes(w)).length;
            if (matchCount / qWords.length >= 0.8) return faq.a;
        }
    }
    return null;
}

async function checkAnalyticalQuery(message, userId) {
    const lower = message.toLowerCase();
    if (!lower.includes('spend') && !lower.includes('total') && !lower.includes('how much') && !lower.includes('compare') && !lower.includes('top') && !lower.includes('where')) return null;

    let category = null;
    if (TRANSPORT_KWS.some(k => lower.includes(k))) category = 'Transport';
    else if (SHOPPING_KWS.some(k => lower.includes(k))) category = 'Shopping';
    else if (FOOD_KWS.some(k => lower.includes(k))) category = 'Food';

    let startDate = new Date(0);
    let timeLabel = "in total";

    // --- Dynamic Comparisons ---
    if (lower.includes('this month') && lower.includes('last month')) {
        const lastMonthStart = new Date(); lastMonthStart.setMonth(lastMonthStart.getMonth() - 1); lastMonthStart.setDate(1); lastMonthStart.setHours(0, 0, 0, 0);
        const thisMonthStart = new Date(); thisMonthStart.setDate(1); thisMonthStart.setHours(0, 0, 0, 0);

        const lastMonthData = await Expense.find({ userId, createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } });
        const thisMonthData = await Expense.find({ userId, createdAt: { $gte: thisMonthStart } });

        const lastTotal = lastMonthData.reduce((s, e) => s + e.amount, 0);
        const thisTotal = thisMonthData.reduce((s, e) => s + e.amount, 0);
        const diff = thisTotal - lastTotal;
        const trend = diff >= 0 ? "increased by 📈" : "decreased by 📉";
        return `Comparing month-over-month: Last month you spent **₹${lastTotal.toFixed(0)}**, and this month it's **₹${thisTotal.toFixed(0)}**. Your spending has ${trend} **₹${Math.abs(diff).toFixed(0)}**.`;
    }

    if (lower.includes('top category') || lower.includes('where am i spending the most')) {
        const expenses = await Expense.find({ userId });
        const cats = {};
        expenses.forEach(e => cats[e.category] = (cats[e.category] || 0) + e.amount);
        const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
        if (sorted.length === 0) return "You haven't logged any expenses yet!";
        return `Your highest spending is in the **${sorted[0][0]}** category, with a total volume of **₹${sorted[0][1].toFixed(0)}**.`;
    }

    if (lower.includes('today')) {
        startDate = new Date(); startDate.setHours(0, 0, 0, 0);
        timeLabel = "today";
    } else if (lower.includes('this week')) {
        startDate = new Date(); startDate.setDate(startDate.getDate() - 7);
        timeLabel = "this week";
    } else if (lower.includes('this month')) {
        startDate = new Date(); startDate.setDate(1); startDate.setHours(0, 0, 0, 0);
        timeLabel = "this month";
    }

    const query = { userId, createdAt: { $gte: startDate } };
    if (category) query.category = category;

    // --- Support for Mobile/Email Specific queries ---
    const phoneMatch = message.match(/\+?\d{10,14}/);
    if (phoneMatch) query.contactNumber = phoneMatch[0];

    const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) query.email = emailMatch[0];

    try {
        const expenses = await Expense.find(query);
        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        const filterLabel = phoneMatch ? `for contact **${phoneMatch[0]}**` : (emailMatch ? `for email **${emailMatch[0]}**` : '');
        const catLabel = category ? `on **${category}**` : "across all categories";
        return `You have spent a total of **₹${total.toFixed(0)}** ${catLabel} ${filterLabel} ${timeLabel}.`;
    } catch (err) {
        return null;
    }
}

// --- Entity Extraction (Co-referencing: extracts multiple fields from one message) ---
function extractEntities(message, currentData = {}, lastPrompt = null) {
    let data = { ...currentData };
    let lower = message.toLowerCase().trim();

    // --- 4. Typo Handling (Lightweight) ---
    const typoMap = {
        'restarant': 'restaurant', 'restarent': 'restaurant',
        'shping': 'shopping', 'shoping': 'shopping',
        'grocry': 'grocery'
    };
    Object.keys(typoMap).forEach(typo => {
        lower = lower.replace(new RegExp(`\\b${typo}\\b`, 'g'), typoMap[typo]);
    });

    const getVal = (k) => data[k];
    const setVal = (k, v) => data[k] = v;

    // --- Smart Error Recovery: Numeric Words ---
    const numWords = { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'ten': 10, 'hundred': 100, 'thousand': 1000 };
    Object.keys(numWords).forEach(w => {
        if (lower.includes(w)) {
            const regex = new RegExp(`\\b${w}\\b`, 'g');
            lower = lower.replace(regex, numWords[w]);
        }
    });

    // --- 2. Multiple Amount & Category Detection (Automatic Split) ---
    const allAmounts = message.match(/\b\d+(?:\.\d{1,2})?\b/g);
    if (allAmounts && allAmounts.length > 1) {
        // Find categories for each amount if possible
        const parts = message.toLowerCase().split(/\band\b|\bplus\b|,/);
        if (parts.length === allAmounts.length) {
            data._autoSplitReady = true;
            data._splitParts = parts.map((p, i) => ({
                amount: parseFloat(allAmounts[i]),
                category: TRANSPORT_KWS.some(k => p.includes(k)) ? 'Transport' : (FOOD_KWS.some(k => p.includes(k)) ? 'Food' : (SHOPPING_KWS.some(k => p.includes(k)) ? 'Shopping' : 'Miscellaneous'))
            }));
        }
    }

    // --- 6. User Corrections (Entity Amendment) ---
    const correctionMatch = message.match(/\b(?:actually|make it|change to|it is|it's|is)\s+(\d+(?:\.\d{1,2})?)/i);
    if (correctionMatch) {
        const val = parseFloat(correctionMatch[1]);
        if (val > 0) {
            setVal('amount', val);
            data._confidence = 'Medium (Correction)';
            return data;
        }
    }

    // Named amendments
    const amendAmount = message.match(/\b(?:change|update|edit)\s+amount\s+(?:to\s+)?(\d+(\.\d{1,2})?)/i);
    if (amendAmount) setVal('amount', parseFloat(amendAmount[1]));

    const amendCat = message.match(/\b(?:change|update|edit)\s+category\s+(?:to\s+)?(transport|shopping|food)/i);
    if (amendCat) setVal('category', amendCat[1].charAt(0).toUpperCase() + amendCat[1].slice(1).toLowerCase());

    const amendDate = message.match(/\b(?:change|update|edit)\s+date\s+(?:to\s+)?(\d{2}-\d{2}-\d{4})/i);
    if (amendDate) { setVal('date', amendDate[1]); delete data._dateError; }

    // Handle "Just [Category]" selection to resolve conflicts
    const justMatch = message.match(/\bjust\s+(food|shopping|transport)\b/i);
    if (justMatch) {
        const cat = justMatch[1].charAt(0).toUpperCase() + justMatch[1].slice(1).toLowerCase();
        setVal('category', cat);
        delete data._conflict;
        delete data._needsSplitConfirmation;
        delete data._detectedCategories;
    }

    const amendPhone = message.match(/\b(?:change|update|edit)\s+(?:phone|number|contact)\s+(?:to\s+)?(\+?\d+)/i);
    if (amendPhone) { setVal('contact_number', amendPhone[1]); delete data._phoneError; }

    const amendEmail = message.match(/\b(?:change|update|edit)\s+email\s+(?:to\s+)?([^\s@]+@[^\s@]+\.[^\s@]+)/i);
    if (amendEmail) { setVal('email', amendEmail[1]); delete data._emailError; }

    // --- 9. Identity Extraction (Phone, Email, Name) ---
    if (!getVal('contact_number') || lastPrompt === 'contact_number') {
        const pMatch = message.match(/\+(\d{1,4})\s?(\d{10})\b/) || message.match(/\b(\d{10,14})\b/);
        if (pMatch) {
            let num = pMatch[0].replace(/\s+/g, '');
            if (!num.startsWith('+')) num = '+' + num;

            // Validate: +[1-4 digits][10 digits]
            if (/^\+\d{1,4}\d{10}$/.test(num)) {
                setVal('contact_number', num);
                delete data._phoneError;
            } else {
                data._phoneError = "Must be +[CountryCode][Exactly 10 digits]";
            }
        }
    }

    if (!getVal('email') || lastPrompt === 'email') {
        const eMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (eMatch) {
            setVal('email', eMatch[0]);
            delete data._emailError;
        }
    }

    if (!getVal('full_name') || lastPrompt === 'full_name') {
        // Look for 2+ words if prompted or following "for"
        const nMatch = message.match(/\bfor\s+([a-zA-ZÀ-ÿ]{2,}\s+[a-zA-ZÀ-ÿ]{2,})\b/i) ||
            (lastPrompt === 'full_name' && message.match(/\b([a-zA-ZÀ-ÿ]{2,}\s+[a-zA-ZÀ-ÿ]{2,})\b/));
        if (nMatch) {
            setVal('full_name', nMatch[1].trim());
            delete data._nameError;
        }
    }

    // --- 2. Amount Detection (Robust Regex) ---
    if (!getVal('amount')) {
        let bestVal = null;
        // --- 2. Smart Amount Selection ---
        const forMatch = message.match(/\bfor\s+(\d+(?:\.\d{1,2})?)\b/i);
        if (forMatch && !isNaN(parseFloat(forMatch[1]))) {
            bestVal = parseFloat(forMatch[1]);
        } else if (data._multipleAmounts) {
            const vals = allAmounts.map(v => parseFloat(v)).filter(v => v > 0);
            if (vals.length > 0) bestVal = Math.max(...vals);
        }

        if (bestVal > 0) {
            setVal('amount', bestVal);
        } else {
            const patterns = [
                /(?:(?:INR|RS|₹|Rs\.?|bucks|rupees|amount|spent|paid|cost|cost me|used|charged|around|about|nearly|almost|approx)\s*)(\d+(?:\.\d{1,2})?)\b/i,
                /\b(\d+(?:\.\d{1,2})?)\s*(?:INR|RS|₹|Rs\.?|bucks|rupees)\b/i,
                /(\d+(?:\.\d{1,2})?)\s*(?:was spent|was paid|cost|was charged)/i,
                /\b(\d+(?:\.\d{1,2})?)\b/
            ];
            for (const p of patterns) {
                const match = message.match(p);
                if (match && !isNaN(parseFloat(match[1]))) {
                    const val = parseFloat(match[1]);
                    if (val > 0) { setVal('amount', val); break; }
                }
            }
        }
    }

    // --- 3/9/10. Category Detection (Unified & Context-Aware) ---
    // --- 6. Performance Optimization (Light) ---
    const checkMsg = (kws) => kws.some(kw => lower.includes(kw));

    if (!getVal('category')) {
        // --- 4. Strengthen Context-Based Category Priority ---
        if (lower.match(/\b(coffee powder|tea powder|milk|vegetables|rice|chilli powder|groceries|grocery)\b/i)) {
            setVal('category', 'Shopping');
        } else if (lower.match(/\b(coffee|tea|juice|water)\b/i)) {
            setVal('category', 'Food');
        } else {
            const isFood = checkMsg(FOOD_KWS);
            const isTransport = checkMsg(TRANSPORT_KWS);
            const isShopping = checkMsg(SHOPPING_KWS);

            // --- 1. Multi-Category Conflict / Split Detection ---
            const detectedCount = [isFood, isTransport, isShopping].filter(Boolean).length;
            if (detectedCount > 1) {
                const detectedCategories = [];
                if (isFood) detectedCategories.push('Food');
                if (isTransport) detectedCategories.push('Transport');
                if (isShopping) detectedCategories.push('Shopping');

                data._conflict = true;
                data._detectedCategories = detectedCategories;

                // Set a temporary display category to avoid "General" label in card
                data.category = `Multiple (${detectedCategories.join(' & ')})`;

                // If we have exactly one amount, it's a candidate for splitting
                if (allAmounts && allAmounts.length === 1) {
                    data._needsSplitConfirmation = true;
                }
            } else if (isFood) setVal('category', 'Food');
            else if (isTransport) setVal('category', 'Transport');
            else if (isShopping) setVal('category', 'Shopping');
            else {
                // --- 5. Missing Category Fallback ---
                data._needsCategory = true;
            }
        }
    }

    // --- 11. Validation Hooks (Card) ---
    if (!getVal('card_type')) {
        if (checkMsg(['debit'])) setVal('card_type', 'Debit Card');
        else if (checkMsg(['credit'])) setVal('card_type', 'Credit Card');
    }

    // --- 5. Date Handling ---
    if (!getVal('date')) {
        const dMatch = message.match(/(\d{2}-\d{2}-\d{4})/) || message.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (dMatch) {
            setVal('date', dMatch[1].replace(/\//g, '-'));
        } else if (lower.includes('today')) {
            const d = new Date();
            setVal('date', `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`);
        } else if (lower.includes('tomorrow')) {
            const d = new Date(Date.now() + 86400000);
            setVal('date', `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`);
        } else if (lower.includes('yesterday')) {
            const d = new Date(Date.now() - 86400000);
            setVal('date', `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`);
        } else if (lower.includes('last week')) {
            const d = new Date(Date.now() - 7 * 86400000);
            setVal('date', `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`);
        } else if (lower.includes('last month')) {
            const d = new Date(); d.setMonth(d.getMonth() - 1);
            setVal('date', `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`);
        }
    }

    // --- 3. Better Description Extraction ---
    if (!getVal('description')) {
        const descMatch = message.match(/\b(?:buying|bought|purchased|had|ate|ordered|booked|paid for|for|on|at|of)\s+([a-zA-Z][\w\s]{1,25}?)(?:\s+(?:with|using|via|today|yesterday|tomorrow|spent|paid)|\s*$)/i);
        if (descMatch) {
            setVal('description', descMatch[1].trim());
        } else {
            const allKws = [
                { kws: FOOD_KWS, cat: 'Food' },
                { kws: TRANSPORT_KWS, cat: 'Transport' },
                { kws: SHOPPING_KWS, cat: 'Shopping' }
            ];
            let found = null;
            for (const item of allKws) {
                const kw = item.kws.find(k => lower.includes(k));
                if (kw) { found = `${item.cat}: ${kw}`; break; }
            }
            if (found) setVal('description', found);
            else setVal('description', 'General Expenditure');
        }
    }

    // --- Confidence Score ---
    let score = 0;
    if (data.amount) score++;
    if (data.category) score++;
    if (data.description !== 'Miscellaneous Expense') score++;
    data._confidence = score >= 3 ? 'High ✅' : (score >= 1 ? 'Medium ⚠️' : 'Low 🔍');

    // --- 8. Quick Add Mode (Advanced UX) ---
    const wordsCount = lower.split(/\s+/).filter(w => w.length > 0).length;
    if (wordsCount <= 3 && data.amount && data.category) {
        if (!data.description || data.description === 'Miscellaneous Expense') {
            // --- 2. Improve Quick Add Description ---
            const cleanDesc = lower.replace(/\d+(?:\.\d{1,2})?/g, '').trim();
            data.description = cleanDesc ? cleanDesc : `${data.category} expense`;
        }
    }

    return data;
}

// --- Sequential missing field prompts (Polished for VIVA) ---
function getMissingFieldPrompt(data) {
    // --- 1. Split / Conflict handling (Priority) ---
    if (data._needsSplitConfirmation && (!data.category || data.category.includes('Multiple'))) {
        return {
            field: 'split',
            prompt: `🤔 I see multiple categories (**${data._detectedCategories.join(' & ')}**) for this ₹${data.amount}. How should I handle this?`,
            quick_replies: ['Split Equally ⚖️', 'Split Manually 🔢', ...data._detectedCategories.map(c => `Just ${c}`)]
        };
    }

    if (data._conflict && (!data.category || data.category.includes('Multiple'))) {
        return { field: 'category', prompt: "🤔 I detected multiple categories. Which one is this?", quick_replies: ['Food 🍔', 'Shopping 🛍️', 'Transport 🚗'] };
    }
    // --- 5. Missing Category Fallback ---
    if (data._needsCategory && !data.category) {
        return { field: 'category', prompt: "💡 I couldn't auto-detect the category. Which one is this?", quick_replies: ['Food 🍔', 'Shopping 🛍️', 'Transport 🚗'] };
    }

    const missing = [];
    if (!data.amount) missing.push("Amount 💰");
    if (!data.category) missing.push("Category 🍔/🚗/🛍️");
    if (!data.card_type) missing.push("Card Type 💳");
    if (!data.description) missing.push("Description 📝");
    if (!data.date) missing.push("Date 📅");

    if (missing.length === 0) return null;

    // Prioritize Validation Errors
    if (data._nameError) return { field: 'full_name', prompt: `⚠️ Name Error: ${data._nameError}` };
    if (data._phoneError) return { field: 'contact_number', prompt: `⚠️ Contact Error: ${data._phoneError}` };
    if (data._emailError) return { field: 'email', prompt: `⚠️ Email Error: ${data._emailError}` };
    if (data._dateError) return { field: 'date', prompt: `⚠️ Date Error: ${data._dateError}` };

    const detected = [];
    if (data.amount) detected.push(`💰 Amount: ₹${data.amount}`);
    if (data.category) {
        const icon = data.category === 'Food' ? '🍔' : (data.category === 'Transport' ? '🚗' : '🛍️');
        detected.push(`${icon} Category: ${data.category}`);
    }
    if (data.description) detected.push(`📝 Desc: ${data.description}`);

    const replyArr = [];
    if (detected.length > 0) {
        replyArr.push(`✅ **Draft Progress** (Confidence: ${data._confidence || '🔍'}):`);
        detected.forEach(d => replyArr.push(`• ${d}`));
        replyArr.push("");
    }

    const firstMissing = (function () {
        if (!data.amount) return 'amount';
        if (!data.category) return 'category';
        if (!data.full_name || data._nameError) return 'full_name';
        if (!data.contact_number || data._phoneError) return 'contact_number';
        if (!data.email || data._emailError) return 'email';
        if (!data.card_type) return 'card_type';
        if (!data.description) return 'description';
        if (!data.date) return 'date';
        return null;
    })();

    replyArr.push(`💡 **Next step:** Please tell me the **${missing[0]}**.`);

    // --- Card Type Quick Replies ---
    if (firstMissing === 'card_type') {
        return {
            field: 'card_type',
            prompt: replyArr.join('\n'),
            quick_replies: ['💳 Debit Card', '💳 Credit Card']
        };
    }

    return { field: firstMissing, prompt: replyArr.join('\n') };
}

async function formatSummary(d, userId) {
    const icon = d.category === 'Food' ? '🍔' : (d.category === 'Transport' ? '🚗' : '🛍️');

    // --- 6. Use Confidence Score in UX ---
    const confStatus = d._confidence ? `\n**Confidence:** ${d._confidence}` : '';

    let budgetInsight = "";
    if (d.category && d.amount) {
        const budget = await Budget.findOne({ userId, category: d.category });
        if (budget && budget.limit > 0) {
            const currentSpend = await Expense.find({ userId, category: d.category, date: { $regex: new RegExp(`-${new Date().getMonth() + 1}-`) } })
                .then(exps => exps.reduce((s, e) => s + e.amount, 0));
            const usage = ((currentSpend + d.amount) / budget.limit) * 100;
            if (usage >= 80) budgetInsight = `\n⚠️ **Warning:** This will put you at **${usage.toFixed(0)}%** of your ${d.category} budget!`;
            else budgetInsight = `\n📊 **Insight:** You will be using **${usage.toFixed(0)}%** of your ${d.category} budget.`;
        }
    }

    return `### 🧾 Precision Ledger Draft
**Status:** Verification Ready 🔒${confStatus}${budgetInsight}

• **Merchant/Item**: ${d.description}
• **Category**: ${icon} ${d.category}
• **Amount**: ₹${d.amount}
• **Date**: 📅 ${d.date}
• **Payment**: 💳 ${d.card_type}

**User Info:**
• 👤 ${d.full_name}
• 📞 ${d.contact_number}
• 📧 ${d.email}

**Is this correct?** Say **"Yes"** to confirm or **"Change [field] to [value]"** to correct.`;
}


// --- Main Chat Router ---
router.post('/', auth, async (req, res) => {
    const { sessionId, message, userContext } = req.body;
    const userId = req.userId;

    if (!sessions[sessionId]) {
        sessions[sessionId] = {
            state: 'MENU',
            data: {},
            intent: 'GeneralQuery',
            isProcessing: false,
            lastMessage: ''
        };
    }

    const session = sessions[sessionId];

    // --- 10. Debug Logging ---
    console.log(`[DEBUG IN] Message: "${message}"`);

    const cleanedMessage = message.trim().toLowerCase();

    // --- 7. Improve Duplicate Detection ---
    if (cleanedMessage === session.lastMessage) {
        session.isProcessing = false;
        return res.json({ intent: "GeneralQuery", bot_reply: "⚠️ I already received that message. How can I help you?", is_ready_for_api: false });
    }
    session.lastMessage = cleanedMessage;

    // --- 3. Empty / Invalid Input Handling ---
    const isMenuChoice = /^[1-3]$/.test(cleanedMessage);
    if (!cleanedMessage || (cleanedMessage.length <= 2 && !isMenuChoice)) {
        session.isProcessing = false;
        return res.json({ intent: "GeneralQuery", bot_reply: "Please enter like: 'Spent 500 on food'", is_ready_for_api: false });
    }

    // Simple lock
    if (session.isProcessing) {
        return res.json({ intent: "GeneralQuery", bot_reply: "Processing...", is_ready_for_api: false });
    }

    session.isProcessing = true;

    try {
        const lowerMsg = cleanedMessage;

        // --- 5. Add Help Command ---
        if (lowerMsg === 'help') {
            session.isProcessing = false;
            return res.json({ intent: "GeneralQuery", bot_reply: `💡 **Help & Examples:**\n• "Spent 500 on food"\n• "Bought shoes for 2000"\n• "Show total spending"` });
        }

        // --- 4. Safe Undo Feature ---
        if (session.state === 'CONFIRM_UNDO') {
            if (['yes', 'sure', 'confirm', 'ok'].includes(lowerMsg)) {
                const lastExp = await Expense.findOne({ userId }).sort({ createdAt: -1 });
                if (lastExp) await Expense.findByIdAndDelete(lastExp._id);
                session.state = 'MENU';
                session.isProcessing = false;
                return res.json({ intent: "GeneralQuery", bot_reply: lastExp ? `✅ Removed entry: ₹${lastExp.amount} on ${lastExp.category}.` : `⚠️ No recent expenses found.` });
            }
            session.state = 'MENU';
            session.isProcessing = false;
            return res.json({ intent: "GeneralQuery", bot_reply: `Undo cancelled.` });
        }

        if (lowerMsg === 'undo' || lowerMsg === 'cancel last') {
            const lastExp = await Expense.findOne({ userId }).sort({ createdAt: -1 });
            if (lastExp) {
                session.state = 'CONFIRM_UNDO';
                session.isProcessing = false;
                return res.json({ intent: "GeneralQuery", bot_reply: `⚠️ Are you sure you want to delete your last expense (₹${lastExp.amount} for ${lastExp.category})? (Yes/No)` });
            } else {
                session.isProcessing = false;
                return res.json({ intent: "GeneralQuery", bot_reply: `⚠️ No recent expenses found to undo.` });
            }
        }

        // --- 8. Analytics Check ---
        const analyticalReply = await checkAnalyticalQuery(message, userId);
        if (analyticalReply && session.state === 'MENU') {
            session.isProcessing = false;
            return res.json({ intent: "GeneralQuery", bot_reply: analyticalReply, extracted_data: session.data });
        }

        const injectedData = {
            full_name: userContext?.name || "Guest User",
            contact_number: userContext?.phone || "+910000000000",
            email: userContext?.email || "user@example.com"
        };

        // Merge profile but don't overwrite user-specified values
        ['full_name', 'contact_number', 'email'].forEach(f => {
            if (!session.data[f]) session.data[f] = injectedData[f];
        });

        // Menu/Cancel
        if (['cancel', 'exit', 'quit', 'back', 'menu'].includes(lowerMsg)) {
            session.state = 'MENU';
            session.data = { ...injectedData };
            session.intent = 'GeneralQuery';
            session.isProcessing = false;
            return res.json({ intent: "GeneralQuery", bot_reply: "Back to menu.", extracted_data: session.data });
        }

        const faqReply = checkFAQ(message);
        if (faqReply && session.state === 'MENU') {
            session.isProcessing = false;
            return res.json({ intent: "GeneralQuery", bot_reply: faqReply, extracted_data: session.data });
        }

        // --- 1. Conversational Memory: "Same as before" ---
        if (cleanedMessage.includes('another') || cleanedMessage.includes('same as before') || cleanedMessage.includes('like last time')) {
            if (session.persistent_memory) {
                session.data = { ...session.persistent_memory };
                session.intent = 'CreateExpense';
                // Allow partial overrides, e.g., "but for 300"
                session.data = extractEntities(message, session.data, null);
                session.isProcessing = false;
                return res.json({ intent: session.intent, bot_reply: await formatSummary(session.data, userId), extracted_data: session.data });
            } else {
                return res.json({ intent: "GeneralQuery", bot_reply: "🤔 I don't remember any previous expenses in this session to copy. Please add one first!" });
            }
        }

        // --- Extraction ---
        const oldIntent = session.intent;
        session.data = extractEntities(message, session.data, session.lastPrompt);

        // --- 1. Automatic Multi-Expense Split (Handoff) ---
        if (session.data._autoSplitReady) {
            try {
                let count = 0;
                for (const part of session.data._splitParts) {
                    await new Expense({
                        userId, amount: part.amount, description: `${part.category} automated entry`, category: part.category,
                        date: session.data.date, email: session.data.email, fullName: session.data.full_name,
                        contactNumber: session.data.contact_number, cardType: 'Debit Card'
                    }).save();
                    count++;
                }
                session.state = 'MENU';
                session.intent = 'GeneralQuery';
                session.data = { ...injectedData };
                session.isProcessing = false;
                return res.json({ intent: 'CreateExpense', bot_reply: `⚖️ I detected multiple items and have automatically ledgered **${count} separate entries** for you!`, is_ready_for_api: true });
            } catch (err) { }
        }

        // --- 10. Debug Logging ---
        console.log(`[DEBUG OUT] Entities:`, JSON.stringify(session.data));

        // --- 7. Intent Detection Extension (Menu + NLP) ---
        const createIntents = ['create', 'add', 'spent', 'paid', 'bought', 'purchase', 'log', 'grabbed', 'got', 'had', 'ate', 'booked', 'cost', 'charged', 'used', 'gave'];
        const modifyIntents = ['modify', 'change', 'edit', 'update'];
        const deleteIntents = ['delete', 'remove'];
        const viewIntents = ['view', 'show', 'history', 'list', 'records'];

        if (lowerMsg === '1' || createIntents.some(k => lowerMsg.includes(k))) {
            session.intent = 'CreateExpense';
            if (lowerMsg === '1') session.state = 'CREATE_GATHER';
        } else if (lowerMsg === '2' || viewIntents.some(k => lowerMsg.includes(k))) {
            session.intent = 'ViewExpense';
            if (session.data.contact_number) {
                session.state = 'VIEW_RESULTS';
            } else {
                session.state = 'ASK_MOBILE_VIEW';
            }
        } else if (lowerMsg === '3' || modifyIntents.some(k => lowerMsg.includes(k)) || deleteIntents.some(k => lowerMsg.includes(k))) {
            session.intent = 'ModifyExpense';
            if (session.data.contact_number) {
                session.state = 'CHOOSE_OP_READY';
            } else {
                session.state = 'ASK_MOBILE_MODIFY';
            }
        } else if (session.state === 'CREATE_GATHER') {
            session.intent = 'CreateExpense';
        }

        if (oldIntent !== 'CreateExpense' && session.intent === 'CreateExpense') {
            session.data = { ...injectedData };
            session.data = extractEntities(message, session.data, null);
        }

        let response = {
            intent: session.intent,
            is_ready_for_api: false,
            extracted_data: session.data,
            missing_fields: []
        };

        // CREATE Flow
        if (session.intent === 'CreateExpense') {

            // --- 0. PRIORITIZED SPLIT & SAVE HANDLER ---
            const isConfirmingSave = (lowerMsg.includes('yes') || lowerMsg.includes('save') || lowerMsg.includes('confirm'));

            if (isConfirmingSave && (session.state === 'READY_FOR_SPLIT_SAVE' || session.data.category?.includes('Multiple'))) {
                try {
                    // Logic: If it's a split-ready transaction, save parts. Otherwise, fall through to single save if valid.
                    if (session.split_results && session.split_results.length > 0) {
                        let count = 0;
                        const patch_name = (session.data.full_name || "Guest").includes(' ') ? session.data.full_name : `${session.data.full_name || "Guest"} User`;
                        let patch_phone = session.data.contact_number || "+910000000000";
                        if (!/^\+\d{1,4}\s?\d{10}$/.test(patch_phone)) {
                            const digits = patch_phone.replace(/\D/g, '');
                            patch_phone = `+91${digits.padStart(10, '0').slice(-10)}`;
                        }

                        for (const resItem of session.split_results) {
                            await new Expense({
                                userId, amount: resItem.amount,
                                description: `${session.data.description || 'Split Expense'} - ${resItem.category}`,
                                category: resItem.category,
                                date: session.data.date, email: session.data.email,
                                fullName: patch_name, contactNumber: patch_phone,
                                cardType: session.data.card_type || 'Debit Card'
                            }).save();
                            count++;
                        }
                        session.state = 'MENU';
                        const finalData = { ...session.data };
                        finalData.isSaved = true;
                        session.data = { ...injectedData };
                        delete session.lastPrompt;
                        session.isProcessing = false;
                        return res.json({ intent: 'CreateExpense', bot_reply: `✅ Successfully saved **${count} separate entries** to your ledger!`, is_ready_for_api: true, extracted_data: finalData });
                    }
                } catch (err) {
                    console.error("Split Save Error:", err.message);
                    session.isProcessing = false;
                    return res.json({ intent: 'GeneralQuery', bot_reply: `⚠️ Save failed: ${err.message}. Please click 'Amend' to fix details.` });
                }
            }

            if (session.state === 'READY_FOR_SPLIT_SAVE' && (lowerMsg.includes('cancel') || lowerMsg.includes('no'))) {
                session.state = 'MENU';
                session.data = { ...injectedData };
                session.isProcessing = false;
                return res.json({ intent: 'GeneralQuery', bot_reply: "Save cancelled.", extracted_data: session.data });
            }

            // --- 1. Multi-Expense Split Handling ---
            if (session.lastPrompt === 'split' && /split manually|manually/i.test(lowerMsg)) {
                // Clear conflict flags
                delete session.data._needsSplitConfirmation;
                delete session.data._conflict;
                delete session.data._detectedCategories;

                session.state = 'MANUAL_SPLIT_STEP';
                session.split_remaining = session.data.amount;
                session.split_queue = [...session.data._detectedCategories];
                session.split_results = [];
                session.lastPrompt = 'manual_split_amount';
                session.isProcessing = false;
                return res.json({
                    intent: 'CreateExpense',
                    bot_reply: `🔢 Manual Split started for ₹${session.data.amount}.\nHow much was for **${session.split_queue[0]}**?`,
                    extracted_data: null // Suppress card during process
                });
            }

            if (session.state === 'MANUAL_SPLIT_STEP' && session.lastPrompt === 'manual_split_amount') {
                const amt = parseFloat(cleanedMessage.match(/\d+(?:\.\d{1,2})?/)?.[0]);
                if (isNaN(amt) || amt <= 0 || amt > session.split_remaining) {
                    session.isProcessing = false;
                    return res.json({ intent: 'CreateExpense', bot_reply: `⚠️ Please enter a valid amount (Max remaining: ₹${session.split_remaining}) for **${session.split_queue[0]}**.` });
                }

                const currentCat = session.split_queue.shift();
                session.split_results.push({ category: currentCat, amount: amt });
                session.split_remaining = (session.split_remaining - amt).toFixed(2);

                if (session.split_queue.length === 1) {
                    // Only one category left, auto-assign remaining
                    const lastCat = session.split_queue.shift();
                    session.split_results.push({ category: lastCat, amount: parseFloat(session.split_remaining) });

                    session.state = 'READY_FOR_SPLIT_SAVE';
                    session.lastPrompt = 'confirm_final_split';

                    // Delay card if fields missing
                    const req = ['amount', 'description', 'category', 'card_type', 'date', 'full_name', 'contact_number', 'email'];
                    const missing = req.filter(f => !session.data[f]);
                    if (missing.length > 0) {
                        session.state = 'CREATE_GATHER';
                        const promptObj = getMissingFieldPrompt(session.data);
                        session.lastPrompt = promptObj.field;
                        session.isProcessing = false;
                        return res.json({ intent: 'CreateExpense', bot_reply: `⚖️ **Manual Split Calculated.**\nBut I still need some details: ${promptObj.prompt}`, quick_replies: promptObj.quick_replies, extracted_data: null });
                    }

                    const breakdown = session.split_results.map(r => `• **₹${r.amount}** for ${r.category}`).join('\n');
                    session.isProcessing = false;
                    return res.json({
                        intent: 'CreateExpense',
                        bot_reply: `⚖️ **Manual Split Calculated:**\n${breakdown}\n\nReady to save these entries to your ledger?`,
                        quick_replies: ['Yes, Save All ✅', 'Cancel'],
                        extracted_data: session.data
                    });
                } else {
                    session.isProcessing = false;
                    return res.json({
                        intent: 'CreateExpense',
                        bot_reply: `Got it. ₹${amt} for ${currentCat}.\nNow, how much for **${session.split_queue[0]}**? (Remaining: ₹${session.split_remaining})`,
                        extracted_data: null
                    });
                }
            }

            if (session.lastPrompt === 'split' && /split equally|equally/i.test(lowerMsg)) {
                // If it was a manual split triggered by multiple categories but one amount
                if (session.data._needsSplitConfirmation && session.data.amount) {
                    // Clear conflict flags
                    delete session.data._needsSplitConfirmation;
                    delete session.data._conflict;
                    const cats = session.data._detectedCategories;
                    delete session.data._detectedCategories;

                    const amt = session.data.amount;
                    const splitAmt = (amt / cats.length).toFixed(2);

                    session.split_results = cats.map(c => ({ category: c, amount: parseFloat(splitAmt) }));
                    session.state = 'READY_FOR_SPLIT_SAVE';
                    session.lastPrompt = 'confirm_final_split';

                    // Delay card if fields missing
                    const req = ['amount', 'description', 'category', 'card_type', 'date', 'full_name', 'contact_number', 'email'];
                    const missing = req.filter(f => !session.data[f]);
                    if (missing.length > 0) {
                        session.state = 'CREATE_GATHER';
                        const promptObj = getMissingFieldPrompt(session.data);
                        session.lastPrompt = promptObj.field;
                        session.isProcessing = false;
                        return res.json({ intent: 'CreateExpense', bot_reply: `⚖️ **Equal Split Projected.**\n${promptObj.prompt}`, quick_replies: promptObj.quick_replies, extracted_data: null });
                    }

                    session.isProcessing = false;
                    return res.json({
                        intent: 'CreateExpense',
                        bot_reply: `⚖️ **Equal Split Projected for ${cats.length} categories.**\nReview the details and click **Save to Ledger** to finalize.`,
                        quick_replies: ['Yes, Save All ✅', 'Cancel'],
                        extracted_data: session.data
                    });
                }

                if (session.data._allAmounts && session.data._allAmounts.length > 1) {
                    try {
                        const vals = session.data._allAmounts.map(v => parseFloat(v)).filter(v => v > 0);
                        const category = session.data.category || 'Miscellaneous';
                        let desc = session.data.description;
                        if (!desc || desc === 'Miscellaneous Expense') desc = `${category} expense`;

                        let count = 0;
                        for (const amt of vals) {
                            await new Expense({
                                userId, amount: amt, description: `${desc} - part expense`, category: category,
                                date: session.data.date, email: session.data.email, fullName: session.data.full_name,
                                contactNumber: session.data.contact_number, cardType: session.data.card_type || 'Debit Card'
                            }).save();
                            count++;
                        }

                        session.state = 'MENU';
                        session.intent = 'GeneralQuery';
                        session.data = { ...injectedData };
                        delete session.lastPrompt;
                        session.isProcessing = false;
                        return res.json({ intent: 'CreateExpense', bot_reply: `✅ Successfully created ${count} split expense entries!`, is_ready_for_api: true });
                    } catch (err) {
                        session.isProcessing = false;
                        return res.json({ intent: "GeneralQuery", bot_reply: `⚠️ Error saving parts: ${err.message}` });
                    }
                }
            }

            const reqFields = ['amount', 'description', 'category', 'card_type', 'date', 'full_name', 'contact_number', 'email'];
            response.missing_fields = reqFields.filter(f => !session.data[f]);

            if (response.missing_fields.length > 0 || session.data._needsSplitConfirmation) {
                session.state = 'CREATE_GATHER';
                const promptObj = getMissingFieldPrompt(session.data);
                session.lastPrompt = promptObj.field;
                response.bot_reply = promptObj.prompt;
                response.quick_replies = promptObj.quick_replies || [];

                // Suppress card if we are in a split prompt to avoid confusion
                if (promptObj.field === 'split') {
                    response.extracted_data = null;
                }

                session.isProcessing = false;
                return res.json(response);
            }


            if (['yes', 'confirm', 'save'].includes(lowerMsg)) {
                // --- 7. Final Validation Before Save ---
                if (!session.data.amount || !session.data.category) {
                    session.isProcessing = false;
                    return res.json({ intent: 'CreateExpense', bot_reply: `❌ Error: Missing required fields. Please provide amount and category.` });
                }

                // --- 10. Duplicate Detection (5 min window) ---
                const recentSimilar = await Expense.findOne({
                    userId,
                    amount: session.data.amount,
                    category: session.data.category || "Multi-Category",
                    description: session.data.description,
                    createdAt: { $gte: new Date(Date.now() - 5 * 60000) }
                });

                if (recentSimilar && !session.duplicateConfirmed) {
                    session.duplicateConfirmed = true;
                    session.isProcessing = false;
                    return res.json({
                        intent: 'CreateExpense',
                        bot_reply: `⚠️ **Duplicate Alert:** I found an identical entry (₹${recentSimilar.amount} for ${recentSimilar.category}) logged just a few minutes ago.\n\nAre you sure you want to log this again? Say **"Yes"** to proceed.`,
                        quick_replies: ['Yes, log anyway', 'No, cancel']
                    });
                }
                session.duplicateConfirmed = false;

                if (session.data.category?.includes('Multiple')) {
                    session.isProcessing = false;
                    return res.json({ intent: 'CreateExpense', bot_reply: `⚠️ Cannot save multiple categories directly. Please use the split flow or amend to a single category.` });
                }

                try {
                    // Data Patching for strict validation
                    const patch_name = (session.data.full_name || "Guest").includes(' ') ? session.data.full_name : `${session.data.full_name || "Guest"} User`;
                    let patch_phone = session.data.contact_number || "+910000000000";
                    if (!/^\+\d{1,4}\s?\d{10}$/.test(patch_phone)) {
                        const digits = patch_phone.replace(/\D/g, '');
                        patch_phone = `+91${digits.padStart(10, '0').slice(-10)}`;
                    }

                    const dbData = {
                        userId,
                        amount: session.data.amount,
                        description: session.data.description,
                        category: session.data.category,
                        date: session.data.date,
                        email: session.data.email,
                        fullName: patch_name,
                        contactNumber: patch_phone,
                        cardType: session.data.card_type
                    };
                    const saved = await new Expense(dbData).save();

                    // CLEAR EVERYTHING & COMMIT TO MEMORY
                    session.persistent_memory = { ...session.data };
                    session.state = 'MENU';
                    session.intent = 'GeneralQuery';
                    session.data = { ...injectedData };
                    delete session.lastPrompt;
                    session.isProcessing = false;

                    response.intent = 'GeneralQuery';
                    response.is_ready_for_api = true;
                    response.bot_reply = `✅ Transaction entry successful! ID: ${saved.shortId}`;
                    return res.json(response);
                } catch (err) {
                    session.isProcessing = false;
                    response.bot_reply = `❌ Error: ${err.message}`;
                    return res.json(response);
                }
            }

            response.bot_reply = await formatSummary(session.data, userId);
            session.isProcessing = false;
            return res.json(response);
        }


        // --- 2. VIEW EXPENSE BY MOBILE ---
        if (session.intent === 'ViewExpense') {
            if (session.state === 'ASK_MOBILE_VIEW' || session.state === 'VIEW_RESULTS') {
                const phoneMatch = message.match(/\+?\d{10,14}/);
                const num = phoneMatch ? (phoneMatch[0].startsWith('+') ? phoneMatch[0] : `+91${phoneMatch[0]}`) : session.data.contact_number;

                if (num) {
                    const expenses = await Expense.find({ userId, contactNumber: num }).limit(5);
                    if (expenses.length === 0) {
                        session.isProcessing = false;
                        return res.json({ intent: 'ViewExpense', bot_reply: `🤔 I couldn't find any records for **${num}**. Would you like to try another number?` });
                    }
                    const list = expenses.map(e => `• ID: \`${e.shortId}\` | ₹${e.amount} [${e.category}] - ${e.date}`).join('\n');
                    session.state = 'MENU';
                    session.isProcessing = false;
                    return res.json({ intent: 'ViewExpense', bot_reply: `📋 **Records for ${num}:**\n${list}\n\nAnything else?` });
                }
                session.isProcessing = false;
                return res.json({ intent: 'ViewExpense', bot_reply: "Please provide the 📞 **Mobile Number** to retrieve records." });
            }
        }

        // --- 3. MODIFY / DELETE BY MOBILE ---
        if (session.intent === 'ModifyExpense' || session.intent === 'DeleteExpense') {
            const idMatch = message.match(/\b([A-Z0-9]{6})\b/i);
            if (idMatch && !['CANCEL', 'DELETE', 'UPDATE'].includes(idMatch[1].toUpperCase())) {
                const targetId = idMatch[1].toUpperCase();
                const specificExp = await Expense.findOne({ userId, shortId: targetId });
                if (specificExp) {
                    session.selectedId = specificExp._id;
                    session.state = 'CHOOSE_OP';
                    session.isProcessing = false;
                    return res.json({ 
                        intent: 'ModifyExpense', 
                        bot_reply: `🔎 Found record [\`${specificExp.shortId}\`]: **₹${specificExp.amount}** for **${specificExp.category}**.\nWhat would you like to do?`,
                        quick_replies: ['Change Date 📅', 'Delete Expense 🗑️', 'Cancel'] 
                    });
                }
            }

            if (session.state === 'ASK_MOBILE_MODIFY' || session.state === 'CHOOSE_OP_READY') {
                const phoneMatch = message.match(/\+?\d{10,14}/);
                const num = phoneMatch ? (phoneMatch[0].startsWith('+') ? phoneMatch[0] : `+91${phoneMatch[0]}`) : session.data.contact_number;

                if (num) {
                    const lastExp = await Expense.findOne({ userId, contactNumber: num }).sort({ createdAt: -1 });
                    if (!lastExp) {
                        session.isProcessing = false;
                        return res.json({ intent: 'ModifyExpense', bot_reply: `🤔 No records found for **${num}**. Please check the number.` });
                    }
                    session.selectedId = lastExp._id;
                    session.state = 'CHOOSE_OP';
                    session.isProcessing = false;
                    return res.json({
                        intent: 'ModifyExpense',
                        bot_reply: `🔎 Found your **last record** [\`${lastExp.shortId}\`] for **${num}**: **₹${lastExp.amount}** for **${lastExp.category}**.\nWhat would you like to do? (Or provide a specific **ID** like \`OIQWH5\`)`,
                        quick_replies: ['Change Date 📅', 'Delete Expense 🗑️', 'Cancel']
                    });
                }
                session.isProcessing = false;
                return res.json({ intent: 'ModifyExpense', bot_reply: "Please provide the 📞 **Mobile Number** (or specific **Short ID**) to manage records." });
            }

            if (session.state === 'CHOOSE_OP') {
                if (lowerMsg.includes('date')) {
                    session.state = 'AWAIT_NEW_DATE';
                    session.isProcessing = false;
                    return res.json({ intent: 'ModifyExpense', bot_reply: "Enter the new **Date** (DD-MM-YYYY):" });
                } else if (lowerMsg.includes('delete')) {
                    session.state = 'AWAIT_DELETE_CONFIRM';
                    session.isProcessing = false;
                    return res.json({ intent: 'ModifyExpense', bot_reply: "⚠️ Are you sure you want to permanently delete this record? (Yes/No)", quick_replies: ['Yes', 'No'] });
                } else {
                    session.state = 'MENU';
                    session.isProcessing = false;
                    return res.json({ intent: 'GeneralQuery', bot_reply: "Operation cancelled." });
                }
            }

            if (session.state === 'AWAIT_NEW_DATE') {
                const dMatch = message.match(/(\d{2}-\d{2}-\d{4})/) || message.match(/(\d{2}\/\d{2}\/\d{4})/);
                if (dMatch) {
                    const newDate = dMatch[1].replace(/\//g, '-');
                    await Expense.findByIdAndUpdate(session.selectedId, { date: newDate });
                    session.state = 'MENU';
                    session.isProcessing = false;
                    return res.json({ intent: 'ModifyExpense', bot_reply: `✅ Date updated to **${newDate}** successfully!`, is_ready_for_api: true });
                }
                session.isProcessing = false;
                return res.json({ intent: 'ModifyExpense', bot_reply: "Please enter a valid date: DD-MM-YYYY" });
            }

            if (session.state === 'AWAIT_DELETE_CONFIRM') {
                if (['yes', 'confirm', 'ok'].includes(lowerMsg)) {
                    await Expense.findByIdAndDelete(session.selectedId);
                    session.state = 'MENU';
                    session.isProcessing = false;
                    return res.json({ intent: 'ModifyExpense', bot_reply: "🗑️ Expense record deleted successfully.", is_ready_for_api: true });
                }
                session.state = 'MENU';
                session.isProcessing = false;
                return res.json({ intent: 'ModifyExpense', bot_reply: "Delete aborted." });
            }
        }

        // --- 5. Improve Fallback Response UX ---
        session.isProcessing = false;
        response.bot_reply = `I'm not sure how to handle that.\n💡 **Try these examples:**\n• "Spent 500 on food"\n• "Bought shoes for 2000"\n• "Show total spending"`;
        return res.json(response);

    } catch (err) {
        console.error("Critical Chat Error:", err);
        session.isProcessing = false;
        return res.json({ intent: "GeneralQuery", bot_reply: "An internal error occurred." });
    }
});

module.exports = {
    router,
    extractEntities,
    checkFAQ
};
