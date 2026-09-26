const { executeProcedure } = require('../config/db');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Get current time details in IST (Asia/Kolkata) or system timezone
 */
function getCurrentIstTime() {
    const now = new Date();
    // Use Intl to get accurate IST day and HH:mm
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(now);
    let dayName = '';
    let hour = '';
    let minute = '';

    for (const p of parts) {
        if (p.type === 'weekday') dayName = p.value;
        if (p.type === 'hour') hour = p.value.padStart(2, '0');
        if (p.type === 'minute') minute = p.value.padStart(2, '0');
    }

    if (hour === '24') hour = '00';
    const currentTimeStr = `${hour}:${minute}`;

    const dayIndex = DAY_NAMES.findIndex(d => d.toLowerCase() === dayName.toLowerCase());

    return {
        dayName,
        dayIndex: dayIndex >= 0 ? dayIndex : now.getDay(),
        currentTimeStr
    };
}

/**
 * Check if the expert's schedule is active at the current moment
 */
function isScheduleActiveNow(weeklyScheduleRaw) {
    if (!weeklyScheduleRaw) return { isActive: false, reason: 'No schedule configured' };

    let scheduleList = [];
    try {
        scheduleList = typeof weeklyScheduleRaw === 'string' ? JSON.parse(weeklyScheduleRaw) : weeklyScheduleRaw;
    } catch (e) {
        return { isActive: false, reason: 'Invalid JSON' };
    }

    if (!Array.isArray(scheduleList) || scheduleList.length === 0) {
        return { isActive: false, reason: 'Empty schedule list' };
    }

    const { dayName, dayIndex, currentTimeStr } = getCurrentIstTime();

    // Find entry for today
    const todayEntry = scheduleList.find(item => 
        (item.dayName && item.dayName.toLowerCase() === dayName.toLowerCase()) ||
        item.dayIndex === dayIndex ||
        item.day === dayIndex
    );

    if (!todayEntry) {
        return { isActive: false, dayName, currentTimeStr, reason: 'No schedule for today' };
    }

    if (!todayEntry.enabled && !todayEntry.isEnabled) {
        return { isActive: false, dayName, currentTimeStr, reason: 'Today is disabled' };
    }

    // Support both multiple slots `slots: [{ startTime, endTime }]` or direct `startTime, endTime`
    const slots = Array.isArray(todayEntry.slots) && todayEntry.slots.length > 0
        ? todayEntry.slots
        : [{ startTime: todayEntry.startTime || '09:00', endTime: todayEntry.endTime || '21:00' }];

    for (const slot of slots) {
        const start = (slot.startTime || '00:00').trim();
        const end = (slot.endTime || '23:59').trim();

        if (start <= end) {
            // Normal same-day slot (e.g. 14:30 to 16:30)
            if (currentTimeStr >= start && currentTimeStr < end) {
                return {
                    isActive: true,
                    dayName,
                    currentTimeStr,
                    activeSlot: slot
                };
            }
        } else {
            // Overnight slot (e.g. 22:00 to 02:00)
            if (currentTimeStr >= start || currentTimeStr < end) {
                return {
                    isActive: true,
                    dayName,
                    currentTimeStr,
                    activeSlot: slot
                };
            }
        }
    }

    return {
        isActive: false,
        dayName,
        currentTimeStr,
        reason: 'Outside scheduled shift hours'
    };
}

/**
 * Evaluate and synchronize all auto-schedule experts
 */
async function evaluateAllAutoSchedules(io) {
    try {
        const result = await executeProcedure('dbo.sp_GetAllAutoScheduleExperts', {});
        const experts = result.recordset || [];

        if (experts.length === 0) return;

        for (const expert of experts) {
            const { isActive, dayName, currentTimeStr, activeSlot } = isScheduleActiveNow(expert.weeklySchedule);

            const isCurrentlyOnline = Boolean(expert.isOnline);

            if (isActive && !isCurrentlyOnline) {
                // Auto Turn ON
                await executeProcedure('dbo.sp_SetExpertOnlineByProfileId', {
                    ExpertId: expert.expertId,
                    IsOnline: 1
                });

                console.log(`🟢 [Auto-Scheduler] Expert "${expert.displayName}" (ID: ${expert.expertId}) turned AUTO-ONLINE at ${currentTimeStr} (${dayName} shift: ${activeSlot?.startTime}-${activeSlot?.endTime})`);

                if (io) {
                    io.emit('expert:presence', { expertUserId: expert.userId, expertId: expert.expertId, isOnline: true });
                    io.emit('expertAvailabilityChanged', { expertId: expert.expertId, isOnline: true, autoScheduled: true });
                }
            } else if (!isActive && isCurrentlyOnline) {
                // Auto Turn OFF
                await executeProcedure('dbo.sp_SetExpertOnlineByProfileId', {
                    ExpertId: expert.expertId,
                    IsOnline: 0
                });

                console.log(`🔴 [Auto-Scheduler] Expert "${expert.displayName}" (ID: ${expert.expertId}) turned AUTO-OFFLINE at ${currentTimeStr} (${dayName} shift ended)`);

                if (io) {
                    io.emit('expert:presence', { expertUserId: expert.userId, expertId: expert.expertId, isOnline: false });
                    io.emit('expertAvailabilityChanged', { expertId: expert.expertId, isOnline: false, autoScheduled: true });
                }
            }
        }
    } catch (err) {
        console.error('⚠️ [Auto-Scheduler Error]:', err.message);
    }
}

/**
 * Start recurring background scheduler
 */
let schedulerIntervalId = null;

function startScheduleRunner(io) {
    if (schedulerIntervalId) {
        clearInterval(schedulerIntervalId);
    }

    console.log('⏱️ [Auto-Scheduler] Expert Weekly Availability Runner initialized (Checking every 30s)...');

    // Run immediately on boot
    evaluateAllAutoSchedules(io);

    // Run every 30 seconds
    schedulerIntervalId = setInterval(() => {
        evaluateAllAutoSchedules(io);
    }, 30000);
}

module.exports = {
    getCurrentIstTime,
    isScheduleActiveNow,
    evaluateAllAutoSchedules,
    startScheduleRunner
};
