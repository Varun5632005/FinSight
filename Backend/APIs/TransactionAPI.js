import express from 'express';
import { TransactionModel } from '../models/TransactionModel.js';
import { verifyToken } from '../middlewares/verifyToken.js';

export const transactionRoute = express.Router();

// Get all transactions for the logged-in user
transactionRoute.get('/', verifyToken, async (req, res) => {
  try {
    const transactions = await TransactionModel.find({ user: req.user.id }).sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a single transaction
transactionRoute.post('/', verifyToken, async (req, res) => {
  try {
    const newTransaction = new TransactionModel({
      ...req.body,
      user: req.user.id
    });
    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Bulk add transactions (perfect for your JSON upload)
transactionRoute.post('/bulk', verifyToken, async (req, res) => {
  try {
    const { transactions } = req.body;
    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }
    
    // Add the current user's ID to all transactions and prepare bulk operations
    const bulkOps = transactions.map(tx => ({
      updateOne: {
        filter: { id: tx.id, user: req.user.id }, // Match by original ID so we don't duplicate
        update: { $set: { ...tx, user: req.user.id } },
        upsert: true // Insert if it doesn't exist, update if it does
      }
    }));

    await TransactionModel.bulkWrite(bulkOps);
    res.status(201).json({ message: `Successfully synced ${transactions.length} transactions to MongoDB` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a transaction
transactionRoute.delete('/:id', verifyToken, async (req, res) => {
  try {
    await TransactionModel.findOneAndDelete({ id: req.params.id, user: req.user.id });
    res.status(200).json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
