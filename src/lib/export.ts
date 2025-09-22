import * as XLSX from 'xlsx';

export const exportToXLSX = (data: any[], fileName: string, sheetName: string = 'Data') => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Convert the array of objects to a worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Append the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate a file with the specified name and trigger the download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
