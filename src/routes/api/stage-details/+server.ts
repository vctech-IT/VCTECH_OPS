// /api/stage-details/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

async function getZohoToken() {
  // Implement your token fetching logic
  // You might want to reuse your existing token logic from salesOrder/[id]/+page.server.ts
  const tokenResponse = await fetch('/api/zohoAuthToken');
  const { token } = await tokenResponse.json();
  return token;
}

export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    const { stage, start, end, orderStatus, pmNameFilter } = await request.json();
    const dateFilter = {};
    if (start && end) {
      dateFilter.createdAt = {
        gte: new Date(start),
        lte: new Date(end)
      };
    }
    const statusFilter = orderStatus === 'all' ? {} : { orderStatus };
    const pmFilter = pmNameFilter === 'all' ? {} : { PMName: pmNameFilter };
    
    const orders = await db.stage0.findMany({
      where: {
        currentStage: stage,
        ...dateFilter,
        ...statusFilter,
        ...pmFilter
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
        orderStatus: true,
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
    
    // Fetch reference numbers from Zoho API
    const token = await getZohoToken();
    for (const order of processedOrders) {
      try {
        const zohoResponse = await fetch(`https://www.zohoapis.in/books/v3/salesorders/${order.SOId}?organization_id=60005679410`, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${token}`
          }
        });
        
        if (zohoResponse.ok) {
          const zohoData = await zohoResponse.json();
          order.referenceNumber = zohoData.salesorder.reference_number || '';
        } else {
          console.error(`Failed to fetch reference number for ${order.SONumber}: ${zohoResponse.status}`);
          order.referenceNumber = '';
        }
      } catch (error) {
        console.error(`Error fetching reference number for ${order.SONumber}:`, error);
        order.referenceNumber = '';
      }
    }
    
    return json({ orders: processedOrders });
  } catch (error) {
    console.error('Error fetching stage details:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};
