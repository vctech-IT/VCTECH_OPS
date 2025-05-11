// src/routes/api/stage-aging/+server.ts
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
	datasources: {
		db: {
			url: process.env.DATABASE_URL
		}
	}
});

export async function GET({ url }) {
	try {
		// Parse query parameters
		const soNumber = url.searchParams.get('soNumber');
		const stage = url.searchParams.get('stage')
			? parseInt(url.searchParams.get('stage') || '0')
			: null;

		// Build query based on filters
		const whereClause = {};
		if (soNumber) whereClause.SONumber = soNumber;
		if (stage !== null) whereClause.stage = stage;

		// Get stage aging data
		const agingData = await prisma.stageAgingHistory.findMany({
			where: whereClause,
			orderBy: [{ SONumber: 'asc' }, { stage: 'asc' }],
			include: {
				SO: {
					select: {
						clientName: true,
						SOCategory: true,
						PMName: true
					}
				}
			}
		});

		// Calculate summary stats
		const stageSummary = await prisma.stageAgingHistory.groupBy({
			by: ['stage'],
			_avg: {
				durationHours: true
			},
			_min: {
				durationHours: true
			},
			_max: {
				durationHours: true
			},
			_count: true
		});

		return json({
			success: true,
			agingData,
			summary: stageSummary.map((item) => ({
				stage: item.stage,
				averageDuration: item._avg.durationHours,
				minDuration: item._min.durationHours,
				maxDuration: item._max.durationHours,
				count: item._count
			}))
		});
	} catch (error) {
		console.error('Error retrieving stage aging data:', error);
		return json({ success: false, error: 'Error retrieving stage aging data' }, { status: 500 });
	}
}

// POST endpoint for more complex queries with request body
export async function POST({ request }) {
	try {
		const { soNumber, stage, startDate, endDate, minDuration, maxDuration, pmName, clientName } =
			await request.json();

		// Build complex where clause
		const whereClause: any = {};

		if (soNumber) whereClause.SONumber = soNumber;
		if (stage !== undefined && stage !== null) whereClause.stage = stage;

		// Date range filtering
		if (startDate || endDate) {
			whereClause.endTime = {};
			if (startDate) whereClause.endTime.gte = new Date(startDate);
			if (endDate) whereClause.endTime.lte = new Date(endDate);
		}

		// Duration filtering
		if (minDuration !== undefined || maxDuration !== undefined) {
			whereClause.durationHours = {};
			if (minDuration !== undefined) whereClause.durationHours.gte = minDuration;
			if (maxDuration !== undefined) whereClause.durationHours.lte = maxDuration;
		}

		// PM and client filtering
		if (pmName || clientName) {
			whereClause.SO = {};
			if (pmName) whereClause.SO.PMName = pmName;
			if (clientName) whereClause.SO.clientName = { contains: clientName };
		}

		// Get stage aging data with filters
		const agingData = await prisma.stageAgingHistory.findMany({
			where: whereClause,
			orderBy: [{ endTime: 'desc' }],
			include: {
				SO: {
					select: {
						clientName: true,
						SOCategory: true,
						PMName: true,
						orderStatus: true,
						invoiceStatus: true
					}
				}
			}
		});

		return json({
			success: true,
			agingData,
			count: agingData.length
		});
	} catch (error) {
		console.error('Error filtering stage aging data:', error);
		return json({ success: false, error: 'Error filtering stage aging data' }, { status: 500 });
	}
}
