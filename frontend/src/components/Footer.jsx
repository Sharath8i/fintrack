import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-left">
          <span className="footer-status">SYSTEM READY</span>
          <span className="footer-version">v2.0.4 - LIVE CLOUD EDITION</span>
        </div>
        <div className="footer-center">
          <p>© 2026 FINTRACK.AI - PRECISION LEDGER SYSTEM</p>
        </div>
        <div className="footer-right">
          <div className="footer-links">
            <span>E2E ENCRYPTED</span>
            <span>SECURE CLUSTERS</span>
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
        }
        .footer-status {
          color: #00ff00;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .footer-status::before {
          content: '';
          width: 6px;
          height: 6px;
          background: #00ff00;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 8px #00ff00;
        }
        .footer-links {
          display: flex;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .footer-content {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
