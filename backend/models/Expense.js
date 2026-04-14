const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  shortId: {
    type: String,
    unique: true,
    default: () => Math.random().toString(36).substring(2, 8).toUpperCase()
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    validate: {
      validator: function(v) {
        // Needs at least two words
        return /^[a-zA-ZÀ-ÿ\s'-]+ [a-zA-ZÀ-ÿ\s'-]+$/.test(v.trim());
      },
      message: props => `${props.value} is not a valid full name. Both first and last names are required.`
    }
  },
  cardType: {
    type: String,
    required: [true, 'Card type is required'],
    enum: {
      values: ['Debit Card', 'Credit Card', 'UPI', 'Cash'],
      message: '{VALUE} is not a valid card type. Must be Debit Card, Credit Card, UPI or Cash.'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Transport', 'Shopping', 'Food', 'Miscellaneous'],
      message: '{VALUE} is not a valid category. Must be Transport, Shopping, Food, or Miscellaneous.'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
    validate: {
      validator: function(v) {
        // Must follow DD-MM-YYYY format exactly
        return /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-\d{4}$/.test(v);
      },
      message: props => `${props.value} is not a valid date. Format must be DD-MM-YYYY.`
    }
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    validate: {
      validator: function(v) {
        // Country code (+...) followed by exactly 10 digits. Allows spaces after country code or straightforward format.
        // e.g. +1 1234567890 or +441234567890
        return /^\+\d{1,4}\s?\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid contact number. Must be country code followed by exactly 10 digits.`
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address.`
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
