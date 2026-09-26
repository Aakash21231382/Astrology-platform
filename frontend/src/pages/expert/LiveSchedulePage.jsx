import React, { useState, useEffect } from 'react';
import { 
  IoTimeOutline, 
  IoCalendarOutline, 
  IoCheckmarkCircle, 
  IoCloseCircle, 
  IoFlashOutline, 
  IoSaveOutline, 
  IoSparklesOutline, 
  IoInformationCircleOutline,
  IoCopyOutline,
  IoSunnyOutline,
  IoMoonOutline
} from 'react-icons/io5';
import { expertService } from '../../services/api';
import { toast } from 'react-toastify';
import '../../assets/css/expert-schedule.css';

const DEFAULT_DAYS = [
  { dayIndex: 1, dayName: 'Monday', enabled: true, startTime: '09:00', endTime: '21:00' },
  { dayIndex: 2, dayName: 'Tuesday', enabled: true, startTime: '09:00', endTime: '21:00' },
  { dayIndex: 3, dayName: 'Wednesday', enabled: true, startTime: '09:00', endTime: '21:00' },
  { dayIndex: 4, dayName: 'Thursday', enabled: true, startTime: '09:00', endTime: '21:00' },
  { dayIndex: 5, dayName: 'Friday', enabled: true, startTime: '09:00', endTime: '21:00' },
  { dayIndex: 6, dayName: 'Saturday', enabled: true, startTime: '10:00', endTime: '22:00' },
  { dayIndex: 0, dayName: 'Sunday', enabled: true, startTime: '14:30', endTime: '16:30' }
];

export default function LiveSchedulePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(false);
  const [schedule, setSchedule] = useState(DEFAULT_DAYS);
  const [expertData, setExpertData] = useState(null);

  // Load schedule from API
  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await expertService.getSchedule();
      if (res.data?.data) {
        const d = res.data.data;
        setExpertData(d);
        setAutoScheduleEnabled(Boolean(d.autoScheduleEnabled));

        if (Array.isArray(d.weeklySchedule) && d.weeklySchedule.length > 0) {
          // Merge with default days to ensure all 7 days exist
          const merged = DEFAULT_DAYS.map(def => {
            const found = d.weeklySchedule.find(s => 
              (s.dayName && s.dayName.toLowerCase() === def.dayName.toLowerCase()) || 
              s.dayIndex === def.dayIndex
            );
            if (found) {
              return {
                ...def,
                ...found,
                enabled: found.enabled !== undefined ? Boolean(found.enabled) : Boolean(found.isEnabled)
              };
            }
            return def;
          });
          setSchedule(merged);
        }
      }
    } catch (err) {
      console.error('Failed to load schedule:', err);
      toast.error('Could not load current availability schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (idx) => {
    setSchedule(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], enabled: !copy[idx].enabled };
      return copy;
    });
  };

  const handleTimeChange = (idx, field, value) => {
    setSchedule(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  // Quick Preset: Apply to all active days
  const handleApplyPreset = (startTime, endTime) => {
    setSchedule(prev => prev.map(d => ({
      ...d,
      enabled: true,
      startTime,
      endTime
    })));
    toast.info(`Preset applied: ${startTime} to ${endTime} for all days`);
  };

  // Copy Monday schedule to all weekdays
  const handleCopyMondayToWeekdays = () => {
    const monday = schedule.find(d => d.dayName === 'Monday') || schedule[0];
    setSchedule(prev => prev.map(d => {
      if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(d.dayName)) {
        return {
          ...d,
          enabled: monday.enabled,
          startTime: monday.startTime,
          endTime: monday.endTime
        };
      }
      return d;
    }));
    toast.success('Monday schedule copied to all weekdays (Tue-Fri)!');
  };

  // Save Schedule
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        autoScheduleEnabled,
        weeklySchedule: schedule
      };
      const res = await expertService.updateSchedule(payload);
      toast.success(res.data?.message || 'Schedule & Auto-Live updated successfully!');
      if (res.data?.data) {
        setExpertData(res.data.data);
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      toast.error('Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Helper to calculate hours between times
  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Overnight
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (mins === 0) return `${hours} hrs`;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="expert-schedule-loading">
        <div className="schedule-spinner"></div>
        <p>Loading your weekly availability schedule...</p>
      </div>
    );
  }

  return (
    <div className="expert-schedule-page">
      {/* Page Header */}
      <div className="schedule-header-card">
        <div className="schedule-header-left">
          <div className="schedule-icon-badge">
            <IoTimeOutline />
          </div>
          <div>
            <h1 className="schedule-title">Weekly Live Hours & Auto-Availability</h1>
            <p className="schedule-subtitle">
              Set your recurring online shift timings. When Auto-Schedule is enabled, your profile automatically goes 
              <strong> ONLINE</strong> at your scheduled time and <strong>OFFLINE</strong> when your shift ends.
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="schedule-current-status-box">
          <div className="status-label">Real-time Presence:</div>
          <div className={`status-pill ${expertData?.isOnline ? 'online' : 'offline'}`}>
            <span className="pulse-dot"></span>
            <span>{expertData?.isOnline ? 'Currently LIVE' : 'Currently OFFLINE'}</span>
          </div>
          {autoScheduleEnabled && (
            <div className="auto-badge">
              <IoFlashOutline /> Auto-Schedule Active
            </div>
          )}
        </div>
      </div>

      {/* Master Toggle Banner */}
      <div className={`master-toggle-card ${autoScheduleEnabled ? 'enabled' : 'disabled'}`}>
        <div className="master-toggle-content">
          <div className="master-toggle-icon">
            <IoSparklesOutline />
          </div>
          <div>
            <h3>Automatic Online/Offline Switch</h3>
            <p>
              {autoScheduleEnabled 
                ? '✅ Auto-Schedule is ENABLED. The server will automatically toggle your live status according to your timetable below.'
                : '⏸️ Auto-Schedule is DISABLED. You are currently in manual online/offline mode.'}
            </p>
          </div>
        </div>

        <label className="toggle-switch-wrapper">
          <input 
            type="checkbox" 
            checked={autoScheduleEnabled} 
            onChange={(e) => setAutoScheduleEnabled(e.target.checked)} 
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Quick Presets Toolbar */}
      <div className="presets-toolbar">
        <span className="presets-label">Quick Shift Presets:</span>
        <div className="preset-buttons-group">
          <button 
            type="button" 
            className="preset-btn"
            onClick={() => handleApplyPreset('09:00', '21:00')}
          >
            <IoSunnyOutline /> Standard (9 AM - 9 PM)
          </button>
          <button 
            type="button" 
            className="preset-btn"
            onClick={() => handleApplyPreset('18:00', '23:30')}
          >
            <IoMoonOutline /> Evening Peak (6 PM - 11:30 PM)
          </button>
          <button 
            type="button" 
            className="preset-btn"
            onClick={() => handleApplyPreset('00:00', '23:59')}
          >
            <IoFlashOutline /> 24/7 Available
          </button>
          <button 
            type="button" 
            className="preset-btn secondary"
            onClick={handleCopyMondayToWeekdays}
          >
            <IoCopyOutline /> Copy Monday to Weekdays
          </button>
        </div>
      </div>

      {/* 7-Day Timetable Grid */}
      <div className="schedule-timetable-card">
        <div className="timetable-header">
          <div className="col-day">Day of Week</div>
          <div className="col-status">Shift Status</div>
          <div className="col-start">Start Time (Live On)</div>
          <div className="col-end">End Time (Live Off)</div>
          <div className="col-duration">Total Shift</div>
        </div>

        <div className="timetable-body">
          {schedule.map((item, idx) => (
            <div 
              key={item.dayName} 
              className={`timetable-row ${item.enabled ? 'active-day' : 'off-day'}`}
            >
              {/* Day Name */}
              <div className="col-day">
                <div className="day-name-wrapper">
                  <span className="day-dot"></span>
                  <strong>{item.dayName}</strong>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="col-status">
                <button
                  type="button"
                  onClick={() => handleToggleDay(idx)}
                  className={`day-toggle-btn ${item.enabled ? 'enabled' : 'disabled'}`}
                >
                  {item.enabled ? (
                    <>
                      <IoCheckmarkCircle />
                      <span>Available</span>
                    </>
                  ) : (
                    <>
                      <IoCloseCircle />
                      <span>Day Off</span>
                    </>
                  )}
                </button>
              </div>

              {/* Start Time */}
              <div className="col-start">
                <div className="time-input-group">
                  <IoTimeOutline className="input-clock-icon" />
                  <input
                    type="time"
                    value={item.startTime || '09:00'}
                    disabled={!item.enabled}
                    onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                    className="time-picker-input"
                  />
                </div>
              </div>

              {/* End Time */}
              <div className="col-end">
                <div className="time-input-group">
                  <IoTimeOutline className="input-clock-icon" />
                  <input
                    type="time"
                    value={item.endTime || '21:00'}
                    disabled={!item.enabled}
                    onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                    className="time-picker-input"
                  />
                </div>
              </div>

              {/* Duration Badge */}
              <div className="col-duration">
                {item.enabled ? (
                  <span className="shift-duration-badge">
                    {calculateDuration(item.startTime, item.endTime)}
                  </span>
                ) : (
                  <span className="shift-off-badge">Closed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="schedule-actions-bar">
        <div className="action-info">
          <IoInformationCircleOutline />
          <span>Any changes made will take effect immediately in our real-time scheduler.</span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-save-schedule"
        >
          <IoSaveOutline />
          <span>{saving ? 'Applying Schedule...' : 'Save & Activate Weekly Schedule'}</span>
        </button>
      </div>
    </div>
  );
}
