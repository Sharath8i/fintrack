const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/authMiddleware');

// @route   GET /api/analytics
// @desc    Get analytics for dashboard (private)
router.get('/', auth, async (req, res) => {
  try {
    const matchQuery = { userId: req.userId };

    // 1. Last 5 transactions
    const recentTransactions = await Expense.find(matchQuery)
      .sort({ date: -1 })
      .limit(5);

    // 2. Fetch all for user to calculate totals
    const allExpenses = await Expense.find(matchQuery);
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    let totalThisMonth = 0;
    const categoryTotals = {};
    const cardTotals = {};
    const monthWiseSpend = {};
    
    allExpenses.forEach(exp => {
      // Amount sum by category
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;

      // Extract Month and Year
      // Date format: DD-MM-YYYY
      const dateParts = exp.date.split('-');
      if (dateParts.length === 3) {
        const mm = parseInt(dateParts[1], 10);
        const yyyy = parseInt(dateParts[2], 10);
        const monthKey = `${String(mm).padStart(2,'0')}-${yyyy}`;
        
        // Month-wise aggregation
        monthWiseSpend[monthKey] = (monthWiseSpend[monthKey] || 0) + exp.amount;

        if (mm === currentMonth && yyyy === currentYear) {
            totalThisMonth += exp.amount;
        }
      }
    });

    res.json({
        totalThisMonth,
        spendByCategory: categoryTotals,
        monthWiseSpend,
        recentTransactions,
        totalExpenses: allExpenses.length
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

