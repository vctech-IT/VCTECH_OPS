// /api/reference-numbers/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { orderIds } = await request.json();
    
    // Get Zoho token using your existing function
    const token = await getZohoToken();
    
    // Process batches of orders in parallel with a limit
    const promises = orderIds.map(async (orderId) => {
      try {
        const zohoResponse = await fetch(`https://www.zohoapis.in/books/v3/salesorders/${orderId}?organization_id=60005679410`, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${token}`
          }
        });
        
        if (zohoResponse.ok) {
          const zohoData = await zohoResponse.json();
          return {
            SOId: orderId,
            referenceNumber: zohoData.salesorder.reference_number || ''
          };
        }
      } catch (error) {
        console.error(`Error fetching reference number for ${orderId}:`, error);
      }
      return { SOId: orderId, referenceNumber: '' };
    });
    
    const references = await Promise.all(promises);
    
    return json({ references });
  } catch (error) {
    console.error('Error fetching reference numbers:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};
