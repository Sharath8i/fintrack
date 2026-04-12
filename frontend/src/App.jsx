import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatWidget from './components/ChatWidget';
import ContextSidebar from './components/ContextSidebar';
import HistoryView from './components/HistoryView';
import AnalyticsView from './components/AnalyticsView';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [externalCommand, setExternalCommand] = useState(null);
  const [totalCapital, setTotalCapital] = useState(0);
  const [mobileNumber, setMobileNumber] = useState('');

  const fetchTotal = async () => {
    try {
      const url = mobileNumber ? `http://localhost:5001/api/analytics?contactNumber=${encodeURIComponent(mobileNumber)}` : 'http://localhost:5001/api/analytics';
      const res = await axios.get(url);
      setTotalCapital(res.data.totalThisMonth || 0); // Using total this month as proxy for total for now
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTotal();
  }, [refreshTrigger, mobileNumber]);

  const handleAgentAction = (action) => {
    if (action === "REFRESH_ANALYTICS") {
      setRefreshTrigger(prev => prev + 1);
    } else if (action && action.type === "VIEW_EXPENSES") {
      setActiveTab('history');
      if (action.mobile) {
        setMobileNumber(action.mobile);
      }
      setRefreshTrigger(prev => prev + 1);
    } else if (action && action.type === "LOAD_MODIFY") {
      // Just keep them in chat to modify
      if (action.mobile) {
        setMobileNumber(action.mobile);
      }
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleTaskSelect = (cmd) => {
    setExternalCommand(cmd);
    setActiveTab('chat');
  };

  return (
    <div className="app-layout">
      {/* LEFT SIDEBAR */}
      <div className="sidebar">
        <div className="brand">FINTRACK.AI</div>
        <div className="profile-badge">

        </div>

        <div className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>CHAT</div>
          <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setMobileNumber(''); }}>HISTORY</div>
          <div className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => { setActiveTab('analytics'); setMobileNumber(''); }}>ANALYTICS</div>
          <div className={`nav-item ${activeTab === 'faq' ? 'active' : ''}`} onClick={() => setActiveTab('faq')}>FAQ</div>
        </div>

      </div>

      {/* MAIN COLUMN */}
      <div className="main-column">

        {/* Dynamic Content */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="finance-header">



            </div>

            {/* Chat takes remaining space */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ChatWidget
                onAction={handleAgentAction}
                externalCommand={externalCommand}
                clearExternalCommand={() => setExternalCommand(null)}
              />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ padding: '3rem', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h1 className="display-lg">Transaction History</h1>
                <p className="label-md">
                  {mobileNumber ? `Filtered by ${mobileNumber}` : 'Comprehensive FinTech of all recorded expenses.'}
                </p>
              </div>
              {mobileNumber && (
                <button className="btn-ghost" onClick={() => setMobileNumber('')}>Clear Filter</button>
              )}
            </div>
            <HistoryView refreshTrigger={refreshTrigger} viewMobile={mobileNumber} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={{ padding: '3rem', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h1 className="display-lg">Advanced Analytics</h1>
                <p className="label-md">
                  {mobileNumber ? `Filtered by ${mobileNumber}` : 'Data-driven insights into your spending topology.'}
                </p>
              </div>
              {mobileNumber && (
                <button className="btn-ghost" onClick={() => setMobileNumber('')}>Clear Filter</button>
              )}
            </div>
            <AnalyticsView refreshTrigger={refreshTrigger} viewMobile={mobileNumber} />
          </div>
        )}

        {activeTab === 'faq' && (
          <div style={{ padding: '3rem', flex: 1, overflowY: 'auto' }}>
            <h1 className="display-lg">FAQ & Support</h1>
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              <div style={{ backgroundColor: 'var(--surface-dim)', border: '1px solid var(--ghost-border)', padding: '1.5rem' }}>
                <h3 style={{ color: 'var(--primary)' }}>What is the purpose of this bot?</h3>
                <p style={{ color: 'var(--on-surface-variant)', marginTop: '0.5rem' }}>The Precision FinTech AI Assistant can rapidly draft new expenses, analyze your historical spending velocity, and precisely delete or modify past entries.</p>
              </div>

              <div style={{ backgroundColor: 'var(--surface-dim)', border: '1px solid var(--ghost-border)', padding: '1.5rem' }}>
                <h3 style={{ color: 'var(--primary)' }}>How do I track an expense?</h3>
                <p style={{ color: 'var(--on-surface-variant)', marginTop: '0.5rem' }}>Navigate to the Chat interface and natively instruct the engine. For example, simply say: "I spent 15 on Food today".</p>
              </div>

              <div style={{ backgroundColor: 'var(--surface-dim)', border: '1px solid var(--ghost-border)', padding: '1.5rem' }}>
                <h3 style={{ color: 'var(--primary)' }}>Can I amend or delete a recorded entry?</h3>
                <p style={{ color: 'var(--on-surface-variant)', marginTop: '0.5rem' }}>Yes. To modify or delete a previously committed entry, use the 'Modify/Delete' interface Button, or say "Option 3". The system will print your ledger so you can target a specific ID.</p>
              </div>





              <div style={{ backgroundColor: 'var(--surface-dim)', border: '1px solid var(--ghost-border)', padding: '1.5rem' }}>
                <h3 style={{ color: 'var(--primary)' }}>Can I provide multiple details at once?</h3>
                <p style={{ color: 'var(--on-surface-variant)', marginTop: '0.5rem' }}>Yes! The AI engine acts like a smart extractor. If you type a full sentence like "I spent Rs 500 on Food using my Debit Card today for Dinner", it will capture your Amount, Category, Card Type, Date, and Description all in one single step!</p>
              </div>

              <div style={{ backgroundColor: 'var(--surface-dim)', border: '1px solid var(--ghost-border)', padding: '1.5rem' }}>
                <h3 style={{ color: 'var(--primary)' }}>Can I correct a mistake mid-conversation?</h3>
                <p style={{ color: 'var(--on-surface-variant)', marginTop: '0.5rem' }}>Yes! You can instantly correct fields without restarting. Just type commands like "change amount to 50" or "change category to Food".</p>
              </div>

              <div style={{ backgroundColor: 'var(--surface-dim)', border: '1px solid var(--ghost-border)', padding: '1.5rem' }}>
                <h3 style={{ color: 'var(--primary)' }}>How do I cancel or exit a task?</h3>
                <p style={{ color: 'var(--on-surface-variant)', marginTop: '0.5rem' }}>If you accidentally started something and want to stop, simply type "cancel" or "exit" at any time to return to the Main Menu.</p>
              </div>

              <div style={{ backgroundColor: 'var(--surface-dim)', border: '1px solid var(--ghost-border)', padding: '1.5rem' }}>
                <h3 style={{ color: 'var(--primary)' }}>Can I set a budget summary limit?</h3>
                <p style={{ color: 'var(--on-surface-variant)', marginTop: '0.5rem' }}>Yes! You can set category-specific budgets by saying, for example, "Set my Food budget to 5000". The system will alert you if future expenses exceed it.</p>
              </div>

              <div style={{ backgroundColor: 'var(--surface-dim)', border: '1px solid var(--ghost-border)', padding: '1.5rem' }}>
                <h3 style={{ color: 'var(--primary)' }}>Can I ask analytical questions?</h3>
                <p style={{ color: 'var(--on-surface-variant)', marginTop: '0.5rem' }}>Absolutely. You can ask queries like "How much did I spend on Transport?" for a real-time summary calculation.</p>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* RIGHT PANEL */}
      {activeTab === 'chat' && (
        <ContextSidebar refreshTrigger={refreshTrigger} onTaskSelect={handleTaskSelect} />
      )}

    </div>
  );
}

export default App;
