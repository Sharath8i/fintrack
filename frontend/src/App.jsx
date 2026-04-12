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
  const { logout, user } = useAuth();
  return (
    <div className="layout-root">
      <nav className="top-nav">
        <div className="top-nav-content">
          <div className="brand">FINTRACK.AI</div>
          {user && (
            <div className="user-section">
              <div className="user-info">
                <span className="user-label">OPERATOR</span>
                <span className="user-name">{user.name}</span>
              </div>
              <button onClick={logout} className="logout-btn">DISCONNECT</button>
            </div>
          )}
        </div>
      </nav>
      <main className="main-viewport">
        {children}
      </main>
      <Footer />

      <style jsx="true">{`
        .layout-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #000;
          color: #fff;
          font-family: 'Inter', sans-serif;
        }
        .top-nav {
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #1a1a1a;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .top-nav-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 15px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand {
          font-weight: 900;
          font-size: 1.2rem;
          letter-spacing: -1px;
        }
        .user-section {
          display: flex;
          align-items: center;
          gap: 30px;
        }
        .user-info {
          display: flex;
          flex-direction: column;
          text-align: right;
        }
        .user-label {
          font-size: 8px;
          color: #666;
          letter-spacing: 1px;
        }
        .user-name {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          text-transform: uppercase;
        }
        .logout-btn {
          background: transparent;
          border: 1px solid #333;
          color: #666;
          padding: 8px 16px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .logout-btn:hover {
          background: #ff4444;
          border-color: #ff4444;
          color: #fff;
        }
        .main-viewport {
          flex: 1;
          display: flex;
          flex-direction: column;
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

