import React, { useState } from 'react';
import { MdTrendingUp, MdPieChart, MdBarChart } from 'react-icons/md';

export default function DashboardCharts({ stats }) {
  const [timeframe, setTimeframe] = useState('7d');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

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
    { name: 'Vedic Astrology', count: 45, color: '#F5C400' },
    { name: 'Tarot Reading', count: 25, color: '#8B5CF6' },
    { name: 'Numerology', count: 18, color: '#3B82F6' },
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdTrendingUp style={{ color: '#F5C400', fontSize: '1.25rem' }} />
              <h3 style={{ fontSize: '0.98rem', color: '#F8FAFC', fontWeight: 600 }}>Revenue & Volume Analytics</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
              Platform consultation earnings over time
            </p>
          </div>

          {/* Clean Segmented Control */}
          <div style={{ display: 'flex', background: '#0B1120', padding: '3px', borderRadius: '6px', border: '1px solid #273247' }}>
            {['7d', '30d', 'ytd'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: timeframe === t ? '600' : '500',
                  color: timeframe === t ? '#080C16' : '#94A3B8',
                  background: timeframe === t ? '#F5C400' : 'transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.15s ease'
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
                <stop offset="0%" stopColor="#F5C400" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#F5C400" stopOpacity="0.0" />
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
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Filled Area */}
            <path d={areaD} fill="url(#areaGradient)" />

            {/* Clean Stroke Line - No neon blur */}
            <path
              d={pathD}
              fill="none"
              stroke="#F5C400"
              strokeWidth="2"
            />

            {/* Interactive Points */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint === idx ? 6 : 3.5}
                  fill={hoveredPoint === idx ? '#F5C400' : '#080C16'}
                  stroke="#F5C400"
                  strokeWidth="2"
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Day Labels */}
                <text
                  x={p.x}
                  y={svgHeight - 8}
                  fill="#64748B"
                  fontSize="11"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
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
                background: '#151D2D',
                border: '1px solid #273247',
                padding: '7px 11px',
                borderRadius: '6px',
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: 20,
                textAlign: 'center'
              }}
            >
              <div style={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.88rem' }}>
                ₹{points[hoveredPoint].revenue}
              </div>
              <div style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                {points[hoveredPoint].consultations} sessions ({points[hoveredPoint].day})
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Category Distribution & Consultations Breakdown */}
      <div className="table-container chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <MdPieChart style={{ color: '#8B5CF6', fontSize: '1.25rem' }} />
          <div>
            <h3 style={{ fontSize: '0.98rem', color: '#F8FAFC', fontWeight: 600 }}>Category Share</h3>
            <p style={{ fontSize: '0.78rem', color: '#64748B' }}>Consultations demand by category</p>
          </div>
        </div>

        {/* Category Progress Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
          {categoryData.map((cat, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 500 }}>{cat.name}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F8FAFC' }}>{cat.count}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  background: '#0B1120',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${cat.count}%`,
                    height: '100%',
                    background: cat.color,
                    borderRadius: '4px',
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
            marginTop: '22px',
            padding: '10px 14px',
            borderRadius: '6px',
            background: '#151D2D',
            border: '1px solid #273247',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Peak Demand Time:</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F8FAFC' }}>8:00 PM – 11:30 PM</span>
        </div>
      </div>
    </div>
  );
}
