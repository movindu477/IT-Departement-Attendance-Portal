/**
 * calculates stats and downloads logs formatted as CSV.
 * @param {Array} logs 
 * @returns {string}
 */
export const convertLogsToCSV = (logs = []) => {
  const headers = ['Date', 'Day', 'IN', 'OUT', 'Hours', 'Salary (Rs.)', 'Reason / Status'];
  const rows = logs.map(log => [
    `"${log.date}"`,
    `"${log.dayOfWeek}"`,
    `"${log.checkIn || '—'}"`,
    `"${log.checkOut || '—'}"`,
    `"${log.hours || '—'}"`,
    `"${log.salary ? 'Rs. ' + log.salary : '—'}"`,
    `"${log.reason || log.status || '—'}"`
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

/**
 * Downloads a file in browser.
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

/**
 * Compiles a structured HTML document matching the third image's layout
 * and triggers download as an MS Word (.doc) document.
 * @param {Array} daysList - full monthly days grid
 * @param {string} monthName 
 * @param {number} year 
 * @param {string} totalHours 
 * @param {string} totalSalary 
 */
export const exportSalarySheetToWord = (daysList = [], monthName, year, totalHours, totalSalary) => {
  // Generate HTML content with Word-compatible CSS styling
  let tableRows = '';
  
  daysList.forEach((day, index) => {
    const isWeekend = day.status === 'Weekend';
    let rowContent = '';
    
    if (isWeekend) {
      rowContent = `
        <tr style="background-color: #FFFF00; font-family: 'Arial', sans-serif; font-size: 11pt;">
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; color: #505050;">${day.dateNum}-${monthName.slice(0, 3)}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; color: #505050;">${day.dayOfWeek}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center; color: #808080;">—</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center; color: #808080;">—</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center; color: #808080;">—</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center; color: #808080;">—</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; font-weight: bold; color: #d0a000;">${day.dayOfWeek === 'Sat' ? 'Saturday — Weekend' : 'Sunday — Weekend'}</td>
        </tr>
      `;
    } else {
      const hoursLogged = day.hours && day.hours !== '0.00' ? day.hours : '—';
      const salaryLogged = day.salary && day.salary > 0 ? `Rs. ${day.salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
      const reasonText = day.reason || (day.status === 'Absent' ? 'Absent' : '—');
      const inTime = day.checkIn || '—';
      const outTime = day.checkOut || '—';
      
      const isAbsent = day.status === 'Absent';
      const textStyle = isAbsent ? 'color: #e11d48;' : '';
      
      tableRows += `
        <tr style="font-family: 'Arial', sans-serif; font-size: 11pt;">
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; font-weight: bold;">${day.dateNum}-${monthName.slice(0, 3)}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; font-weight: bold;">${day.dayOfWeek}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center;">${inTime}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center;">${outTime}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center; font-weight: bold;">${hoursLogged}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; font-weight: bold;">${salaryLogged}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; ${textStyle}">${reasonText}</td>
        </tr>
      `;
      return;
    }
    tableRows += rowContent;
  });

  const docHTML = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>Salary Sheet - ${monthName} ${year}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: A4;
          margin: 1in;
        }
        body {
          font-family: 'Arial', sans-serif;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th {
          background-color: #000000;
          color: #ffffff;
          font-family: 'Arial', sans-serif;
          font-size: 11pt;
          font-weight: bold;
          text-align: left;
          padding: 8px;
          border: 1px solid #000000;
        }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-family: 'Arial', sans-serif; font-size: 16pt; font-weight: bold; margin: 0;">APIIT Attendance & Salary Sheet</h2>
        <p style="font-family: 'Arial', sans-serif; font-size: 11pt; color: #505050; margin: 5px 0 0 0;">Month: ${monthName} ${year} | Rate: Rs. 240.00 / Hour</p>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">#</th>
            <th style="width: 12%;">Date</th>
            <th style="width: 10%;">Day</th>
            <th style="width: 12%; text-align: center;">IN</th>
            <th style="width: 12%; text-align: center;">OUT</th>
            <th style="width: 12%; text-align: center;">Hours</th>
            <th style="width: 18%;">Salary (Rs.)</th>
            <th style="width: 29%;">Reason / Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <!-- Total Row -->
          <tr style="font-family: 'Arial', sans-serif; font-size: 11pt; font-weight: bold;">
            <td colspan="3" style="background-color: #8cdb44; border: 1px solid #c0c0c0; padding: 8px; text-align: center; color: #000000; font-weight: bold; font-size: 11pt;">TOTAL</td>
            <td style="border: 1px solid #c0c0c0; padding: 8px; text-align: center;">—</td>
            <td style="border: 1px solid #c0c0c0; padding: 8px; text-align: center;">—</td>
            <td style="border: 1px solid #c0c0c0; padding: 8px; text-align: center; font-size: 12pt;">${totalHours}</td>
            <td style="border: 1px solid #c0c0c0; padding: 8px; font-size: 12pt; color: #15803d;">Rs. ${totalSalary}</td>
            <td style="border: 1px solid #c0c0c0; padding: 8px; color: #505050;">Calculated at Rs. 240/hr</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + docHTML], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Salary_Sheet_${monthName}_${year}.doc`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
