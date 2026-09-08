// src/utils/generateTimesheet.js
// -----------------------------------------------------------------
//  Excel export matching Tech_Team_Payment_Template.xlsx
//
//  Layout (11-row pitch per week block):
//    A  week-day / week-end subtotal labels
//    B  week label ("Week1")
//    C  date (day of month)
//    D  day name (Mon..Sun)
//    E  In       - clock-in time, TEXT, never summed
//    F  Out      - clock-out time, TEXT, never summed
//    G  Hours    - numeric
//    H  <staff name> - numeric
//    I  Remarks
//
//  Week blocks run Monday -> Sunday. Days falling outside the month
//  are left blank so the calendar grid stays aligned. The number of
//  blocks is derived from the month (4-6), not fixed at 5.
// -----------------------------------------------------------------

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const ACCOUNTING = '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)';
const DAY_NAMES  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const COL = {
  LABEL: 1, WEEK: 2, DATE: 3, DAY: 4,
  IN: 5, OUT: 6, HOURS: 7, NAME: 8, REMARKS: 9,
};

const ROWS_PER_BLOCK = 11;   // 7 day rows + 2 subtotal rows + 2 spacers
const FIRST_DATA_ROW = 2;

const pad = n => String(n).padStart(2, '0');

/** Monday of the week containing `d`. */
function mondayOf(d) {
  const out = new Date(d);
  const dow = out.getDay();                 // 0 = Sunday
  out.setDate(out.getDate() + (dow === 0 ? -6 : 1 - dow));
  out.setHours(0, 0, 0, 0);
  return out;
}

/**
 * Local YYYY-MM-DD.
 * Deliberately not toISOString() - that converts to UTC and rolls
 * evening dates forward a day at UTC+5:30.
 */
function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Filename for a given month/staff member. */
export function timesheetFileName(monthDate, user) {
  const staffName = user?.name || 'Your Name';
  return `${staffName.replace(/\s+/g, '_')}_${MONTHS[monthDate.getMonth()]}_${monthDate.getFullYear()}_Timesheet.xlsx`;
}

/**
 * Builds the workbook. Kept separate from the download so the layout can be
 * asserted in Node, where there is no Blob/DOM to save into.
 *
 * @param {Date}   monthDate  any date inside the target month
 * @param {Array}  records    [{ date, checkIn, checkOut, hours, status, reason }]
 * @param {Object} user       { name }
 * @returns {{ workbook: ExcelJS.Workbook, blocks: number }}
 */
export function buildTimesheetWorkbook(monthDate, records = [], user) {
  const year  = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const staffName = user?.name || 'Your Name';

  const byDate = new Map(records.map(r => [r.date, r]));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'IT Attendance Portal';
  const ws = wb.addWorksheet(`${MONTHS[month]} ${year}`);

  ws.columns = [
    { width: 10 }, { width: 9 }, { width: 7 }, { width: 7 },
    { width: 9 },  { width: 9 }, { width: 9 }, { width: 14 }, { width: 26 },
  ];

  // ---- header ----------------------------------------------------
  ws.getCell(1, COL.LABEL).value =
    `${pad(1)}-${pad(month + 1)}-${year} to ${pad(last.getDate())}-${pad(month + 1)}-${year}`;
  ws.getCell(1, COL.IN).value      = 'In';
  ws.getCell(1, COL.OUT).value     = 'Out';
  ws.getCell(1, COL.HOURS).value   = 'Hours';
  ws.getCell(1, COL.NAME).value    = staffName;
  ws.getCell(1, COL.REMARKS).value = 'Remarks';
  ws.getRow(1).eachCell(c => { c.font = { bold: true }; });

  // ---- week blocks -----------------------------------------------
  const cursor = mondayOf(first);
  let block = 0;

  while (cursor <= last) {
    const top = FIRST_DATA_ROW + block * ROWS_PER_BLOCK;
    ws.getCell(top, COL.WEEK).value = `Week${block + 1}`;

    for (let i = 0; i < 7; i++) {
      const day = new Date(cursor);
      day.setDate(day.getDate() + i);
      const row = top + i;

      ws.getCell(row, COL.DAY).value = DAY_NAMES[i];

      // Outside the month: keep the slot, leave it empty
      if (day.getMonth() !== month || day.getFullYear() !== year) continue;

      ws.getCell(row, COL.DATE).value = day.getDate();

      const rec = byDate.get(dateKey(day));
      if (!rec) continue;

      const hours = Number(rec.hours) || 0;

      ws.getCell(row, COL.IN).value  = rec.checkIn  || '';
      ws.getCell(row, COL.OUT).value = rec.checkOut || '';

      if (hours > 0) {
        ws.getCell(row, COL.HOURS).value = hours;
        ws.getCell(row, COL.NAME).value  = hours;
      }
      if (rec.reason) ws.getCell(row, COL.REMARKS).value = rec.reason;
    }

    // ---- subtotals ------------------------------------------------
    const wdRow = top + 7;   // Mon-Fri
    const weRow = top + 8;   // Sat-Sun

    ws.getCell(wdRow, COL.LABEL).value = 'Week day';
    ws.getCell(weRow, COL.LABEL).value = 'Week end';

    for (const col of [COL.HOURS, COL.NAME]) {
      const L = ws.getColumn(col).letter;
      ws.getCell(wdRow, col).value = { formula: `SUM(${L}${top}:${L}${top + 4})` };
      ws.getCell(weRow, col).value = { formula: `SUM(${L}${top + 5}:${L}${top + 6})` };
    }
    ws.getRow(wdRow).eachCell(c => { c.font = { bold: true }; });
    ws.getRow(weRow).eachCell(c => { c.font = { bold: true }; });

    cursor.setDate(cursor.getDate() + 7);
    block++;
  }

  // ---- number formats --------------------------------------------
  const lastRow = FIRST_DATA_ROW + block * ROWS_PER_BLOCK;
  for (let r = 1; r <= lastRow; r++) {
    for (const col of [COL.HOURS, COL.NAME]) {
      ws.getCell(r, col).numFmt = ACCOUNTING;
    }
  }

  return { workbook: wb, blocks: block };
}

/**
 * Builds the timesheet and hands it to the browser as a download.
 *
 * @param {Date}   monthDate  any date inside the target month
 * @param {Array}  records    [{ date, checkIn, checkOut, hours, status, reason }]
 * @param {Object} user       { name }
 * @returns {Promise<string>} the file name written
 */
export async function generateTimesheet(monthDate, records, user) {
  const { workbook } = buildTimesheetWorkbook(monthDate, records, user);

  const buf = await workbook.xlsx.writeBuffer();
  const fileName = timesheetFileName(monthDate, user);

  saveAs(
    new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName
  );

  return fileName;
}

export { COL, ROWS_PER_BLOCK, FIRST_DATA_ROW, DAY_NAMES, dateKey, mondayOf };
