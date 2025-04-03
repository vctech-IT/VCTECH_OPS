// routes/salesOrder/+page.server.ts
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

    // Build filter object
    let filter: any = {};
    
    // Search across multiple fields
    if (search) {
      filter.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { SONumber: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Order Status filter
    if (statusFilter) {
      const statuses = statusFilter.split(',');
      if (statuses.length > 0) {
        filter.orderStatus = { in: statuses };
      }
    }

    // Invoice Status filter
    if (invoiceStatusFilter) {
      const invoiceStatuses = invoiceStatusFilter.split(',');
      if (invoiceStatuses.length > 0) {
        filter.invoiceStatus = { in: invoiceStatuses };
      }
    }

    // Payment Status filter
    if (paymentStatusFilter) {
      const paymentStatuses = paymentStatusFilter.split(',');
      if (paymentStatuses.length > 0) {
        filter.paymentStatus = { in: paymentStatuses };
      }
    }

    // Ops Status (currentStage) filter
    if (opsStatusFilter) {
      const opsStatuses = opsStatusFilter.split(',').map(Number);
      if (opsStatuses.length > 0) {
        filter.currentStage = { in: opsStatuses };
      }
    }

    // Delivery Method filter
    if (deliveryMethodFilter) {
      const deliveryMethods = deliveryMethodFilter.split(',');
      if (deliveryMethods.length > 0) {
        filter.deliveryMethod = { in: deliveryMethods };
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
      filter.Total = {};
      if (minTotal) filter.Total.gte = parseFloat(minTotal);
      if (maxTotal) filter.Total.lte = parseFloat(maxTotal);
    }

    // Build sort object
    const orderBy: any = {};
    orderBy[sortColumn] = sortDirection;

    try {
      // Execute queries in parallel for better performance
      const [salesOrders, totalSalesOrders, allStatuses, allDeliveryMethods, allInvoiceStatuses, allPaymentStatuses, allOpsStatuses] = await Promise.all([
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
        prisma.stage0.count({ where: filter }),
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

      return {
        salesOrders,
        totalSalesOrders,
        availableStatuses: allStatuses.map(status => status.orderStatus),
        availableDeliveryMethods: allDeliveryMethods.map(method => method.deliveryMethod),
        availableInvoiceStatuses: allInvoiceStatuses.map(status => status.invoiceStatus),
        availablePaymentStatuses: allPaymentStatuses.map(status => status.paymentStatus),
        availableOpsStatuses: allOpsStatuses.map(status => status.currentStage),
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
