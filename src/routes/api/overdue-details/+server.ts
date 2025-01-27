// /api/overdue-details/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { stage, start, end } = await request.json();

    const dateFilter = {};
    if (start && end) {
      dateFilter.createdAt = {
        gte: new Date(start),
        lte: new Date(end)
      };
    }

    const stageLimits = {
      0: 24 * 60 * 60 * 1000, // 24 hours
      1: 24 * 60 * 60 * 1000, // 24 hours
      2: 10 * 24 * 60 * 60 * 1000, // 10 days
      3: 7 * 24 * 60 * 60 * 1000, // 7 days
      4: 10 * 24 * 60 * 60 * 1000, // 10 days
      5: 48 * 60 * 60 * 1000 // 48 hours
    };

    const orders = await db.stage0.findMany({
      where: {
        currentStage: stage,
        ...dateFilter
      },
      select: {
        SONumber: true,
        SOId: true,
        clientName: true,
        Total: true,
        SOCategory: true,
        PMName: true,
        clientExpectedDate: true,
        createdAt: true,
        stageHistory: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const currentDate = new Date();
    const overdueOrders = orders.filter(order => {
      const ageInMs = currentDate.getTime() - new Date(order.stageHistory[0].timestamp).getTime();
      return ageInMs > stageLimits[stage];
    }).map(order => ({
      ...order,
      ageInHours: Math.round((currentDate.getTime() - new Date(order.stageHistory[0].timestamp).getTime()) / (60 * 60 * 1000))
    }));

    return json({ orders: overdueOrders });
  } catch (error) {
    console.error('Error fetching overdue details:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};