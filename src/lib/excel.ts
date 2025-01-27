 import * as XLSX from 'xlsx';
export interface ExcelWorkbook {
  Sheets: {
    [key: string]: XLSX.WorkSheet;
  };
  SheetNames: string[];
}