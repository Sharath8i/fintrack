const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/authMiddleware');

// @route   GET /api/analytics
// @desc    Full analytics payload (private to logged-in user)
router.get('/', auth, async (req, res) => {
  try {
    const matchQuery = { userId: req.userId };

    // Last 5 transactions (sorted by date string descending via createdAt)
    const recentTransactions = await Expense.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(5);

    const allExpenses = await Expense.find(matchQuery);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear  = new Date().getFullYear();

    let totalThisMonth = 0;
    const categoryTotals        = {};   // { Food: 500, Transport: 150 }
    const cardTotals             = {};   // { 'Debit Card': 400, 'Credit Card': 250 }
    const monthWiseSpend         = {};   // { '04-2026': 650 }
    const monthWiseCategorySpend = {};   // { '04-2026': { Food: 500, Transport: 150 } }

    allExpenses.forEach(exp => {
      // --- Category totals ---
      if (exp.category) {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
      }

      // --- Card type totals ---
      if (exp.cardType) {
        cardTotals[exp.cardType] = (cardTotals[exp.cardType] || 0) + exp.amount;
      }

      // --- Date parsing: DD-MM-YYYY ---
      if (!exp.date) return;
      const parts = exp.date.split('-');
      if (parts.length !== 3) return;

      const mm   = parseInt(parts[1], 10);
      const yyyy = parseInt(parts[2], 10);
      if (isNaN(mm) || isNaN(yyyy)) return;

      const monthKey = `${String(mm).padStart(2, '0')}-${yyyy}`;

      // Month-wise spend
      monthWiseSpend[monthKey] = (monthWiseSpend[monthKey] || 0) + exp.amount;

      // Month + category spend
      if (!monthWiseCategorySpend[monthKey]) monthWiseCategorySpend[monthKey] = {};
      if (exp.category) {
        monthWiseCategorySpend[monthKey][exp.category] =
          (monthWiseCategorySpend[monthKey][exp.category] || 0) + exp.amount;
      }

      // This-month total
      if (mm === currentMonth && yyyy === currentYear) {
        totalThisMonth += exp.amount;
      }
    });

    res.json({
      totalThisMonth,
      spendByCategory: categoryTotals,
      spendByCard: cardTotals,
      monthWiseSpend,
      monthWiseCategorySpend,
      recentTransactions,
      totalExpenses: allExpenses.length
    });

  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
