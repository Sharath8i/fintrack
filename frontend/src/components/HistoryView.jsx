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
    <div className="history-container" style={{ paddingTop: '2rem' }}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-2px', margin: 0 }}>LEDGER_HISTORY</h2>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.1em', marginTop: '0.5rem' }}>{recentTransactions.length} ARCHIVED_ENTRIES</div>
        </div>
        
        {recentTransactions.length > 0 && (
          <button className="export-btn" onClick={downloadExcel} style={{ 
            background: 'var(--accent)', 
            color: '#000', 
            border: 'none', 
            padding: '0.75rem 1.5rem', 
            fontSize: '0.7rem', 
            fontWeight: '900', 
            letterSpacing: '0.1em', 
            borderRadius: '4px', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Download size={14} /> EXPORT_RECORDS
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '10rem 0', color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.2em' }}>SYNCHRONIZING_ACTIVE_LEDGER...</div>
      ) : recentTransactions.length > 0 ? (
        <div className="ledger-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <div className="table-head" style={{ display: 'grid', gridTemplateColumns: '120px 1fr 150px 150px', padding: '1rem 2rem', borderBottom: '1px solid var(--glass-border)', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.1em' }}>
            <div>DATE</div>
            <div>DESCRIPTION</div>
            <div>CATEGORY</div>
            <div style={{ textAlign: 'right' }}>AMOUNT</div>
          </div>
          {recentTransactions.map(tx => (
            <div 
              key={tx._id} 
              className="table-row" 
              onClick={() => setSelectedExpense(tx)}
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '120px 1fr 150px 150px', 
                padding: '1.5rem 2rem', 
                borderBottom: '1px solid var(--glass-border)', 
                cursor: 'pointer',
                transition: 'background 0.2s',
                alignItems: 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-active)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-dim)' }}>{tx.date}</div>
              <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{tx.description}</div>
              <div>
                <span style={{ fontSize: '0.6rem', padding: '0.25rem 0.75rem', border: '1px solid var(--glass-border)', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tx.category}</span>
              </div>
              <div style={{ textAlign: 'right', fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)' }}>₹{tx.amount.toFixed(2)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '10rem 0', color: 'var(--text-dim)', fontSize: '0.9rem' }}>NO_RECORDS_AVAILABLE_IN_THIS_CONTEXT</div>
      )}

      <ExpenseModal 
        expense={selectedExpense} 
        onClose={() => setSelectedExpense(null)} 
      />
    </div>
  );
}
