import express from 'express';
import bcrypt from 'bcryptjs';
const { hash, compare } = bcrypt;
import { UserModel } from '../models/UserModel.js';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middlewares/verifyToken.js';
import { TransactionModel } from '../models/TransactionModel.js';

export const userRoute = express.Router();

userRoute.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await UserModel.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await hash(password, 12);
    user = new UserModel({ name, email, password: hashedPassword });
    await user.save();
    
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

userRoute.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });

    const userObj = user.toObject();
    delete userObj.password;
    
    res.status(200).json({ message: 'Login successful', user: userObj });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

userRoute.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none' });
  res.status(200).json({ message: 'Logout successful' });
});

userRoute.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select('-password');
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seed Demo Account Route
userRoute.get('/seed-demo', async (req, res) => {
  try {
    const demoEmail = 'test@finsight.com';
    const demoPassword = 'password123';
    
    // Check if demo user already exists
    let user = await UserModel.findOne({ email: demoEmail });
    if (!user) {
      const hashedPassword = await hash(demoPassword, 12);
      user = new UserModel({ name: 'Demo User', email: demoEmail, password: hashedPassword });
      await user.save();
    }

    // Delete existing transactions for this user so we can cleanly recreate them
    await TransactionModel.deleteMany({ user: user._id });

    // Generate mock data exactly like the beautiful frontend UI
    const categories = ['Investment', 'Entertainment', 'Health', 'Shopping', 'Utilities', 'Freelance', 'Transport', 'Food & Dining', 'Salary', 'Rent', 'Other'];
    
    const transactions = Array.from({ length: 60 }).map((_, i) => {
      const month = i < 20 ? '04' : (i < 40 ? '05' : '06');
      const day = String((i % 28) + 1).padStart(2, '0');
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const descriptions = {
        'Investment': ['SIP Payment', 'Stock Buy', 'HDFC Dividend', 'NMDC Dividend', 'Reliance Dividend', 'Gold Purchase'],
        'Entertainment': ['Movie Tickets', 'OTT Subscription', 'Gaming Console', 'Concert'],
        'Health': ['Pharmacy', 'Doctor Consultation', 'Multivitamins', 'Dentist'],
        'Shopping': ['Amazon Purchase', 'Clothing Store', 'Gadget Upgrade', 'Footwear'],
        'Utilities': ['Phone Bill', 'Internet Bill', 'Gas Connection', 'Maintenance'],
        'Freelance': ['UI Design Project', 'Bug Fix Payment', 'Consulting Fee', 'SEO Project'],
        'Transport': ['Uber Ride', 'Petrol Refill', 'Train Tickets', 'Parking Fee'],
        'Food & Dining': ['Pizza Night', 'Starbucks Coffee', 'Lunch with Friend', 'Fine Dining'],
        'Salary': ['Performance Bonus', 'Monthly Salary', 'Reimbursement'],
        'Rent': ['Monthly Rent', 'Security Deposit'],
        'Other': ['Misc Purchase', 'Cash Withdrawal', 'Gift']
      };
      const possibleDescs = descriptions[cat] || ['Monthly Transaction'];
      const desc = possibleDescs[Math.floor(Math.random() * possibleDescs.length)];
      const type = (cat === 'Salary' || cat === 'Freelance' || desc.includes('Dividend')) ? 'income' : (Math.random() > 0.9 ? 'income' : 'expense');
      
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
        description: desc,
        type
      };
    });

    // Add fixed core transactions to anchor the visual charts
    transactions.push(
      { user: user._id, id: 'd1', date: '2025-06-25', amount: 1250.00, category: 'Investment', description: 'TCS Quarterly Dividend', type: 'income' },
      { user: user._id, id: 'd2', date: '2025-06-10', amount: 4500.00, category: 'Freelance', description: 'Freelance Project', type: 'income' },
      { user: user._id, id: 'd3', date: '2025-06-01', amount: 35000.00, category: 'Salary', description: 'Monthly Salary', type: 'income' }
    );

    await TransactionModel.insertMany(transactions);

    res.status(200).send(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
        <h1 style="color: #10b981;">✅ Demo Account Created Successfully!</h1>
        <p style="font-size: 1.2rem;">Your MongoDB database has been successfully seeded with rich mock data.</p>
        <div style="background: #f3f4f6; display: inline-block; padding: 20px; border-radius: 10px; margin-top: 20px; text-align: left;">
          <p><strong>Email:</strong> test@finsight.com</p>
          <p><strong>Password:</strong> password123</p>
        </div>
        <p style="margin-top: 30px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #3b82f6; text-decoration: none; font-weight: bold;">Go back to FinSight to Login</a></p>
      </div>
    `);
  } catch (err) {
    res.status(500).send(`<h1>Error:</h1><p>${err.message}</p>`);
  }
});
