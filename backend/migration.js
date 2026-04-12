const mongoose = require('mongoose');
const Expense = require('./models/Expense');

mongoose.connect('mongodb://127.0.0.1:27017/expense_tracker')
  .then(async () => {
    console.log("Connected to MongoDB for migration...");
    const expenses = await Expense.find({ shortId: { $exists: false } });
    
    console.log(`Found ${expenses.length} records needing migration.`);
    let count = 0;
    
    for (let exp of expenses) {
      exp.shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
      await exp.save();
      count++;
    }
    
    console.log(`Successfully assigned shortId to ${count} previous expressions.`);
    process.exit(0);
  })
  .catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
