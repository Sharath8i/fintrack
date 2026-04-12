import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { API_BASE } from '../config';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler);

const CAT_COLORS  = { Transport: '#22c55e', Shopping: '#ffe792', Food: '#f87171' };
const THEME_CLRS  = ['#ffe792', '#e6ae47', '#ffc562', '#ff9f43', '#f39c12'];
const CARD_CLRS   = ['#ffffff', '#ffe792'];

export default function AnalyticsView({ refreshTrigger, viewMobile }) {
  const [data, setData] = useState({
    totalThisMonth: 0, spendByCategory: {}, spendByCard: {},
    monthWiseSpend: {}, monthWiseCategorySpend: {}, recentTransactions: []
  });

  useEffect(() => {
    const url = viewMobile
      ? `${API_BASE}/api/analytics?contactNumber=${encodeURIComponent(viewMobile)}`
      : `${API_BASE}/api/analytics`;
    axios.get(url).then(r => setData(r.data)).catch(console.error);
  }, [refreshTrigger, viewMobile]);

  /* ── Derived ── */
  const totalAllTime = Object.values(data.spendByCategory || {}).reduce((a, b) => a + b, 0);
  const topCat  = Object.entries(data.spendByCategory || {}).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';
  const topCard = Object.entries(data.spendByCard     || {}).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';

  const sortedMonths = Object.keys(data.monthWiseSpend || {}).sort((a, b) => {
    const [m1,y1]=a.split('-'), [m2,y2]=b.split('-');
    return new Date(y1,m1-1) - new Date(y2,m2-1);
  });

  const categories = Object.keys(data.spendByCategory || {});

  /* ── Bar datasets ── */
  const barDatasets = categories.map((cat, i) => ({
    type: 'bar', label: cat,
    data: sortedMonths.map(m => data.monthWiseCategorySpend?.[m]?.[cat] || 0),
    backgroundColor: THEME_CLRS[i % THEME_CLRS.length],
    borderColor: '#000', borderWidth: 1,
    borderRadius: 2,
    barPercentage: 0.35,
    categoryPercentage: 0.5,
    hoverBackgroundColor: '#fff',
  }));

  const trendLine = {
    type: 'line', label: 'Total',
    data: sortedMonths.map(m => data.monthWiseSpend[m] || 0),
    borderColor: '#fff', borderWidth: 1.5,
    pointRadius: 3, pointBackgroundColor: '#fff',
    backgroundColor: 'transparent', order: 0,
  };

  const barData = {
    labels: sortedMonths.length ? sortedMonths : ['No Data'],
    datasets: barDatasets,   // no trend line — clean stacked bars only
  };

  const totalOnTop = {
    id: 'totalOnTop',
    afterDatasetsDraw(chart) {
      const { ctx, data: d, scales: { y } } = chart;
      ctx.save();
      ctx.font = 'bold 12px Inter';
      ctx.fillStyle = '#ffe792';
      ctx.textAlign = 'center';
      d.labels.forEach((_, i) => {
        let total=0, topY=y.bottom, barX=0;
        d.datasets.forEach((ds, di) => {
          const meta = chart.getDatasetMeta(di);
          if (!meta.hidden && ds.data[i]) {
            total += ds.data[i];
            if (meta.data[i] && meta.data[i].y < topY) {
              topY = meta.data[i].y;
              barX = meta.data[i].x;
            }
          }
        });
        if (total > 0 && barX) ctx.fillText(`₹${total.toLocaleString('en-IN')}`, barX, topY - 10);
      });
      ctx.restore();
    }
  };

  const barOpts = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#888', font: { family: 'Inter', size: 12 }, padding: 24, boxWidth: 14, boxHeight: 10 }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#111',
        titleColor: '#fff',
        bodyColor: '#aaa',
        borderColor: '#222',
        borderWidth: 1,
        callbacks: { label: c => `${c.dataset.label}: ₹${c.parsed.y.toLocaleString('en-IN')}` }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#666', font: { size: 11, family: 'Inter' } },
        border: { color: '#1a1a1a' }
      },
      y: {
        stacked: true,
        grid: { color: 'rgba(255,255,255,0.06)', lineWidth: 1 },
        ticks: {
          color: '#666',
          font: { size: 11, family: 'Inter' },
          callback: v => v.toLocaleString('en-IN')
        },
        border: { display: false },
        suggestedMax: () => Math.max(...Object.values(data.monthWiseSpend || { _: 100 })) * 1.22
      }
    }
  };

  const donutOpts = { maintainAspectRatio: false, cutout: '66%',
    plugins: { legend: { position: 'bottom', labels: { color: '#666', padding: 14, boxWidth: 8, font: { size: 10 } } } }
  };

  const catChart  = { labels: Object.keys(data.spendByCategory||{}), datasets:[{ data: Object.values(data.spendByCategory||{}), backgroundColor: THEME_CLRS, borderColor:'#000', borderWidth:2, hoverOffset:4 }] };
  const cardChart = { labels: Object.keys(data.spendByCard||{}),     datasets:[{ data: Object.values(data.spendByCard||{}),     backgroundColor: CARD_CLRS,  borderColor:'#000', borderWidth:2, hoverOffset:4 }] };

  const kpis = [
    { label: 'TOTAL SPEND (ALL TIME)', value: `₹${totalAllTime.toLocaleString('en-IN',{minimumFractionDigits:2})}`, tag: '● ACTIVE',        tagColor: '#22c55e' },
    { label: 'TOTAL THIS MONTH',       value: `₹${(data.totalThisMonth||0).toLocaleString('en-IN',{minimumFractionDigits:2})}`, tag: 'CURRENT', tagColor: '#ffe792' },
    { label: 'TOP CATEGORY',           value: topCat,  tag: 'HIGHEST OUTFLOW', tagColor: '#f87171' },
    { label: 'PRIMARY CARD',           value: topCard, tag: 'MOST USED',        tagColor: '#a0a0a0' },
  ];

  return (
    <div style={{ background:'#000', color:'#fff', fontFamily:"'Inter',sans-serif", minHeight:'100%', width:'100%' }}>

      {/* ── Header ── */}
      <div style={{ padding:'28px 28px 0', marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:900, letterSpacing:0.5, margin:0 }}>Advanced Analytics</h1>
        <p style={{ fontSize:10, color:'#444', marginTop:4, letterSpacing:0.5 }}>Get a deeper insight into your spending schedule.</p>
      </div>

      <div style={{ padding:'0 28px', display:'flex', flexDirection:'column', gap:12, paddingBottom:32 }}>

        {/* ── Bar Chart ── */}
        <div style={card}>
          <div style={secLabel}>MONTH'S ACTIVITY TREND</div>
          <div style={{ height: 320, position:'relative' }}>
            {sortedMonths.length > 0
              ? <Bar data={barData} options={barOpts} plugins={[totalOnTop]} />
              : <Empty msg="No monthly data yet. Log expenses to see trends." />}
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:1, background:'#111', borderRadius:4, overflow:'hidden' }}>
          {kpis.map((k,i) => (
            <div key={i} style={{ background:'#000', padding:'16px 18px' }}>
              <div style={{ fontSize:7.5, color:'#444', letterSpacing:2, fontWeight:800, marginBottom:8 }}>{k.label}</div>
              <div style={{ fontSize:18, fontWeight:900, color:'#fff', letterSpacing:-0.5, wordBreak:'break-word' }}>{k.value}</div>
              <div style={{ fontSize:8.5, color:k.tagColor, marginTop:6, fontWeight:700, letterSpacing:1 }}>{k.tag}</div>
            </div>
          ))}
        </div>

        {/* ── Donut Row ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:12 }}>
          <div style={card}>
            <div style={secLabel}>SPEND BY CATEGORY</div>
            <div style={{ height:260 }}>
              {Object.keys(data.spendByCategory||{}).length > 0
                ? <Doughnut data={catChart} options={donutOpts} />
                : <Empty msg="No category data." />}
            </div>
          </div>
          <div style={card}>
            <div style={secLabel}>SPEND BY CARD</div>
            <div style={{ height:260 }}>
              {Object.keys(data.spendByCard||{}).length > 0
                ? <Doughnut data={cardChart} options={donutOpts} />
                : <Empty msg="No card data." />}
            </div>
          </div>
        </div>

        {/* ── Last 5 Transactions ── */}
        <div style={card}>
          <div style={secLabel}>CREDIT TRANSACTIONS (LAST 5)</div>
          {data.recentTransactions?.length > 0 ? (
            data.recentTransactions.map((tx) => (
              <div key={tx._id}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                         padding:'14px 0', borderTop:'1px solid #0f0f0f' }}
                onMouseEnter={e=>e.currentTarget.style.background='#070707'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {tx.description || tx.category}
                  </div>
                  <div style={{ fontSize:9.5, color:'#444', letterSpacing:0.3 }}>
                    {tx.category} &bull; {tx.date} &bull; {tx.cardType}
                  </div>
                  <span style={{
                    display:'inline-block', marginTop:5, fontSize:7.5, fontWeight:800,
                    letterSpacing:1, padding:'2px 7px', borderRadius:2,
                    backgroundColor: CAT_COLORS[tx.category] || '#444', color:'#000'
                  }}>
                    {tx.category?.toUpperCase()}
                  </span>
                </div>
                <div style={{ textAlign:'right', paddingLeft:16, flexShrink:0 }}>
                  <div style={{ fontSize:15, fontWeight:900, color:'#ffe792', letterSpacing:-0.3 }}>
                    ₹{tx.amount.toFixed(2)}
                  </div>
                  <div style={{ fontSize:8.5, color:'#333', marginTop:3, letterSpacing:0.8 }}>{tx.shortId}</div>
                </div>
              </div>
            ))
          ) : (
            <Empty msg="No recent transactions recorded." />
          )}
        </div>

      </div>
    </div>
  );
}

const card = {
  background: '#050505',
  border: '1px solid #111',
  borderRadius: 4,
  padding: '14px 16px',
};

const secLabel = {
  fontSize: 8,
  color: '#444',
  letterSpacing: 2.5,
  fontWeight: 900,
  marginBottom: 14,
  textTransform: 'uppercase',
};

function Empty({ msg }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:80, color:'#333', fontSize:11 }}>
      {msg}
    </div>
  );
}
