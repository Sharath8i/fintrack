import React, { useState, useEffect } from 'react';

const Footer = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-left">
          <span className="footer-status">SYSTEM READY</span>
          <span className="footer-version">v2.0.4 <span className="env-label">PRODUCTION</span></span>
        </div>
        <div className="footer-center">
          <p>© {time.getFullYear()} FINTRACK.AI // AUTONOMOUS EXPENSE INTELLIGENCE ENGINE</p>
        </div>
        <div className="footer-right">
          <div className="footer-links">
            <span className="live-time">{time.toLocaleTimeString([], { hour12: false })} LOCAL</span>
            <span className="api-status">API: CONNECTED <span className="dot-yellow"></span></span>
            <span>E2E SECURE</span>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .app-footer {
          width: 100%;
          background: #000;
          border-top: 1px solid #1a1a1a;
          padding: 15px 30px;
          color: #666;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
        }
        .footer-left {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        .footer-status {
          color: #00ff00;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
        }
        @keyframes pulseDot {
          0% { box-shadow: 0 0 4px #00ff00; opacity: 1; }
          50% { box-shadow: 0 0 1px #00ff00; opacity: 0.5; }
          100% { box-shadow: 0 0 4px #00ff00; opacity: 1; }
        }
        .footer-status::before {
          content: '';
          width: 5px;
          height: 5px;
          background: #00ff00;
          border-radius: 50%;
          display: inline-block;
          animation: pulseDot 2s infinite ease-in-out;
        }
        .env-label {
          background: rgba(255, 204, 0, 0.1);
          color: #ffcc00;
          padding: 2px 6px;
          border-radius: 2px;
          border: 1px solid rgba(255, 204, 0, 0.2);
          margin-left: 8px;
        }
        .footer-links {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        .footer-links span {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .footer-links span:hover {
          color: #fff;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
        }
        .api-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dot-yellow {
          width: 4px;
          height: 4px;
          background: #ffcc00;
          border-radius: 50%;
          display: inline-block;
        }
        .live-time {
          color: #888;
        }
        @media (max-width: 900px) {
          .footer-content {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }
          .footer-left {
            justify-content: center;
          }
          .footer-links {
            justify-content: center;
            flex-wrap: wrap;
            gap: 12px;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
