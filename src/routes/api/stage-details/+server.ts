// /api/stage-details/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { stage, start, end, orderStatus, pmNameFilter, invoiceStatus } = await request.json();

    const dateFilter = {};
    if (start && end) {
      dateFilter.createdAt = {
        gte: new Date(start),
        lte: new Date(end)
      };
    }

    const statusFilter = orderStatus === 'all' ? {} : { orderStatus };
    const pmFilter = pmNameFilter === 'all' ? {} : { PMName: pmNameFilter };
    const invoiceFilter = invoiceStatus === 'all' ? {} : { invoiceStatus };

    const orders = await db.stage0.findMany({
      where: {
        currentStage: stage,
        ...dateFilter,
        ...statusFilter,
        ...pmFilter,
        ...invoiceFilter
      },
      select: {
        SONumber: true,
        SOId: true,
        referenceNumber: true,
        clientName: true,
        Total: true,
        SOCategory: true,
        PMName: true,
        clientExpectedDate: true,
        createdAt: true,
        orderStatus: true,
        invoiceStatus: true,
        stageHistory: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const processedOrders = orders.map(order => {
      const lastUpdated = order.stageHistory[0]?.timestamp;
      const ageInHours = lastUpdated
        ? Math.round((now.getTime() - new Date(lastUpdated).getTime()) / (60 * 60 * 1000))
        : 0;

      return {
        ...order,
        ageInHours,
        lastUpdated,
        isOverdue: ageInHours > 48 // Assuming orders are overdue after 48 hours, adjust as needed
      };
    });

    return json({ orders: processedOrders });
  } catch (error) {
    console.error('Error fetching stage details:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};
