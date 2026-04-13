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
  }, [refreshTrigger, activeTab]);

  const handleAction = (action) => {
    if (action === "REFRESH") {
      setRefreshTrigger(p => p + 1);
      fetchSummary();
    }
  };

  return (
    <div className="dashboard-viewport" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <ChatWidget onAction={handleAction} />
        </div>
      )}

      {activeTab === 'history' && (
        <HistoryView refreshTrigger={refreshTrigger} />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsView refreshTrigger={refreshTrigger} />
      )}

      {activeTab === 'faq' && (
        <FAQView />
      )}
    </div>
  );
}
