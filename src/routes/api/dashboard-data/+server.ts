// src/routes/api/dashboard-data/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

// Define types for better type safety
type StageSummary = {
	onTime: number;
	overdue: number;
};

type ProcessedCurrentAgingData = {
	summary: Record<number, StageSummary>;
	details: {
		SONumber: string;
		stage: number;
		ageInHours: number;
		isOverdue: boolean;
		stageEntryTime: Date;
	}[];
};

function calculateCurrentAging(
	stageHistoryData: any[],
	currentDate: Date
): ProcessedCurrentAgingData {
	const stageLimits: Record<number, number> = {
		0: 24 * 60 * 60 * 1000, // 24 hours
		1: 24 * 60 * 60 * 1000, // 24 hours
		2: 10 * 24 * 60 * 60 * 1000, // 10 days
		3: 7 * 24 * 60 * 60 * 1000, // 7 days
		4: 10 * 24 * 60 * 60 * 1000, // 10 days
		5: 48 * 60 * 60 * 1000 // 48 hours
	};

	// Initialize summary with all possible stages
	const summary: Record<number, StageSummary> = {};
	Object.keys(stageLimits).forEach((stage) => {
		summary[Number(stage)] = { onTime: 0, overdue: 0 };
	});

	const details = stageHistoryData.map((item) => {
		const stage = Number(item.stage);
		const stageEntryTime = new Date(item.timestamp);
		const ageInMs = currentDate.getTime() - stageEntryTime.getTime();
		const ageInHours = Math.round(ageInMs / (60 * 60 * 1000));
		const isOverdue = ageInMs > stageLimits[stage];

		// Update summary counters
		if (summary[stage]) {
			if (isOverdue) {
				summary[stage].overdue++;
			} else {
				summary[stage].onTime++;
			}
		}

		return {
			SONumber: item.SONumber,
			stage,
			ageInHours,
			isOverdue,
			stageEntryTime
		};
	});

	return { summary, details };
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { start, end, orderStatus, pmNameFilter, invoiceStatusFilter } = await request.json();

		// Define date filter
		const dateFilter = {};
		if (start && end) {
			dateFilter.createdAt = {
				gte: new Date(start),
				lte: new Date(end)
			};
		}

		const statusFilter = orderStatus === 'all' ? {} : { orderStatus };
		const pmFilter = pmNameFilter === 'all' ? {} : { PMName: pmNameFilter };
		const invoiceFilter =
			invoiceStatusFilter === 'all' ? {} : { invoiceStatus: invoiceStatusFilter };

		const [
			totalOrders,
			totalRevenue,
			activeInstallations,
			activeServices,
			orderCategories,
			recentOrders,
			ordersByStage,
			topCustomers,
			installationDetails,
			serviceDetails,
			// Get current stage entry data for aging calculation
			currentStagesData,
			pmNames,
			invoiceStatuses,
			// Get stage aging history for completed stages
			stageAgingHistory
		] = await Promise.all([
			db.stage0.count({ where: { ...dateFilter, ...statusFilter, ...pmFilter, ...invoiceFilter } }),
			db.stage0.aggregate({
				_sum: { Total: true },
				where: { ...dateFilter, ...statusFilter, ...pmFilter, ...invoiceFilter }
			}),
			db.installation.count({
				where: {
					...dateFilter,
					InstReport: { not: null }
				}
			}),
			db.service.count({
				where: {
					...dateFilter,
					ServiceReport: { not: null }
				}
			}),
			db.stage0.groupBy({
				by: ['SOCategory'],
				_count: true,
				where: { ...dateFilter, ...statusFilter, ...pmFilter, ...invoiceFilter }
			}),
			db.stage0.findMany({
				where: dateFilter,
				orderBy: { createdAt: 'desc' },
				take: 10,
				select: {
					SONumber: true,
					SOId: true,
					clientName: true,
					Total: true,
					currentStage: true,
					createdAt: true
				}
			}),
			db.stage0.groupBy({
				by: ['currentStage'],
				_count: true,
				where: { ...dateFilter, ...statusFilter, ...pmFilter, ...invoiceFilter }
			}),
			db.stage0.groupBy({
				by: ['clientName'],
				_count: { SONumber: true },
				_sum: { Total: true },
				orderBy: [{ _sum: { Total: 'desc' } }],
				take: 10,
				where: { ...dateFilter, ...statusFilter, ...pmFilter, ...invoiceFilter }
			}),
			// Installation details
			db.installation.findMany({
				where: {
					...dateFilter,
					InstReport: { not: null }
				},
				select: {
					SONumber: true,
					engName: true,
					ScheduleDate: true,
					VendorName: true,
					SONo: {
						select: {
							SOId: true,
							clientName: true,
							SOCategory: true,
							Total: true
						}
					}
				}
			}),
			// Service details
			db.service.findMany({
				where: {
					...dateFilter,
					ServiceReport: { not: null }
				},
				select: {
					SONumber: true,
					engName: true,
					ScheduleDate: true,
					VendorName: true,
					SONo: {
						select: {
							SOId: true,
							clientName: true,
							SOCategory: true,
							Total: true
						}
					}
				}
			}),
			// Get latest stage history entry for each order
			Promise.all(
				(
					await db.stage0.findMany({
						where: { ...dateFilter, ...statusFilter, ...pmFilter, ...invoiceFilter },
						select: { SONumber: true, currentStage: true }
					})
				).map(async (order) => {
					const latestEntry = await db.stageHistory.findFirst({
						where: {
							SONumber: order.SONumber,
							stage: order.currentStage
						},
						orderBy: { timestamp: 'desc' }
					});
					return latestEntry;
				})
			).then((results) => results.filter(Boolean)), // Filter out nulls

			db.stage0.findMany({
				select: {
					PMName: true
				},
				distinct: ['PMName'],
				orderBy: {
					PMName: 'asc'
				}
			}),

			db.stage0.findMany({
				select: {
					invoiceStatus: true
				},
				distinct: ['invoiceStatus'],
				orderBy: {
					invoiceStatus: 'asc'
				}
			}),

			// Stage aging history summary
			db.stageAgingHistory.groupBy({
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
			})
		]);

		// Calculate current aging for orders in each stage
		const currentAging = calculateCurrentAging(currentStagesData, new Date());

		return json({
			totalOrders,
			totalRevenue: totalRevenue._sum.Total || 0,
			activeInstallations,
			activeServices,
			orderCategories: orderCategories.map((c) => ({
				category: c.SOCategory,
				count: c._count
			})),
			recentOrders,
			ordersByStage: ordersByStage.map((s) => ({
				stage: s.currentStage,
				count: s._count
			})),
			topCustomers: topCustomers.map((c) => ({
				name: c.clientName,
				totalOrders: c._count.SONumber,
				totalRevenue: c._sum.Total || 0
			})),
			installationDetails: installationDetails.map((i) => ({
				SONumber: i.SONumber,
				SOId: i.SONo.SOId,
				clientName: i.SONo.clientName,
				category: i.SONo.SOCategory,
				cost: i.SONo.Total,
				engName: i.engName,
				scheduleDate: i.ScheduleDate,
				vendorName: i.VendorName
			})),
			serviceDetails: serviceDetails.map((s) => ({
				SONumber: s.SONumber,
				SOId: s.SONo.SOId,
				clientName: s.SONo.clientName,
				category: s.SONo.SOCategory,
				cost: s.SONo.Total,
				engName: s.engName,
				scheduleDate: s.ScheduleDate,
				vendorName: s.VendorName
			})),
			currentAging, // Updated aging data for current stages
			pmNames: pmNames.map((pm) => pm.PMName),
			invoiceStatuses: invoiceStatuses.map((inv) => inv.invoiceStatus).filter(Boolean),
			// Historical stage aging summary
			stageAgingSummary: stageAgingHistory.map((item) => ({
				stage: item.stage,
				averageDuration: item._avg.durationHours,
				minDuration: item._min.durationHours,
				maxDuration: item._max.durationHours,
				count: item._count
			}))
		});
	} catch (error) {
		console.error('Error fetching dashboard data:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
