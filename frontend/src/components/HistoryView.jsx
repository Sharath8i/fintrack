import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { Download } from 'lucide-react';

const ExpenseModal = ({ expense, onClose }) => {
  if (!expense) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">TRANSACTION DETAILS</div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <span className="label">DESCRIPTION</span>
            <span className="value">{expense.description}</span>
          </div>
          <div className="detail-row">
            <span className="label">AMOUNT</span>
            <span className="value highlighting">₹{expense.amount.toFixed(2)}</span>
          </div>
          <div className="detail-row">
            <span className="label">CATEGORY</span>
            <span className="value">{expense.category}</span>
          </div>
          <div className="detail-row">
            <span className="label">DATE</span>
            <span className="value">{expense.date}</span>
          </div>
          <div className="detail-row">
            <span className="label">TRANSACTION ID</span>
            <span className="value mono">{expense.shortId}</span>
          </div>
          <div className="detail-row">
            <span className="label">PAYMENT METHOD</span>
            <span className="value">{expense.cardType || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="label">TIMESTAMP</span>
            <span className="value">{new Date(expense.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
      <style jsx="true">{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        .modal-content {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          width: 100%;
          max-width: 450px;
          padding: 30px;
          border-radius: 4px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 1px solid #1a1a1a;
          padding-bottom: 15px;
        }
        .modal-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #666;
        }
        .close-btn {
          background: none;
          border: none;
          color: #fff;
          font-size: 24px;
          cursor: pointer;
        }
        .detail-row {
          display: flex;
          flex-direction: column;
          margin-bottom: 20px;
        }
        .label {
          font-size: 9px;
          color: #444;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        .value {
          font-size: 1rem;
          color: #fff;
        }
        .value.highlighting {
          color: #ffcc00;
          font-size: 1.5rem;
          font-weight: 800;
        }
        .value.mono {
          font-family: 'DM Mono', monospace;
          color: #00ff00;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
};

export default function HistoryView({ refreshTrigger }) {
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/expenses`);
      setRecentTransactions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  const downloadExcel = () => {
    if (!recentTransactions.length) return;

    // CSV Headers
    const headers = ["ID", "Date", "Category", "Amount (INR)", "Description", "Card Type", "Timestamp"];
    
    // Process Rows
    const rows = recentTransactions.map(tx => [
      tx.shortId,
      tx.date,
      tx.category,
      tx.amount.toFixed(2),
      `"${(tx.description || "").replace(/"/g, '""')}"`, // Escape quotes for CSV
      tx.cardType || "N/A",
      new Date(tx.createdAt).toLocaleString()
    ]);

    // Construct CSV String
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    // Create Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Precision_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="history-view">
      <div className="section-header">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="section-title">LEDGER_HISTORY</h2>
          <div className="entry-count">{recentTransactions.length} ENTRIES FOUND</div>
        </div>
        
        {recentTransactions.length > 0 && (
          <button className="export-btn" onClick={downloadExcel}>
            <Download size={14} />
            <span>EXPORT_TO_EXCEL</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-state">SYNCHRONIZING...</div>
      ) : recentTransactions.length > 0 ? (
        <div className="transaction-grid">
          {recentTransactions.map(tx => (
            <div 
              key={tx._id} 
              className="tx-card" 
              onClick={() => setSelectedExpense(tx)}
            >
              <div className="tx-main">
                <span className="tx-date">{tx.date}</span>
                <span className="tx-desc">{tx.description}</span>
                <span className="tx-cat">{tx.category}</span>
              </div>
              <div className="tx-amount">₹{tx.amount.toFixed(2)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">NO TRANSACTIONS RECORDED UNDER THIS IDENTITY</div>
      )}

      <ExpenseModal 
        expense={selectedExpense} 
        onClose={() => setSelectedExpense(null)} 
      />

      <style jsx="true">{`
        .history-view {
          padding: 40px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 40px;
          border-bottom: 1px solid #111;
          padding-bottom: 20px;
        }
        .section-title {
          font-weight: 900;
          font-size: 2rem;
          letter-spacing: -2px;
        }
        .entry-count {
          font-size: 10px;
          color: #444;
          letter-spacing: 1.5px;
          font-weight: 800;
          margin-top: 4px;
        }
        .export-btn {
          background: #ffcc00;
          border: none;
          color: #000;
          padding: 8px 16px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.5px;
          border-radius: 2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.1s, opacity 0.1s;
        }
        .export-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .export-btn:active {
          transform: translateY(0);
        }
        .transaction-grid {
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: #111;
          border: 1px solid #111;
        }
        .tx-card {
          background: #000;
          padding: 20px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background 0.1s;
        }
        .tx-card:hover {
          background: #0a0a0a;
        }
        .tx-main {
          display: flex;
          align-items: center;
          gap: 30px;
        }
        .tx-date {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          color: #444;
          width: 80px;
        }
        .tx-desc {
          font-weight: 600;
          font-size: 0.95rem;
          min-width: 200px;
        }
        .tx-cat {
          font-size: 10px;
          color: #666;
          border: 1px solid #222;
          padding: 2px 8px;
          border-radius: 100px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .tx-amount {
          font-weight: 800;
          font-size: 1.1rem;
        }
        .loading-state, .empty-state {
          padding: 100px;
          text-align: center;
          color: #333;
          font-weight: 900;
          letter-spacing: 3px;
        }
      `}</style>
    </div>
  );
}
