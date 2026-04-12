import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function HistoryView({ refreshTrigger, viewMobile }) {
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 15;

  const fetchHistory = async () => {
    try {
      const url = viewMobile ? `http://localhost:5001/api/expenses?contactNumber=${encodeURIComponent(viewMobile)}` : 'http://localhost:5001/api/expenses';
      const res = await axios.get(url);
      setRecentTransactions(res.data || []);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setRecentTransactions([]);
      } else {
        console.error("Failed to fetch history", err);
      }
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger, viewMobile]);

  useEffect(() => {
    setCurrentPage(1);
  }, [recentTransactions]);

  const downloadCSV = () => {
    if (!recentTransactions || recentTransactions.length === 0) return;

    const headers = ['ID', 'Date', 'Name', 'Mobile', 'Email', 'Category', 'Description', 'Card Type', 'Amount'];
    const rows = recentTransactions.map(tx => [
      tx.shortId,
      tx.date,
      `"${tx.fullName || ''}"`,
      tx.contactNumber,
      tx.email,
      tx.category,
      `"${tx.description || ''}"`,
      tx.cardType,
      tx.amount
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Batch_Test_Results_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="analytics-side" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="label-md" style={{ margin: 0 }}>All Transactions</h3>
        {recentTransactions.length > 0 && (
          <button className="btn-primary" onClick={downloadCSV} style={{ padding: '0.6rem 1.2rem', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em' }}>
            DOWNLOAD BATCH CSV & REPORT
          </button>
        )}
      </div>
      {recentTransactions.length > 0 ? (
        <>
        <div className="transaction-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {recentTransactions.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage).map(tx => (
            <div key={tx._id} className="transaction-item" style={{ backgroundColor: 'var(--surface-dim)', border: '1px solid var(--ghost-border)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--on-surface)', fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                  {tx.description || tx.category}
                </div>
                <div className="label-md" style={{ color: 'var(--on-surface-variant)', fontSize: '0.75rem' }}>
                  {tx.category} • {tx.date} • {tx.cardType}
                </div>
                <div className="label-md" style={{ marginTop: '0.4rem', textTransform: 'none', color: 'var(--error)' }}>
                  ID: {tx.shortId}
                </div>
              </div>
              <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: '700' }}>
                ₹{tx.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        
        {Math.ceil(recentTransactions.length / entriesPerPage) > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '2rem 0', gap: '1rem' }}>
            <button 
              className="btn-ghost" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ opacity: currentPage === 1 ? 0.3 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', letterSpacing: '0.1em', fontSize: '0.75rem', fontWeight: '800' }}
            >
              PREV
            </button>
            <div className="label-md" style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
              PAGE {currentPage} OF {Math.ceil(recentTransactions.length / entriesPerPage)}
            </div>
            <button 
              className="btn-ghost" 
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(recentTransactions.length / entriesPerPage), p + 1))}
              disabled={currentPage === Math.ceil(recentTransactions.length / entriesPerPage)}
              style={{ opacity: currentPage === Math.ceil(recentTransactions.length / entriesPerPage) ? 0.3 : 1, cursor: currentPage === Math.ceil(recentTransactions.length / entriesPerPage) ? 'not-allowed' : 'pointer', letterSpacing: '0.1em', fontSize: '0.75rem', fontWeight: '800' }}
            >
              NEXT
            </button>
          </div>
        )}
        </>
      ) : (
        <p className="label-md" style={{ marginTop: '1rem' }}>No transactions recorded.</p>
      )}
    </div>
  );
}
