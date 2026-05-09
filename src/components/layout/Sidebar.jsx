import React from 'react';
import { motion } from 'framer-motion';
import { useDashboard } from '../../context/DashboardContext';
import { LayoutDashboard, Receipt, Settings, PieChart, Menu, X, DollarSign } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, mobileOpen, setMobileOpen, handleLogout }) => {
  const { role, setRole, user } = useDashboard();
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'insights', label: 'Insights', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <div className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ padding: '2.5rem 1.5rem', marginBottom: '1.5rem' }}>
          <div className="avatar logo-avatar" style={{
            width: 38, 
            height: 38, 
            background: '#ffffff',
            border: '2.5px solid #000000',
            color: '#000000',
            borderRadius: '50%',
            marginRight: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            fontWeight: 'bold'
          }}>
            <DollarSign size={20} strokeWidth={3} />
          </div>
          <span style={{ 
            fontSize: '1.4rem', 
            fontWeight: 900, 
            color: 'var(--sidebar-active-text)',
            letterSpacing: '-0.5px',
            textTransform: 'none',
            fontFamily: 'serif'
          }}>FinSight</span>
          <button 
            className="mobile-toggle icon-btn" 
            style={{marginLeft: 'auto', opacity: 0.4}}
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <motion.div 
                key={item.id}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </motion.div>
            );
          })}
        </div>
        
        <div style={{ marginTop: 'auto', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>Access Mode</p>
             <div style={{ display: 'flex', background: 'var(--bg-color)', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => setRole('Viewer')}
                  style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', background: role === 'Viewer' ? 'var(--primary)' : 'transparent', color: role === 'Viewer' ? 'white' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                >Viewer</button>
                <button 
                  onClick={() => setRole('Admin')}
                  style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', background: role === 'Admin' ? 'var(--primary)' : 'transparent', color: role === 'Admin' ? 'white' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                >Admin</button>
             </div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, opacity: 0.6 }}>
            &copy; 2026 FinSight Hub
          </div>
          <button 
            onClick={handleLogout}
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', border: 'none', borderRadius: '8px', background: 'var(--danger-bg)', color: 'var(--danger-text)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
