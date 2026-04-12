import React from 'react';
import { Plus, List, Edit3, Trash2, Settings, Shield } from 'lucide-react';

export default function OperationsView() {
  const operations = [
    { 
      category: 'DATA MANAGEMENT',
      items: [
        { name: 'CREATE EXPENSE', icon: <Plus size={16} />, desc: 'Manually inject new ledger entry' },
        { name: 'EXPORT LEDGER', icon: <List size={16} />, desc: 'Generate CSV/PDF financial report' },
      ]
    },
    { 
      category: 'SYSTEM MAINTENANCE',
      items: [
        { name: 'AUDIT LOGS', icon: <Shield size={16} />, desc: 'Review security and transaction history' },
        { name: 'PURGE DATA', icon: <Trash2 size={16} />, desc: 'Permanently remove selected records' },
      ]
    },
    { 
      category: 'IDENTITY CONFIG',
      items: [
        { name: 'UPDATE PROFILE', icon: <Settings size={16} />, desc: 'Configure mobile and email identity' },
      ]
    }
  ];

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
              {group.items.map((item, i) => (
                <button key={i} className="ops-card">
                  <div className="ops-icon">{item.icon}</div>
                  <div className="ops-info">
                    <span className="ops-name">{item.name}</span>
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
          background: #050505;
          border: 1px solid #111;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          border-radius: 4px;
        }
        .ops-card:hover {
          background: #0a0a0a;
          border-color: #222;
          transform: translateY(-2px);
        }
        .ops-icon {
          width: 40px;
          height: 40px;
          background: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffcc00;
          border-radius: 4px;
        }
        .ops-info {
          display: flex;
          flex-direction: column;
        }
        .ops-name {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #fff;
        }
        .ops-desc {
          font-size: 10px;
          color: #444;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
