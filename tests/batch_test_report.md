# Batch Test Report: NLP Entity Extraction

## Summary
- **Total Tests:** 7
- **Passed:** 6
- **Failed:** 1
- **Accuracy:** 85.71%

## Detailed Results
| Input | Expected | Status |
| :--- | :--- | :--- |
| I spent 500 on food | {"amount":500,"category":"Food"} | PASS |
| spent 100 today on transport | {"amount":100,"category":"Transport","date":"13-04-2026"} | PASS |
| Shopping for 2500 using credit card | {"amount":2500,"category":"Shopping","cardType":"Credit Card"} | FAIL |
| change amount to 750 | {"amount":750} | PASS |
| my name is John Doe and email is john@test.com | {"fullName":"John Doe","email":"john@test.com"} | PASS |
| Spent RS 45.50 on snacks | {"amount":45.5} | PASS |
| +91 9876543210 is my number | {"contactNumber":"+91 9876543210"} | PASS |
