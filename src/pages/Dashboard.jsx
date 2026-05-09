import React, { useMemo, useEffect, useState } from 'react';
import { motion, useSpring, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../context/DashboardContext';
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  CreditCard, Sparkles, Edit2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const AnimatedCounter = ({ value, formatter }) => {
  const [displayValue, setDisplayValue] = useState(formatter(0));
  const springValue = useSpring(0, { stiffness: 50, damping: 15 });

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    return springValue.on('change', (latest) => {
      setDisplayValue(formatter(latest));
    });
  }, [springValue, formatter]);

  return <>{displayValue}</>;
};

const DashboardOverview = () => {
  const { transactions, formatCurrency, initialBalance, user, privacyMode } = useDashboard();

  // Aggregate stats
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    const now = new Date();
    const currMonth = now.getMonth();
    const currYear = now.getFullYear();
    let monthlySpending = 0;

    transactions.forEach(tx => {
      const amount = Number(tx.amount);
      if (tx.type === 'income') {
        income += amount;
        incomeCount++;
      }
      if (tx.type === 'expense') {
        expense += amount;
        expenseCount++;
        
        const txDate = new Date(tx.date);
        if (txDate.getMonth() === currMonth && txDate.getFullYear() === currYear) {
          monthlySpending += amount;
        }
      }
    });

    return {
      balance: initialBalance + income - expense,
      income,
      expense,
      incomeCount,
      expenseCount,
      savingsPercent: income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0,
      monthlySpending
    };
  }, [transactions, initialBalance]);

  // Aggregate spending by category for Pie Chart
  const expenseByCategory = useMemo(() => {
    const expenses = transactions.filter(tx => tx.type === 'expense');
    const grouped = expenses.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + Number(tx.amount);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Transform transactions to chart data with Predictive Forecasting
  const chartData = useMemo(() => {
    if (!transactions.length) return [];
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = initialBalance;
    const dataMap = {};

    sorted.forEach(tx => {
      const date = tx.date.substring(5);
      const amount = Number(tx.amount);
      if (tx.type === 'income') runningBalance += amount;
      else runningBalance -= amount;

      dataMap[date] = { date, balance: runningBalance };
    });

    const actualData = Object.values(dataMap);
    
    // Predictive Forecast Calculation (3 months)
    const firstDate = new Date(sorted[0].date);
    const lastDate = new Date(sorted[sorted.length-1].date);
    const daysDiff = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));
    
    const dailyNet = (stats.income - stats.expense) / daysDiff;
    
    let projBalance = runningBalance;
    const forecastPoints = [];
    const bridgePoint = { ...actualData[actualData.length-1], forecast: runningBalance };
    
    for (let i = 1; i <= 3; i++) {
       const futureDate = new Date(lastDate);
       futureDate.setDate(futureDate.getDate() + (i * 30));
       projBalance += (dailyNet * 30);
       forecastPoints.push({
         date: futureDate.toISOString().substring(5, 10),
         forecast: projBalance
       });
    }

    return [...actualData, bridgePoint, ...forecastPoints];
  }, [transactions, initialBalance, stats]);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.25rem' }}>Overview</h1>
        <p style={{ color: 'var(--text-muted)' }}>Morning, {user.name.split(' ')[0]}! Here's what's happening with your money.</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        initial="hidden"
        animate="show"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '1.25rem'
        }}
      >

        {/* TOTAL INCOME */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="card"
          style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '0.75rem', position: 'relative' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Income
            </span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={14} />
            </div>
          </div>
          <div>
            <h2 className={privacyMode ? 'privacy-blur' : ''} style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <AnimatedCounter value={stats.income} formatter={formatCurrency} />
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {stats.incomeCount} transactions
            </p>
          </div>
        </motion.div>

        {/* TOTAL EXPENSES */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="card"
          style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '0.75rem', position: 'relative' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Expenses
            </span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={14} />
            </div>
          </div>
          <div>
            <h2 className={privacyMode ? 'privacy-blur' : ''} style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <AnimatedCounter value={stats.expense} formatter={formatCurrency} />
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {stats.expenseCount} transactions
            </p>
          </div>
        </motion.div>

        {/* NET SAVINGS */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="card"
          style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '0.75rem', position: 'relative' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Net Savings
            </span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={14} />
            </div>
          </div>
          <div>
            <h2 className={privacyMode ? 'privacy-blur' : ''} style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <AnimatedCounter value={Math.max(0, stats.balance)} formatter={formatCurrency} />
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {stats.savingsPercent}% of income
            </p>
          </div>
        </motion.div>

        {/* Gamified Goal Card */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0, 209, 255, 0.3)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="card"
          style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', opacity: 0.1, filter: 'blur(30px)', transform: 'translate(30%, -30%)' }}></div>
          
          <div style={{ position: 'relative', width: '60px', height: '60px' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border-color)" strokeWidth="3" />
              <motion.path 
                initial={{ strokeDasharray: '0, 100' }}
                animate={{ strokeDasharray: `${Math.min(100, Math.max(0, (stats.balance / 150000) * 100))}, 100` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" 
              />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)' }}>
               {Math.max(0, Math.min(100, Math.round((stats.balance / 45000) * 100)))}%
            </div>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Goal</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.1rem' }}>Sony XM5 Headphones</h3>
            <p className={privacyMode ? 'privacy-blur' : ''} style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {formatCurrency(Math.max(0, stats.balance))} / {formatCurrency(45000)}
            </p>
          </div>
        </motion.div>

      </motion.div>



      {/* Charts Section */}
      {transactions.length > 0 ? (
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
          }}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '1.5rem' }}
        >
          <motion.div
            variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
            whileHover={{ scale: 1.01, boxShadow: 'var(--shadow-xl)' }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
            className="card"
            style={{ minHeight: '350px', height: 'auto', display: 'flex', flexDirection: 'column' }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Balance Trend</h3>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} formatter={(val) => formatCurrency(val)} />
                  <Area type="monotone" dataKey="balance" name="Actual Balance" stroke="var(--primary)" fillOpacity={1} fill="url(#colorBalance)" connectNulls />
                  <Area type="monotone" dataKey="forecast" name="AI Forecast" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="6 6" fillOpacity={0} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
            whileHover={{ scale: 1.01, boxShadow: 'var(--shadow-xl)' }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
            className="card"
            style={{ minHeight: '450px', height: 'auto', display: 'flex', flexDirection: 'column' }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Spending Breakdown</h3>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={3} dataKey="value" stroke="none">
                    {expenseByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ paddingTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>No Transactions Yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Your dashboard is currently empty. Add your first transaction to unlock AI insights, charts, and trends!</p>
        </div>
      )}

    </div>
  );
};

export default DashboardOverview;
