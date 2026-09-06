import React, { useState } from 'react';
import { convertLogsToCSV, downloadFile } from '../../utils/reportUtils';
import { FileText, Download, FileSpreadsheet, Search, Filter } from 'lucide-react';

const ReportGenerator = ({ logs }) => {
  const [reportType, setReportType] = useState('attendance');
  const [dateRange, setDateRange] = useState('this-month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);

  // Helper to filter logs based on selection
  const handleGenerate = () => {
    setIsGenerated(true);
    let filtered = [...logs];

    // Filter by date range (mock logic for simplicity)
    const now = new Date();
    if (dateRange === 'this-week') {
      // Show logs from past 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      filtered = logs.filter(log => new Date(log.date) >= sevenDaysAgo);
    } else if (dateRange === 'this-month') {
      // Current month logs
      filtered = logs.filter(log => log.date.includes('May'));
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(log =>
        log.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setPreviewData(filtered);
  };

  const handleDownloadCSV = () => {
    const dataToExport = isGenerated ? previewData : logs;
    const csvContent = convertLogsToCSV(dataToExport);
    downloadFile(csvContent, `ValenTime_${reportType}_report_${dateRange}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleDownloadPDF = () => {
    // Client-side PDF print trick
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Configuration Controls */}
      <div className="bg-subtle/90 border border-line rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/5 rounded-full blur-[100px] -z-10" />
        
        <h3 className="text-lg font-bold text-ink mb-6">Configure Report</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider block">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-subtle/60 border border-line focus:outline-none focus:border-violet-500 text-sm text-ink transition-colors"
            >
              <option value="attendance">Attendance Activity Log</option>
              <option value="breaks">Breaks & Intermissions</option>
              <option value="leave">Leave & Balance Audits</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider block">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-subtle/60 border border-line focus:outline-none focus:border-violet-500 text-sm text-ink transition-colors"
            >
              <option value="this-week">This Week (Last 7 Days)</option>
              <option value="this-month">This Month (Current)</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider block">Search Filter</label>
            <div className="relative">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search status or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-subtle/60 border border-line focus:outline-none focus:border-violet-500 text-sm text-ink transition-colors"
              />
            </div>
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-line">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider block">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-subtle/60 border border-line focus:outline-none focus:border-violet-500 text-sm text-ink"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider block">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-subtle/60 border border-line focus:outline-none focus:border-violet-500 text-sm text-ink"
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-line pt-6">
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold border bg-subtle border-line hover:bg-subtle hover:border-line-strong text-ink-soft transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Filter className="w-4 h-4" />
            Apply & Preview
          </button>
          
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand to-brand-ink hover:from-violet-500 hover:to-indigo-500 text-ink shadow-md hover:shadow-brand/20 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Generated Report Output */}
      {isGenerated && (
        <div className="bg-subtle backdrop-blur-sm border border-line rounded-2xl overflow-hidden shadow-xl animate-fade-in">
          <div className="px-6 py-5 border-b border-line flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand" />
                Report Preview: {reportType.toUpperCase()}
              </h3>
              <p className="text-xs text-ink-soft">Review generated dataset before exporting.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line hover:bg-subtle text-xs font-semibold text-ink-soft hover:text-ink transition-colors"
              >
                Print PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-subtle border-b border-line text-xs text-ink-soft font-medium uppercase">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Check In</th>
                  <th className="px-6 py-4">Check Out</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-sm">
                {previewData.length > 0 ? (
                  previewData.map((log) => (
                    <tr key={log.id} className="hover:bg-subtle transition-colors duration-150">
                      <td className="px-6 py-4 font-medium text-ink">{log.date}</td>
                      <td className="px-6 py-4 text-ink-soft">{log.checkIn}</td>
                      <td className="px-6 py-4 text-ink-soft">{log.checkOut}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.status === 'On-time'
                              ? 'bg-online/10 text-mint-ink border border-emerald-500/20'
                              : 'bg-accent/10 text-accent border border-amber-500/20'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-ink-soft font-medium">{log.hours}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-muted font-medium">
                      No matching records found for the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;
