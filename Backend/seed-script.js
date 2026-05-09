import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { UserModel } from './models/UserModel.js';
import { TransactionModel } from './models/TransactionModel.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const demoEmail = 'test@finsight.com';
    const demoPassword = 'password123';
    
    let user = await UserModel.findOne({ email: demoEmail });
    if (!user) {
      const hashedPassword = await bcrypt.hash(demoPassword, 12);
      user = new UserModel({ name: 'Demo User', email: demoEmail, password: hashedPassword });
      await user.save();
      console.log('Demo user created');
    } else {
      console.log('Demo user already exists');
    }

    await TransactionModel.deleteMany({ user: user._id });
    console.log('Cleared old transactions');

    const categories = ['Investment', 'Entertainment', 'Health', 'Shopping', 'Utilities', 'Freelance', 'Transport', 'Food & Dining', 'Salary', 'Rent', 'Other'];
    
    const transactions = Array.from({ length: 60 }).map((_, i) => {
      const month = i < 20 ? '04' : (i < 40 ? '05' : '06');
      const day = String((i % 28) + 1).padStart(2, '0');
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const type = (cat === 'Salary' || cat === 'Freelance') ? 'income' : (Math.random() > 0.9 ? 'income' : 'expense');
      
      let amount = 0;
      if (cat === 'Salary') amount = 35000;
      else if (cat === 'Rent') amount = 8000;
      else amount = (Math.floor(Math.random() * 1200) + 100);

      return {
        user: user._id,
        id: `demo-${i}-${Date.now()}`,
        date: `2025-${month}-${day}`,
        amount,
        category: cat,
        description: 'Auto-generated demo transaction',
        type
      };
    });

    transactions.push(
      { user: user._id, id: 'd1', date: '2025-06-25', amount: 1250.00, category: 'Investment', description: 'TCS Quarterly Dividend', type: 'income' },
      { user: user._id, id: 'd2', date: '2025-06-10', amount: 4500.00, category: 'Freelance', description: 'Freelance Project', type: 'income' },
      { user: user._id, id: 'd3', date: '2025-06-01', amount: 35000.00, category: 'Salary', description: 'Monthly Salary', type: 'income' }
    );

    await TransactionModel.insertMany(transactions);
    console.log('Seeded 60+ transactions');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
