/**
 * Calculates summary statistics based on logs.
 * @param {Array} logs 
 * @returns {Object}
 */
export const getSummaryStats = (logs = []) => {
  if (logs.length === 0) {
    return {
      averageArrival: '08:52 AM',
      attendanceRate: '100%',
      onTimeCount: 0,
      totalHours: '0h'
    };
  }

  let totalMinutes = 0;
  let parsedLogCount = 0;
  let onTimeCount = 0;
  let hoursSum = 0;

  logs.forEach(log => {
    // Average arrival calculation (for logs with checkIn time)
    if (log.checkIn && log.checkIn !== '--:--') {
      try {
        const [time, modifier] = log.checkIn.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        totalMinutes += hours * 60 + minutes;
        parsedLogCount++;
      } catch (e) {
        // Ignore parsing errors
      }
    }

    if (log.status === 'On-time') {
      onTimeCount++;
    }

    if (log.hours && log.hours !== '--') {
      const parsedHours = parseFloat(log.hours);
      if (!isNaN(parsedHours)) {
        hoursSum += parsedHours;
      }
    }
  });

  let averageArrival = '08:52 AM';
  if (parsedLogCount > 0) {
    const avgMinutesTotal = Math.round(totalMinutes / parsedLogCount);
    let avgHours = Math.floor(avgMinutesTotal / 60);
    const avgMinutes = avgMinutesTotal % 60;
    const ampm = avgHours >= 12 ? 'PM' : 'AM';
    avgHours = avgHours % 12;
    avgHours = avgHours ? avgHours : 12; // the hour '0' should be '12'
    const strMinutes = avgMinutes < 10 ? '0' + avgMinutes : avgMinutes;
    const strHours = avgHours < 10 ? '0' + avgHours : avgHours;
    averageArrival = `${strHours}:${strMinutes} ${ampm}`;
  }

  const attendanceRate = logs.length > 0 
    ? ((onTimeCount / logs.length) * 100).toFixed(1) + '%' 
    : '100%';

  return {
    averageArrival,
    attendanceRate,
    onTimeCount,
    totalHours: `${hoursSum.toFixed(1)}h`
  };
};

/**
 * structure logs into a downloadable CSV string.
 * @param {Array} logs 
 * @returns {string}
 */
export const convertLogsToCSV = (logs = []) => {
  const headers = ['Date', 'Check In', 'Check Out', 'Status', 'Hours'];
  const rows = logs.map(log => [
    `"${log.date}"`,
    `"${log.checkIn}"`,
    `"${log.checkOut}"`,
    `"${log.status}"`,
    `"${log.hours}"`
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

/**
 * Downloads a text/CSV file in the browser.
 * @param {string} content 
 * @param {string} fileName 
 * @param {string} mimeType 
 */
export const downloadFile = (content, fileName, mimeType = 'text/csv;charset=utf-8;') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
