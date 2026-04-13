import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => {
  const { logout, user, updateProfile } = useAuth();
  const [showProfile, setShowProfile] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [phone, setPhone] = React.useState(user?.phone || '');
  const [newName, setNewName] = React.useState(user?.name || '');
  const [newEmail, setNewEmail] = React.useState(user?.email || '');
  const [isNewSignup, setIsNewSignup] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState({});
  const profileRef = React.useRef(null);

  React.useEffect(() => {
    if (user?.phone) setPhone(user.phone);
    if (user?.name) setNewName(user.name);
    if (user?.email) setNewEmail(user.email);

    const isNew = localStorage.getItem('is_new_signup');
    if (isNew === 'true') {
      setIsNewSignup(true);
      setShowProfile(true);
      setIsEditing(true);
      localStorage.removeItem('is_new_signup');
    }
  }, [user]);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
        setIsEditing(false);
      }
    };
    if (showProfile) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfile]);

  // Close on ESC key
  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowProfile(false);
        setIsEditing(false);
        setIsNewSignup(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const handleUpdate = async () => {
    const errors = {};
    const sanitizedPhone = phone.replace(/\s+/g, '');

    // 1. Name Validation
    if (newName.trim().split(' ').length < 2) {
      errors.name = "Full name required (First and Last)";
    }

    // 2. Phone Validation (+[Code][10 digits])
    if (!/^\+\d{1,4}\d{10}$/.test(sanitizedPhone)) {
      errors.phone = "Format: +[Code][Exactly 10 digits] (e.g. +919876543210)";
    }

    // 3. Email Validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      errors.email = "Enter a valid email address";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setFieldErrors({});
      await updateProfile({
        name: newName.trim(),
        phone: sanitizedPhone,
        email: newEmail.trim()
      });
      setIsEditing(false);
      setIsNewSignup(false);
      setShowProfile(false);
    } catch (err) {
      setFieldErrors({ form: err.response?.data?.message || 'Update failed' });
    }
  };

  const [activeTab, setActiveTab] = React.useState('chat');

  React.useEffect(() => {
    const handleSwitch = (e) => setActiveTab(e.detail);
    window.addEventListener('switchTab', handleSwitch);
    return () => window.removeEventListener('switchTab', handleSwitch);
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">
            💰 FINTRACK.AI
          </div>
        </div>

        <nav className="nav-menu">
          <div className={`nav-link ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <span className="icon">◈</span> AI_ASSISTANT
          </div>
          <div className={`nav-link ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <span className="icon">▤</span> LEDGER_HISTORY
          </div>
          <div className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <span className="icon">📊</span> DATA_INSIGHTS
          </div>
          <div className={`nav-link ${activeTab === 'faq' ? 'active' : ''}`} onClick={() => setActiveTab('faq')}>
            <span className="icon">?</span> HELP_FAQ
          </div>
        </nav>

        <div style={{ padding: '2rem', marginTop: 'auto', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>PRECISION_NODE_V2.0</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-view">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div className="user-profile" onClick={() => setShowProfile(!showProfile)}>
              <div className="user-name">{user?.name || 'SYNCING...'}</div>
              <div className="avatar-circle">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            </div>
            <button onClick={logout} style={{
              background: 'transparent',
              border: '1px solid var(--glass-border)',
              color: 'var(--error)',
              padding: '0.5rem 1.25rem',
              fontSize: '0.75rem',
              fontWeight: '800',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Logout
            </button>
          </div>

          {showProfile && (
            <div className={isNewSignup ? "profile-modal-overlay" : ""}>
              <div className={isNewSignup ? "profile-modal-content" : "profile-dropdown"} style={{
                position: isNewSignup ? 'relative' : 'absolute',
                top: isNewSignup ? '0' : '80px',
                right: isNewSignup ? '0' : '3rem',
                zIndex: 1000,
                background: 'var(--bg-elevated)',
                padding: '2.5rem',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                width: isNewSignup ? '450px' : '320px',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <div className="dropdown-header" style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '800', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                  {isNewSignup ? "Profile Setup" : "Profile Details"}
                </div>

                {isNewSignup && (
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    Please complete your profile details below.
                  </p>
                )}

                <div className="detail-item" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.5rem' }}>Full Name</label>
                  {isEditing ? (
                    <input
                      style={{ background: 'var(--bg-active)', border: `1px solid ${fieldErrors.name ? 'var(--error)' : 'var(--glass-border)'}`, color: '#fff', padding: '0.75rem', width: '100%', borderRadius: '4px' }}
                      value={newName}
                      onChange={(e) => { setNewName(e.target.value); if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null })); }}
                    />
                  ) : <div style={{ fontSize: '0.9rem', color: '#fff' }}>{user?.name}</div>}
                  {fieldErrors.name && <div style={{ color: 'var(--error)', fontSize: '0.7rem', marginTop: '0.25rem' }}>{fieldErrors.name}</div>}
                </div>

                <div className="detail-item" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.5rem' }}>Email Address</label>
                  {isEditing ? (
                    <input
                      style={{ background: 'var(--bg-active)', border: `1px solid ${fieldErrors.email ? 'var(--error)' : 'var(--glass-border)'}`, color: '#fff', padding: '0.75rem', width: '100%', borderRadius: '4px' }}
                      value={newEmail}
                      onChange={(e) => { setNewEmail(e.target.value); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null })); }}
                    />
                  ) : <div style={{ fontSize: '0.9rem', color: '#fff' }}>{user?.email}</div>}
                  {fieldErrors.email && <div style={{ color: 'var(--error)', fontSize: '0.7rem', marginTop: '0.25rem' }}>{fieldErrors.email}</div>}
                </div>

                <div className="detail-item" style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.5rem' }}>Phone Number</label>
                  {isEditing ? (
                    <input
                      style={{ background: 'var(--bg-active)', border: `1px solid ${fieldErrors.phone ? 'var(--error)' : 'var(--glass-border)'}`, color: '#fff', padding: '0.75rem', width: '100%', borderRadius: '4px' }}
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: null })); }}
                      placeholder="+919876543210"
                    />
                  ) : <div style={{ fontSize: '0.9rem', color: '#fff' }}>{user?.phone || 'Not provided'}</div>}
                  {fieldErrors.phone && <div style={{ color: 'var(--error)', fontSize: '0.7rem', marginTop: '0.25rem' }}>{fieldErrors.phone}</div>}
                </div>

                <div className="dropdown-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {isEditing ? (
                    <button onClick={handleUpdate} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '1rem', fontWeight: '800', cursor: 'pointer', borderRadius: '4px' }}>Save Changes</button>
                  ) : (
                    <button onClick={() => setIsEditing(true)} style={{ background: 'var(--bg-active)', color: '#fff', border: '1px solid var(--glass-border)', padding: '0.85rem', fontWeight: '700', cursor: 'pointer', borderRadius: '4px' }}>Edit Profile</button>
                  )}
                  {!isNewSignup && (
                    <button onClick={logout} style={{ background: 'transparent', color: 'var(--error)', border: 'none', padding: '0.5rem', fontWeight: '800', cursor: 'pointer' }}>Logout</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </header>

        <section className="main-viewport" style={{ padding: '0 3rem' }}>
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { activeTab });
            }
            return child;
          })}
        </section>

        <footer className="footer-status">
          <div className="status-indicator">
            <span className="dot"></span>
            SYSTEM ONLINE_NODE v2.0.4
          </div>
          <div>© 2026 PRECISION LEDGER SYSTEM • ALL QUANTUM ENCRYPTED</div>
          <div>SESSION: {user?.id?.slice(0, 8).toUpperCase() || 'VOID'}</div>
        </footer>
      </main>
    </div>
  );
};

import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "PASTE_YOUR_GOOGLE_CLIENT_ID_HERE";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

