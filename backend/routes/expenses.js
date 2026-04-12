const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// @route   POST /api/expenses
// @desc    Create a new expense
router.post('/', async (req, res) => {
  try {
    const newExpense = new Expense(req.body);
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
// @desc    Get expenses (optionally filter by mobile number)
router.get('/', async (req, res) => {
  try {
    const { contactNumber } = req.query;
    let matchQuery = {};

    if (contactNumber) {
      let searchNum = contactNumber.trim();
      if (!searchNum.startsWith('+')) searchNum = '+' + searchNum.replace(/\s+/g, '');
      
      const digitsOnly = contactNumber.replace(/\D/g, '').slice(-10);
      if(digitsOnly.length !== 10) {
          return res.status(400).json({ error: 'Invalid contact number format' });
      }
      matchQuery.contactNumber = { $regex: new RegExp(digitsOnly + '$') };
    }

    const expenses = await Expense.find(matchQuery).sort({ createdAt: -1 });

    if (expenses.length === 0) {
        return res.status(404).json({ error: 'No expenses found.' });
    }

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Modify Expense Date (as per rubric: offer Change Date (PUT))
router.put('/:id', async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'Date is required for update' });
    }
    
    // Validate format
    if (!/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-\d{4}$/.test(date)) {
        return res.status(400).json({ error: 'Date must follow DD-MM-YYYY format exactly' });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
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
// @desc    Delete Expense
router.delete('/:id', async (req, res) => {
  try {
    const deletedExpense = await Expense.findByIdAndDelete(req.params.id);
    if (!deletedExpense) { return res.status(404).json({ error: 'Expense not found' }); }
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
