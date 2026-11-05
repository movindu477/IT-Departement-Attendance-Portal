/**
 * Calculates stats and downloads logs formatted as CSV.
 * @param {Array} logs 
 * @returns {string}
 */
export const convertLogsToCSV = (logs = []) => {
  const headers = ['Date', 'IN', 'OUT', 'Reason / Status'];
  const rows = logs.map(log => [
    `"${log.date}"`,
    `"${log.checkIn || '—'}"`,
    `"${log.checkOut || '—'}"`,
    `"${log.reason || log.status || '—'}"`
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

/**
 * Downloads a file in browser.
 */
export const downloadFile = (content, fileName, mimeType = 'text/csv;charset=utf-8;') => {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
