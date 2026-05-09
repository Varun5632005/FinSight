import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockTransactions } from '../data/mockData';

const DashboardContext = createContext();

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }) => {
  // Try to load from local storage
  const STORAGE_VERSION = '2.0';

  const [transactions, setTransactions] = useState([]);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);



  const [role, setRole] = useState('Viewer'); // 'Viewer' or 'Admin'
  const [notifications, setNotifications] = useState([]);
  const [budgetAlert, setBudgetAlert] = useState(null); // { percent, amount, remaining }

  const addNotification = (message, type = 'info') => {
    const newNotif = {
      id: Date.now(),
      message,
      type,
      read: false,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAsRead = (id) => {
    if (id === 'all') {
      setNotifications(prev => prev.map(n => ({...n, read: true})));
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
    }
  };
  
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('finance-dashboard-theme');
    return saved || 'light';
  });

  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('finance-dashboard-currency') || 'INR';
  });

  const [privacyMode, setPrivacyMode] = useState(() => {
    return localStorage.getItem('finance-dashboard-privacy') === 'true';
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('finsight_auth');
    if (saved) {
       try { 
         return JSON.parse(saved);
       } catch (e) { }
    }
    return null;
  });

  // Fetch transactions from MongoDB on load
  useEffect(() => {
    // Clear transactions and notifications when a new user logs in to prevent data bleed
    setTransactions([]);
    setTransactionsLoaded(false);
    setNotifications([]);
    setBudgetAlert(null);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/transactions`, {
          credentials: 'include', // Sends the secure JWT cookie
          cache: 'no-store' // Prevents browser from caching previous user's data
        });
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
          setTransactionsLoaded(true);
        }
      } catch (err) {
        console.error('Failed to fetch transactions from MongoDB', err);
      }
    };
    
    // Only fetch if we have a valid logged-in user
    if (user && user.email) {
      fetchTransactions();
    }
  }, [user]);
  
  const [initialBalance, setInitialBalance] = useState(() => {
    const saved = localStorage.getItem('finance-dashboard-initial-balance');
    return saved ? Number(saved) : 0;
  });

  const [monthlyGoal, setMonthlyGoal] = useState(() => {
    const saved = localStorage.getItem('monthly-spending-goal');
    return saved ? Number(saved) : 15000; // Default goal
  });

  // Global Currency Formatter
  const formatCurrency = (val) => {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(val);
  };

  const exportTransactions = (format = 'json') => {
    if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "transactions.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      addNotification('Transactions exported as JSON successfully', 'success');
    } else if (format === 'csv') {
      const headers = ["ID,Description,Amount,Date,Category,Type"];
      const csvRows = transactions.map(tx => {
        const desc = tx.description ? tx.description.replace(/"/g, '""') : '';
        return `"${tx.id}","${desc}",${tx.amount},"${tx.date}","${tx.category}","${tx.type}"`;
      });
      const csvStr = "data:text/csv;charset=utf-8," + encodeURIComponent(headers.concat(csvRows).join('\n'));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", csvStr);
      downloadAnchorNode.setAttribute("download", "transactions.csv");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      addNotification('Transactions exported as CSV successfully', 'success');
    }
  };

  // No longer persist transactions to local storage, they are in MongoDB now!

  // Persist theme
  useEffect(() => {
    localStorage.setItem('finance-dashboard-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist currency and user
  useEffect(() => {
    localStorage.setItem('finance-dashboard-currency', currency);
  }, [currency]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('finsight_auth', JSON.stringify(user));
    } else {
      localStorage.removeItem('finsight_auth');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('finance-dashboard-privacy', String(privacyMode));
  }, [privacyMode]);

  useEffect(() => {
    localStorage.setItem('finance-dashboard-initial-balance', String(initialBalance));
  }, [initialBalance]);

  useEffect(() => {
    localStorage.setItem('monthly-spending-goal', String(monthlyGoal));
  }, [monthlyGoal]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const checkRecordHeight = (transaction) => {
    const matchingTrans = transactions.filter(t => t.type === transaction.type && t.id !== transaction.id);
    const highest = matchingTrans.length > 0 ? Math.max(...matchingTrans.map(t => Number(t.amount))) : 0;
    
    if (Number(transaction.amount) > highest && highest > 0) {
      addNotification(`New record! Highest ${transaction.type === 'income' ? 'Income' : 'Expense'} recorded: ${formatCurrency(transaction.amount)}`, transaction.type === 'income' ? 'success' : 'danger');
    }
  };

  const addTransaction = (transaction) => {
    if (role !== 'Admin') return;
    const cleanTx = { ...transaction, amount: Math.abs(Number(transaction.amount)) };
    checkRecordHeight(cleanTx);
    
    // Monthly Goal Notification logic
    if (cleanTx.type === 'expense') {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyTotal = transactions
        .filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
        })
        .reduce((sum, t) => sum + Number(t.amount), 0) + cleanTx.amount;
        
      if (monthlyGoal > 0) {
        const percentFilled = Math.floor((monthlyTotal / monthlyGoal) * 100);
        const remaining = monthlyGoal - monthlyTotal;
        
        if (monthlyTotal > monthlyGoal) {
          addNotification(`Warning! You have exceeded your monthly goal by ${formatCurrency(monthlyTotal - monthlyGoal)}!`, 'danger');
          setBudgetAlert({ percent: percentFilled, amount: cleanTx.amount, remaining: 0, exceeded: true });
        } else {
          addNotification(`Transaction added! You have used ${percentFilled}% of your monthly ${formatCurrency(monthlyGoal)} budget. (${formatCurrency(remaining)} left)`, percentFilled > 80 ? 'warning' : 'success');
          setBudgetAlert({ percent: percentFilled, amount: cleanTx.amount, remaining, exceeded: false });
        }
        
        // Auto-clear pop-up after 9 seconds
        setTimeout(() => setBudgetAlert(null), 9000);
      }
    }
    
    // Optimistic update
    setTransactions(prev => [cleanTx, ...prev]);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    // Save to MongoDB
    fetch(`${BACKEND_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(cleanTx)
    }).catch(err => {
      console.error('Failed to save to database', err);
      addNotification('Failed to save transaction to cloud', 'danger');
    });
  };

  const bulkAddTransactions = (newList) => {
    // Basic validation
    const valid = newList.filter(tx => tx.id && tx.amount && tx.type);
    if (valid.length === 0) return;
    
    setTransactions(prev => {
      // Create a map of existing IDs to avoid duplicates
      const existingIds = new Set(prev.map(tx => tx.id));
      const filteredNew = valid.filter(tx => !existingIds.has(tx.id));
      return [...filteredNew, ...prev];
    });
    
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    // Save bulk data to MongoDB
    fetch(`${BACKEND_URL}/api/transactions/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ transactions: valid })
    }).then(res => {
      if (res.ok) {
        addNotification(`Successfully synced ${valid.length} transactions to MongoDB!`, 'success');
      }
    }).catch(err => {
      console.error(err);
      addNotification('Bulk sync failed to connect to cloud', 'danger');
    });
  };

  const editTransaction = (id, updatedTx) => {
    if (role !== 'Admin') return;
    const cleanTx = { ...updatedTx, amount: Math.abs(Number(updatedTx.amount)) };
    checkRecordHeight({ id, ...cleanTx });
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...cleanTx } : tx));
  };

  const deleteTransaction = (id) => {
    if (role !== 'Admin') return;
    setTransactions(prev => prev.filter(tx => tx.id !== id));

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    // Delete from MongoDB
    fetch(`${BACKEND_URL}/api/transactions/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    }).catch(err => console.error('Failed to delete transaction', err));
  };

  return (
    <DashboardContext.Provider value={{
      transactions,
      role,
      setRole,
      theme,
      toggleTheme,
      currency,
      setCurrency,
      user,
      setUser,
      formatCurrency,
      addTransaction,
      editTransaction,
      bulkAddTransactions,
      deleteTransaction,
      notifications,
      addNotification,
      markAsRead,
      exportTransactions,
      initialBalance,
      setInitialBalance,
      privacyMode,
      setPrivacyMode,
      monthlyGoal,
      setMonthlyGoal,
      budgetAlert,
      setBudgetAlert
    }}>
      {children}
    </DashboardContext.Provider>
  );
};
