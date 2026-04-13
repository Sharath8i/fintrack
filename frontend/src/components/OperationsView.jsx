import React, { useState } from 'react';
import { Plus, List, Edit3, Trash2, Settings, Shield } from 'lucide-react';

export default function OperationsView() {
  const [clickedCard, setClickedCard] = useState(null);

  const handleNavigate = (tab) => {
    window.dispatchEvent(new CustomEvent('switchTab', { detail: tab }));
  };

  const handlePurge = () => {
    if (window.confirm("⚠️ CRITICAL ALERT\n\nYou are about to permanently purge all ledger data. This action is irreversible.\n\nProceed with data destruction?")) {
      alert("SYS_HALT: Purge operation rejected. Insufficient security clearance.");
    }
  };

  const operations = [
    { 
      category: 'DATA MANAGEMENT',
      items: [
        { id: 'op1', name: 'CREATE EXPENSE', icon: <Plus size={16} />, desc: 'Manually inject new ledger entry', status: 'READY', action: () => handleNavigate('chat') },
        { id: 'op2', name: 'EXPORT LEDGER', icon: <List size={16} />, desc: 'Generate CSV/PDF financial report', status: 'READY', action: () => handleNavigate('history') },
      ]
    },
    { 
      category: 'SYSTEM MAINTENANCE',
      items: [
        { id: 'op3', name: 'AUDIT LOGS', icon: <Shield size={16} />, desc: 'Review security and transaction history', status: 'DISABLED', action: null },
        { id: 'op4', name: 'PURGE DATA', icon: <Trash2 size={16} />, desc: 'Permanently remove selected records', status: 'DANGER', action: handlePurge },
      ]
    },
    { 
      category: 'IDENTITY CONFIG',
      items: [
        { id: 'op5', name: 'UPDATE PROFILE', icon: <Settings size={16} />, desc: 'Configure mobile and email identity', status: 'DISABLED', action: null },
      ]
    }
  ];

  const triggerAction = (item) => {
    if (item.status === 'DISABLED') return;
    setClickedCard(item.id);
    setTimeout(() => setClickedCard(null), 150);
    if (item.action) {
      setTimeout(() => item.action(), 150);
    }
  };

  return (
    <div className="operations-view">
      <div className="view-header">
        <h2 className="view-title">OPERATIONAL_CONTROL_CENTER</h2>
        <p className="view-subtitle">Execute high-priority system commands and ledger management.</p>
      </div>

      <div className="ops-grid">
        {operations.map((group, idx) => (
          <div key={idx} className="ops-group">
            <h3 className="group-label">{group.category}</h3>
            <div className="group-items">
              {group.items.map((item) => (
                <button 
                  key={item.id} 
                  className={`ops-card ${item.status.toLowerCase()} ${clickedCard === item.id ? 'clicked' : ''}`}
                  onClick={() => triggerAction(item)}
                  title={item.desc}
                >
                  <div className="ops-icon" style={{ color: item.status === 'DANGER' ? '#ff3333' : (item.status === 'DISABLED' ? '#444' : '#ffcc00') }}>
                    {item.icon}
                  </div>
                  <div className="ops-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '4px' }}>
                      <span className="ops-name">{item.name}</span>
                      <span className={`status-badge ${item.status.toLowerCase()}`}>{item.status}</span>
                    </div>
                    <span className="ops-desc">{item.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx="true">{`
        .operations-view {
          padding: 40px;
          height: 100%;
          overflow-y: auto;
          background: #000;
          color: #fff;
        }
        .view-header {
          margin-bottom: 40px;
          border-left: 2px solid #ffcc00;
          padding-left: 20px;
        }
        .view-title {
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 8px;
        }
        .view-subtitle {
          font-size: 12px;
          color: #444;
          font-weight: 600;
          letter-spacing: 1px;
        }
        .ops-grid {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        .group-label {
          font-size: 10px;
          color: #333;
          letter-spacing: 3px;
          font-weight: 900;
          margin-bottom: 20px;
        }
        .group-items {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
        }
        .ops-card {
          width: 100%;
          background: #050505;
          border: 1px solid #111;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.1, 0.9, 0.2, 1);
          text-align: left;
          border-radius: 4px;
        }
        .ops-card:hover:not(.disabled) {
          background: #0a0a0a;
          border-color: #333;
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.4);
        }
        .ops-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ops-card.clicked {
          transform: scale(0.97);
          border-color: #555;
          background: #1a1a1a;
        }
        .ops-icon {
          width: 40px;
          height: 40px;
          background: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .ops-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .status-badge {
          font-size: 8px;
          padding: 3px 6px;
          border-radius: 2px;
          font-weight: 900;
          letter-spacing: 1px;
        }
        .status-badge.ready { background: rgba(0, 255, 0, 0.1); color: #00ff00; border: 1px solid rgba(0, 255, 0, 0.2); }
        .status-badge.disabled { background: rgba(255, 255, 255, 0.05); color: #666; border: 1px solid #222; }
        .status-badge.danger { background: rgba(255, 0, 0, 0.1); color: #ff3333; border: 1px solid rgba(255, 0, 0, 0.2); }
        .ops-name {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #fff;
        }
        .ops-desc {
          font-size: 10px;
          color: #666;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
