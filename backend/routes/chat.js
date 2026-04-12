const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Temporary in-memory session storage
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
        response: 'Your ledger operates under End-to-End Secure mode. Transactions are safely isolated within your local MongoDB instance.'
    },
    {
        keywords: ['export', 'download', 'csv', 'excel'],
        response: 'Yes! You can instantly export your filtered transaction history as a CSV file by clicking the "DOWNLOAD BATCH CSV & REPORT" button inside the History tab.'
    },
    {
        keywords: ['track', 'how to track', 'create', 'log an expense'],
        response: 'Simply tell me what you spent! For example, say: "I spent 15 on Food today".'
    },
    {
        keywords: ['delete', 'remove', 'undo an expense', 'modify', 'edit'],
        response: 'To modify or delete a previously committed entry, use the "Modify/Delete" Task Control, or say "Option 3". I will pull up your ledger so you can target a specific ID.'
    },
    {
        keywords: ['mistake', 'correction', 'change', 'wrong field', 'amend'],
        response: 'You can quickly correct mistakes mid-conversation! Just type commands like "change amount to 50" or "change category to Food".'
    },
    {
        keywords: ['cancel', 'exit', 'quit', 'start over', 'stop'],
        response: 'If you want to stop what you are doing and return to the Main Menu, simply type "cancel" or "exit" at any time.'
    },
    {
        keywords: ['budget', 'limit', 'cap', 'set budget'],
        response: 'You can set a budget for a category by saying "Set my Food budget to 5000". I will automatically warn you if your expenses exceed it.'
    },
    {
        keywords: ['how much did', 'query', 'total spent', 'analytics'],
        response: 'You can ask analytical queries to get real-time summaries, such as: "How much did I spend on Transport?"'
    }
];

function checkFAQ(message) {
    const lowerMessage = message.toLowerCase();
    
    // Ignore short menu numerical inputs
    if (['1', '2', '3'].includes(lowerMessage.trim())) return null;

    // Loop through FAQs to find a match
    for (const faq of FAQS) {
        for (const keyword of faq.keywords) {
            if (lowerMessage.includes(keyword)) {
                return faq.response;
            }
        }
    }
    return null;
}

function extractEntities(message, currentData = {}, lastPrompt = null) {
    const data = { ...currentData };
    const lower = message.toLowerCase();

    // Universal Amendment Hooks (overrides anything previously stored)
    if (lower.includes('change name to ')) {
        data.fullName = message.substring(lower.indexOf('change name to ') + 15).trim();
    }
    if (lower.includes('change amount to ')) {
        const amt = message.match(/change amount to\s*(?:rs\.?|inr|₹)?\s*(\d+(\.\d{1,2})?)\s*(?:rupees|rs\.?|inr|₹)?/i);
        if (amt) data.amount = parseFloat(amt[1]);
    }
    if (lower.includes('change category to ')) {
        const cat = lower.split('change category to ')[1].trim();
        if (cat.includes('transport')) data.category = 'Transport';
        else if (cat.includes('shopping')) data.category = 'Shopping';
        else if (cat.includes('food')) data.category = 'Food';
    }
    if (lower.includes('change card to ')) {
        if (lower.includes('debit')) data.cardType = 'Debit Card';
        else if (lower.includes('credit')) data.cardType = 'Credit Card';
    }

    // Amount - explicit match or response to prompt
    const explicitAmount = message.match(/(?:spend|spent|cost|paid|amount is)\s*(?:rs\.?|inr|₹)?\s*(\d+(\.\d{1,2})?)\s*(?:rupees|rs\.?|inr|₹)?/i);
    if (explicitAmount) {
        data.amount = parseFloat(explicitAmount[1]);
    } else if (lastPrompt === 'amount') {
        const numMatch = message.match(/(\d+(\.\d{1,2})?)/);
        if (numMatch) data.amount = parseFloat(numMatch[1]);
    } else if (!data.amount) {
        const currencyMatch = message.match(/(?:rs\.?|inr|₹)\s*(\d+(\.\d{1,2})?)/i) || message.match(/(\d+(\.\d{1,2})?)\s*(?:rupees|inr|rs\.?|₹)/i);
        if (currencyMatch) data.amount = parseFloat(currencyMatch[1]);
    }
    
    // Category
    if (!data.category) {
        if (lower.includes('transport')) data.category = 'Transport';
        else if (lower.includes('shopping')) data.category = 'Shopping';
        else if (lower.includes('food')) data.category = 'Food';
    }

    // Card Type
    if (!data.cardType) {
        if (lower.includes('debit')) data.cardType = 'Debit Card';
        else if (lower.includes('credit')) data.cardType = 'Credit Card';
    }

    // Date
    if (lower.includes('change date to ')) {
         const d = message.match(/change date to (\d{2}-\d{2}-\d{4})/i);
         if (d) data.date = d[1];
    } else if (!data.date) {
        const dateMatch = message.match(/(\d{2}-\d{2}-\d{4})/);
        if (dateMatch) data.date = dateMatch[1];
        else if (lower.includes('today')) {
            const d = new Date();
            data.date = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
        }
    }

    // Contact Number (Country code + 10 digits)
    if (!data.contactNumber) {
        const phoneMatch = message.match(/(\+\d{1,4}\s?\d{10})/);
        if (phoneMatch) data.contactNumber = phoneMatch[1];
    }

    // Email
    if (!data.email) {
        const emailMatch = message.match(/([\w.-]+@[\w.-]+\.\w+)/);
        if (emailMatch) data.email = emailMatch[1];
    }

    // Full name
    if (!data.fullName) {
        if (lastPrompt === 'fullName') {
            data.fullName = message.trim();
        } else {
            const nameMatch = message.match(/my name is ([a-zA-ZÀ-ÿ]+ [a-zA-ZÀ-ÿ]+)/i);
            if (nameMatch) {
                data.fullName = nameMatch[1];
            } else if (/^[a-zA-ZÀ-ÿ\s]+$/.test(message.trim()) && message.trim().split(/\s+/).length >= 2) {
                data.fullName = message.trim();
            }
        }
    }

    // Description
    if (lastPrompt === 'description') {
        data.description = message.trim();
    } else if (!data.description) {
        if (lower.includes('change description to ')) {
            data.description = lower.split('change description to ')[1].trim();
        }
    }

    return data;
}

const REQUIRED_FIELDS = ['fullName', 'cardType', 'category', 'amount', 'description', 'date', 'contactNumber', 'email'];

function getMissingFieldPrompt(data) {
    if (!data.fullName) return { field: 'fullName', prompt: "What is your full name? (First and Last)" };
    if (!data.contactNumber) return { field: 'contactNumber', prompt: "What is your mobile number? (Country code + 10 digits)" };
    if (!data.email) return { field: 'email', prompt: "What is your email address?" };
    if (!data.cardType) return { field: 'cardType', prompt: "Which card did you use? (Debit Card or Credit Card)" };
    if (!data.category) return { field: 'category', prompt: "What category is this for? (Transport, Shopping, Food)" };
    if (!data.amount) return { field: 'amount', prompt: "What was the amount spent?" };
    if (!data.date) return { field: 'date', prompt: "What is the date of the expense? (DD-MM-YYYY or 'today')" };
    if (!data.description) return { field: 'description', prompt: "What is a brief description of this expense?" };
    return null; // All collected
}

function formatSummary(data) {
    return `Here is a summary of your expense:
- Name: ${data.fullName}
- Mobile: ${data.contactNumber}
- Email: ${data.email}
- Card: ${data.cardType}
- Category: ${data.category}
- Amount: $${data.amount}
- Date: ${data.date}
- Description: ${data.description}

Does this look correct? Say "yes" to save, or type the correction (e.g. "change amount to 50").`;
}

router.post('/', async (req, res) => {
    const { sessionId, message } = req.body;
    let reply = '';
    let requiresAction = null; // can tell UI to refresh or do something

    if (!sessions[sessionId]) {
        sessions[sessionId] = { state: 'MENU', data: {} };
    }

    const session = sessions[sessionId];
    const lowerMsg = message.toLowerCase();

    // Global Cancel / Exit
    if (['cancel', 'exit', 'quit', 'start over'].includes(lowerMsg.trim())) {
        session.state = 'MENU';
        session.data = {};
        delete session.lastPrompt;
        return res.json({ 
            reply: "Action cancelled. Returning to the main menu.\n1. Create Expense\n2. View Expenses\n3. Modify/Delete Expense", 
            state: session.state 
        });
    }

    // Check FAQ only in MENU state to avoid hijacking mid-flow commands
    if (session.state === 'MENU') {
        const faqReply = checkFAQ(message);
        if (faqReply && !['1','2','3'].includes(lowerMsg.trim())) {
            return res.json({ reply: faqReply, state: session.state });
        }
    }

    switch (session.state) {
        case 'MENU':
            const expenseIntent = /(?:spend|spent|cost|bought|paid|purchase)\b/i.test(lowerMsg) || /(?:rs\.?|inr|₹)\s*\d+/i.test(lowerMsg) || /\d+\s*(?:rupees|rs\.?|inr|₹)/i.test(lowerMsg);
            const isOpt1 = lowerMsg === '1' || lowerMsg === '1.' || lowerMsg.includes('create') || expenseIntent;
            const isOpt2 = lowerMsg === '2' || lowerMsg === '2.' || lowerMsg.includes('view');
            const isOpt3 = lowerMsg === '3' || lowerMsg === '3.' || lowerMsg.includes('modify') || lowerMsg.includes('delete');
            const isUndo = lowerMsg === 'undo';
            const isAnalyticalQuery = (lowerMsg.includes('how much') || lowerMsg.includes('total')) && (lowerMsg.includes('spend') || lowerMsg.includes('spent'));
            const isSetBudget = lowerMsg.includes('set') && lowerMsg.includes('budget');

            if (isUndo) {
                if (session.lastSavedId) {
                    try {
                        const Expense = require('../models/Expense');
                        await Expense.findOneAndDelete({ shortId: session.lastSavedId });
                        reply = `Success! I have completely undone and deleted your last recorded expense (ID: ${session.lastSavedId}).`;
                        delete session.lastSavedId;
                        requiresAction = "REFRESH_ANALYTICS";
                    } catch (err) {
                        reply = "Error: I couldn't undo the last action.";
                    }
                } else {
                    reply = "There is no recently saved expense in my active memory to undo right now.";
                }
            } else if (isAnalyticalQuery) {
                try {
                    const Expense = require('../models/Expense');
                    let filter = {};
                    let catName = "all categories";
                    if (lowerMsg.includes('food')) { filter.category = 'Food'; catName = "Food"; }
                    else if (lowerMsg.includes('transport')) { filter.category = 'Transport'; catName = "Transport"; }
                    else if (lowerMsg.includes('shopping')) { filter.category = 'Shopping'; catName = "Shopping"; }

                    const allExp = await Expense.find(filter);
                    const totalCount = allExp.reduce((sum, current) => sum + current.amount, 0);
                    reply = `Based on your live matrix, you have spent a grand total of Rs ${totalCount} on ${catName}.`;
                } catch (err) {
                    reply = "I'm having trouble analyzing your database right now.";
                }
            } else if (isSetBudget) {
                const amtMatch = message.match(/(?:rs\.?|inr|\$|£|€)?\s*(\d+(\.\d{1,2})?)/i);
                let catResult = null;
                if (lowerMsg.includes('food')) catResult = 'Food';
                else if (lowerMsg.includes('transport')) catResult = 'Transport';
                else if (lowerMsg.includes('shopping')) catResult = 'Shopping';
                
                if (catResult && amtMatch) {
                    session.data = { category: catResult, threshold: parseFloat(amtMatch[1]) };
                    session.state = 'BUDGET_ASK_MOBILE';
                    reply = `Got it. Let's set a Rs ${amtMatch[1]} budget for ${catResult}. Please enter your mobile number connecting this configuration.`;
                } else {
                    reply = "To set a budget, please state the category and amount (e.g., 'Set my Food budget to 5000').";
                }
            } else if (isOpt1) {
                session.state = 'CREATE_GATHER';
                const msgForExtraction = ['1','2','3'].includes(message.trim()) ? '' : message;
                session.data = extractEntities(msgForExtraction, session.data, session.lastPrompt);
                const missing = getMissingFieldPrompt(session.data);
                if (missing) {
                    session.lastPrompt = missing.field;
                    reply = "Great, let's log a new expense. " + missing.prompt;
                } else {
                    session.state = 'CONFIRM_SAVE';
                    reply = formatSummary(session.data);
                }
            } else if (isOpt2) {
                session.state = 'VIEW_ASK_MOBILE';
                reply = "Please enter your mobile number (starting with country code) to view your expenses.";
            } else if (isOpt3) {
                session.state = 'MODIFY_ASK_MOBILE';
                reply = "Please enter your mobile number to look up your expenses to modify/delete.";
            } else if (lowerMsg === 'hi' || lowerMsg === 'hello' || lowerMsg === 'start') {
                reply = "Hi! Which operations do you need to do?\n1. Create Expense\n2. View Expenses\n3. Modify/Delete Expense";
            } else {
                reply = "Hi! Which operations do you need to do?\n1. Create Expense\n2. View Expenses\n3. Modify/Delete Expense";
            }
            break;

        case 'CREATE_GATHER':
            // Entity Amendment inside gather
            const preData = { ...session.data };
            session.data = extractEntities(message, session.data, session.lastPrompt);
            
            if (session.lastPrompt && !session.data[session.lastPrompt]) {
                let errorMsg = "Invalid input.";
                if (session.lastPrompt === 'amount') errorMsg = "Error: Amount must be a valid number.";
                else if (session.lastPrompt === 'contactNumber') errorMsg = "Error: Contact number must be country code + exactly 10 digits.";
                else if (session.lastPrompt === 'date') errorMsg = "Error: Date must be DD-MM-YYYY.";
                else if (session.lastPrompt === 'email') errorMsg = "Error: Please provide a valid email format.";
                else if (session.lastPrompt === 'fullName') errorMsg = "Error: Please provide both first and last name.";
                else if (session.lastPrompt === 'category') errorMsg = "Error: Category must be Transport, Shopping, or Food.";
                else if (session.lastPrompt === 'cardType') errorMsg = "Error: Card must be Debit Card or Credit Card.";
                
                reply = errorMsg + " Let's try again. " + getMissingFieldPrompt(preData).prompt;
            } else {
                const missing = getMissingFieldPrompt(session.data);
                if (missing) {
                    session.lastPrompt = missing.field;
                    reply = missing.prompt;
                } else {
                    delete session.lastPrompt;
                    session.state = 'CONFIRM_SAVE';
                    reply = formatSummary(session.data);
                }
            }
            break;

        case 'CONFIRM_SAVE':
            if (lowerMsg === 'yes' || lowerMsg === 'y' || lowerMsg === 'correct') {
                // Actually save
                try {
                    const newExpense = new Expense(session.data);
                    const savedExp = await newExpense.save();
                    reply = `Saved successfully! You can view it in your dashboard now. (Hint: Type 'undo' if you made a mistake)`;
                    requiresAction = "REFRESH_ANALYTICS";
                    session.state = 'MENU';
                    session.lastSavedId = savedExp.shortId; // Preserve for contextual undo
                    
                    // Verify if a budget threshold is exceeded post-save
                    try {
                        const Budget = require('../models/Budget');
                        const activeBudget = await Budget.findOne({ mobile: savedExp.contactNumber, category: savedExp.category });
                        if (activeBudget) {
                            const sameCatExpenses = await Expense.find({ contactNumber: savedExp.contactNumber, category: savedExp.category });
                            const totalSpend = sameCatExpenses.reduce((sum, curr) => sum + curr.amount, 0);
                            if (totalSpend > activeBudget.threshold) {
                                reply += `\n\n⚠️ BUDGET ALERT: This expense pushed your total ${savedExp.category} spending (Rs ${totalSpend}) over your securely established budget boundary of Rs ${activeBudget.threshold}!`;
                            }
                        }
                    } catch (budgetErr) {
                        console.error('Budget verification skipped', budgetErr);
                    }
                    
                    session.data = {};
                } catch (err) {
                    reply = "Sorry, I couldn't save that. " + err.message;
                    session.state = 'CREATE_GATHER'; // back to gather to fix
                    
                    // Drop invalid fields dynamically to force valid extraction next turn
                    if (err.message.includes('fullName')) {
                        delete session.data.fullName;
                        session.lastPrompt = 'fullName';
                    } else if (err.message.includes('contactNumber')) {
                        delete session.data.contactNumber;
                        session.lastPrompt = 'contactNumber';
                    } else if (err.message.includes('email')) {
                        delete session.data.email;
                        session.lastPrompt = 'email';
                    } else if (err.message.includes('amount')) {
                        delete session.data.amount;
                        session.lastPrompt = 'amount';
                    }
                }
            } else {
                // Treat as amendment
                session.data = extractEntities(message, session.data, null);
                reply = "Got it. " + formatSummary(session.data);
            }
            break;

        case 'VIEW_ASK_MOBILE':
            const phoneMatch = message.match(/(\+\d{1,4}\s?\d{10})/);
            if (phoneMatch) {
                try {
                    const expenses = await Expense.find({ contactNumber: phoneMatch[1] }).sort({ createdAt: -1 }).limit(10);
                    if (expenses.length === 0) {
                        reply = `No expenses found for ${phoneMatch[1]}.`;
                    } else {
                        let expText = expenses.map(e => `- ${e.date}: ₹${e.amount} | ${e.category} | ${e.description} | ID: ${e.shortId}`).join('\n');
                        reply = `Here are your recent expenses for ${phoneMatch[1]}:\n${expText}`;
                    }
                    session.state = 'MENU';
                } catch (err) {
                    reply = "Failed to fetch your expenses.";
                    session.state = 'MENU';
                }
            } else {
                reply = "Error: Contact number must contain a country code and exactly 10 digits (e.g. +1 1234567890).";
            }
            break;

         case 'MODIFY_ASK_MOBILE':
            const modMatch = message.match(/(\+\d{1,4}\s?\d{10})/);
            if (modMatch) {
                try {
                    const count = await Expense.countDocuments({ contactNumber: modMatch[1] });
                    if (count === 0) {
                        reply = `There are no recorded expenses for the number ${modMatch[1]}. Going back to the Main Menu.`;
                        session.state = 'MENU';
                    } else {
                        requiresAction = { type: "LOAD_MODIFY", mobile: modMatch[1] };
                        reply = "Loaded your expenses. Tell me the ID of the expense you want to delete or change the date of (e.g. 'delete XGT8F1' or 'change date of XGT8F1 to 12-12-2023').";
                        session.state = 'MODIFY_ACTION';
                    }
                } catch (err) {
                    reply = "Error connecting to database.";
                    session.state = 'MENU';
                }
            } else {
                reply = "Error: Invalid number. Try again (e.g. +1 1234567890).";
            }
            break;

         case 'BUDGET_ASK_MOBILE':
            const budgMatch = message.match(/(\+\d{1,4}\s?\d{10})/);
            if (budgMatch) {
                try {
                    const Budget = require('../models/Budget');
                    await Budget.findOneAndUpdate(
                       { mobile: budgMatch[1], category: session.data.category },
                       { threshold: session.data.threshold },
                       { upsert: true, new: true }
                    );
                    reply = `Budget bound successfully! You will now organically receive a warning popup in chat if you exceed Rs ${session.data.threshold} on your ${session.data.category} expenses!`;
                } catch (e) {
                    reply = "Error saving budget.";
                }
            } else {
                reply = "Error: Invalid number. Try again (e.g. +1 1234567890).";
            }
            session.state = 'MENU';
            break;

        case 'MODIFY_ACTION':
            // E.g., 'delete A3M9K2' or 'change date of A3M9K2 to 10-10-2023'
            const possibleIds = message.match(/\b([A-Za-z0-9]{6})\b/g);
            let targetId = null;
            if (possibleIds) {
                // Filter out the 6-letter command keywords themselves ('delete', 'change', 'cancel', 'update')
                targetId = possibleIds.find(id => {
                    const l = id.toLowerCase();
                    return l !== 'delete' && l !== 'change' && l !== 'cancel' && l !== 'update';
                });
            }

            if (lowerMsg.includes('delete')) {
                if(targetId) {
                    session.data = { action: 'DELETE', id: targetId.toUpperCase() };
                    session.state = 'MODIFY_CONFIRM';
                    reply = `Are you sure you want to delete the expense with ID ${targetId.toUpperCase()}? Say 'yes' to confirm.`;
                } else {
                    reply = "Please reply with 'delete' and the specific 6-character ID shown on the screen.";
                }
            } else if (lowerMsg.includes('change date')) {
                const dMatch = message.match(/(\d{2}-\d{2}-\d{4})/);
                if(targetId && dMatch) {
                    session.data = { action: 'UPDATE_DATE', id: targetId.toUpperCase(), newDate: dMatch[1] };
                    session.state = 'MODIFY_CONFIRM';
                    reply = `Are you sure you want to change the date of expense ${targetId.toUpperCase()} to ${dMatch[1]}? Say 'yes' to confirm.`;
                } else {
                    reply = "Please reply with 'change date of [ID] to [DD-MM-YYYY]'.";
                }
            } else {
                reply = "You can say 'delete [ID]' or 'change date of [ID] to [DD-MM-YYYY]', or say 'cancel'.";
                if(lowerMsg.includes('cancel')) session.state = 'MENU';
            }
            break;

        case 'MODIFY_CONFIRM':
            if (lowerMsg === 'yes' || lowerMsg === 'y' || lowerMsg === 'confirm') {
                try {
                    const Expense = require('../models/Expense');
                    if (session.data.action === 'DELETE') {
                        const deleted = await Expense.findOneAndDelete({ shortId: session.data.id });
                        if (deleted) {
                            reply = "Deleted successfully.";
                            requiresAction = "REFRESH_ANALYTICS";
                        } else {
                            reply = "Error: No expense found with that specific ID to delete.";
                        }
                    } else if (session.data.action === 'UPDATE_DATE') {
                        const updated = await Expense.findOneAndUpdate({ shortId: session.data.id }, { date: session.data.newDate }, { runValidators: true });
                        if (updated) {
                            reply = "Date updated successfully.";
                            requiresAction = "REFRESH_ANALYTICS";
                        } else {
                            reply = "Error: No expense found with that specific ID to update.";
                        }
                    }
                } catch (e) {
                     reply = "Action failed. " + e.message;
                }
            } else {
                reply = "Action cancelled.";
            }
            session.state = 'MENU';
            session.data = {};
            break;

        default:
            session.state = 'MENU';
            reply = "I'm not sure what to do. Let's start over. 1. Create, 2. View, 3. Modify/Delete.";
    }

    res.json({ reply, state: session.state, requiresAction });
});

module.exports = router;
