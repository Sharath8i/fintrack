function extractEntities(message, currentData = {}, lastPrompt = null) {
    const data = { ...currentData };
    const lower = message.toLowerCase();

    const explicitAmount = message.match(/(?:spend|spent|cost|amount is)\s*\$?(\d+(\.\d{1,2})?)/i);
    if (explicitAmount) {
        data.amount = parseFloat(explicitAmount[1]);
    } else if (lastPrompt === 'amount') {
        const numMatch = message.match(/(\d+(\.\d{1,2})?)/);
        if (numMatch) data.amount = parseFloat(numMatch[1]);
    } else {
        const dollarMatch = message.match(/\$(\d+(\.\d{1,2})?)/);
        if (dollarMatch) data.amount = parseFloat(dollarMatch[1]);
    }
    
    if (lower.includes('transport')) data.category = 'Transport';
    else if (lower.includes('shopping')) data.category = 'Shopping';
    else if (lower.includes('food')) data.category = 'Food';

    if (lower.includes('debit')) data.cardType = 'Debit Card';
    else if (lower.includes('credit')) data.cardType = 'Credit Card';

    const dateMatch = message.match(/(\d{2}-\d{2}-\d{4})/);
    if (dateMatch) data.date = dateMatch[1];
    else if (lower.includes('today')) {
        const d = new Date();
        data.date = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
    }

    const phoneMatch = message.match(/(\+\d{1,4}\s?\d{10})/);
    if (phoneMatch) data.contactNumber = phoneMatch[1];

    const emailMatch = message.match(/([\w.-]+@[\w.-]+\.\w+)/);
    if (emailMatch) data.email = emailMatch[1];

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

    if (lastPrompt === 'description') {
        data.description = message.trim();
    } else {
        const descMatch = message.match(/for (.*)/i);
        if (descMatch && !lower.includes('change')) {
            const raw = descMatch[1].replace(/[.,]/g,'').trim();
            if(raw.length > 0) data.description = raw;
        } else if (lower.includes('change description to ')) {
            data.description = lower.split('change description to ')[1].trim();
        }
    }

    return data;
}

let session = {state: 'MENU', data: {}};
session.data = extractEntities('', session.data, undefined);
console.log("After 1:", session.data);

session.data = extractEntities('John Doe', session.data, 'fullName');
console.log("After name:", session.data);

session.data = extractEntities('+1 1234567890', session.data, 'contactNumber');
console.log("After contact:", session.data);

session.data = extractEntities('test@test.com', session.data, 'email');
console.log("After email:", session.data);

session.data = extractEntities('credit', session.data, 'cardType');
console.log("After card:", session.data);

session.data = extractEntities('food', session.data, 'category');
console.log("After food:", session.data);
