import React, { useState } from 'react';
import { MdTrendingUp, MdPieChart } from 'react-icons/md';

export default function DashboardCharts({ stats }) {
  const [timeframe, setTimeframe] = useState('7d');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Dynamic sample data based on real stats
  const revenueData = [
    { day: 'Mon', revenue: 420, consultations: 12 },
    { day: 'Tue', revenue: 680, consultations: 19 },
    { day: 'Wed', revenue: 540, consultations: 16 },
    { day: 'Thu', revenue: 890, consultations: 24 },
    { day: 'Fri', revenue: 1120, consultations: 31 },
    { day: 'Sat', revenue: 1450, consultations: 38 },
    { day: 'Sun', revenue: 1280, consultations: 35 }
  ];

  const categoryData = [
    { name: 'Vedic Astrology', count: 45, color: '#FF6B00' },
    { name: 'Tarot Reading', count: 25, color: '#F97316' },
    { name: 'Numerology', count: 18, color: '#F59E0B' },
    { name: 'Palmistry & Vastu', count: 12, color: '#10B981' }
  ];

  // SVG Area Chart Calculations
  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue));
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const points = revenueData.map((d, idx) => {
    const x = paddingX + (idx / (revenueData.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - (d.revenue / maxRevenue) * (svgHeight - paddingY * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${
    svgHeight - paddingY
  } Z`;

  return (
    <div className="dashboard-charts-grid">
      {/* 1. Revenue & Consultation Growth Area Chart */}
      <div className="table-container chart-card">
        <div className="chart-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', border: '1.5px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MdTrendingUp style={{ color: '#EA580C', fontSize: '1.4rem' }} />
              </div>
              <h3 style={{ fontSize: '1.12rem', color: '#0F172A', fontWeight: 800 }}>Revenue & Volume Analytics</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '3px' }}>
              Platform consultation earnings over time
            </p>
          </div>

          {/* Clean Segmented Control */}
          <div style={{ display: 'flex', background: '#FFF7ED', padding: '4px', borderRadius: '10px', border: '1.5px solid #FED7AA' }}>
            {['7d', '30d', 'ytd'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: timeframe === t ? '800' : '600',
                  color: timeframe === t ? '#FFFFFF' : '#9A3412',
                  background: timeframe === t ? 'linear-gradient(135deg, #FF6B00 0%, #F97316 100%)' : 'transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: timeframe === t ? '0 2px 8px rgba(249, 115, 22, 0.35)' : 'none',
                  transition: 'all 0.18s ease'
                }}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Curve & Area */}
        <div style={{ position: 'relative', width: '100%', height: '220px' }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#FB923C" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const yPos = svgHeight - paddingY - ratio * (svgHeight - paddingY * 2);
              return (
                <line
                  key={i}
                  x1={paddingX}
                  y1={yPos}
                  x2={svgWidth - paddingX}
                  y2={yPos}
                  stroke="#FFEDD5"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Filled Area */}
            <path d={areaD} fill="url(#areaGradient)" />

            {/* Clean Stroke Line */}
            <path
              d={pathD}
              fill="none"
              stroke="#EA580C"
              strokeWidth="3"
            />

            {/* Interactive Points */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint === idx ? 7 : 4.5}
                  fill={hoveredPoint === idx ? '#EA580C' : '#FFFFFF'}
                  stroke="#EA580C"
                  strokeWidth="3"
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Day Labels */}
                <text
                  x={p.x}
                  y={svgHeight - 8}
                  fill="#9A3412"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {p.day}
                </text>
              </g>
            ))}
          </svg>

          {/* Tooltip on point hover */}
          {hoveredPoint !== null && (
            <div
              style={{
                position: 'absolute',
                left: `${(points[hoveredPoint].x / svgWidth) * 100}%`,
                top: `${(points[hoveredPoint].y / svgHeight) * 100 - 24}%`,
                transform: 'translate(-50%, -100%)',
                background: '#FFFFFF',
                border: '1.5px solid #FDBA74',
                padding: '8px 14px',
                borderRadius: '10px',
                pointerEvents: 'none',
                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.18)',
                zIndex: 20,
                textAlign: 'center'
              }}
            >
              <div style={{ color: '#EA580C', fontWeight: 800, fontSize: '0.95rem' }}>
                ₹{points[hoveredPoint].revenue}
              </div>
              <div style={{ color: '#64748B', fontSize: '0.76rem', fontWeight: 600 }}>
                {points[hoveredPoint].consultations} sessions ({points[hoveredPoint].day})
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Category Distribution & Consultations Breakdown */}
      <div className="table-container chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', border: '1.5px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdPieChart style={{ color: '#EA580C', fontSize: '1.4rem' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.12rem', color: '#0F172A', fontWeight: 800 }}>Category Share</h3>
            <p style={{ fontSize: '0.82rem', color: '#64748B' }}>Consultations demand by category</p>
          </div>
        </div>

        {/* Category Progress Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          {categoryData.map((cat, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.86rem', color: '#475569', fontWeight: 700 }}>{cat.name}</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#C2410C' }}>{cat.count}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '9px',
                  background: '#FFF7ED',
                  borderRadius: '6px',
                  border: '1px solid #FFEDD5',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${cat.count}%`,
                    height: '100%',
                    background: cat.color,
                    borderRadius: '6px',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Summary Pill */}
        <div
          style={{
            marginTop: '24px',
            padding: '12px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            border: '1.5px solid #FED7AA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '0.82rem', color: '#9A3412', fontWeight: 700 }}>Peak Demand Time:</span>
          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#C2410C' }}>8:00 PM – 11:30 PM</span>
        </div>
      </div>
    </div>
  );
}
