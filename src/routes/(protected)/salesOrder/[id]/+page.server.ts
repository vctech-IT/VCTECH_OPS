// src/routes/salesOrder/[id]/+page.server.ts
import type { PageServerLoad } from './$types';
import type { SalesOrder } from '$lib/types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/database';

async function getToken(fetch: typeof globalThis.fetch): Promise<string> {
    const tokenResponse = await fetch('/api/zohoAuthToken');
    const { token } = await tokenResponse.json();
    return token;
}

export const load: PageServerLoad = async ({ params, fetch, locals }) => {

        // redirect user if not logged in
        if (!locals.user) {
            throw redirect(302, new URL('/login', 'http://localhost:5173').toString());
    }
    
         if (!locals.user) {
            throw redirect(302, new URL('/login', 'https://vc-tech.vercel.app/').toString());
        }

    const token = await getToken(fetch);
    const salesOrderId = params.id;

    const response = await fetch(`https://www.zohoapis.in/books/v3/salesorders/${salesOrderId}?organization_id=60005679410`, {
        headers: {
            'Authorization': `Zoho-oauthtoken ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const salesOrder: SalesOrder = data.salesorder;



        // Fetch activity logs from your database
         const activityLogs = await db.activityLog.findMany({
        where: { salesOrderId: salesOrder.salesorder_number },
        orderBy: { timestamp: 'desc' }
         });
    
        // Fetch Stage0 data from your database
        const currentStage = await db.stage0.findUnique({
        where: { SONumber: salesOrder.salesorder_number },
        select: { currentStage: true }
        });
    
        const stage0Data = await db.stage0.findUnique({
        where: { SONumber: salesOrder.salesorder_number },
        select: { currentStage: true, isDropped: true }
    });

    return {
        salesOrder,
        activityLogs,
        currentStage,
        isDropped: stage0Data?.isDropped || false
    };
};
