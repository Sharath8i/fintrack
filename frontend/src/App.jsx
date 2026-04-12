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

    // 1. Name Validation
    const nameParts = newName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      errors.name = "First and Last name required";
    }

    // 2. Phone Validation
    if (!/^\+\d{1,4}\s?\d{10}$/.test(phone.trim())) {
      errors.phone = "Use format: +[Code][10 digits]";
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
        phone: phone.trim(),
        email: newEmail.trim()
      });
      setIsEditing(false);
      setIsNewSignup(false);
      setShowProfile(false);
    } catch (err) {
      setFieldErrors({ form: err.response?.data?.message || 'Update failed' });
    }
  };

  return (
    <div className="layout-root">
      <nav className="top-nav">
        <div className="top-nav-content">
          <div className="nav-left">
            <div className="nav-brand">
              <span className="brand-icon">💰</span>
              <h1 className="brand-name">FinTrack.AI</h1>
            </div>
          </div>

          <div className="nav-right">
            <div className="profile-wrapper" ref={profileRef}>
              <div className="user-profile" onClick={() => setShowProfile(!showProfile)}>
                <div className="avatar">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="user-name">{user?.name?.split(' ')[0] || 'Operator'}</span>
              </div>

              {showProfile && (
                <div className={isNewSignup ? "profile-modal-overlay" : ""}>
                 <div className={isNewSignup ? "profile-modal-content" : "profile-dropdown"}>
                  {!isNewSignup && <div className="dropdown-arrow"></div>}
                  <div className="dropdown-header">
                    {isNewSignup ? "INITIALIZE ACCOUNT_DETAILS" : "ACCOUNT_DETAILS"}
                  </div>
                  
                  {isNewSignup && (
                    <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '25px', marginTop: '-10px', letterSpacing: '0.5px' }}>
                      Welcome to Precision Ledger AI. Please finalize your identity to activate advanced financial tracking features.
                    </p>
                  )}

                  <div className="detail-item">
                    <span className="detail-label">FULL NAME</span>
                    {isEditing ? (
                      <>
                        <input
                          className={`detail-input ${fieldErrors.name ? 'input-error' : ''}`}
                          value={newName}
                          onChange={(e) => { setNewName(e.target.value); delete fieldErrors.name; }}
                          placeholder="e.g. John Doe"
                        />
                        {fieldErrors.name && <span className="error-text">{fieldErrors.name}</span>}
                      </>
                    ) : (
                      <span className="detail-value">{user?.name}</span>
                    )}
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">EMAIL ADDRESS</span>
                    {isEditing ? (
                      <>
                        <input
                          className={`detail-input ${fieldErrors.email ? 'input-error' : ''}`}
                          value={newEmail}
                          onChange={(e) => { setNewEmail(e.target.value); delete fieldErrors.email; }}
                          placeholder="name@example.com"
                        />
                        {fieldErrors.email && <span className="error-text">{fieldErrors.email}</span>}
                      </>
                    ) : (
                      <span className="detail-value">{user?.email}</span>
                    )}
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">MOBILE_NUMBER</span>
                    {isEditing ? (
                      <>
                        <input
                          className={`detail-input ${fieldErrors.phone ? 'input-error' : ''}`}
                          value={phone}
                          onChange={(e) => { setPhone(e.target.value); delete fieldErrors.phone; }}
                          placeholder="+919876543210"
                          autoFocus
                        />
                        {fieldErrors.phone && <span className="error-text">{fieldErrors.phone}</span>}
                      </>
                    ) : (
                      <span className="detail-value">{user?.phone || 'NOT_SET'}</span>
                    )}
                  </div>
                  {fieldErrors.form && <div className="error-text" style={{ textAlign: 'center', marginBottom: 15 }}>{fieldErrors.form}</div>}

                  <div className="dropdown-footer">
                    {isEditing ? (
                      <div className="edit-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button onClick={handleUpdate} className="save-btn" style={{ width: '100%' }}>SAVE_IDENTITY</button>
                        {!isNewSignup && (
                          <button onClick={() => setIsEditing(false)} className="cancel-btn" style={{ background: '#111', color: '#fff', border: 'none', padding: '10px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>CANCEL</button>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => setIsEditing(true)} className="edit-btn">EDIT_PROFILE</button>
                    )}
                    {!isNewSignup && (
                      <button onClick={logout} className="dropdown-logout">DISCONNECT_SESSION</button>
                    )}
                  </div>
                 </div>
                </div>
              )}
            </div>

            <button className="signout-btn" onClick={logout}>Sign out</button>
          </div>
        </div>
      </nav>

      <main className="main-viewport">
        {children}
      </main>
      <Footer />

      <style jsx="true">{`
        .layout-root {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #000;
          color: #fff;
          font-family: 'Inter', sans-serif;
          overflow: hidden;
        }
        .top-nav {
          background: #000;
          border-bottom: 1px solid #111;
          z-index: 100;
          height: 64px;
          display: flex;
          align-items: center;
        }
        .top-nav-content {
          width: 100%;
          padding: 0 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .nav-left .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-icon {
          font-size: 18px;
        }
        .brand-name {
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #fff;
          margin: 0;
          text-transform: uppercase;
        }
        .nav-center .mode-toggle {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          gap: 2px;
        }
        .mode-btn {
          padding: 6px 16px;
          border-radius: 2px;
          font-size: 10px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: #444;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .mode-btn.active {
          background: #111;
          color: #ffcc00;
          box-shadow: 0 0 15px rgba(255, 204, 0, 0.1);
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .profile-wrapper {
          position: relative;
        }
        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .user-profile:hover {
          background: #0a0a0a;
        }
        .avatar {
          width: 28px;
          height: 28px;
          background: #111;
          border: 1px solid #222;
          color: #ffcc00;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: 800;
          font-size: 12px;
        }
        .user-name {
          font-size: 11px;
          color: #888;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .profile-dropdown {
          position: absolute;
          top: 50px;
          right: 0;
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          width: 300px;
          padding: 25px;
          border-radius: 4px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          z-index: 1000;
        }
        .profile-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.9);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.4s ease-out;
        }
        .profile-modal-content {
          background: #050505;
          border: 1px solid #1a1a1a;
          padding: 40px;
          width: 100%;
          max-width: 450px;
          border-radius: 4px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .dropdown-arrow {
          position: absolute;
          top: -6px;
          right: 20px;
          width: 10px;
          height: 10px;
          background: #050505;
          border-left: 1px solid #1a1a1a;
          border-top: 1px solid #1a1a1a;
          transform: rotate(45deg);
        }
        .dropdown-header {
          font-size: 9px;
          color: #444;
          font-weight: 800;
          letter-spacing: 2px;
          margin-bottom: 20px;
          border-bottom: 1px solid #111;
          padding-bottom: 10px;
        }
        .detail-item {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .detail-label {
          font-size: 8px;
          color: #555;
          font-weight: 800;
          letter-spacing: 1px;
        }
        .detail-value {
          font-size: 12px;
          color: #eee;
          font-weight: 500;
        }
        .detail-input {
          background: #111;
          border: 1px solid #333;
          color: #fff;
          padding: 8px 12px;
          font-size: 11px;
          border-radius: 2px;
          outline: none;
          font-family: inherit;
        }
        .detail-input:focus {
          border-color: #ffcc00;
        }
        .detail-input.input-error {
          border-color: #ff4444;
        }
        .error-text {
          color: #ff4444;
          font-size: 8px;
          margin-top: 4px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .status-active {
          color: #00ff88;
          font-size: 10px;
          font-weight: 800;
        }
        .dropdown-footer {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #111;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .edit-btn, .save-btn {
          width: 100%;
          background: #111;
          border: 1px solid #333;
          color: #fff;
          padding: 10px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          cursor: pointer;
          border-radius: 2px;
          transition: all 0.2s;
          text-transform: uppercase;
        }
        .save-btn {
          background: #ffcc00;
          color: #000;
          border-color: #ffcc00;
        }
        .edit-btn:hover {
          background: #1a1a1a;
          border-color: #444;
        }
        .dropdown-logout {
          width: 100%;
          background: transparent;
          border: 1px solid #222;
          color: #555;
          padding: 10px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          cursor: pointer;
          border-radius: 2px;
          transition: all 0.2s;
        }
        .dropdown-logout:hover {
          border-color: #ef4444;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }
        .signout-btn {
          display: none; /* Hidden because it's now in the dropdown */
        }
        .main-viewport {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
      `}</style>
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

