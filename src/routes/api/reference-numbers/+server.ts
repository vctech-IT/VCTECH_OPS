// /api/reference-numbers/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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
