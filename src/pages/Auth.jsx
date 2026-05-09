import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import './Auth.css';

const Auth = ({ setAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/users/login' : '/api/users/register';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : { name: formData.name, email: formData.email, password: formData.password };

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (res.ok) {
        if (isLogin) {
          setAuth(true, data.user);
        } else {
          setIsLogin(true); // Switch to login after successful register
          setFormData({ ...formData, password: '' });
          alert('Registration successful! Please login.');
        }
      } else {
        setError(data.message || 'An error occurred.');
      }
    } catch (err) {
      // For demo purposes, let's allow bypass if backend is not running yet
      console.error(err);
      if (err.message.includes('Failed to fetch')) {
        console.warn('Backend not running, bypassing auth for demonstration');
        setAuth(true, { name: formData.name || 'Demo User', email: formData.email });
      } else {
        setError('Failed to connect to the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <motion.div 
        className="auth-card card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Login to access your FinSight dashboard' : 'Join FinSight to organize your Financial Life'}</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-error">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                key="name-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="input-group"
              >
                <label>Full Name</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input 
                    type="text" 
                    name="name" 
                    placeholder="Enter your full name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required={!isLogin}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                name="email" 
                placeholder="Enter your email" 
                value={formData.email} 
                onChange={handleChange} 
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                name="password" 
                placeholder="Enter your password" 
                value={formData.password} 
                onChange={handleChange} 
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Processing...' : (
              <>
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                {isLogin ? 'Login' : 'Register'}
              </>
            )}
          </button>
        </form>

        {isLogin && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: 'var(--bg-color)', 
              borderRadius: '8px', 
              textAlign: 'center', 
              border: '1px dashed var(--primary)',
              opacity: 0.9
            }}
          >
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Explore the Demo</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}><strong>Email:</strong> test@finsight.com</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}><strong>Password:</strong> password123</p>
            </div>
            <button 
              type="button" 
              style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                padding: '0.4rem 1rem', 
                borderRadius: '6px', 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(59, 130, 246, 0.3)'
              }}
              onClick={() => setFormData({ ...formData, email: 'test@finsight.com', password: 'password123' })}
            >
              Auto-Fill Demo Credentials
            </button>
          </motion.div>
        )}

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button className="text-btn" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
