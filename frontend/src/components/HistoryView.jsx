import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { Download, Search, Filter, ChevronRight, ArrowUpDown, CheckCircle } from 'lucide-react';

const getCategoryBadgeStyle = (cat) => {
  const lc = (cat || '').toLowerCase();
  if (lc.includes('food')) return { color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' };
  if (lc.includes('shop')) return { color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.05)' };
  if (lc.includes('transport')) return { color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.05)' };
  return { color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.3)', background: 'rgba(139, 92, 246, 0.05)' }; 
};

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
  
  // --- 1., 3., 9., 10. Added UX States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('desc');
  const [exportFeedback, setExportFeedback] = useState(false);

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
    const headers = ["ID", "Date", "Category", "Amount (INR)", "Description", "Card Type", "Timestamp"];
    const rows = recentTransactions.map(tx => [
      tx.shortId, tx.date, tx.category, tx.amount.toFixed(2), `"${(tx.description || "").replace(/"/g, '""')}"`, tx.cardType || "N/A", new Date(tx.createdAt).toLocaleString()
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", `Precision_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleExport = () => {
     downloadExcel();
     setExportFeedback(true);
     setTimeout(() => setExportFeedback(false), 3000);
  };

  const filteredData = recentTransactions
    .filter(tx => categoryFilter === 'ALL' || tx.category === categoryFilter)
    .filter(tx => 
      (tx.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Very basic date parsing for DD-MM-YYYY comparing epoch
      const parseDate = (d) => {
        if (!d) return 0;
        const pts = d.split('-'); return new Date(pts[2], pts[1]-1, pts[0]).getTime();
      };
      const dbA = parseDate(a.date) || new Date(a.createdAt).getTime();
      const dbB = parseDate(b.date) || new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dbB - dbA : dbA - dbB;
    });

  const totalFilteredAmount = filteredData.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const uniqueCategories = ['ALL', ...new Set(recentTransactions.map(t => t.category))];

  return (
    <div className="history-container" style={{ paddingTop: '2rem' }}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-2px', margin: 0 }}>LEDGER_HISTORY</h2>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.1em', marginTop: '0.5rem' }}>{recentTransactions.length} ARCHIVED_ENTRIES</div>
        </div>
        
        {recentTransactions.length > 0 && (
          <button className="export-btn" onClick={handleExport} disabled={exportFeedback} style={{ 
            background: 'var(--accent)', color: '#000', border: 'none', padding: '0.75rem 1.5rem', fontSize: '0.7rem', fontWeight: '900', letterSpacing: '0.1em', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', opacity: exportFeedback ? 0.7 : 1
          }}>
            {exportFeedback ? <><CheckCircle size={14} /> EXPORTED</> : <><Download size={14} /> EXPORT_RECORDS</>}
          </button>
        )}
      </div>

      {/* --- 1. Add search/filter  |  3. Sorting  |  10. Filter Dropdown --- */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
         <div style={{ flex: 1, minWidth: '200px', display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: '4px', alignItems: 'center', padding: '0 0.75rem' }}>
            <Search size={14} color="#666" />
            <input type="text" placeholder="Search description or category..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', padding: '0.75rem', width: '100%', outline: 'none', fontSize: '0.85rem' }} />
         </div>
         <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: '4px', padding: '0 0.75rem' }}>
            <Filter size={14} color="#666" />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', padding: '0.75rem', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}>
               {uniqueCategories.map(c => <option key={c} value={c} style={{ background: '#111', color: '#fff', padding: '10px' }}>{c}</option>)}
            </select>
         </div>
         <button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: '#fff', padding: '0.75rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <ArrowUpDown size={14} /> Sort: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
         </button>
      </div>

      {/* --- 4. Add summary bar --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-active)', borderLeft: '4px solid var(--accent)', padding: '1rem', borderRadius: '0 4px 4px 0', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
         <div style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 600 }}>Showing {filteredData.length} records matching criteria</div>
         <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 900 }}>Total: <span style={{ color: 'var(--accent)' }}>₹{totalFilteredAmount.toFixed(2)}</span></div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '10rem 0', color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.2em' }}>SYNCHRONIZING_ACTIVE_LEDGER...</div>
        // --- 5. Improve empty state message ---
      ) : filteredData.length > 0 ? (
        <div className="ledger-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          {/* --- 7. Improve mobile responsiveness (flex) --- */}
          <div className="table-head" style={{ display: 'flex', padding: '1rem 2rem', borderBottom: '1px solid var(--glass-border)', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.1em' }}>
            <div style={{ flex: '0 0 20%', minWidth: '100px' }}>DATE</div>
            <div style={{ flex: '1', minWidth: '150px' }}>DESCRIPTION</div>
            <div style={{ flex: '0 0 20%', minWidth: '120px' }}>CATEGORY</div>
            <div style={{ flex: '0 0 20%', minWidth: '100px', textAlign: 'right' }}>AMOUNT</div>
          </div>
          {filteredData.map((tx, idx) => (
            <div 
              key={tx._id} 
              onClick={() => setSelectedExpense(tx)}
              title="Click to view full details" // --- 6. Click Hint ---
              style={{ 
                display: 'flex', 
                padding: '1.5rem 2rem', 
                borderBottom: '1px solid var(--glass-border)', 
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // --- 8. Hover Effects ---
                alignItems: 'center',
                background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                position: 'relative'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-active)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.querySelector('.hint-icon').style.opacity = 1; e.currentTarget.querySelector('.hint-icon').style.transform = 'translateX(4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.querySelector('.hint-icon').style.opacity = 0; e.currentTarget.querySelector('.hint-icon').style.transform = 'translateX(0)'; }}
            >
              <div style={{ flex: '0 0 20%', minWidth: '100px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-dim)' }}>{tx.date}</div>
              <div style={{ flex: '1', minWidth: '150px', fontWeight: '600', fontSize: '0.95rem' }}>{tx.description}</div>
              <div style={{ flex: '0 0 20%', minWidth: '120px' }}>
                {/* --- 2. Category-based styling --- */}
                <span style={{ ...getCategoryBadgeStyle(tx.category), fontSize: '0.6rem', padding: '0.35rem 0.75rem', border: '1px solid', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '800' }}>{tx.category}</span>
              </div>
              <div style={{ flex: '0 0 20%', minWidth: '100px', textAlign: 'right', fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                ₹{tx.amount.toFixed(2)}
                {/* --- 8. Subtle Hover Icon --- */}
                <ChevronRight className="hint-icon" size={16} color="var(--accent)" style={{ opacity: 0, transition: 'all 0.2s', position: 'absolute', right: '0.75rem' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '8rem 0', color: 'var(--text-dim)' }}>
          <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem' }}>No Records Found</h3>
          <p style={{ fontSize: '0.9rem' }}>{searchQuery ? "Try adjusting your search criteria or category filter." : "Your ledger is currently empty. Start documenting expenses with the AI agent."}</p>
        </div>
      )}

      <ExpenseModal 
        expense={selectedExpense} 
        onClose={() => setSelectedExpense(null)} 
      />
    </div>
  );
}
