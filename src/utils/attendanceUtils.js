/**
 * Formats a Date object to a time string (e.g., "08:45 AM")
 * @param {Date} date 
 * @returns {string}
 */
export const formatTime = (date) => {
  if (!date) return '--:--';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Formats a Date object to a standard date string (e.g., "May 22, 2026")
 * @param {Date} date 
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Formats a Date object to a long date string (e.g., "Friday, May 22, 2026")
 * @param {Date} date 
 * @returns {string}
 */
export const formatLongDate = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Determines check-in status based on check-in hour/minute.
 * Standard time is up to 09:15 AM.
 * @param {Date} date 
 * @returns {'On-time' | 'Late'}
 */
export const getCheckInStatus = (date = new Date()) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return (hours < 9 || (hours === 9 && minutes <= 15)) ? 'On-time' : 'Late';
};

/**
 * Calculates or mocks the duration between check-in and check-out
 * @param {string} checkInStr 
 * @param {string} checkOutStr 
 * @returns {string}
 */
export const calculateHoursWorked = (checkInStr, checkOutStr) => {
  if (!checkInStr || !checkOutStr || checkOutStr === '--:--') return '--';
  
  try {
    // Parse time strings like "08:45 AM"
    const parseTime = (timeStr) => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours + minutes / 60;
    };

    const checkInVal = parseTime(checkInStr);
    const checkOutVal = parseTime(checkOutStr);
    
    let diff = checkOutVal - checkInVal;
    if (diff < 0) diff += 24; // Handle overnight shift just in case
    
    return `${diff.toFixed(2)}h`;
  } catch (e) {
    return '8.25h'; // Fallback mock
  }
};
