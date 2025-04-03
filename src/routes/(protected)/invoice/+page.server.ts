// routes/invoice/+page.server.ts
import type { PageServerLoad } from './$types';
import { db as prisma } from '$lib/database';
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ url, locals }) => {

            // redirect user if not logged in
            if (!locals.user) {
                redirect(302, '/login')
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
      { customer_name: { contains: search, mode: 'insensitive' } },
      { invoice_number: { contains: search, mode: 'insensitive' } },
      { reference_number: { contains: search, mode: 'insensitive' } }
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
      filter.branch_name = { in: branches };
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
    const [invoices, totalInvoices, allStatuses, allBranches] = await Promise.all([
      prisma.invoice.findMany({
        where: filter,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          zoho_invoice_id: true,
          branch_name: true,
          balance: true,
          total: true,
          reference_number: true,
          date: true,
          invoice_number: true,
          customer_name: true,
          status: true,
          due_date: true
        }
      }),
      prisma.invoice.count({ where: filter }),
      prisma.invoice.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.invoice.groupBy({
        by: ['branch_name'],
        _count: true
      })
    ]);

    return {
      invoices,
      totalInvoices,
      availableStatuses: allStatuses.map(status => status.status),
      availableBranches: allBranches.map(branch => branch.branch_name),
      page,
      limit,
      search,
      sortColumn,
      sortDirection
    };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return {
      invoices: [],
      totalInvoices: 0,
      availableStatuses: [],
      availableBranches: [],
      page,
      limit,
      search,
      sortColumn,
      sortDirection,
      error: 'Failed to fetch invoices'
    };
  }
};
