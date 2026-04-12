import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function AnalyticsView({ refreshTrigger }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/analytics`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [refreshTrigger]);

  if (loading) return <div className="loading">CALCULATING_INSIGHTS...</div>;
  if (!data) return <div className="loading">FAILED_TO_LOAD_DATA</div>;

  const categoryData = {
    labels: Object.keys(data.spendByCategory || {}),
    datasets: [{
      data: Object.values(data.spendByCategory || {}),
      backgroundColor: ['#ffcc00', '#333', '#111', '#444'],
      borderWidth: 0
    }]
  };

  return (
    <div className="analytics-view">
      <div className="analytics-header">
        <h2 className="header-title">DATA_INSIGHTS</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">MONTHLY_TOTAL</span>
          <span className="stat-value highlight">₹{data.totalThisMonth.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">ACCOUNT_STABILITY</span>
          <span className="stat-value">OPERATIONAL</span>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3 className="chart-title">SEGMENTATION_BY_CATEGORY</h3>
          <div className="chart-box">
            <Doughnut 
              data={categoryData} 
              options={{ cutout: '80%', plugins: { legend: { position: 'right', labels: { color: '#666', font: { size: 10 } } } } }} 
            />
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .analytics-view {
          padding: 40px;
          max-width: 1000px;
        }
        .analytics-header {
          margin-bottom: 40px;
        }
        .header-title {
          font-weight: 900;
          font-size: 2rem;
          letter-spacing: -2px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 40px;
        }
        .stat-card {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          padding: 25px;
          display: flex;
          flex-direction: column;
        }
        .stat-label {
          font-size: 8px;
          color: #444;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }
        .stat-value {
          font-size: 1.8rem;
          font-weight: 800;
        }
        .stat-value.highlight {
          color: #ffcc00;
        }
        .charts-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
        }
        .chart-card {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          padding: 30px;
        }
        .chart-title {
          font-size: 9px;
          color: #444;
          letter-spacing: 2px;
          margin-bottom: 30px;
          font-weight: 800;
        }
        .chart-box {
          height: 300px;
        }
        .loading {
          padding: 100px;
          text-align: center;
          font-weight: 900;
          letter-spacing: 5px;
          color: #222;
        }
      `}</style>
    </div>
  );
}
