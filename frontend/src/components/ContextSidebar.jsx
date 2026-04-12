import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE from '../config';
import { PlusCircle, List, Edit3 } from 'lucide-react';

export default function ContextSidebar({ refreshTrigger, onTaskSelect }) {
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/analytics`);
        setRecentTransactions(res.data.recentTransactions || []);
      } catch (err) {
        console.error("Failed to fetch recent transactions", err);
      }
    };
    fetchRecent();
  }, [refreshTrigger]);

  return (
    <div className="right-panel">

      {/* TASK CONTROL */}
      <div className="panel-section">
        <h3>Task Control</h3>
        <button className="task-button" onClick={() => onTaskSelect('1')}>
          CREATE EXPENSE <PlusCircle size={16} className="icon" />
        </button>
        <button className="task-button" onClick={() => onTaskSelect('2')}>
          VIEW EXPENSES <List size={16} className="icon" />
        </button>
        <button className="task-button" onClick={() => onTaskSelect('3')}>
          MODIFY/DELETE <Edit3 size={16} className="icon" />
        </button>
      </div>

      {/* AI INSIGHT */}


    </div>
  );
}
