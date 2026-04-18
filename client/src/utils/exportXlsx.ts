import * as XLSX from 'xlsx';

interface ExportData {
  [key: string]: string | number | boolean | null | undefined;
}

export function exportToXlsx(data: ExportData[], filename: string, sheetName: string = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, 15),
  }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportMultiSheet(data: Record<string, ExportData[]>, filename: string) {
  const workbook = XLSX.utils.book_new();

  Object.entries(data).forEach(([sheetName, sheetData]) => {
    const worksheet = XLSX.utils.json_to_sheet(sheetData);

    const colWidths = Object.keys(sheetData[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
