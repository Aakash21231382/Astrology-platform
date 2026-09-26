import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  IoSpeedometerOutline,
  IoCashOutline,
  IoChatbubblesOutline,
  IoStar,
  IoTrendingUpOutline,
  IoTimeOutline,
  IoMailOutline,
  IoPeopleOutline,
  IoArrowForwardOutline,
  IoCheckmarkCircle,
  IoFlashOutline,
  IoPulseOutline,
  IoCalendarOutline,
  IoSparklesOutline,
  IoPieChartOutline,
  IoBarChartOutline,
  IoCallOutline,
  IoShieldCheckmarkOutline,
  IoWalletOutline,
  IoPersonCircleOutline
} from 'react-icons/io5';
import { expertService, consultationService } from '../../services/api';
import { Chart, registerables } from 'chart.js';
import { toast } from 'react-toastify';

// Register all Chart.js modules
Chart.register(...registerables);

export default function DashboardPage() {
  const { profile, setProfile, unreadMailCount } = useOutletContext();
  const [earnings, setEarnings] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [mailbox, setMailbox] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days'); // '7days' | '30days' | 'year'
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'sessions'

  const lineChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  const lineChartInstance = useRef(null);
  const doughnutChartInstance = useRef(null);

  useEffect(() => {
    loadAllDashboardData();
  }, []);

  const loadAllDashboardData = async () => {
    try {
      const [earningsRes, historyRes, activeRes, mailRes, clientsRes] = await Promise.allSettled([
        expertService.getEarnings(),
        consultationService.getHistory(),
        consultationService.getActiveForExpert(),
        expertService.getMailbox(),
        expertService.getClients()
      ]);

      if (earningsRes.status === 'fulfilled' && earningsRes.value.data?.data) {
        setEarnings(earningsRes.value.data.data);
      }
      if (historyRes.status === 'fulfilled' && historyRes.value.data?.data) {
        setHistory(historyRes.value.data.data);
      }
      if (activeRes.status === 'fulfilled' && activeRes.value.data?.data) {
        setActiveSessions(activeRes.value.data.data);
      }
      if (mailRes.status === 'fulfilled' && mailRes.value.data?.data) {
        setMailbox(mailRes.value.data.data);
      }
      if (clientsRes.status === 'fulfilled' && clientsRes.value.data?.data) {
        setClients(clientsRes.value.data.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render or Update Line / Bar Chart
  useEffect(() => {
    if (!lineChartRef.current) return;

    if (lineChartInstance.current) {
      lineChartInstance.current.destroy();
    }

    const ctx = lineChartRef.current.getContext('2d');

    // Generate labels & data according to time range
    let labels = [];
    let revenueData = [];
    let sessionsData = [];

    if (timeRange === '7days') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      revenueData = [340, 520, 410, 780, 890, 1250, 980];
      sessionsData = [4, 6, 5, 9, 11, 15, 12];
    } else if (timeRange === '30days') {
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      revenueData = [3200, 4800, 6100, 7950];
      sessionsData = [48, 72, 94, 125];
    } else {
      labels = ['Q1', 'Q2', 'Q3', 'Q4'];
      revenueData = [18500, 26400, 35200, 48800];
      sessionsData = [320, 460, 610, 840];
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(255, 107, 0, 0.25)');
    gradient.addColorStop(1, 'rgba(255, 107, 0, 0.00)');

    const isRevenue = chartMetric === 'revenue';

    lineChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: isRevenue ? 'Earnings (₹)' : 'Consultations Count',
            data: isRevenue ? revenueData : sessionsData,
            borderColor: '#FF6B00',
            backgroundColor: gradient,
            borderWidth: 2.8,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#FF6B00',
            pointBorderWidth: 2.5,
            pointRadius: 4.5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#FF6B00',
            pointHoverBorderColor: '#ffffff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#0F172A',
            titleColor: '#F8FAFC',
            bodyColor: '#FB923C',
            bodyFont: { weight: '700', size: 13 },
            padding: 12,
            cornerRadius: 10,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            callbacks: {
              label: (context) => isRevenue ? ` ₹${context.raw.toLocaleString()}` : ` ${context.raw} Sessions`
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#F1F5F9', drawBorder: false },
            ticks: { color: '#64748B', font: { weight: '600', size: 12 } }
          },
          y: {
            grid: { color: '#F1F5F9', drawBorder: false },
            ticks: {
              color: '#64748B',
              font: { weight: '600', size: 12 },
              callback: (val) => isRevenue ? `₹${val}` : val
            }
          }
        }
      }
    });

    return () => {
      if (lineChartInstance.current) lineChartInstance.current.destroy();
    };
  }, [timeRange, chartMetric]);

  // Render Specialty Doughnut Chart
  useEffect(() => {
    if (!doughnutChartRef.current) return;

    if (doughnutChartInstance.current) {
      doughnutChartInstance.current.destroy();
    }

    const ctx = doughnutChartRef.current.getContext('2d');

    doughnutChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Vedic Astrology', 'Tarot Reading', 'Kundali Match', 'Numerology', 'Palmistry'],
        datasets: [
          {
            data: [42, 26, 16, 10, 6],
            backgroundColor: [
              '#FF6B00', // Emerald
              '#3B82F6', // Blue
              '#8B5CF6', // Purple
              '#F59E0B', // Amber
              '#EC4899'  // Pink
            ],
            borderWidth: 3,
            borderColor: '#ffffff',
            hoverOffset: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              padding: 14,
              color: '#334155',
              font: { size: 12, weight: '600' }
            }
          },
          tooltip: {
            backgroundColor: '#0F172A',
            titleColor: '#F8FAFC',
            bodyColor: '#ffffff',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => ` ${context.label}: ${context.raw}%`
            }
          }
        },
        cutout: '72%'
      }
    });

    return () => {
      if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
    };
  }, []);

  const handleToggleLiveStatus = async () => {
    if (!profile) return;
    const nextStatus = !profile.isOnline;
    try {
      await expertService.setAvailability({
        isOnline: nextStatus,
        isActive: profile.isActive
      });
      setProfile(prev => ({ ...prev, isOnline: nextStatus }));
      if (nextStatus) {
        toast.success('Live Consultation status is now ONLINE!');
      } else {
        toast.info('Live Consultation status is now OFFLINE.');
      }
    } catch (err) {
      toast.error('Failed to update availability status.');
    }
  };

  const totalEarningsAmt = parseFloat(earnings?.summary?.totalNetEarnings || 0);
  const availablePayoutAmt = parseFloat(earnings?.summary?.availableForWithdrawal || 0);
  const totalConsultationsCount = history.length || 10;
  const ratingScore = profile?.rating ? parseFloat(profile.rating).toFixed(1) : '5.0';

  return (
    <div className="expert-content-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Welcome & Status Command Hero Card */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)', 
          border: '1px solid #E2E8F0', 
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 8px 24px -4px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 800, 
                background: '#FFEDD5', 
                color: '#FF6B00', 
                border: '1px solid #FED7AA', 
                padding: '4px 10px', 
                borderRadius: '20px', 
                letterSpacing: '0.6px', 
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <IoShieldCheckmarkOutline style={{ fontSize: '13px' }} /> ASTROLOGER COMMAND CENTER
              </span>
              <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600 }}>
                <IoCalendarOutline style={{ verticalAlign: 'middle', marginRight: '4px', color: '#FF6B00' }} />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: '#0F172A', letterSpacing: '-0.3px' }}>
              Welcome back, {profile?.displayName || 'Acharya'}! 🙏
            </h1>
            <p style={{ fontSize: '13.5px', color: '#475569', margin: 0, maxWidth: '620px', lineHeight: '1.5' }}>
              Your real-time consultation control center. Manage incoming live chat & voice call requests, monitor earnings, and manage client readings.
            </p>
          </div>

          {/* Quick Live Switch and CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleToggleLiveStatus}
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: profile?.isOnline ? '#FF6B00' : '#64748B',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: profile?.isOnline ? '0 4px 14px rgba(22, 163, 74, 0.35)' : 'none'
              }}
            >
              <IoPulseOutline style={{ fontSize: '18px' }} />
              {profile?.isOnline ? 'Live Status: ONLINE' : 'Live Status: OFFLINE'}
            </button>

            <Link
              to="/expert/dashboard/live-chat"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                color: '#FF6B00',
                border: '1.5px solid #FF6B00',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <IoChatbubblesOutline style={{ fontSize: '17px' }} /> Open Live Chat
            </Link>

            <Link
              to="/expert/dashboard/live-call"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                color: '#2563EB',
                border: '1.5px solid #3B82F6',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <IoCallOutline style={{ fontSize: '17px' }} /> Live Call Room
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Auto-Schedule Live Timetable Ribbon */}
      <div style={{ 
        background: profile?.autoScheduleEnabled 
          ? 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)' 
          : '#FFFFFF', 
        border: profile?.autoScheduleEnabled ? '1px solid #FED7AA' : '1px solid #E2E8F0', 
        borderRadius: '14px',
        padding: '16px 22px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            background: profile?.autoScheduleEnabled ? '#FFEDD5' : '#F1F5F9', 
            color: profile?.autoScheduleEnabled ? '#FF6B00' : '#64748B', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '20px' 
          }}>
            <IoCalendarOutline />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: '#0F172A' }}>
                Auto-Live Weekly Schedule
              </h4>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: '12px', 
                background: profile?.autoScheduleEnabled ? '#FFEDD5' : '#F1F5F9', 
                color: profile?.autoScheduleEnabled ? '#FF6B00' : '#64748B',
                border: profile?.autoScheduleEnabled ? '1px solid #FED7AA' : '1px solid #CBD5E1'
              }}>
                {profile?.autoScheduleEnabled ? '⚡ Active (Automatic Live Shifts)' : '⏸️ Manual Live Mode'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748B' }}>
              {profile?.autoScheduleEnabled 
                ? 'Your account automatically switches Online & Offline according to your configured weekly shift schedule.'
                : 'Set your daily & weekly shifts so your profile goes Online & Offline automatically without manual logins.'}
            </p>
          </div>
        </div>

        <Link
          to="/expert/dashboard/schedule"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FF6B00',
            color: '#FFFFFF',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '13px',
            textDecoration: 'none',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(21, 128, 61, 0.2)'
          }}
        >
          <IoTimeOutline style={{ fontSize: '16px' }} /> Configure Timetable
        </Link>
      </div>

      {/* 3. Top 4 Elevated KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
        
        {/* Metric 1: Available Payout */}
        <div 
          style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: '14px', 
            padding: '20px 22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                AVAILABLE PAYOUT
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#FF6B00', marginTop: '6px', letterSpacing: '-0.5px' }}>
                ₹{availablePayoutAmt.toFixed(2)}
              </div>
            </div>
            <div style={{ background: '#FFEDD5', color: '#FF6B00', border: '1px solid #FED7AA', padding: '10px', borderRadius: '12px', fontSize: '22px', display: 'flex' }}>
              <IoCashOutline />
            </div>
          </div>
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Total: ₹{totalEarningsAmt.toFixed(2)}</span>
            <Link to="/expert/dashboard/withdrawals" style={{ fontSize: '12px', fontWeight: 700, color: '#FF6B00', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Withdraw <IoArrowForwardOutline />
            </Link>
          </div>
        </div>

        {/* Metric 2: Total Consultations */}
        <div 
          style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: '14px', 
            padding: '20px 22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                TOTAL CONSULTATIONS
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', marginTop: '6px', letterSpacing: '-0.5px' }}>
                {totalConsultationsCount}
              </div>
            </div>
            <div style={{ background: '#DBEAFE', color: '#2563EB', border: '1px solid #93C5FD', padding: '10px', borderRadius: '12px', fontSize: '22px', display: 'flex' }}>
              <IoChatbubblesOutline />
            </div>
          </div>
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#FF6B00', fontWeight: 700 }}>Active Today: {activeSessions.length}</span>
            <Link to="/expert/dashboard/chat-history" style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View History <IoArrowForwardOutline />
            </Link>
          </div>
        </div>

        {/* Metric 3: Client Satisfaction */}
        <div 
          style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: '14px', 
            padding: '20px 22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                CLIENT SATISFACTION
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '-0.5px' }}>
                <IoStar style={{ color: '#F59E0B', fontSize: '26px' }} />
                <span>{ratingScore}</span>
              </div>
            </div>
            <div style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', padding: '10px', borderRadius: '12px', fontSize: '22px', display: 'flex' }}>
              <IoSparklesOutline />
            </div>
          </div>
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>{profile?.totalReviews || 2} Verified Reviews</span>
            <span style={{ fontSize: '12px', color: '#FF6B00', fontWeight: 700 }}>100% Satisfied</span>
          </div>
        </div>

        {/* Metric 4: Consultation Rate */}
        <div 
          style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: '14px', 
            padding: '20px 22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                CONSULTATION RATE
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', marginTop: '6px', letterSpacing: '-0.5px' }}>
                ₹{profile?.pricePerMinute || 20} <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>/ min</span>
              </div>
            </div>
            <div style={{ background: '#EDE9FE', color: '#7C3AED', border: '1px solid #DDD6FE', padding: '10px', borderRadius: '12px', fontSize: '22px', display: 'flex' }}>
              <IoTrendingUpOutline />
            </div>
          </div>
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>{profile?.experienceYears || 5} Years Experience</span>
            <Link to="/expert/dashboard/create-profile" style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Edit Pricing <IoArrowForwardOutline />
            </Link>
          </div>
        </div>

      </div>

      {/* 4. Analytics & Interactive Visual Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        
        {/* Main Trajectory Line Chart */}
        <div 
          style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: '14px', 
            padding: '22px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex', 
            flexDirection: 'column' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: '0 0 3px 0', fontSize: '17px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IoBarChartOutline style={{ color: '#FF6B00', fontSize: '20px' }} />
                Consultation & Revenue Trajectory
              </h2>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748B' }}>
                Interactive daily & weekly trend analytics for seeker consultations.
              </p>
            </div>

            {/* Controls: Metric Switch & Time Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Metric Toggle */}
              <div style={{ background: '#F1F5F9', padding: '3px', borderRadius: '8px', display: 'flex' }}>
                <button
                  type="button"
                  onClick={() => setChartMetric('revenue')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: chartMetric === 'revenue' ? '#FF6B00' : 'transparent',
                    color: chartMetric === 'revenue' ? '#ffffff' : '#475569',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ₹ Revenue
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('sessions')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: chartMetric === 'sessions' ? '#FF6B00' : 'transparent',
                    color: chartMetric === 'sessions' ? '#ffffff' : '#475569',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Sessions
                </button>
              </div>

              {/* Time Range Filter */}
              <div style={{ background: '#F1F5F9', borderRadius: '8px', padding: '3px', display: 'flex' }}>
                <button
                  type="button"
                  onClick={() => setTimeRange('7days')}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: timeRange === '7days' ? '#0F172A' : 'transparent',
                    color: timeRange === '7days' ? '#ffffff' : '#64748B'
                  }}
                >
                  7D
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange('30days')}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: timeRange === '30days' ? '#0F172A' : 'transparent',
                    color: timeRange === '30days' ? '#ffffff' : '#64748B'
                  }}
                >
                  30D
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange('year')}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: timeRange === 'year' ? '#0F172A' : 'transparent',
                    color: timeRange === 'year' ? '#ffffff' : '#64748B'
                  }}
                >
                  1Y
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Chart Container */}
          <div style={{ position: 'relative', height: '270px', width: '100%', marginTop: 'auto' }}>
            <canvas ref={lineChartRef} />
          </div>
        </div>

        {/* Specialty Distribution Doughnut Chart */}
        <div 
          style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: '14px', 
            padding: '22px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex', 
            flexDirection: 'column' 
          }}
        >
          <div style={{ marginBottom: '10px' }}>
            <h2 style={{ margin: '0 0 3px 0', fontSize: '17px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IoPieChartOutline style={{ color: '#2563EB', fontSize: '20px' }} />
              Consultation Disciplines Breakdown
            </h2>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748B' }}>
              Distribution of seeker readings across your astrology specialties.
            </p>
          </div>

          <div style={{ position: 'relative', height: '270px', width: '100%', marginTop: 'auto' }}>
            <canvas ref={doughnutChartRef} />
          </div>
        </div>

      </div>

      {/* 5. Fast Action Shortcuts Grid */}
      <div 
        style={{ 
          background: '#FFFFFF', 
          border: '1px solid #E2E8F0', 
          borderRadius: '14px', 
          padding: '18px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IoFlashOutline style={{ color: '#FF6B00', fontSize: '20px' }} />
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Quick Management Tools:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link 
              to="/expert/dashboard/live-chat" 
              style={{ 
                padding: '8px 16px', 
                fontSize: '13px', 
                background: '#FF6B00', 
                color: '#ffffff', 
                borderRadius: '8px', 
                fontWeight: 700, 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                boxShadow: '0 2px 6px rgba(21, 128, 61, 0.2)'
              }}
            >
              <IoChatbubblesOutline /> Start Live Chat
            </Link>

            <Link 
              to="/expert/dashboard/live-call" 
              style={{ 
                padding: '8px 16px', 
                fontSize: '13px', 
                background: '#2563EB', 
                color: '#ffffff', 
                borderRadius: '8px', 
                fontWeight: 700, 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)'
              }}
            >
              <IoCallOutline /> Live Voice Call
            </Link>

            <Link 
              to="/expert/dashboard/withdrawals" 
              style={{ 
                padding: '8px 15px', 
                fontSize: '13px', 
                background: '#F8FAFC', 
                color: '#0F172A', 
                border: '1px solid #CBD5E1', 
                borderRadius: '8px', 
                fontWeight: 700, 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px'
              }}
            >
              <IoCashOutline /> Payouts
            </Link>

            <Link 
              to="/expert/dashboard/mailbox" 
              style={{ 
                padding: '8px 15px', 
                fontSize: '13px', 
                background: '#F8FAFC', 
                color: '#0F172A', 
                border: '1px solid #CBD5E1', 
                borderRadius: '8px', 
                fontWeight: 700, 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px'
              }}
            >
              <IoMailOutline /> Mailbox {unreadMailCount > 0 && `(${unreadMailCount})`}
            </Link>

            <Link 
              to="/expert/dashboard/create-profile" 
              style={{ 
                padding: '8px 15px', 
                fontSize: '13px', 
                background: '#F8FAFC', 
                color: '#0F172A', 
                border: '1px solid #CBD5E1', 
                borderRadius: '8px', 
                fontWeight: 700, 
                textDecoration: 'none'
              }}
            >
              Edit Profile
            </Link>

            <Link 
              to={`/expert/${profile?.id || ''}`} 
              target="_blank" 
              style={{ 
                padding: '8px 15px', 
                fontSize: '13px', 
                background: '#F8FAFC', 
                color: '#FF6B00', 
                border: '1px solid #FED7AA', 
                borderRadius: '8px', 
                fontWeight: 700, 
                textDecoration: 'none'
              }}
            >
              Public Profile ↗
            </Link>
          </div>
        </div>
      </div>

      {/* 6. Two Columns: Recent Consultations & Mailbox Center */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Column 1: Recent Consultations Log */}
        <div 
          style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: '14px', 
            padding: '22px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: '0 0 3px 0', fontSize: '16.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IoTimeOutline style={{ color: '#FF6B00', fontSize: '19px' }} />
                Recent Consultations
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Last completed seeker readings.</p>
            </div>
            <Link to="/expert/dashboard/chat-history" style={{ fontSize: '12.5px', fontWeight: 700, color: '#FF6B00', textDecoration: 'none' }}>
              View All History →
            </Link>
          </div>

          {history.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '12px 14px', 
                    background: '#F8FAFC', 
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      background: '#FFEDD5', 
                      color: '#FF6B00', 
                      border: '1.5px solid #FED7AA', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 800, 
                      fontSize: '13px' 
                    }}>
                      {(item.customerName || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                        {item.customerName || 'Seeker Client'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'} • {item.durationMinutes || 5} mins
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#FF6B00' }}>
                      +₹{parseFloat(item.expertEarnings || 80).toFixed(2)}
                    </div>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', background: '#FFEDD5', color: '#FF6B00', border: '1px solid #FED7AA' }}>
                      COMPLETED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B', fontSize: '13px', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
              No completed consultations yet. Go Online to begin receiving seekers!
            </div>
          )}
        </div>

        {/* Column 2: Platform Notices & Seeker Clients */}
        <div 
          style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: '14px', 
            padding: '22px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: '0 0 3px 0', fontSize: '16.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IoMailOutline style={{ color: '#2563EB', fontSize: '19px' }} />
                Mailbox & Notices
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Administrative announcements and client alerts.</p>
            </div>
            <Link to="/expert/dashboard/mailbox" style={{ fontSize: '12.5px', fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>
              Open Mailbox →
            </Link>
          </div>

          {mailbox.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mailbox.slice(0, 4).map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    background: msg.isRead ? '#FFFFFF' : '#FFF7ED',
                    borderLeft: msg.isRead ? '1px solid #E2E8F0' : '4px solid #FF6B00',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                      {msg.title || 'Platform Notice'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.body || 'No details provided.'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B', fontSize: '13px', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
              Your mailbox is empty. All systems operational!
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
