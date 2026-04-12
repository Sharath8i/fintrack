import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import ChatWidget from './ChatWidget';
import HistoryView from './HistoryView';
import AnalyticsView from './AnalyticsView';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('chat');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [totalSpend, setTotalSpend] = useState(0);

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/analytics`);
      setTotalSpend(res.data.totalThisMonth || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [refreshTrigger]);

  const handleAction = (action) => {
    if (action === "REFRESH") {
      setRefreshTrigger(p => p + 1);
    }
  };

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="summary-card">
            <span className="summary-label">TOTAL_SPEND_MONTH</span>
            <span className="summary-value">₹{totalSpend.toFixed(2)}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            AI_ASSISTANT
          </button>
          <button 
            className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            LEDGER_HISTORY
          </button>
          <button 
            className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            DATA_INSIGHTS
          </button>
        </nav>
      </aside>

      {/* VIEWPORT */}
      <section className="dashboard-viewport">
        {activeTab === 'chat' && (
          <ChatWidget onAction={handleAction} />
        )}
        {activeTab === 'history' && (
          <HistoryView refreshTrigger={refreshTrigger} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsView refreshTrigger={refreshTrigger} />
        )}
      </section>

      <style jsx="true">{`
        .dashboard-container {
          display: flex;
          height: calc(100vh - 70px); /* 70px is nav height */
          background: #000;
        }
        .dashboard-sidebar {
          width: 300px;
          border-right: 1px solid #111;
          display: flex;
          flex-direction: column;
          padding: 30px;
        }
        .sidebar-header {
          margin-bottom: 50px;
        }
        .summary-card {
          padding: 20px;
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          border-radius: 4px;
        }
        .summary-label {
          display: block;
          font-size: 8px;
          color: #444;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        .summary-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .nav-btn {
          background: transparent;
          border: none;
          color: #666;
          text-align: left;
          padding: 15px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .nav-btn:hover {
          color: #fff;
          background: #0a0a0a;
        }
        .nav-btn.active {
          background: #111;
          color: #ffcc00;
        }
        .dashboard-viewport {
          flex: 1;
          overflow-y: auto;
          background: #000;
        }
      `}</style>
    </div>
  );
}
