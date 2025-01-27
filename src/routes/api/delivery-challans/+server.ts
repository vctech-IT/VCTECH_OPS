// routes/api/delivery-challan/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, url }) => {
    const dcNumber = url.searchParams.get('dc_number');

    // First, get the Zoho auth token
    const tokenResponse = await fetch('/api/zohoAuthToken');
    const { token } = await tokenResponse.json();

    if (!token) {
        return json({ error: 'Failed to obtain Zoho auth token' }, { status: 500 });
    }

    // Now use the token to fetch the delivery challan data
    const zohoResponse = await fetch(`https://books.zoho.in/api/v3/deliverychallans?dc_number=${dcNumber}`, {
        headers: {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!zohoResponse.ok) {
        return json({ error: 'Failed to fetch delivery challan data' }, { status: zohoResponse.status });
    }

    const data = await zohoResponse.json();
    return json(data);
};