// api/export-data/+server.ts
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
		const [stage0, stage1, lineItems, installation, service, stage4, stage5, stageAgingHistory] =
			await Promise.all([
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
				}),
				prisma.stageAgingHistory.findMany({
					where: {
						SO: {
							...(pmName && { PMName: pmName }),
							...(orderStatus && { orderStatus }),
							...(category && { SOCategory: category }),
							...(clientName && { clientName })
						}
					},
					orderBy: [{ SONumber: 'asc' }, { stage: 'asc' }]
				})
			]);

		// Get all unique SO Numbers
		const soNumbers = new Set(stage0.map((item) => item.SONumber));

		// Process aging data by SO Number
		const agingDataBySO = new Map();
		stageAgingHistory.forEach((item) => {
			if (!agingDataBySO.has(item.SONumber)) {
				// Initialize with zeros for each stage
				agingDataBySO.set(item.SONumber, {
					stageDurations: Array(6).fill(0), // For stages 0-5
					totalDuration: 0
				});
			}

			const soAging = agingDataBySO.get(item.SONumber);
			if (item.stage >= 0 && item.stage <= 5) {
				soAging.stageDurations[item.stage] += item.durationHours;
				soAging.totalDuration += item.durationHours;
			}
		});

		// Create workbook
		const wb = XLSX.utils.book_new();

		// Create worksheet
		const ws = XLSX.utils.aoa_to_sheet([]);

		const tables = [
			{ name: 'Stage0', data: stage0 },
			{ name: 'Stage1', data: stage1 },
			{ name: 'LineItems', data: lineItems },
			{ name: 'Installation', data: installation },
			{ name: 'Service', data: service },
			{ name: 'Stage4', data: stage4 },
			{ name: 'Stage5', data: stage5 }
		];

		// Add table names header row
		const tableNamesHeader = ['SO Number', 'Aging Details (Hours)'];
		tables.forEach((table) => {
			tableNamesHeader.push(`Table: ${table.name}`);
			// Add empty columns for spacing between tables
			tableNamesHeader.push('');
		});
		XLSX.utils.sheet_add_aoa(ws, [tableNamesHeader], { origin: 'A1' });

		// Add aging details for sub-header
		const agingHeader = ['', 'Stage 0,1,2,3,4,5,Total'];
		tables.forEach((table) => {
			if (table.data.length > 0) {
				const tableHeaders = Object.keys(table.data[0]).filter((h) => h !== 'SONumber');
				agingHeader.push(...tableHeaders, ''); // Empty column between tables
			}
		});
		XLSX.utils.sheet_add_aoa(ws, [agingHeader], { origin: 'A2' });

		// Add data rows with aging info
		const data = Array.from(soNumbers).map((soNumber) => {
			// Start with SO Number
			const row = [soNumber];

			// Add aging data
			const aging = agingDataBySO.get(soNumber) || {
				stageDurations: Array(6).fill(0),
				totalDuration: 0
			};
			const agingInfo = [
				aging.stageDurations[0].toFixed(1),
				aging.stageDurations[1].toFixed(1),
				aging.stageDurations[2].toFixed(1),
				aging.stageDurations[3].toFixed(1),
				aging.stageDurations[4].toFixed(1),
				aging.stageDurations[5].toFixed(1),
				aging.totalDuration.toFixed(1)
			].join(',');
			row.push(agingInfo);

			// Add data from each table
			tables.forEach((table) => {
				const item = table.data.find((i) => i.SONumber === soNumber) || {};
				Object.keys(item)
					.filter((k) => k !== 'SONumber')
					.forEach((key) => {
						row.push(truncateValue(item[key]));
					});
				row.push(''); // Empty column between tables
			});

			return row;
		});

		XLSX.utils.sheet_add_aoa(ws, data, { origin: 'A3' });

		// Set column widths
		const columnWidths = [
			{ wch: 15 }, // SO Number
			{ wch: 25 } // Aging Details
		];

		// Add widths for other columns
		tables.forEach((table) => {
			if (table.data.length > 0) {
				const tableHeaders = Object.keys(table.data[0]).filter((h) => h !== 'SONumber');
				tableHeaders.forEach(() => {
					columnWidths.push({ wch: 15 });
				});
				columnWidths.push({ wch: 5 }); // Empty column
			}
		});

		ws['!cols'] = columnWidths;

		// Set row height for the headers
		ws['!rows'] = [{ hpt: 30 }, { hpt: 25 }];

		// Add the worksheet to the workbook
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
