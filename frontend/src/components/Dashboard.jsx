import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import ChatWidget from './ChatWidget';
import HistoryView from './HistoryView';
import AnalyticsView from './AnalyticsView';
import OperationsView from './OperationsView';
import FAQView from './FAQView';

export default function Dashboard({ activeTab }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [totalSpend, setTotalSpend] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_BASE}/api/analytics`);
      setTotalSpend(res.data.totalThisMonth || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [refreshTrigger]); // Removed activeTab to strictly prevent duplicate refetches

  const handleAction = (action) => {
    // Catch-all mapping for ChatWidget's various triggers
    if (['REFRESH', 'REFRESH_ANALYTICS', 'LOAD_HISTORY'].includes(action)) {
      setRefreshTrigger(p => p + 1);
    }
  };

  // Graceful fallback for invalid props
  const validTabs = ['chat', 'history', 'analytics', 'faq'];
  const currentTab = validTabs.includes(activeTab) ? activeTab : 'chat';

  return (
    <div className="dashboard-viewport" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#000' }}>
      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .tab-panel { animation: fadeSlideIn 0.35s cubic-bezier(0.1, 0.9, 0.2, 1); flex: 1; display: flex; flex-direction: column; overflow: hidden; }
      `}</style>



      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {currentTab === 'chat' && (
          <div className="tab-panel">
            <ChatWidget onAction={handleAction} />
          </div>
        )}

        {currentTab === 'history' && (
          <div className="tab-panel" style={{ overflowY: 'auto' }}>
            <HistoryView refreshTrigger={refreshTrigger} />
          </div>
        )}

        {currentTab === 'analytics' && (
          <div className="tab-panel" style={{ overflowY: 'auto' }}>
            <AnalyticsView refreshTrigger={refreshTrigger} />
          </div>
        )}

        {currentTab === 'faq' && (
          <div className="tab-panel" style={{ overflowY: 'auto' }}>
            <FAQView />
          </div>
        )}
      </div>
    </div>
  );
}
