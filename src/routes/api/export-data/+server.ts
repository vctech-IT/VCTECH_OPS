import { PrismaClient } from '@prisma/client';
import { json } from '@sveltejs/kit';
import * as XLSX from 'xlsx';
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();

const MAX_CELL_LENGTH = 32700;

function truncateValue(value: any): any {
  if (typeof value === 'string' && value.length > MAX_CELL_LENGTH) {
    return value.substring(0, MAX_CELL_LENGTH) + '... (truncated)';
  }
  return value;
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const pmName = url.searchParams.get('pmName') || undefined;
    const orderStatus = url.searchParams.get('orderStatus') || undefined;
    const category = url.searchParams.get('category') || undefined;
    const clientName = url.searchParams.get('clientName') || undefined;

    // Fetch data from all tables, applying filters where applicable
    const [stage0, stage1, lineItems, installation, service, stage4, stage5] = await Promise.all([
      prisma.stage0.findMany({
        where: {
          ...(pmName && { PMName: pmName }),
          ...(orderStatus && { orderStatus }),
          ...(category && { SOCategory: category }),
          ...(clientName && { clientName })
        }
      }),
      prisma.stage1.findMany({
        where: {
          SONo: {
            ...(pmName && { PMName: pmName }),
            ...(orderStatus && { orderStatus }),
            ...(category && { SOCategory: category }),
            ...(clientName && { clientName })
          }
        }
      }),
      prisma.lineItems.findMany({
        where: {
          SONo: {
            ...(pmName && { PMName: pmName }),
            ...(orderStatus && { orderStatus }),
            ...(category && { SOCategory: category }),
            ...(clientName && { clientName })
          }
        }
      }),
      prisma.installation.findMany({
        where: {
          SONo: {
            ...(pmName && { PMName: pmName }),
            ...(orderStatus && { orderStatus }),
            ...(category && { SOCategory: category }),
            ...(clientName && { clientName })
          }
        }
      }),
      prisma.service.findMany({
        where: {
          SONo: {
            ...(pmName && { PMName: pmName }),
            ...(orderStatus && { orderStatus }),
            ...(category && { SOCategory: category }),
            ...(clientName && { clientName })
          }
        }
      }),
      prisma.stage4.findMany({
        where: {
          SONo: {
            ...(pmName && { PMName: pmName }),
            ...(orderStatus && { orderStatus }),
            ...(category && { SOCategory: category }),
            ...(clientName && { clientName })
          }
        }
      }),
      prisma.stage5.findMany({
        where: {
          SONo: {
            ...(pmName && { PMName: pmName }),
            ...(orderStatus && { orderStatus }),
            ...(category && { SOCategory: category }),
            ...(clientName && { clientName })
          }
        }
      })
    ]);

    // Get all unique SO Numbers
    const soNumbers = new Set(stage0.map(item => item.SONumber));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    const tables = [
      { name: 'Stage0', data: stage0 },
      { name: 'Stage1', data: stage1 },
      { name: 'LineItems', data: lineItems },
      { name: 'Installation', data: installation },
      { name: 'Service', data: service },
      { name: 'Stage4', data: stage4 },
      { name: 'Stage5', data: stage5 },
    ];

    // Add table names
    XLSX.utils.sheet_add_aoa(ws, [tables.map(t => `Table: ${t.name}`)], { origin: 'A1' });

    // Add headers
    const headers = ['SO Number'];
    tables.forEach(table => {
      if (table.data.length > 0) {
        const tableHeaders = Object.keys(table.data[0]).filter(h => h !== 'SONumber');
        headers.push(...tableHeaders, ''); // Empty column between tables
      }
    });
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A2' });

    // Add data
    const data = Array.from(soNumbers).map(soNumber => {
      const row = [soNumber];
      tables.forEach(table => {
        const item = table.data.find(i => i.SONumber === soNumber) || {};
        Object.keys(item).filter(k => k !== 'SONumber').forEach(key => {
          row.push(truncateValue(item[key]));
        });
        row.push(''); // Empty column between tables
      });
      return row;
    });
    XLSX.utils.sheet_add_aoa(ws, data, { origin: 'A3' });

    // Set column widths
    const columnWidths = headers.map(() => ({ wch: 15 }));
    ws['!cols'] = columnWidths;

    // Set row height for the table names and headers
    ws['!rows'] = [{ hpt: 30 }, { hpt: 25 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Database Export');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="database_export.xlsx"'
      }
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return json({ error: 'Failed to export data' }, { status: 500 });
  }
};