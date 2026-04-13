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

    // --- 8. Handle No Data Case ---
    if (allExpenses.length === 0) {
      return res.json({
        totalThisMonth: 0,
        spendByCategory: {},
        spendByCard: {},
        monthWiseSpend: {},
        monthWiseCategorySpend: {},
        recentTransactions: [],
        totalExpenses: 0,
        averageExpense: 0,
        topCategory: null,
        topCard: null,
        highestExpense: null,
        lowestExpense: null,
        growth: 0,
        message: "No expenses found."
      });
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear  = new Date().getFullYear();

    let totalThisMonth = 0;
    let thisMonthCount = 0;
    let highestExpense = null;
    let maxAmount = 0;
    let lowestExpense = null;
    let minAmount = Infinity;

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
        // --- 2. Track count for Average Expense ---
        thisMonthCount++;
      }
      
      // --- 3 & 4. Track Highest and Lowest expense ---
      if (exp.amount > maxAmount) { maxAmount = exp.amount; highestExpense = exp; }
      if (exp.amount < minAmount) { minAmount = exp.amount; lowestExpense = exp; }
    });

    // --- 1. Top Spending Category ---
    let topCategory = null;
    let maxCatTotal = 0;
    Object.entries(categoryTotals).forEach(([cat, val]) => {
      if (val > maxCatTotal) { maxCatTotal = val; topCategory = cat; }
    });

    // --- 5. Most Used Payment Method ---
    let topCard = null;
    let maxCardTotal = 0;
    Object.entries(cardTotals).forEach(([card, val]) => {
      if (val > maxCardTotal) { maxCardTotal = val; topCard = card; }
    });

    // --- 2. Average Expense ---
    const averageExpense = thisMonthCount > 0 ? (totalThisMonth / thisMonthCount) : 0;

    // --- 6. Monthly Growth % ---
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const lastMonthKey = `${String(prevMonth).padStart(2, '0')}-${prevYear}`;
    const totalLastMonth = monthWiseSpend[lastMonthKey] || 0;
    let growth = 0;
    if (totalLastMonth === 0) {
        growth = totalThisMonth > 0 ? 100 : 0;
    } else {
        growth = ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100;
    }

    // --- 7. Sort Month-wise Data ---
    const sortedMonthWiseSpend = {};
    Object.keys(monthWiseSpend)
      .sort((a, b) => {
        const [ma, ya] = a.split('-').map(Number);
        const [mb, yb] = b.split('-').map(Number);
        return ya !== yb ? ya - yb : ma - mb;
      })
      .forEach(key => { sortedMonthWiseSpend[key] = monthWiseSpend[key]; });

    // --- Extended Response Output ---
    res.json({
      totalThisMonth,
      spendByCategory: categoryTotals,
      spendByCard: cardTotals,
      monthWiseSpend: sortedMonthWiseSpend,
      monthWiseCategorySpend,
      recentTransactions,
      totalExpenses: allExpenses.length,
      averageExpense,
      topCategory,
      topCard,
      highestExpense,
      lowestExpense,
      growth: parseFloat(growth.toFixed(2))
    });

  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
