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
 * Compiles a structured HTML document matching the spreadsheet layout
 * and triggers download as an MS Excel (.xls) document configured to fit on one page.
 * @param {Array} daysList - full monthly days grid
 * @param {string} monthName 
 * @param {number} year 
 * @param {string} totalHours 
 * @param {string} totalSalary 
 */
export const exportSalarySheetToExcel = (daysList = [], monthName, year, totalHours, totalSalary) => {
  let tableRows = '';
  
  daysList.forEach((day, index) => {
    const isWeekend = day.status === 'Weekend';
    const isDayOff = day.status === 'Day Off';
    let rowContent = '';
    
    if (isWeekend) {
      rowContent = `
        <tr style="background-color: #EF401D; font-family: 'Arial', sans-serif; font-size: 11pt; color: #ffffff;">
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; color: #ffffff; font-weight: bold; text-align: left;">${day.dateNum}-${monthName.slice(0, 3)}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; color: #ffffff; font-weight: bold; text-align: left;">${day.dayOfWeek}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center; color: #fecdd3;">—</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center; color: #fecdd3;">—</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center; color: #fecdd3;">—</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center; color: #fecdd3;">—</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; font-weight: bold; color: #ffffff; text-align: left;">${day.dayOfWeek === 'Sat' ? 'Saturday — Weekend' : 'Sunday — Weekend'}</td>
        </tr>
      `;
    } else if (isDayOff) {
      rowContent = `
        <tr style="background-color: #E0E7FF; font-family: 'Arial', sans-serif; font-size: 11pt;">
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; color: #000000; font-weight: bold; text-align: left;">${day.dateNum}-${monthName.slice(0, 3)}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; color: #000000; font-weight: bold; text-align: left;">${day.dayOfWeek}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center; color: #808080;">—</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center; color: #808080;">—</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center; color: #808080;">—</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center; color: #808080;">—</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; font-weight: bold; color: #4f46e5; text-align: left;">Day Off — ${day.reason || 'Not Working'}</td>
        </tr>
      `;
    } else {
      const hoursLogged = day.hours && day.hours !== '0.00' ? day.hours : '—';
      const salaryLogged = day.salary && day.salary > 0 ? `Rs. ${day.salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
      const reasonText = day.reason || (day.status === 'Absent' ? 'Absent' : '—');
      const inTime = day.checkIn || '—';
      const outTime = day.checkOut || '—';
      
      const isAbsent = day.status === 'Absent';
      const textStyle = isAbsent ? 'color: #e11d48; font-weight: bold;' : '';
      
      rowContent = `
        <tr style="font-family: 'Arial', sans-serif; font-size: 11pt;">
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; font-weight: bold; text-align: left;">${day.dateNum}-${monthName.slice(0, 3)}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; font-weight: bold; text-align: left;">${day.dayOfWeek}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center;">${inTime}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center;">${outTime}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: center; font-weight: bold;">${hoursLogged}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; font-weight: bold; text-align: left;">${salaryLogged}</td>
          <td style="border: 1px solid #c0c0c0; padding: 6px; text-align: left; ${textStyle}">${reasonText}</td>
        </tr>
      `;
    }
    tableRows += rowContent;
  });

  const excelHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <title>Attendance & Salary Sheet - ${monthName} ${year}</title>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Attendance Statement</x:Name>
              <x:WorksheetOptions>
                <x:FitToPage/>
                <x:Print>
                  <x:FitWidth>1</x:FitWidth>
                  <x:FitHeight>1</x:FitHeight>
                  <x:ValidPrinterInfo/>
                </x:Print>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: portrait;
          margin: 0.5in;
        }
        body {
          font-family: 'Arial', sans-serif;
        }
        table {
          border-collapse: collapse;
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
      <table border="1" style="border-collapse: collapse;">
        <thead>
          <tr style="height: 35px; background-color: #ffffff;">
            <th colspan="8" style="background-color: #ffffff; color: #000000; font-family: 'Arial', sans-serif; font-size: 14pt; font-weight: bold; text-align: center; border: none; padding: 10px 0;">
              APIIT Attendance & Salary Sheet
            </th>
          </tr>
          <tr style="height: 20px; background-color: #ffffff;">
            <th colspan="8" style="background-color: #ffffff; color: #505050; font-family: 'Arial', sans-serif; font-size: 10pt; font-weight: normal; text-align: center; border: none; padding-bottom: 15px;">
              Month: ${monthName} ${year} | Rate: Rs. 240.00 / Hour
            </th>
          </tr>
          <tr style="height: 25px;">
            <th style="width: 40px; text-align: center; background-color: #000000; color: #ffffff;">#</th>
            <th style="width: 100px; text-align: left; background-color: #000000; color: #ffffff;">Date</th>
            <th style="width: 80px; text-align: left; background-color: #000000; color: #ffffff;">Day</th>
            <th style="width: 70px; text-align: center; background-color: #000000; color: #ffffff;">IN</th>
            <th style="width: 70px; text-align: center; background-color: #000000; color: #ffffff;">OUT</th>
            <th style="width: 70px; text-align: center; background-color: #000000; color: #ffffff;">Hours</th>
            <th style="width: 120px; text-align: left; background-color: #000000; color: #ffffff;">Salary (Rs.)</th>
            <th style="width: 200px; text-align: left; background-color: #000000; color: #ffffff;">Reason / Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <!-- Total Row -->
          <tr style="font-family: 'Arial', sans-serif; font-size: 11pt; font-weight: bold; height: 30px;">
            <td colspan="3" style="background-color: #C4FF36; border: 1px solid #c0c0c0; padding: 8px; text-align: center; color: #000000; font-weight: bold; font-size: 11pt;">TOTAL</td>
            <td style="border: 1px solid #c0c0c0; padding: 8px; text-align: center; color: #808080;">—</td>
            <td style="border: 1px solid #c0c0c0; padding: 8px; text-align: center; color: #808080;">—</td>
            <td style="border: 1px solid #c0c0c0; padding: 8px; text-align: center; font-size: 11pt; font-weight: bold;">${totalHours}</td>
            <td style="border: 1px solid #c0c0c0; padding: 8px; font-size: 11pt; font-weight: bold; color: #15803d; text-align: left;">Rs. ${totalSalary}</td>
            <td style="border: 1px solid #c0c0c0; padding: 8px; color: #505050; font-weight: normal; text-align: left;">Calculated at Rs. 240/hr</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + excelHTML], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Salary_Sheet_${monthName}_${year}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
