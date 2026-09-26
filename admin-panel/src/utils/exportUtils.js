/**
 * Universal Multi-Format Export Utility for Admin Panel
 * Supports:
 *  1. Microsoft Excel (.xlsx) via SheetJS
 *  2. Comma-Separated Values (.csv) with UTF-8 BOM
 *  3. Formatted Printable Document / PDF view
 */

/**
 * Dynamically loads SheetJS library from CDN if not already loaded in the document
 */
export const loadSheetJSLibrary = () => {
  return new Promise((resolve) => {
    if (window.XLSX) {
      resolve(window.XLSX);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.async = true;
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => {
      console.warn('Failed to load SheetJS from CDN, falling back to CSV.');
      resolve(null);
    };
    document.body.appendChild(script);
  });
};

/**
 * Formats a timestamp into a safe filename string (e.g., 2026-09-12_14-30)
 */
const getTimestampString = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}_${hh}${min}`;
};

/**
 * Trigger browser file download from Blob
 */
const triggerBlobDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export data array to Microsoft Excel (.xlsx)
 * @param {Array<Object>} data Array of flat key-value objects
 * @param {string} fileNamePrefix Base name for file
 * @param {string} [sheetName='Report'] Excel Sheet tab name
 */
export const exportToExcel = async (data, fileNamePrefix = 'Export', sheetName = 'Report') => {
  if (!data || data.length === 0) {
    throw new Error('No records available to export.');
  }

  const XLSX = await loadSheetJSLibrary();
  const fullFileName = `${fileNamePrefix}_${getTimestampString()}.xlsx`;

  if (!XLSX) {
    // Graceful fallback to CSV if SheetJS CDN is unreachable
    exportToCSV(data, fileNamePrefix);
    return;
  }

  // Convert JSON to Worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Automatically calculate column widths based on max content length
  const colKeys = Object.keys(data[0] || {});
  const colWidths = colKeys.map((key) => {
    let maxLen = key.length;
    data.forEach((row) => {
      const valStr = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
      if (valStr.length > maxLen) maxLen = Math.min(valStr.length, 50);
    });
    return { wch: Math.max(maxLen + 3, 12) };
  });
  worksheet['!cols'] = colWidths;

  // Create Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

  // Write and trigger download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  triggerBlobDownload(blob, fullFileName);
};

/**
 * Export data array to CSV (.csv) with UTF-8 BOM for full character set compatibility
 * @param {Array<Object>} data Array of flat key-value objects
 * @param {string} fileNamePrefix Base name for file
 */
export const exportToCSV = (data, fileNamePrefix = 'Export') => {
  if (!data || data.length === 0) {
    throw new Error('No records available to export.');
  }

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        let val = row[header];
        if (val === null || val === undefined) val = '';
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',')
  );

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fullFileName = `${fileNamePrefix}_${getTimestampString()}.csv`;
  triggerBlobDownload(blob, fullFileName);
};

/**
 * Print or Save Table Data as PDF
 * @param {Object} options
 * @param {string} options.title Document Title
 * @param {string} [options.subtitle] Secondary context or filter details
 * @param {Array<string>} options.columns Column display names
 * @param {Array<Array<any>>} options.rows Row data
 */
export const printOrSaveAsPDF = ({ title = 'Report', subtitle = '', columns = [], rows = [] }) => {
  if (!rows || rows.length === 0) {
    throw new Error('No records available to print.');
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Unable to open print preview. Please allow popups for this site.');
  }

  const generatedDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${title} - ${generatedDate}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 12mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #1e293b;
          background: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 2px solid #EA580C;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .brand {
          font-size: 20px;
          font-weight: 800;
          color: #EA580C;
          letter-spacing: -0.5px;
        }
        .report-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 4px 0 2px;
        }
        .report-subtitle {
          font-size: 12px;
          color: #64748b;
        }
        .meta-info {
          text-align: right;
          font-size: 11px;
          color: #64748b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
          margin-top: 10px;
        }
        th {
          background-color: #FFF7ED;
          color: #9A3412;
          border: 1px solid #FED7AA;
          padding: 8px 10px;
          text-align: left;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        td {
          border: 1px solid #e2e8f0;
          padding: 7px 10px;
          color: #334155;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #94a3b8;
        }
        @media print {
          body { padding: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">Aakash Astrology • Admin Panel</div>
          <div class="report-title">${title}</div>
          ${subtitle ? `<div class="report-subtitle">${subtitle}</div>` : ''}
        </div>
        <div class="meta-info">
          <div>Generated: <strong>${generatedDate}</strong></div>
          <div>Total Records: <strong>${rows.length}</strong></div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            ${columns.map((c) => `<th>${c}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `
            <tr>
              ${r.map((cell) => `<td>${cell !== null && cell !== undefined ? cell : '-'}</td>`).join('')}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="footer">
        <span>Confidential & Proprietary • Aakash Astrology Platform Management</span>
        <span>Page 1 of 1</span>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
