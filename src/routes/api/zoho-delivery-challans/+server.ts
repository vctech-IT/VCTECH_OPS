// src/routes/api/zoho-delivery-challans/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const REFRESH_TOKEN = '1000.b94e5345a93e9e0f672a31a27a2fd390.0ba27ca3d43ba0863e11c303b6a8c16f';
const CLIENT_ID = '1000.KXTGP1GAGIDX12Q294C6OIMVR60VMX';
const CLIENT_SECRET = 'bb44b083c2b29eb4eefd1a605266a866fcd5f491fb';
const REDIRECT_URI = 'https://www.google.com/';
const ORGANIZATION_ID = '60005679410';

let authToken: string | null = null;
let tokenExpiry = 0;

interface TokenResponse {
    access_token: string;
    expires_in: number;
}

async function refreshToken(): Promise<void> {
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
}

interface DeliveryChallan {
    challan_number: string;
    date: string;
    customer_name: string;
    status: string;
    total: number;
    balance: number;
    reference_number: string;
}

async function fetchDeliveryChallans(token: string): Promise<DeliveryChallan[]> {
    const response = await fetch(`https://books.zoho.in/api/v3/deliverychallans?organization_id=${ORGANIZATION_ID}`, {
        method: 'GET',
        headers: {
            'Authorization': `Zoho-oauthtoken ${token}`
        }
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.deliverychallans; // Adjust this if the API response structure is different
}

export const GET: RequestHandler = async () => {
    // If token is expired or will expire in the next 5 minutes, refresh it
    if (!authToken || Date.now() > tokenExpiry - 300000) {
        await refreshToken();
    }
   
    try {
        const deliveryChallans = await fetchDeliveryChallans(authToken!);
        return json({ deliveryChallans });
    } catch (error) {
        console.error('Error fetching delivery challans:', error);
        return json({ error: 'Failed to fetch delivery challans' }, { status: 500 });
    }
};
