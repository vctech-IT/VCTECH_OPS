import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

async function getToken(fetch: typeof globalThis.fetch): Promise<string> {
    const tokenResponse = await fetch('/api/zohoAuthToken');
    const { token } = await tokenResponse.json();
    return token;
}

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
    // Redirect user if not logged in
    if (!locals.user) {
        throw redirect(302, new URL('/login', 'http://localhost:5173').toString());
    }

    const token = await getToken(fetch);
    const invoiceId = params.id;

    const response = await fetch(`https://www.zohoapis.in/books/v3/invoices/${invoiceId}?organization_id=60005679410`, {
        headers: {
            'Authorization': `Zoho-oauthtoken ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
        invoice: data.invoice
    };
};
