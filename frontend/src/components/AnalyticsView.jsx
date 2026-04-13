import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { API_BASE } from '../config';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler);

const CAT_COLORS  = { Transport: '#3b82f6', Shopping: '#f59e0b', Food: '#ef4444' };
const THEME_CLRS  = ['#ffe792', '#e6ae47', '#ffc562', '#ff9f43', '#f39c12'];

// --- 5. Add icons for categories ---
const getCatIcon = (c) => {
  const lc = c.toLowerCase();
  return lc.includes('food') ? '🍔' : lc.includes('shopping') ? '🛍️' : lc.includes('transport') ? '🚗' : '🏷️';
};

export default function AnalyticsView({ refreshTrigger, viewMobile }) {
  // --- 1. Loading State Setup ---
  const [data, setData] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all'); // --- 7. Month / All Time filter ---

  useEffect(() => {
    const url = viewMobile
      ? `${API_BASE}/api/analytics?contactNumber=${encodeURIComponent(viewMobile)}`
      : `${API_BASE}/api/analytics`;
    axios.get(url).then(r => setData(r.data)).catch(console.error);
  }, [refreshTrigger, viewMobile]);

  // --- 1. & 2. Loading and No Data States ---
  if (!data) return <div style={{ color: '#fff', padding: '4rem', textAlign: 'center', fontSize: '1.2rem', fontWeight: 800 }}>Loading Precision Data...</div>;
  if (data.message === "No expenses found.") return <div style={{ color: '#aaa', padding: '4rem', textAlign: 'center' }}><h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '1rem' }}>No Ledger Data Found.</h2><p>Start interacting with the AI Agent to document your expenses!</p></div>;

  /* ── Derived ── */
  const totalAllTime = Object.values(data.spendByCategory || {}).reduce((a, b) => a + b, 0);
  const topCat  = Object.entries(data.spendByCategory || {}).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';
  const topCard = Object.entries(data.spendByCard     || {}).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';

  const sortedMonths = Object.keys(data.monthWiseSpend || {}).sort((a, b) => {
    const [m1,y1]=a.split('-'), [m2,y2]=b.split('-');
    return new Date(y1,m1-1) - new Date(y2,m2-1);
  });

  const categories = Object.keys(data.spendByCategory || {});

  const barData = {
    labels: sortedMonths.length ? sortedMonths : ['DADOS_AUSENTES'],
    datasets: categories.map((cat, i) => ({
      label: cat,
      data: sortedMonths.map(m => data.monthWiseCategorySpend?.[m]?.[cat] || 0),
      backgroundColor: THEME_CLRS[i % THEME_CLRS.length],
      borderRadius: 4,
    })),
  };

  const barOpts = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#ffffff', font: { size: 11, weight: '800' }, padding: 30 } },
      // --- 4. Improve chart tooltips ---
      tooltip: { backgroundColor: 'var(--bg-elevated)', titleColor: 'var(--accent)', bodyColor: '#fff', borderColor: 'var(--glass-border)', borderWidth: 1, padding: 12, cornerRadius: 6, displayColors: true }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#ffffff', font: { size: 11, weight: '700' } } },
      y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#ffffff', font: { size: 11, weight: '600' } } }
    }
  };

  const donutOpts = { 
    maintainAspectRatio: false, 
    cutout: '70%',
    plugins: { 
      // --- 4. Improve chart tooltips ---
      tooltip: { backgroundColor: 'var(--bg-elevated)', titleColor: 'var(--accent)', bodyColor: '#fff', borderColor: 'var(--glass-border)', borderWidth: 1, padding: 12, cornerRadius: 6 },
      legend: { 
        position: 'bottom', 
        labels: { 
          color: '#ffffff', 
          font: { size: 12, weight: '800' }, 
          padding: 25,
          usePointStyle: true
        } 
      } 
    }
  };

  const catChart  = { labels: Object.keys(data.spendByCategory||{}), datasets:[{ data: Object.values(data.spendByCategory||{}), backgroundColor: THEME_CLRS, borderWidth: 0 }] };
  const cardChart = { labels: Object.keys(data.spendByCard||{}),     datasets:[{ data: Object.values(data.spendByCard||{}),     backgroundColor: [THEME_CLRS[0], THEME_CLRS[1]], borderWidth: 0 }] };

  return (
    <div className="analytics-container" style={{ padding: '2rem 0' }}>
      <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2.5px', margin: 0, color: '#fff' }}>DATA_INSIGHTS</h2>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.15em', marginTop: '0.5rem' }}>QUANTUM_LEAD_FINANCE v3.0</div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
          {/* --- 7. Add filter --- */}
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.1em', marginBottom: '4px' }}>FILTER_VIEW</div>
            <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              <option value="all" style={{ background: '#111', color: '#fff' }}>ALL TIME</option>
              <option value="month" style={{ background: '#111', color: '#fff' }}>THIS MONTH</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.1em', marginBottom: '4px' }}>LAST_RECONCILIATION</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: '700' }}>{new Date().toLocaleDateString('en-GB')}</div>
          </div>
        </div>
      </header>

      {/* ── SECTION 1: KEY PERFORMANCE INDICATORS ── */}
      {/* --- 8. Improve mobile responsiveness (grid auto-fit) --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {[
          { label: timeFilter === 'all' ? 'LIQUID_TOTAL' : 'LIQUID_TOTAL (ALL)', val: `₹${totalAllTime.toLocaleString()}`, sub: 'AGGREGATE_OUTFLOW', color: '#fff' },
          // --- 3. Add trend indicator (%) ---
          { label: 'PERIOD_SPEND', val: `₹${data.totalThisMonth?.toLocaleString()}`, sub: data.growth != null ? `${data.growth >= 0 ? '▲ +'+data.growth : '▼ '+data.growth}% vs PREV MONTH` : 'CURRENT_CYCLE', color: 'var(--accent)' },
          { label: 'TOP_SECTOR', val: data.topCategory || topCat, sub: 'MAX_VOLUME_CATEGORY', color: '#fff' },
          { label: 'PRIMARY_SOURCE', val: data.topCard || topCard, sub: 'DOMINANT_PAYMENT_METHOD', color: '#fff' }
        ].map((kpi, idx) => (
          <div key={idx} className="precision-panel" style={{ background: 'var(--bg-elevated)', padding: '2rem', border: '1px solid var(--glass-border)', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.7rem', color: '#fff', fontWeight: '900', letterSpacing: '0.1em', marginBottom: '1.25rem', opacity: 0.8 }}>{kpi.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: kpi.color, letterSpacing: '-0.5px' }}>{kpi.val}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: '0.75rem', fontWeight: '700' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── SECTION 2: TREND ANALYSIS (BAR CHART) ── */}
      <div className="analytics-section" style={{ marginBottom: '4rem' }}>
        <div className="section-header" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent)', paddingLeft: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: 0 }}>EXPENDITURE_CHRONOLOGY</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontWeight: '700' }}>MONTH_OVER_MONTH_SECTOR_TRENDS</p>
        </div>
        <div className="precision-panel" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', padding: '3rem' }}>
           <div style={{ height: 450 }}>
             <Bar data={barData} options={barOpts} />
           </div>
        </div>
      </div>

      {/* ── SECTION 3: ALLOCATION DASHBOARD (DOUGHNUTS) ── */}
      <div className="analytics-section" style={{ marginBottom: '4rem' }}>
        <div className="section-header" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #fff', paddingLeft: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: 0 }}>ALLOCATION_DYNAMICS</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontWeight: '700' }}>SECTOR_BY_SECTOR_AND_METHOD_DISTRIBUTION</p>
        </div>
        {/* --- 8. Improve mobile responsiveness --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="precision-panel" style={{ background: 'var(--bg-active)', border: '1px solid var(--glass-border)', padding: '3rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '900', marginBottom: '2.5rem', textAlign: 'center', letterSpacing: '0.1em' }}>ALLOCATION_BY_SECTOR</div>
            <div style={{ height: 300 }}>
              <Doughnut data={catChart} options={donutOpts} />
            </div>
          </div>
          <div className="precision-panel" style={{ background: 'var(--bg-active)', border: '1px solid var(--glass-border)', padding: '3rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '900', marginBottom: '2.5rem', textAlign: 'center', letterSpacing: '0.1em' }}>METHOD_EFFICIENCY</div>
            <div style={{ height: 300 }}>
              <Doughnut data={cardChart} options={donutOpts} />
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: AUDIT LOGS ── */}
      <div className="analytics-section" style={{ marginBottom: '4rem' }}>
         <div className="section-header" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--text-muted)', paddingLeft: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: 0 }}>LEDGER_SNAPSHOT</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontWeight: '700' }}>FIVE_MOST_RECENT_PERSISTENT_ENTRIES {timeFilter === 'month' && '(THIS MONTH)'}</p>
        </div>
        <div className="precision-panel" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '600px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#fff', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '1.5rem', fontWeight: '900', letterSpacing: '0.05em' }}>TIMESTAMP</th>
                <th style={{ padding: '1.5rem', fontWeight: '900', letterSpacing: '0.05em' }}>SECTOR</th>
                <th style={{ padding: '1.5rem', fontWeight: '900', letterSpacing: '0.05em' }}>DESCRIPTION</th>
                <th style={{ padding: '1.5rem', fontWeight: '900', letterSpacing: '0.05em', textAlign: 'right' }}>VALUATION</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentTransactions || [])
                .filter(t => timeFilter === 'all' || t.date.split('-')[1] === String(new Date().getMonth()+1).padStart(2,'0'))
                .slice(0, 5).map((t, i) => (
                // --- 6. Improve table UX (hover + zebra rows) ---
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: i % 2 === 0 ? 'var(--bg-active)' : 'transparent', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 204, 0, 0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'var(--bg-active)' : 'transparent'}>
                  <td style={{ padding: '1.5rem', color: 'var(--text-dim)', fontWeight: '600' }}>{t.date}</td>
                  {/* --- 5. Add icons for categories --- */}
                  <td style={{ padding: '1.5rem' }}><span style={{ background: 'var(--bg-elevated)', padding: '0.4rem 0.8rem', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent)' }}>{getCatIcon(t.category)} {t.category.toUpperCase()}</span></td>
                  <td style={{ padding: '1.5rem', color: '#fff', fontWeight: '500' }}>{t.description}</td>
                  <td style={{ padding: '1.5rem', textAlign: 'right', fontWeight: '900', color: 'var(--accent)', fontSize: '0.95rem' }}>₹{t.amount?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
