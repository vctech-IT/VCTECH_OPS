// routes/salesOrder/+page.server.ts
import type { PageServerLoad } from './$types';
import { db as prisma } from '$lib/database';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';

// Add cache with TTL for filter options
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let filterOptionsCache = {
  timestamp: 0,
  data: {
    availableStatuses: [],
    availableDeliveryMethods: [],
    availableInvoiceStatuses: [],
    availablePaymentStatuses: [],
    availableOpsStatuses: []
  }
};

export const load: PageServerLoad = async ({ url, locals }) => {
  // Redirect user if not logged in
  if (!locals.user) {
    redirect(302, '/login');
  }
    
  // Extract query parameters
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const search = url.searchParams.get('search') || '';
  const sortColumn = url.searchParams.get('sortColumn') || 'date';
  const sortDirection = url.searchParams.get('sortDirection') || 'desc';
  const statusFilter = url.searchParams.get('status') || '';
  const deliveryMethodFilter = url.searchParams.get('deliveryMethod') || '';
  const startDate = url.searchParams.get('startDate') || '';
  const endDate = url.searchParams.get('endDate') || '';
  const minTotal = url.searchParams.get('minTotal') || '';
  const maxTotal = url.searchParams.get('maxTotal') || '';
  const invoiceStatusFilter = url.searchParams.get('invoiceStatus') || '';
  const paymentStatusFilter = url.searchParams.get('paymentStatus') || '';
  const opsStatusFilter = url.searchParams.get('currentStage') || '';

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build optimized filter object
  const filter: any = buildOptimizedFilter(
    search, 
    statusFilter, 
    invoiceStatusFilter, 
    paymentStatusFilter, 
    opsStatusFilter,
    deliveryMethodFilter,
    startDate,
    endDate,
    minTotal,
    maxTotal
  );

  // Build sort object
  const orderBy: any = {};
  orderBy[sortColumn] = sortDirection;

  try {
    // Check if filter options are cached and still valid
    const now = Date.now();
    let filterOptions: any = {};
    
    if (now - filterOptionsCache.timestamp < CACHE_TTL && !dev) {
      // Use cached filter options
      filterOptions = filterOptionsCache.data;
    } else {
      // Fetch filter options from database
      const [allStatuses, allDeliveryMethods, allInvoiceStatuses, allPaymentStatuses, allOpsStatuses] = 
        await Promise.all([
          prisma.stage0.groupBy({
            by: ['orderStatus'],
            _count: true
          }),
          prisma.stage0.groupBy({
            by: ['deliveryMethod'],
            _count: true
          }),
          prisma.stage0.groupBy({
            by: ['invoiceStatus'],
            _count: true
          }),
          prisma.stage0.groupBy({
            by: ['paymentStatus'],
            _count: true
          }),
          prisma.stage0.groupBy({
            by: ['currentStage'],
            _count: true
          })
        ]);

      filterOptions = {
        availableStatuses: allStatuses.map(status => status.orderStatus),
        availableDeliveryMethods: allDeliveryMethods.map(method => method.deliveryMethod),
        availableInvoiceStatuses: allInvoiceStatuses.map(status => status.invoiceStatus),
        availablePaymentStatuses: allPaymentStatuses.map(status => status.paymentStatus),
        availableOpsStatuses: allOpsStatuses.map(status => status.currentStage)
      };

      // Update cache
      filterOptionsCache = {
        timestamp: now,
        data: filterOptions
      };
    }

    // Execute query for sales orders and count in parallel
    const [salesOrders, totalSalesOrders] = await Promise.all([
      prisma.stage0.findMany({
        where: filter,
        skip,
        take: limit,
        orderBy,
        select: {
          date: true,
          SONumber: true,
          SOId: true,
          clientName: true,
          referenceNumber: true,
          Total: true,
          orderStatus: true,
          invoiceStatus: true,
          paymentStatus: true,
          currentStage: true,
          deliveryMethod: true
        }
      }),
      prisma.stage0.count({ where: filter })
    ]);

    return {
      salesOrders,
      totalSalesOrders,
      ...filterOptions,
      page,
      limit,
      search,
      sortColumn,
      sortDirection
    };
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    return {
      salesOrders: [],
      totalSalesOrders: 0,
      availableStatuses: [],
      availableDeliveryMethods: [],
      availableInvoiceStatuses: [],
      availablePaymentStatuses: [],
      availableOpsStatuses: [],
      page,
      limit,
      search,
      sortColumn,
      sortDirection,
      error: 'Failed to fetch sales orders'
    };
  }
};

// Optimized filter builder
function buildOptimizedFilter(
  search: string,
  statusFilter: string,
  invoiceStatusFilter: string,
  paymentStatusFilter: string,
  opsStatusFilter: string,
  deliveryMethodFilter: string,
  startDate: string,
  endDate: string,
  minTotal: string,
  maxTotal: string
) {
  const filter: any = {};
  
  // Use composite indices where possible
  if (search) {
    filter.OR = [
      { clientName: { contains: search, mode: 'insensitive' } },
      { SONumber: { contains: search, mode: 'insensitive' } },
      { referenceNumber: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Build filter arrays in one pass
  const filterMap: Record<string, { field: string, values: any[], transform?: (val: string) => any }> = {
    status: { field: 'orderStatus', values: [], transform: (v) => v },
    invoice: { field: 'invoiceStatus', values: [], transform: (v) => v },
    payment: { field: 'paymentStatus', values: [], transform: (v) => v },
    ops: { field: 'currentStage', values: [], transform: (v) => Number(v) },
    delivery: { field: 'deliveryMethod', values: [], transform: (v) => v }
  };

  if (statusFilter) filterMap.status.values = statusFilter.split(',');
  if (invoiceStatusFilter) filterMap.invoice.values = invoiceStatusFilter.split(',');
  if (paymentStatusFilter) filterMap.payment.values = paymentStatusFilter.split(',');
  if (opsStatusFilter) filterMap.ops.values = opsStatusFilter.split(',');
  if (deliveryMethodFilter) filterMap.delivery.values = deliveryMethodFilter.split(',');

  // Apply filters
  Object.entries(filterMap).forEach(([key, config]) => {
    if (config.values.length > 0) {
      filter[config.field] = { 
        in: config.transform ? config.values.map(config.transform) : config.values 
      };
    }
  });

  // Date range filter - optimization to avoid creating unnecessary objects
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.gte = new Date(startDate);
    if (endDate) filter.date.lte = new Date(endDate);
  }

  // Total amount range filter
  if (minTotal || maxTotal) {
    filter.Total = {};
    if (minTotal) filter.Total.gte = parseFloat(minTotal);
    if (maxTotal) filter.Total.lte = parseFloat(maxTotal);
  }

  return filter;
}
