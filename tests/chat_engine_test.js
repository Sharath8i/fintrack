const fs = require('fs');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ userId: 'qa_bot_1' }, 'fintrack_secret_key_123');

const cases = [
  "I paid 500 for petrol",
  "Booked a cab for 250",
  "Paid parking fee 100",
  "Took a metro ride for 60",
  "Spent 1200 on flight ticket",
  "Paid toll charges 200",
  "Filled fuel for bike 800",
  "Booked train ticket for 450",
  "Paid auto fare 90",
  "Rented a car for 2000",
  
  "Bought a watch for 2000",
  "Purchased shoes for 3000",
  "Ordered clothes online for 1500",
  "Got groceries from supermarket for 1200",
  "Bought a mobile phone for 15000",
  "Picked up some items for 700",
  "Paid 500 for accessories",
  "Shopping in mall cost me 2500",
  "Bought a laptop charger for 800",
  "Grabbed some stuff for 600",
  
  "Had dinner at restaurant for 800",
  "Ordered pizza for 400",
  "Had lunch for 250",
  "Grabbed a burger for 150",
  "Bought coffee and snacks for 200",
  "Ate breakfast at cafe for 300",
  "Ordered food online for 500",
  "Had tea and biscuits for 100",
  "Paid for meal 350",
  "Had ice cream for 120",
  
  "Paid 1000 for petrol and snacks",
  "Ordered groceries and food for 1500",
  "Booked cab and had dinner for 700",
  "Bought clothes and shoes for 4000",
  "Paid for ride and coffee 300",
  "Got stuff and snacks for 900",
  "Ordered burger and booked cab for 500",
  "Paid fuel and bought groceries for 2000",
  "Had lunch and shopping cost 1800",
  "Bought items and ate food for 1000"
];

async function runTests() {
  const results = [];
  console.log("Starting batch test of " + cases.length + " statements against local API...");
  for (let i = 0; i < cases.length; i++) {
    const text = cases[i];
    try {
      const resp = await fetch(`http://127.0.0.1:5002/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: "test-batch-002-" + i,
          message: text,
          userContext: { name: "QA Bot" }
        })
      });
      const data = await resp.json();
      results.push({
        query: text,
        intent: data.intent,
        category: data.extracted_data?.category || 'NONE',
        amount: data.extracted_data?.amount || 'NONE',
        desc: data.extracted_data?.description || 'NONE',
        missing: data.missing_fields || [],
        ready: data.is_ready_for_api ? "✅ READY" : "⚠️ MISSING DATA"
      });
      console.log(`[${i+1}/${cases.length}] Parsed:`, data.extracted_data?.category, data.extracted_data?.amount);
    } catch (e) {
       console.log(`[${i+1}/${cases.length}] Error:`, e.message);
       results.push({ query: text, error: e.message });
    }
    // Delay to respect API limits locally
    await new Promise(r => setTimeout(r, 800));
  }
  
  let md = "# AI Entity Extraction Raw Test Results\n\n| Query | Intent | Category | Amount | Description | Status |\n|---|---|---|---|---|---|\n";
  results.forEach(r => {
    md += `| ${r.query} | ${r.intent} | ${r.category} | ${r.amount} | ${r.desc} | ${r.ready || r.error} |\n`;
  });
  
  fs.writeFileSync('c:\\Sharath-ps3\\tests\\test_suite_raw.md', md);
  console.log("Done. Results saved to tests/test_suite_raw.md");
}

runTests();
