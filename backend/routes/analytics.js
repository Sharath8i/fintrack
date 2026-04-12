const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// @route   GET /api/analytics
// @desc    Get analytics for dashboard (spending by category, total this month, last 5)
router.get('/', async (req, res) => {
  try {
    const { contactNumber } = req.query;
    let matchQuery = {};
    if (contactNumber) {
        const digitsOnly = contactNumber.replace(/\D/g, '').slice(-10);
        if(digitsOnly.length === 10) {
            matchQuery.contactNumber = { $regex: new RegExp(digitsOnly + '$') };
        }
    }

    // 1. Last 5 transactions
    const recentTransactions = await Expense.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(5);

    // 2. Total this month
    // Need to parse string dates DD-MM-YYYY carefully. Since it's stored as String, it's safer to fetch all or use Aggregation if strict. 
    // Wait, let's fetch all matched expenses and calculate since typical personal finance records for one user are small.
    const allExpenses = await Expense.find(matchQuery);
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    let totalThisMonth = 0;
    const categoryTotals = {};
    const cardTotals = {};
    const monthWiseSpend = {};
    const monthWiseCategorySpend = {};
    
    allExpenses.forEach(exp => {
      // Amount sum by category
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;

      // Amount sum by card type
      if (exp.cardType) {
         cardTotals[exp.cardType] = (cardTotals[exp.cardType] || 0) + exp.amount;
      }

      // Extract Month and Year
      // Date format: DD-MM-YYYY
      const dateParts = exp.date.split('-');
      if (dateParts.length === 3) {
        const mm = parseInt(dateParts[1], 10);
        const yyyy = parseInt(dateParts[2], 10);
        const monthKey = `${String(mm).padStart(2,'0')}-${yyyy}`;
        
        // Month-wise aggregation
        monthWiseSpend[monthKey] = (monthWiseSpend[monthKey] || 0) + exp.amount;
        
        monthWiseCategorySpend[monthKey] = monthWiseCategorySpend[monthKey] || {};
        monthWiseCategorySpend[monthKey][exp.category] = (monthWiseCategorySpend[monthKey][exp.category] || 0) + exp.amount;

        if (mm === currentMonth && yyyy === currentYear) {
            totalThisMonth += exp.amount;
        }
      }
    });

    res.json({
        totalThisMonth,
        spendByCategory: categoryTotals,
        spendByCard: cardTotals,
        monthWiseSpend,
        monthWiseCategorySpend,
        recentTransactions
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
