// src/utils/generateTeamTimesheet.js
// -----------------------------------------------------------------
//  Team Excel export matching the admin's actual payment sheet layout.
//  See the admin plan, Section 8, for the derivation.
//
//  Fixed columns:
//    A  week-day / week-end subtotal labels
//    B  week label ("Week1")
//    C  date (day of month)
//    D  day name (Mon..Sun)
//  Then two columns per staff member: hours, remarks.
//
//  Week blocks run Monday -> Sunday, 11-row pitch, block count derived from
//  the month (4-6), not fixed at 5. Grand-total pay uses each staff member's
//  own configured weekday rate and a single org-wide weekend premium - see
//  utils/payroll.js for why, and why that rate is unconfirmed.
//
//  This export is an admin action, not a staff timesheet submission, so it
//  never writes a monthlyReports document - that would suppress the SMS
//  reminder for staff who have not actually exported their own sheet.
// -----------------------------------------------------------------

import { saveAs } from 'file-saver';
import { DEFAULT_RATES } from './payroll';

const ACCOUNTING = '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)';
const DAY_NAMES  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const FIXED_COLS = { LABEL: 1, WEEK: 2, DATE: 3, DAY: 4 };
const FIRST_STAFF_COL = 5; // E
const ROWS_PER_BLOCK = 11;
const FIRST_DATA_ROW = 3;  // row 1 = banner, row 2 = header, weeks start row 3

const WEEKDAY_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2A0' } };
const WEEKEND_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBFE0FF' } };
const BANNER_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4A020' } };

const pad = n => String(n).padStart(2, '0');

/** Monday of the week containing `d`. */
function mondayOf(d) {
  const out = new Date(d);
  const dow = out.getDay();
  out.setDate(out.getDate() + (dow === 0 ? -6 : 1 - dow));
  out.setHours(0, 0, 0, 0);
  return out;
}

/** Local YYYY-MM-DD - never toISOString(), which rolls evening dates forward a day at UTC+5:30. */
function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function teamTimesheetFileName(monthDate) {
  return `Team_${MONTHS[monthDate.getMonth()]}_${monthDate.getFullYear()}_Timesheet.xlsx`;
}

/**
 * Builds the team workbook. ExcelJS is passed in rather than imported here so
 * this stays testable in plain Node - the app's wrapper below imports it
 * dynamically, since the library is ~900 kB and only needed on click.
 *
 * @param {typeof import('exceljs')} ExcelJS
 * @param {Date}   monthDate  any date inside the target month
 * @param {Array}  staff      [{ uid, name, weekdayRate, records: [{date, hours, reason, status}] }]
 * @param {Object} rates      { weekdayRate, weekendRate } - org default, used when a
 *                             staff member has no individual rate on file
 * @returns {{ workbook: ExcelJS.Workbook, blocks: number }}
 */
export function buildTeamWorkbook(ExcelJS, monthDate, staff = [], rates = DEFAULT_RATES) {
  const year  = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'IT Attendance Portal';
  const ws = wb.addWorksheet(`${MONTHS[month]} ${year}`);

  const staffCols = staff.map((s, i) => ({
    staff: s,
    hoursCol: FIRST_STAFF_COL + i * 2,
    remarksCol: FIRST_STAFF_COL + i * 2 + 1,
  }));
  const colCount = Math.max(FIXED_COLS.DAY, FIRST_STAFF_COL - 1 + staff.length * 2);

  ws.columns = [
    { width: 10 }, { width: 9 }, { width: 7 }, { width: 7 },
    ...staff.flatMap(() => [{ width: 11 }, { width: 22 }]),
  ];

  const byDate = staffCols.map(sc => new Map((sc.staff.records || []).map(r => [r.date, r])));

  // ---- banner -------------------------------------------------------
  ws.mergeCells(1, 1, 1, colCount);
  const banner = ws.getCell(1, 1);
  banner.value = `Tech Team -   ${MONTHS[month].toUpperCase()} 1 to ${MONTHS[month].toUpperCase()} ${last.getDate()}`;
  banner.font = { bold: true, size: 13 };
  banner.alignment = { horizontal: 'center', vertical: 'middle' };
  banner.fill = BANNER_FILL;
  ws.getRow(1).height = 24;

  // ---- header ---------------------------------------------------------
  ws.getCell(2, FIXED_COLS.LABEL).value =
    `${pad(1)}-${pad(month + 1)}-${year} to ${pad(last.getDate())}-${pad(month + 1)}-${year}`;
  staffCols.forEach(sc => {
    ws.getCell(2, sc.hoursCol).value = sc.staff.name;
    ws.getCell(2, sc.remarksCol).value = 'Remarks';
  });
  ws.getRow(2).eachCell(c => { c.font = { bold: true }; });

  // ---- week blocks ------------------------------------------------------
  const cursor = mondayOf(first);
  let block = 0;
  const wdRows = [];
  const weRows = [];

  while (cursor <= last) {
    const top = FIRST_DATA_ROW + block * ROWS_PER_BLOCK;
    ws.getCell(top, FIXED_COLS.WEEK).value = `Week${block + 1}`;

    for (let i = 0; i < 7; i++) {
      const day = new Date(cursor);
      day.setDate(day.getDate() + i);
      const row = top + i;

      ws.getCell(row, FIXED_COLS.DAY).value = DAY_NAMES[i];

      // Outside the month: keep the slot, leave it empty
      if (day.getMonth() !== month || day.getFullYear() !== year) continue;

      ws.getCell(row, FIXED_COLS.DATE).value = day.getDate();

      const key = dateKey(day);
      staffCols.forEach((sc, idx) => {
        const rec = byDate[idx].get(key);
        if (!rec) return;
        const hours = Number(rec.hours) || 0;
        if (hours > 0) ws.getCell(row, sc.hoursCol).value = hours;
        if (rec.reason) ws.getCell(row, sc.remarksCol).value = rec.reason;
      });
    }

    // ---- subtotals --------------------------------------------------
    const wdRow = top + 7; // Mon-Fri
    const weRow = top + 8; // Sat-Sun
    wdRows.push(wdRow);
    weRows.push(weRow);

    ws.getCell(wdRow, FIXED_COLS.LABEL).value = 'Week day';
    ws.getCell(weRow, FIXED_COLS.LABEL).value = 'Week end';
    ws.getCell(wdRow, FIXED_COLS.LABEL).fill = WEEKDAY_FILL;
    ws.getCell(weRow, FIXED_COLS.LABEL).fill = WEEKEND_FILL;

    staffCols.forEach(sc => {
      const L = ws.getColumn(sc.hoursCol).letter;
      ws.getCell(wdRow, sc.hoursCol).value = { formula: `SUM(${L}${top}:${L}${top + 4})` };
      ws.getCell(weRow, sc.hoursCol).value = { formula: `SUM(${L}${top + 5}:${L}${top + 6})` };
      ws.getCell(wdRow, sc.hoursCol).fill = WEEKDAY_FILL;
      ws.getCell(weRow, sc.hoursCol).fill = WEEKEND_FILL;
    });
    ws.getRow(wdRow).eachCell(c => { c.font = { bold: true }; });
    ws.getRow(weRow).eachCell(c => { c.font = { bold: true }; });

    cursor.setDate(cursor.getDate() + 7);
    block++;
  }

  // ---- grand total block ------------------------------------------------
  const grandHeaderRow = FIRST_DATA_ROW + block * ROWS_PER_BLOCK + 1; // one spacer row after the last block
  staffCols.forEach(sc => {
    ws.getCell(grandHeaderRow, sc.hoursCol).value = sc.staff.name;
    ws.getCell(grandHeaderRow, sc.remarksCol).value = 'Remarks';
  });
  ws.getRow(grandHeaderRow).eachCell(c => { c.font = { bold: true }; });

  const wdTotalRow = grandHeaderRow + 1;
  const weTotalRow = grandHeaderRow + 2;
  const grandRow   = grandHeaderRow + 3;

  ws.getCell(wdTotalRow, FIXED_COLS.LABEL).value = 'Week day';
  ws.getCell(weTotalRow, FIXED_COLS.LABEL).value = 'Week end';
  ws.getCell(grandRow, FIXED_COLS.LABEL).value   = 'Grand total';

  staffCols.forEach(sc => {
    const L = ws.getColumn(sc.hoursCol).letter;
    ws.getCell(wdTotalRow, sc.hoursCol).value = wdRows.length
      ? { formula: wdRows.map(r => `${L}${r}`).join('+') }
      : 0;
    ws.getCell(weTotalRow, sc.hoursCol).value = weRows.length
      ? { formula: weRows.map(r => `${L}${r}`).join('+') }
      : 0;

    const weekdayRate = Number(sc.staff.weekdayRate) || rates.weekdayRate;
    ws.getCell(grandRow, sc.hoursCol).value = {
      formula: `${L}${wdTotalRow}*${weekdayRate}+${L}${weTotalRow}*${rates.weekendRate}`,
    };
  });

  ws.getRow(wdTotalRow).eachCell(c => { c.font = { bold: true }; });
  ws.getRow(weTotalRow).eachCell(c => { c.font = { bold: true }; });
  ws.getRow(grandRow).eachCell(c => { c.font = { bold: true }; });

  // ---- rate assumption note, kept visible rather than buried in a formula
  const noteRow = grandRow + 2;
  ws.mergeCells(noteRow, 1, noteRow, colCount);
  const note = ws.getCell(noteRow, 1);
  note.value = `Rates: weekday pay uses each staff member's own configured rate; weekend hours assumed at Rs. ${rates.weekendRate}/hr (unconfirmed - verify before processing salaries). Grand total = weekday hrs x weekday rate + weekend hrs x weekend rate.`;
  note.font = { italic: true, size: 9, color: { argb: 'FF888888' } };

  // ---- number formats -----------------------------------------------
  const lastRow = noteRow;
  staffCols.forEach(sc => {
    for (let r = 1; r <= lastRow; r++) {
      ws.getCell(r, sc.hoursCol).numFmt = ACCOUNTING;
    }
  });

  return { workbook: wb, blocks: block };
}

/**
 * Builds the team timesheet and hands it to the browser as a download.
 * Does not write a monthlyReports document - see the file header.
 *
 * @param {Date}   monthDate
 * @param {Array}  staff
 * @param {Object} rates
 * @returns {Promise<string>} the file name written
 */
export async function generateTeamTimesheet(monthDate, staff, rates = DEFAULT_RATES) {
  const ExcelJS = (await import('exceljs')).default;
  const { workbook } = buildTeamWorkbook(ExcelJS, monthDate, staff, rates);

  const buf = await workbook.xlsx.writeBuffer();
  const fileName = teamTimesheetFileName(monthDate);

  saveAs(
    new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName
  );

  return fileName;
}

export { FIXED_COLS, FIRST_STAFF_COL, ROWS_PER_BLOCK, FIRST_DATA_ROW, DAY_NAMES, dateKey, mondayOf };
