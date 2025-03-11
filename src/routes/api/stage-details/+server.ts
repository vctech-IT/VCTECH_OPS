// /api/stage-details/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';
import pLimit from 'p-limit';

// Zoho credentials
const REFRESH_TOKEN = '1000.b94e5345a93e9e0f672a31a27a2fd390.0ba27ca3d43ba0863e11c303b6a8c16f';
const CLIENT_ID = '1000.KXTGP1GAGIDX12Q294C6OIMVR60VMX';
const CLIENT_SECRET = 'bb44b083c2b29eb4eefd1a605266a866fcd5f491fb';
const REDIRECT_URI = 'https://www.google.com/';

// In-memory token cache (note: this will reset on server restarts)
let authToken: string | null = null;
let tokenExpiry = 0;

interface TokenResponse {
    access_token: string;
    expires_in: number;
}

// Function to get a fresh Zoho token
async function getZohoToken(): Promise<string> {
    // If token is expired or will expire in the next 5 minutes, refresh it
    if (!authToken || Date.now() > tokenExpiry - 300000) {
        try {
            const response = await fetch('https://accounts.zoho.in/oauth/v2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    refresh_token: REFRESH_TOKEN,
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    redirect_uri: REDIRECT_URI,
                    grant_type: 'refresh_token'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data: TokenResponse = await response.json();
            authToken = data.access_token;
            tokenExpiry = Date.now() + (data.expires_in * 1000);
        } catch (error) {
            console.error('Error refreshing Zoho token:', error);
            throw error;
        }
    }
    
    return authToken!;
}

export const POST: RequestHandler = async ({ request }) => {
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
        isOverdue: ageInHours > 48, 
        referenceNumber: '' // Initialize with empty string
      };
    });
    
    // Get Zoho token
    let token;
    try {
      token = await getZohoToken();
    } catch (error) {
      console.error('Error getting Zoho token:', error);
      // Return processed orders without reference numbers
      return json({ orders: processedOrders });
    }
    
    const limit = pLimit(5); // Process 5 requests at a time
    const promises = processedOrders.map(order => {
      return limit(async () => {
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
          }
        } catch (error) {
          console.error(`Error fetching reference number for ${order.SONumber}:`, error);
        }
        return order;
      });
    });
    
    await Promise.all(promises);
    
    return json({ orders: processedOrders });
  } catch (error) {
    console.error('Error fetching stage details:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};
