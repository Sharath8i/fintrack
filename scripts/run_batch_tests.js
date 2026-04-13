const { extractEntities } = require('../backend/routes/chat'); 
const fs = require('fs');
const path = require('path');
const resultsPath = path.resolve(__dirname, '../tests/batch_test_results.csv');
const reportPath = path.resolve(__dirname, '../tests/batch_test_report.md');

const testCases = [
    { input: "I spent 500 on food", expected: { amount: 500, category: 'Food' } },
    { input: "spent 100 today on transport", expected: { amount: 100, category: 'Transport', date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-') } },
    { input: "Shopping for 2500 using credit card", expected: { amount: 2500, category: 'Shopping', cardType: 'Credit Card' } },
    { input: "change amount to 750", expected: { amount: 750 } },
    { input: "my name is John Doe and email is john@test.com", expected: { fullName: 'John Doe', email: 'john@test.com' } },
    { input: "Spent RS 45.50 on snacks", expected: { amount: 45.50 } },
    { input: "+91 9876543210 is my number", expected: { contactNumber: '+91 9876543210' } }
];

const results = [];
testCases.forEach(tc => {
    const extracted = extractEntities(tc.input);
    const pass = Object.keys(tc.expected).every(key => extracted[key] === tc.expected[key]);
    results.push({
        input: tc.input,
        expected: JSON.stringify(tc.expected),
        actual: JSON.stringify(extracted),
        status: pass ? 'PASS' : 'FAIL'
    });
});

const csvHeader = "Input,Expected,Actual,Status\n";
const csvRows = results.map(r => `"${r.input}","${r.expected.replace(/"/g, '""')}","${r.actual.replace(/"/g, '""')}",${r.status}`).join('\n');
fs.writeFileSync(resultsPath, csvHeader + csvRows);

const report = `# Batch Test Report: NLP Entity Extraction

## Summary
- **Total Tests:** ${testCases.length}
- **Passed:** ${results.filter(r => r.status === 'PASS').length}
- **Failed:** ${results.filter(r => r.status === 'FAIL').length}
- **Accuracy:** ${(results.filter(r => r.status === 'PASS').length / testCases.length * 100).toFixed(2)}%

## Detailed Results
| Input | Expected | Status |
| :--- | :--- | :--- |
${results.map(r => `| ${r.input} | ${r.expected} | ${r.status} |`).join('\n')}
`;

fs.writeFileSync(reportPath, report);
console.log("Batch tests completed successfully.");
console.log("Results saved to:", resultsPath);
console.log("Report saved to:", reportPath);
