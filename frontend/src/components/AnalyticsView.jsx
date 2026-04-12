import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE from '../config';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler);

export default function AnalyticsView({ refreshTrigger, viewMobile }) {
  const [data, setData] = useState({
    totalThisMonth: 0,
    spendByCategory: {},
    spendByCard: {},
    monthWiseSpend: {},
    monthWiseCategorySpend: {}
  });

  const fetchAnalytics = async () => {
    try {
      const url = viewMobile ? `${API_BASE}/api/analytics?contactNumber=${encodeURIComponent(viewMobile)}` : `${API_BASE}/api/analytics`;
      const res = await axios.get(url);
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [refreshTrigger, viewMobile]);

  const categoryData = {
    labels: Object.keys(data.spendByCategory || {}),
    datasets: [
      {
        data: Object.values(data.spendByCategory || {}),
        backgroundColor: ['#ffe792', '#e6ae47', '#ffc562', '#ff9f43', '#f39c12'],
        borderColor: 'rgba(20, 20, 20, 1)',
        borderWidth: 2,
        hoverOffset: 6
      },
    ],
  };

  const cardData = {
    labels: Object.keys(data.spendByCard || {}),
    datasets: [
      {
        data: Object.values(data.spendByCard || {}),
        backgroundColor: ['#ffffff', '#ffe792', '#e6ae47'],
        borderColor: 'rgba(20, 20, 20, 1)',
        borderWidth: 2,
        hoverOffset: 6
      },
    ],
  };

  // Sort monthWiseSpend keys chronologically for the bar chart
  const sortedMonths = Object.keys(data.monthWiseSpend || {}).sort((a, b) => {
    // a and b are "MM-YYYY"
    const [m1, y1] = a.split('-');
    const [m2, y2] = b.split('-');
    return new Date(y1, m1 - 1) - new Date(y2, m2 - 1);
  });

  const categories = Object.keys(data.spendByCategory || {});
  const themeColors = ['#ffe792', '#e6ae47', '#ffc562', '#ff9f43', '#f39c12'];

  const barDatasets = categories.map((cat, i) => {
    return {
      label: cat,
      data: sortedMonths.length > 0 ? sortedMonths.map(m => (data.monthWiseCategorySpend?.[m]?.[cat] || 0)) : [0, 0, 0],
      backgroundColor: themeColors[i % themeColors.length],
      borderColor: 'rgba(20, 20, 20, 1)',
      borderWidth: 1
    };
  });

  const barData = {
    labels: sortedMonths.length > 0 ? sortedMonths : ['Jan', 'Feb', 'Mar'], // Fallback labels
    datasets: barDatasets
  };

  const totalOnTopPlugin = {
    id: 'totalOnTop',
    afterDatasetsDraw(chart, args, pluginOptions) {
      const { ctx, data, scales: { x, y } } = chart;
      ctx.save();
      ctx.font = 'bold 12px Inter';
      ctx.fillStyle = '#ffe792';
      ctx.textAlign = 'center';

      data.labels.forEach((label, index) => {
        let total = 0;
        let topY = y.bottom;
        let barX = 0;

        data.datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (!meta.hidden && dataset.data[index]) {
            total += dataset.data[index];
            if (meta.data[index] && meta.data[index].y < topY) {
              topY = meta.data[index].y;
              barX = meta.data[index].x;
            }
          }
        });

        if (total > 0 && barX) {
          ctx.fillText(`₹${total.toFixed(0)}`, barX, topY - 10);
        }
      });
      ctx.restore();
    }
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#a0a0a0', font: { family: 'Inter', size: 12 }, padding: 20 } },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    responsive: true,
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#a0a0a0' }
      },
      y: {
        stacked: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#a0a0a0' },
        suggestedMax: (context) => {
          // Add some padding to the max value to accommodate the total label on top
          const maxVal = Math.max(...Object.values(data.monthWiseSpend || { a: 100 }));
          return maxVal * 1.15;
        }
      }
    }
  };

  const totalAllTime = Object.values(data.spendByCategory || {}).reduce((a, b) => a + b, 0);
  const topCat = Object.entries(data.spendByCategory || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const topCard = Object.entries(data.spendByCard || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const summaryCards = [
    { label: "Total Spend (All Time)", value: `₹${totalAllTime.toLocaleString('en-IN')}`, extra: '+ Active' },
    { label: "Spend This Month", value: `₹${data.totalThisMonth.toLocaleString('en-IN')}`, extra: 'Current' },
    { label: "Top Category", value: topCat, extra: 'Highest Outflow' },
    { label: "Primary Card", value: topCard, extra: 'Most Used' }
  ];

  return (
    <div className="analytics-side" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Row 1: Monthly Graph */}
      <div className="metric-card hover-card" style={{ width: '100%', backgroundColor: 'var(--surface-dim)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px' }}>
        <h3 className="label-md" style={{ marginBottom: '20px' }}>Monthly Expense Trend</h3>
        <div className="chart-container" style={{ height: '420px', position: 'relative' }}>
          {sortedMonths.length > 0 ? (
            <Bar data={barData} options={chartOptions} plugins={[totalOnTopPlugin]} />
          ) : (
            <p className="label-md" style={{ textAlign: 'center', marginTop: '4rem' }}>Not enough temporal data to construct graph.</p>
          )}
        </div>
      </div>

      {/* Row 2: 4 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {summaryCards.map((card, idx) => (
          <div key={idx} className="metric-card hover-card" style={{ backgroundColor: 'var(--surface-dim)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="label-md" style={{ color: 'var(--on-surface-variant)' }}>{card.label}</div>
            <div style={{ color: 'var(--on-surface)', fontSize: '28px', fontWeight: '700', marginTop: '1rem', letterSpacing: '0.05em' }}>{card.value}</div>
            <div className="label-md" style={{ color: 'var(--primary)', marginTop: '0.5rem', fontSize: '0.75rem' }}>{card.extra}</div>
          </div>
        ))}
      </div>

      {/* Row 3: Doughnuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="metric-card hover-card" style={{ backgroundColor: 'var(--surface-dim)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px' }}>
          <h3 className="label-md" style={{ marginBottom: '20px' }}>Spend by Category</h3>
          <div className="chart-container" style={{ height: '240px' }}>
            {Object.keys(data.spendByCategory || {}).length > 0 ? (
              <Doughnut data={categoryData} options={{ maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: '#a0a0a0', padding: 20 } } } }} />
            ) : (<p className="label-md">No Category Data</p>)}
          </div>
        </div>
        <div className="metric-card hover-card" style={{ backgroundColor: 'var(--surface-dim)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px' }}>
          <h3 className="label-md" style={{ marginBottom: '20px' }}>Spend by Card</h3>
          <div className="chart-container" style={{ height: '240px' }}>
            {Object.keys(data.spendByCard || {}).length > 0 ? (
              <Doughnut data={cardData} options={{ maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: '#a0a0a0', padding: 20 } } } }} />
            ) : (<p className="label-md">No Card Data</p>)}
          </div>
        </div>
      </div>



      {/* Recent Transactions (Last 5) */}
      <h3 className="label-md" style={{ marginTop: '30px', marginBottom: '20px' }}>Recent Transactions (Last 5)</h3>
      {data.recentTransactions && data.recentTransactions.length > 0 ? (
        <div className="transaction-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {data.recentTransactions.map(tx => (
            <div key={tx._id} className="transaction-item hover-card" style={{ backgroundColor: 'var(--surface-dim)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--on-surface)', fontWeight: '600', fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                  {tx.description || tx.category}
                </div>
                <div className="label-md" style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                  {tx.category} • {tx.date} • {tx.cardType}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--primary)', fontSize: '1.25rem', fontWeight: '700' }}>
                  ₹{tx.amount.toFixed(2)}
                </div>
                <div className="label-md" style={{ marginTop: '0.2rem', textTransform: 'none', color: 'var(--error)', fontSize: '0.7rem' }}>
                  ID: {tx.shortId}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="label-md" style={{ marginTop: '1rem' }}>No recent transactions recorded.</p>
      )}

    </div>
  );
}
