import * as XLSX from 'xlsx';
import type { Invoice } from '../types';

export interface ExcelRow {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  transactionDate: string;
  purchaseOrder: string;
  projectId: string;
  projectDescription: string;
  projectManager: string;
}

export function parseExcelFile(file: File): Promise<Record<string, ExcelRow>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

        const result: Record<string, ExcelRow> = {};

        // Skip header row (row 0), process from row 1
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] as unknown[];
          if (!row || !row[0]) continue;

          const invoiceNumber = String(row[0]).trim();
          if (!invoiceNumber) continue;

          // Parse date - Excel stores dates as numbers
          let transactionDate = '';
          if (row[3]) {
            if (typeof row[3] === 'number') {
              const date = XLSX.SSF.parse_date_code(row[3]);
              transactionDate = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            } else {
              transactionDate = String(row[3]);
            }
          }

          result[invoiceNumber] = {
            invoiceNumber,
            customerId: String(row[1] || '').trim(),
            customerName: String(row[2] || '').trim(),
            transactionDate,
            purchaseOrder: String(row[4] || '').trim(),
            projectId: String(row[5] || '').trim(),
            projectDescription: String(row[6] || '').trim(),
            projectManager: String(row[7] || '').trim(),
          };
        }

        resolve(result);
      } catch (err) {
        reject(new Error('Failed to parse Excel file: ' + String(err)));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function createInvoiceFromExcel(
  row: ExcelRow,
  existingInvoice?: Partial<Invoice>
): Invoice {
  return {
    ...row,
    status: existingInvoice?.status || 'pending_verification',
    submissionChannel: existingInvoice?.submissionChannel || null,
    submissionDate: existingInvoice?.submissionDate || null,
    submissionNotes: existingInvoice?.submissionNotes || null,
    currentOwner: existingInvoice?.currentOwner || 'AR Team',
    comments: existingInvoice?.comments || [],
    followUpTasks: existingInvoice?.followUpTasks || [],
    createdAt: existingInvoice?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
