// routes/api/validate-dc/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, url }) => {
    const dcNumber = url.searchParams.get('dc_number');
    const organizationId = '60005679410'; // You might want to store this in an environment variable

    // First, get the Zoho auth token
    const tokenResponse = await fetch('/api/zohoAuthToken');
    const { token } = await tokenResponse.json();

    if (!token) {
        return json({ error: 'Failed to obtain Zoho auth token' }, { status: 500 });
    }

    
    const zohoResponse = await fetch(`https://www.zohoapis.in/books/v3/deliverychallans?organization_id=60005679410&deliverychallan_number=${dcNumber}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'organization_id': organizationId,
        },
    });

    if (!zohoResponse.ok) {
        return json({ error: 'Failed to fetch delivery challan data' }, { status: zohoResponse.status });
    }

    const data = await zohoResponse.json();
    return json(data);
};
