import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const AuthPage = ({ mode = 'login' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = () => {
    if (!password) return null;
    let score = 0;
    if (password.length > 7) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score < 2) return { text: 'WEAK', color: '#ff4444' };
    if (score < 3) return { text: 'MODERATE', color: '#ffcc00' };
    return { text: 'STRONG', color: '#00ff00' };
  };
  const strength = mode === 'register' ? getPasswordStrength() : null;
  const isEmailValid = email.length > 0 ? (email.includes('@') && email.includes('.') ? 'valid' : 'invalid') : 'neutral';
  
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
        await register('', email, password); // Name will be filled later in profile
        localStorage.setItem('is_new_signup', 'true');
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const { googleLogin: performGoogleLogin } = useAuth();

  const handleGoogleSuccess = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError('');
      try {
        await performGoogleLogin(tokenResponse.access_token);
        navigate('/');
      } catch (err) {
        setError('Google Login failed: ' + (err.response?.data?.message || err.message));
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setError('Google Authentication failed')
  });

  return (
    <div className="auth-view" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-base)',
      padding: '2rem'
    }}>
      <div className="auth-panel" style={{ 
        width: '100%', 
        maxWidth: '420px', 
        background: 'var(--bg-surface)', 
        border: '1px solid var(--glass-border)', 
        padding: '3.5rem', 
        borderRadius: '8px', 
        boxShadow: 'var(--shadow-lg)' 
      }}>
        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ 
            fontFamily: "'Outfit', sans-serif", 
            fontWeight: 800, 
            fontSize: '1.2rem', 
            letterSpacing: '0.2em', 
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            FIN<span>TRACK.AI</span>
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {mode === 'login' ? 'SECURE_ACCESS_REQUIRED' : 'INITIALIZE_LEDGER_NODE'}
          </p>
        </div>

        <style>{`
          .auth-input { transition: all 0.2s ease; }
          .auth-input:focus { border-color: var(--accent) !important; box-shadow: 0 0 8px rgba(255, 204, 0, 0.15); }
        `}</style>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-field">
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.5rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <input 
                className="auth-input"
                style={{ width: '100%', background: 'var(--bg-active)', border: '1px solid var(--glass-border)', color: '#fff', padding: '1rem', paddingRight: '2.5rem', borderRadius: '4px', outline: 'none' }}
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              {isEmailValid === 'valid' && <CheckCircle size={14} color="#00ff00" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />}
              {isEmailValid === 'invalid' && <AlertCircle size={14} color="#ff4444" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />}
            </div>
          </div>

          <div className="form-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>Password</label>
              {mode === 'login' && <Link to="#" onClick={(e) => { e.preventDefault(); alert('Sys: Link recovery portal inactive during demo.'); }} style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.target.style.color='var(--accent)'} onMouseLeave={e => e.target.style.color='var(--text-dim)'}>FORGOT KEY?</Link>}
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                className="auth-input"
                style={{ width: '100%', background: 'var(--bg-active)', border: '1px solid var(--glass-border)', color: '#fff', padding: '1rem', paddingRight: '2.5rem', borderRadius: '4px', outline: 'none' }}
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {strength && (
               <div style={{ fontSize: '10px', marginTop: '6px', textAlign: 'right', fontWeight: 800, display: 'flex', justifyContent: 'flex-end', gap: '4px', letterSpacing: '1px' }}>
                 SECURITY FRAMEWORK: <span style={{ color: strength.color }}>{strength.text}</span>
               </div>
            )}
          </div>

          {error && <div style={{ color: 'var(--error)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem', background: 'rgba(255,68,68,0.05)', borderRadius: '4px' }}>{error}</div>}

          <button type="submit" style={{ 
            background: 'var(--accent)', 
            color: '#000', 
            border: 'none', 
            padding: '1.1rem', 
            fontWeight: '900', 
            fontSize: '0.8rem', 
            cursor: 'pointer', 
            borderRadius: '4px', 
            marginTop: '1rem',
            textTransform: 'uppercase'
          }} disabled={loading}>
            {loading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Register')}
          </button>

          <div style={{ textAlign: 'center', margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '800' }}>OR CONTINUE WITH</div>

          <button type="button" onClick={() => handleGoogleSuccess()} style={{ 
            background: googleLoading ? '#f0f0f0' : '#fff', 
            color: '#000', 
            border: 'none', 
            padding: '1rem', 
            borderRadius: '4px', 
            fontWeight: '900', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '1rem', 
            cursor: googleLoading ? 'not-allowed' : 'pointer', 
            fontSize: '0.8rem',
            width: '100%',
            transition: 'all 0.2s',
            opacity: googleLoading ? 0.7 : 1
          }} disabled={googleLoading || loading}>
            <img src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" alt="G" style={{ width: '18px' }} />
            {googleLoading ? 'SECURING OAUTH HANDSHAKE...' : 'AUTHORIZE WITH GOOGLE'}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.75rem' }}>
          {mode === 'login' ? (
            <p style={{ color: 'var(--text-dim)' }}>New operator? <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '700' }}>REGISTER_HERE</Link></p>
          ) : (
            <p style={{ color: 'var(--text-dim)' }}>Active node? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '700' }}>SIGN_IN</Link></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
