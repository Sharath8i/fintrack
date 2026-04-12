const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/authMiddleware');

// @route   POST /api/expenses
// @desc    Create a new expense
router.post('/', auth, async (req, res) => {
  try {
    const newExpense = new Expense({ ...req.body, userId: req.userId });
    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ error: 'Validation Error', messages });
    }
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/expenses
// @desc    Get expenses (private to user)
router.get('/', auth, async (req, res) => {
  try {
    // Users only see their own data
    const expenses = await Expense.find({ userId: req.userId }).sort({ date: -1 });

    if (expenses.length === 0) {
        return res.json([]); // Return empty array instead of 404 for better UX
    }

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Modify Expense Date (private)
router.put('/:id', auth, async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'Date is required for update' });
    }
    
    // Validate format
    if (!/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-\d{4}$/.test(date)) {
        return res.status(400).json({ error: 'Date must follow DD-MM-YYYY format exactly' });
    }

    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId }, // Security: must match user
      { date },
      { new: true, runValidators: true }
    );

    if (!updatedExpense) { return res.status(404).json({ error: 'Expense not found' }); }
    res.json(updatedExpense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete Expense (private)
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedExpense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deletedExpense) { return res.status(404).json({ error: 'Expense not found' }); }
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

