import React, { useState, useRef, useEffect } from 'react';
import {
  MdFileDownload,
  MdTableChart,
  MdDescription,
  MdPrint,
  MdArrowDropDown
} from 'react-icons/md';
import { exportToExcel, exportToCSV, printOrSaveAsPDF } from '../utils/exportUtils';
import { toast } from 'react-toastify';

export default function ExportDropdown({
  data = [],
  fileName = 'Report',
  sheetName = 'Data',
  title = 'Data Report',
  subtitle = '',
  columns = null,
  disabled = false,
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportExcel = async () => {
    if (!data || data.length === 0) {
      toast.warning('No records available to export.');
      return;
    }
    setExporting(true);
    setIsOpen(false);
    try {
      await exportToExcel(data, fileName, sheetName);
      toast.success(`${fileName}.xlsx exported successfully!`);
    } catch (err) {
      toast.error(err.message || 'Failed to export Excel file.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast.warning('No records available to export.');
      return;
    }
    setIsOpen(false);
    try {
      exportToCSV(data, fileName);
      toast.success(`${fileName}.csv exported successfully!`);
    } catch (err) {
      toast.error(err.message || 'Failed to export CSV file.');
    }
  };

  const handlePrintPDF = () => {
    if (!data || data.length === 0) {
      toast.warning('No records available to print.');
      return;
    }
    setIsOpen(false);
    try {
      const exportCols = columns || Object.keys(data[0]);
      const exportRows = data.map((item) => exportCols.map((col) => item[col]));
      printOrSaveAsPDF({
        title,
        subtitle: subtitle || `Total Records: ${data.length}`,
        columns: exportCols,
        rows: exportRows
      });
    } catch (err) {
      toast.error(err.message || 'Failed to prepare print preview.');
    }
  };

  const count = Array.isArray(data) ? data.length : 0;

  return (
    <div className="export-dropdown-container" ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <button
        type="button"
        className="btn-export-dropdown"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled || exporting || count === 0}
        title={count === 0 ? 'No records to export' : 'Export records in multiple formats'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '8px 14px',
          backgroundColor: '#FFF7ED',
          color: '#C2410C',
          border: '1.5px solid #FED7AA',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 700,
          cursor: disabled || count === 0 ? 'not-allowed' : 'pointer',
          opacity: disabled || count === 0 ? 0.6 : 1,
          transition: 'all 0.18s ease',
          boxShadow: '0 1px 3px rgba(249, 115, 22, 0.08)'
        }}
      >
        <MdFileDownload style={{ fontSize: '18px', color: '#EA580C' }} />
        <span>{exporting ? 'Exporting...' : `Export (${count})`}</span>
        <MdArrowDropDown style={{ fontSize: '18px', marginLeft: '-2px' }} />
      </button>

      {isOpen && (
        <div
          className="export-menu-card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 999,
            minWidth: '220px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1.5px solid #FED7AA',
            boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div style={{ padding: '6px 10px 4px', fontSize: '11px', fontWeight: 800, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Choose Export Format
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              border: 'none',
              borderRadius: '6px',
              background: 'transparent',
              color: '#1e293b',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ background: '#dcfce7', color: '#16a34a', padding: '5px', borderRadius: '6px', display: 'flex' }}>
              <MdTableChart style={{ fontSize: '16px' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#15803d' }}>Microsoft Excel (.xlsx)</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Full formatted workbook</div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              border: 'none',
              borderRadius: '6px',
              background: 'transparent',
              color: '#1e293b',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ background: '#dbeafe', color: '#2563eb', padding: '5px', borderRadius: '6px', display: 'flex' }}>
              <MdDescription style={{ fontSize: '16px' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1d4ed8' }}>CSV Spreadsheet (.csv)</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Universal tabular format</div>
            </div>
          </button>

          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />

          <button
            type="button"
            onClick={handlePrintPDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              border: 'none',
              borderRadius: '6px',
              background: 'transparent',
              color: '#1e293b',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fff7ed')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ background: '#ffedd5', color: '#ea580c', padding: '5px', borderRadius: '6px', display: 'flex' }}>
              <MdPrint style={{ fontSize: '16px' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#c2410c' }}>Print / Save as PDF</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Clean printable layout</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
