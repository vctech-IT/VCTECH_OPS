// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';

const CLIENT_ID = '1000.PN9H4DB1F9UMY9NCNC09T1KXOPCY0S';
const CLIENT_SECRET = 'e7265c042a0e212f0d8f0ed1bc09898e1b3a558371';
const REDIRECT_URI = 'https://www.google.com/';
const REFRESH_TOKEN = '1000.6392365fb9997c38ca5c12c720462933.0483d564157c9ebdeb4de99ba951791f';

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    scope: string;
    api_domain: string;
    token_type: string;
    expires_in: number;
}

// Store token data with expiration time
let tokenCache: {
    token: string;
    expiresAt: number;
} | null = null;

async function getAuthToken(): Promise<string> {
    const now = Date.now();
    
    // Check if we have a cached token that's still valid (with 60s buffer)
    if (tokenCache && tokenCache.expiresAt > now + 60000) {
        console.log('Using cached token');
        return tokenCache.token;
    }
    
    // Token expired or doesn't exist, get a new one
    console.log('Fetching new auth token');
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
    
    // Cache the token with expiration time
    tokenCache = {
        token: data.access_token,
        expiresAt: now + (data.expires_in * 1000) // convert seconds to milliseconds
    };
    
    return data.access_token;
}

export const load: PageServerLoad = async ({params}) => {
    
    try {
        const authToken = await getAuthToken();
       
        // Fetch invoice details using the obtained token
        const invoiceId = params.id;
        console.log('invoiceID:', invoiceId);
        const invoiceResponse = await fetch(
            `https://www.zohoapis.in/books/v3/invoices/${invoiceId}?organization_id=60005679410`,
            {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${authToken}`
                }
            }
        );
        
        if (!invoiceResponse.ok) {
            throw new Error(`Failed to fetch invoice data: ${invoiceResponse.status}`);
        }
        
        const invoiceData = await invoiceResponse.json();
        return {
            success: true,
            invoiceData
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
