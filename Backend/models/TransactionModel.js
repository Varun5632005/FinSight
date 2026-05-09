import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  id: { type: String, required: true } // Preserving your frontend's string UUIDs
}, { timestamps: true });

export const TransactionModel = mongoose.model('Transaction', transactionSchema);
