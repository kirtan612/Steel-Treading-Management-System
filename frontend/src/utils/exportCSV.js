import Papa from 'papaparse';

/**
 * Exports an array of objects to a CSV file and triggers download
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} filename - Name of the CSV file (without extension)
 */
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Convert to CSV using papaparse
  const csv = Papa.unparse(data);

  // Create a Blob from the CSV string
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Formats a date as YYYY-MM-DD for filenames
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateForFilename = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Removes currency symbols from number values for Excel compatibility
 * @param {number} value - Numeric value
 * @returns {number} Plain number
 */
export const formatCurrencyForCSV = (value) => {
  return typeof value === 'number' ? value : parseFloat(value) || 0;
};
