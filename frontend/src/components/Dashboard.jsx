import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE from '../config';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard({ refreshTrigger, viewMobile }) {
  const [data, setData] = useState({
    totalThisMonth: 0,
    spendByCategory: {},
    recentTransactions: []
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

  const chartData = {
    labels: Object.keys(data.spendByCategory),
    datasets: [
      {
        data: Object.values(data.spendByCategory),
        backgroundColor: [
          '#ffe792', // Primary
          'rgba(255, 231, 146, 0.6)', 
          'rgba(255, 231, 146, 0.2)',
        ],
        borderColor: [
          '#ffe792',
          'rgba(255, 231, 146, 0.6)',
          'rgba(255, 231, 146, 0.2)',
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="analytics-side">
      <div>
        <h2 className="label-md" style={{ marginBottom: '1rem' }}>
          {viewMobile ? `Dashboard (Mobile: ${viewMobile})` : 'Global Overview'}
        </h2>
        
        <div className="metrics-grid">
          <div className="metric-card" style={{ flex: 1 }}>
            <h3 className="label-md">Total This Month</h3>
            {/* Massive precision display */}
            <div className="display-lg" style={{ marginTop: '0.5rem', color: 'var(--primary)' }}>
              ${data.totalThisMonth.toFixed(2)}
            </div>
          </div>
          
          <div className="metric-card" style={{ flex: 1.5 }}>
             <h3 className="label-md">Spend by Category</h3>
             <div className="chart-container" style={{ height: '200px' }}>
                {Object.keys(data.spendByCategory).length > 0 ? (
                   <Doughnut data={chartData} options={{ 
                      maintainAspectRatio: false, 
                      cutout: '75%',
                      plugins: {
                        legend: { position: 'right', labels: { color: '#ababab', font: { family: 'Inter', size: 12 } } }
                      }
                   }} />
                ) : (
                   <p className="label-md" style={{ marginTop: '2rem' }}>No Data Available</p>
                )}
             </div>
          </div>
        </div>
      </div>

      <div className="metric-card" style={{ marginTop: '2rem' }}>
        <h3 className="label-md">Recent Transactions</h3>
        {data.recentTransactions.length > 0 ? (
            <div className="transaction-list">
            {data.recentTransactions.map(tx => (
                <div key={tx._id} className="transaction-item">
                    <div>
                        <div style={{ color: 'var(--on-surface)', fontWeight: '600', fontSize: '1rem' }}>
                          {tx.category}
                        </div>
                        <div className="label-md" style={{ marginTop: '0.25rem' }}>
                          {tx.date} • {tx.cardType}
                        </div>
                        {viewMobile && <div className="label-md" style={{ textTransform: 'none', color: 'var(--error)' }}>
                          ID: {tx._id}
                        </div>}
                    </div>
                    <div style={{ color: 'var(--on-surface)', fontSize: '1.25rem', fontWeight: '500' }}>
                        ${tx.amount.toFixed(2)}
                    </div>
                </div>
            ))}
            </div>
        ) : (
             <p className="label-md" style={{ marginTop: '1rem' }}>No transactions recorded.</p>
        )}
      </div>
    </div>
  );
}
