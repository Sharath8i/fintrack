import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { PlusCircle, List, Edit3, Activity, Clock, TrendingUp, TrendingDown } from 'lucide-react';

export default function ContextSidebar({ refreshTrigger, onTaskSelect }) {
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [totalSpend, setTotalSpend] = useState(0);
  const [growth, setGrowth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${API_BASE}/api/analytics`);
        setRecentTransactions(res.data.recentTransactions || []);
        setTotalSpend(res.data.totalThisMonth || 0);
        setGrowth(res.data.growthPercentage || 0);
      } catch (err) {
        console.error("Failed to fetch recent transactions", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecent();
  }, [refreshTrigger]);

  const handleTxClick = () => {
    window.dispatchEvent(new CustomEvent('switchTab', { detail: 'history' }));
  };

  return (
    <div className="right-panel">
      <style>{`
        .task-button { transition: all 0.2s ease; border: 1px solid transparent; }
        .task-button:hover { background: #1a1a1a; border-color: #ffcc00; box-shadow: 0 4px 12px rgba(255, 204, 0, 0.1); transform: translateY(-1px); }
        .tx-item { cursor: pointer; transition: background 0.2s ease, border-color 0.2s; }
        .tx-item:hover { background: #111; border-color: #333; }
        .cat-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; box-shadow: 0 0 6px rgba(255,255,255,0.2) }
      `}</style>
      
      {/* TASK CONTROL */}
      <div className="panel-section">
        <h3 style={{ fontSize: '11px', color: '#666', letterSpacing: '2px', marginBottom: '16px' }}>TASK CONTROL</h3>
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
      <div className="panel-section" style={{ marginTop: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffcc00', fontSize: '11px', letterSpacing: '2px', marginBottom: '12px' }}>
          <Activity size={14} /> AI INSIGHT
        </h3>
        {isLoading ? (
          <div style={{ color: '#666', fontSize: '11px' }}>Analyzing patterns...</div>
        ) : (
          <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '16px' }}>
             <div style={{ margin: 0, fontSize: '11px', color: '#aaa', lineHeight: '1.6' }}>
               Current month spend is <strong style={{ color: '#fff' }}>₹{Number(totalSpend).toLocaleString()}</strong>. 
               {growth > 0 ? (
                 <span style={{ color: '#ff4444', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontWeight: 600 }}>
                   <TrendingUp size={14} /> +{growth}% from last month. Watch your budget!
                 </span>
               ) : (
                 <span style={{ color: '#00ff00', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontWeight: 600 }}>
                   <TrendingDown size={14} /> {growth}% from last month. Great savings!
                 </span>
               )}
             </div>
          </div>
        )}
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="panel-section" style={{ marginTop: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffcc00', fontSize: '11px', letterSpacing: '2px', marginBottom: '12px' }}>
          <Clock size={14} /> RECENT LOGS
        </h3>
        {isLoading ? (
           <div style={{ color: '#666', fontSize: '11px' }}>Fetching records...</div>
        ) : recentTransactions.length === 0 ? (
           <div style={{ color: '#666', fontSize: '11px' }}>No recent activity.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             {recentTransactions.map(tx => {
               let dotColor = '#ffcc00'; // Default/Shopping
               if (tx.category === 'Food') dotColor = '#ff6b6b';
               if (tx.category === 'Transport') dotColor = '#4ecdc4';

               return (
                 <div key={tx._id} className="tx-item" onClick={handleTxClick} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <span className="cat-dot" style={{ background: dotColor }}></span>
                     <div>
                       <div style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>{tx.category}</div>
                       <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>{tx.date}</div>
                     </div>
                   </div>
                   <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff', letterSpacing: '0.5px' }}>
                     ₹{tx.amount}
                   </div>
                 </div>
               );
             })}
          </div>
        )}
      </div>

    </div>
  );
}
