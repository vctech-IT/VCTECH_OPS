// routes/deliveryChallans/+page.server.ts
import type { PageServerLoad } from './$types';
import { db as prisma } from '$lib/database';
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ url, locals }) => {
    
    if (!locals.user) {
        throw redirect(302, new URL('/login', 'https://vc-tech.vercel.app/').toString());
    }
    
    // Extract query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const sortColumn = url.searchParams.get('sortColumn') || 'date';
    const sortDirection = url.searchParams.get('sortDirection') || 'desc';
    const statusFilter = url.searchParams.get('status') || '';
    const branchFilter = url.searchParams.get('branch') || '';
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    const minTotal = url.searchParams.get('minTotal') || '';
    const maxTotal = url.searchParams.get('maxTotal') || '';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build filter object
    let filter: any = {};
    
    // Search across multiple fields
    if (search) {
        filter.OR = [
            { customerName: { contains: search, mode: 'insensitive' } },
            { dcNumber: { contains: search, mode: 'insensitive' } },
            { referenceNumber: { contains: search, mode: 'insensitive' } }
        ];
    }

    // Status filter
    if (statusFilter) {
        const statuses = statusFilter.split(',');
        if (statuses.length > 0) {
            filter.status = { in: statuses };
        }
    }

    // Branch filter
    if (branchFilter) {
        const branches = branchFilter.split(',');
        if (branches.length > 0) {
            filter.branchName = { in: branches };
        }
    }

    // Date range filter
    if (startDate && endDate) {
        filter.date = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    } else if (startDate) {
        filter.date = { gte: new Date(startDate) };
    } else if (endDate) {
        filter.date = { lte: new Date(endDate) };
    }

    // Total amount range filter
    if (minTotal || maxTotal) {
        filter.total = {};
        if (minTotal) filter.total.gte = parseFloat(minTotal);
        if (maxTotal) filter.total.lte = parseFloat(maxTotal);
    }

    // Build sort object
    const orderBy: any = {};
    orderBy[sortColumn] = sortDirection;

    try {
        // Execute queries in parallel for better performance
        const [deliveryChallans, totalDeliveryChallans, allStatuses, allBranches] = await Promise.all([
            prisma.deliveryChallans.findMany({
                where: filter,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    dcNumber_id: true,
                    branchName: true,
                    total: true,
                    referenceNumber: true,
                    date: true,
                    dcNumber: true,
                    customerName: true,
                    status: true
                }
            }),
            prisma.deliveryChallans.count({ where: filter }),
            prisma.deliveryChallans.groupBy({
                by: ['status'],
                _count: true
            }),
            prisma.deliveryChallans.groupBy({
                by: ['branchName'],
                _count: true
            })
        ]);

        return {
            deliveryChallans,
            totalDeliveryChallans,
            availableStatuses: allStatuses.map(status => status.status),
            availableBranches: allBranches.map(branch => branch.branchName),
            page,
            limit,
            search,
            sortColumn,
            sortDirection
        };
    } catch (error) {
        console.error('Error fetching delivery challans:', error);
        return {
            deliveryChallans: [],
            totalDeliveryChallans: 0,
            availableStatuses: [],
            availableBranches: [],
            page,
            limit,
            search,
            sortColumn,
            sortDirection,
            error: 'Failed to fetch delivery challans'
        };
    }
};
