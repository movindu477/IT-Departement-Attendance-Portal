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

// CRC-32 Table for client-side standard ZIP archive generation
const makeCrcTable = () => {
  let c;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
};

const crcTable = makeCrcTable();

const crc32 = (bytes) => {
  let crc = 0 ^ (-1);
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
};

/**
 * Creates an uncompressed ZIP file in pure JS (compatible with all Excel versions).
 * OpenXML (.xlsx) files are ZIP containers of XML files.
 */
const createZipBlob = (files) => {
  const textEncoder = new TextEncoder();
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = textEncoder.encode(file.name);
    const dataBytes = typeof file.data === 'string' ? textEncoder.encode(file.data) : file.data;
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header (30 bytes + name length)
    const local = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true); // signature
    view.setUint16(4, 20, true);         // version needed (2.0)
    view.setUint16(6, 0, true);          // flags
    view.setUint16(8, 0, true);          // compression (0 = STORE)
    view.setUint16(10, 0, true);         // mod time
    view.setUint16(12, 0, true);         // mod date
    view.setUint32(14, crc, true);       // crc-32
    view.setUint32(18, size, true);      // compressed size
    view.setUint32(22, size, true);      // uncompressed size
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);         // extra length
    local.set(nameBytes, 30);

    localHeaders.push(local, dataBytes);

    // Central directory header (46 bytes + name length)
    const central = new Uint8Array(46 + nameBytes.length);
    const cView = new DataView(central.buffer);
    cView.setUint32(0, 0x02014b50, true); // signature
    cView.setUint16(4, 20, true);         // version made by
    cView.setUint16(6, 20, true);         // version needed
    cView.setUint16(8, 0, true);          // flags
    cView.setUint16(10, 0, true);         // compression (0)
    cView.setUint16(12, 0, true);         // mod time
    cView.setUint16(14, 0, true);         // mod date
    cView.setUint32(16, crc, true);       // crc-32
    cView.setUint32(20, size, true);      // compressed size
    cView.setUint32(24, size, true);      // uncompressed size
    cView.setUint16(28, nameBytes.length, true);
    cView.setUint16(30, 0, true);         // extra length
    cView.setUint16(32, 0, true);         // comment length
    cView.setUint16(34, 0, true);         // disk start
    cView.setUint16(36, 0, true);         // internal attrs
    cView.setUint32(38, 0, true);         // external attrs
    cView.setUint32(42, offset, true);    // local header offset
    central.set(nameBytes, 46);

    centralHeaders.push(central);

    offset += local.length + dataBytes.length;
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const ch of centralHeaders) centralSize += ch.length;

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eView = new DataView(eocd.buffer);
  eView.setUint32(0, 0x06054b50, true);
  eView.setUint16(4, 0, true); // disk number
  eView.setUint16(6, 0, true); // central dir disk
  eView.setUint16(8, files.length, true); // entries on disk
  eView.setUint16(10, files.length, true); // total entries
  eView.setUint32(12, centralSize, true);
  eView.setUint32(16, centralOffset, true);
  eView.setUint16(20, 0, true); // comment length

  return new Blob([...localHeaders, ...centralHeaders, eocd], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
};

const escapeXml = (str) => {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Builds and downloads a true modern .xlsx file matching the latest table columns
 * (Date, IN, OUT, Reason / Status). Opens seamlessly in Microsoft Excel 365/Desktop,
 * Excel Web, Google Sheets, Apple Numbers, and mobile devices with zero warnings.
 *
 * @param {Array} daysList - full monthly days grid
 * @param {string} monthName 
 * @param {number} year 
 */
export const exportSalarySheetToExcel = (daysList = [], monthName, year) => {
  const shortMonth = monthName.slice(0, 3);
  let rowIndex = 1;
  let sheetRowsXml = '';

  const addCell = (colLetter, rowNum, val) => {
    return `<c r="${colLetter}${rowNum}" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>`;
  };

  // Row 1: Title
  sheetRowsXml += `<row r="${rowIndex}">` +
    addCell('A', rowIndex, `Attendance Statement - ${monthName} ${year}`) +
    `</row>`;
  rowIndex++;

  // Empty spacer row
  rowIndex++;

  // Column headers
  sheetRowsXml += `<row r="${rowIndex}">` +
    addCell('A', rowIndex, 'Date') +
    addCell('B', rowIndex, 'IN') +
    addCell('C', rowIndex, 'OUT') +
    addCell('D', rowIndex, 'Reason / Status') +
    `</row>`;
  rowIndex++;

  // Data rows
  daysList.forEach((day) => {
    const isWeekend = day.status === 'Weekend';
    const isDayOff = day.status === 'Day Off';
    const dateLabel = `${day.dateNum}-${shortMonth}`;

    let inVal = '—';
    let outVal = '—';
    let reasonVal = '—';

    if (isWeekend) {
      reasonVal = day.dayOfWeek === 'Sat' ? 'Saturday — Weekend' : 'Sunday — Weekend';
    } else if (isDayOff) {
      reasonVal = `Day Off — ${day.reason || 'Not Working'}`;
    } else {
      inVal = day.checkIn || '—';
      outVal = day.checkOut || '—';
      reasonVal = day.reason || (day.status === 'Absent' ? 'Absent' : 'Present');
    }

    sheetRowsXml += `<row r="${rowIndex}">` +
      addCell('A', rowIndex, dateLabel) +
      addCell('B', rowIndex, inVal) +
      addCell('C', rowIndex, outVal) +
      addCell('D', rowIndex, reasonVal) +
      `</row>`;
    rowIndex++;
  });


  // Standard OpenXML definitions
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Attendance Statement" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1">
    <font><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  </cellXfs>
</styleSheet>`;

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="16" customWidth="1"/>
    <col min="2" max="2" width="12" customWidth="1"/>
    <col min="3" max="3" width="12" customWidth="1"/>
    <col min="4" max="4" width="34" customWidth="1"/>
  </cols>
  <sheetData>
    ${sheetRowsXml}
  </sheetData>
</worksheet>`;

  const zipBlob = createZipBlob([
    { name: '[Content_Types].xml', data: contentTypesXml },
    { name: '_rels/.rels', data: rootRelsXml },
    { name: 'xl/workbook.xml', data: workbookXml },
    { name: 'xl/_rels/workbook.xml.rels', data: workbookRelsXml },
    { name: 'xl/styles.xml', data: stylesXml },
    { name: 'xl/worksheets/sheet1.xml', data: sheet1Xml }
  ]);

  downloadFile(zipBlob, `Attendance_Sheet_${monthName}_${year}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};
