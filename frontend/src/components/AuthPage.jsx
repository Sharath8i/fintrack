import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const AuthPage = ({ mode = 'login' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="brand-title">FINTRACK.AI</h1>
          <p className="auth-subtitle">{mode === 'login' ? 'Welcome back to your ledger' : 'Initialize your personal ledger'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="Sharath KH" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
          )}
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'login' ? (
            <p>New here? <Link to="/register">Create an account</Link></p>
          ) : (
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          padding: 20px;
        }
        .auth-card {
          width: 100%;
          max-width: 400px;
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          padding: 40px;
          border-radius: 4px;
        }
        .brand-title {
          font-family: 'Inter', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          color: #fff;
          margin-bottom: 8px;
          letter-spacing: -1px;
        }
        .auth-subtitle {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 32px;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .input-group label {
          display: block;
          color: #999;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .input-group input {
          width: 100%;
          background: #111;
          border: 1px solid #222;
          padding: 12px;
          color: #fff;
          border-radius: 4px;
          font-size: 1rem;
        }
        .input-group input:focus {
          outline: none;
          border-color: #ffcc00;
        }
        .auth-button {
          margin-top: 12px;
          background: #ffcc00;
          color: #000;
          border: none;
          padding: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          border-radius: 4px;
          transition: transform 0.2s;
        }
        .auth-button:hover {
          transform: translateY(-2px);
          background: #e6b800;
        }
        .auth-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .auth-error {
          color: #ff4444;
          font-size: 0.85rem;
          background: rgba(255, 68, 68, 0.1);
          padding: 10px;
          border-radius: 4px;
        }
        .auth-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 0.9rem;
          color: #666;
        }
        .auth-footer a {
          color: #ffcc00;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
};

export default AuthPage;
