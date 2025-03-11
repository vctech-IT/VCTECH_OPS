// src/routes/+page.server.ts
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { db } from '$lib/database'

async function getToken(fetch: typeof globalThis.fetch): Promise<string> {
    const tokenResponse = await fetch('/api/zohoAuthToken');
    const { token } = await tokenResponse.json();
    return token;
}

export const load: PageServerLoad = async ({ fetch, locals }) => {
  // redirect user if not logged in
  if (!locals.user) {
    throw redirect(302, '/login')
  }
  
  // Fetch all orders from database
  const orders = await db.stage0.findMany({
    select: {
      SOId: true,
      SONumber: true,
      clientName: true,
      SOCategory: true,
      SOAmount: true
    }
  });
  
  // Get Zoho token
  const token = await getToken(fetch);
  
  // Fetch reference numbers for each order
  const ordersWithRefs = await Promise.all(
    orders.map(async (order) => {
      try {
        const response = await fetch(
          `https://www.zohoapis.in/books/v3/salesorders/${order.SONumber}?organization_id=60005679410`,
          {
            headers: {
              'Authorization': `Zoho-oauthtoken ${token}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          return {
            ...order,
            referenceNumber: data.salesorder.reference_number || 'N/A'
          };
        }
        return { ...order, referenceNumber: 'Error' };
      } catch (error) {
        console.error(`Error fetching reference number for order ${order.SONumber}:`, error);
        return { ...order, referenceNumber: 'Error' };
      }
    })
  );
  
  return {
    orders: ordersWithRefs
  };
}
