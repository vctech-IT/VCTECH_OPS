import type { PageServerLoad } from './$types';
import type { SalesOrder } from '$lib/types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/database';

interface ZohoResponse {
    salesorders: SalesOrder[];
    page_context: {
        page: number;
        per_page: number;
        has_more_page: boolean;
        report_name: string;
        applied_filter: string;
        sort_column: string;
        sort_order: string;
    };
}

async function getToken(fetch: typeof globalThis.fetch): Promise<string> {
    const tokenResponse = await fetch('/api/zohoAuthToken');
    const { token } = await tokenResponse.json();
    return token;
}

export const load: PageServerLoad = async ({ fetch, locals, url, depends }) => {
    depends('app:salesOrders');

    if (!locals.user) {
        throw redirect(302, '/login');
    }

    const token = await getToken(fetch);
    const page = Number(url.searchParams.get('page')) || 1;
    const per_page = 200;
    const searchTerm = url.searchParams.get('search') || '';
    const statusFilter = url.searchParams.get('status') || 'all';
    const opsStatusFilter = url.searchParams.get('opsStatus') || 'all';

    let orders: SalesOrder[];
    let hasMore: boolean;

    ;

    if (searchTerm) {
        const response = await fetch(`https://www.zohoapis.in/books/v3/salesorders?organization_id=60005679410&salesorder_number=${searchTerm}`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ZohoResponse = await response.json();
        orders = data.salesorders;
        hasMore = false;
    } else if (statusFilter !== 'all') {
         const response = await fetch(`https://www.zohoapis.in/books/v3/salesorders?organization_id=60005679410&page=${page}&per_page=${per_page}&status=${statusFilter}`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ZohoResponse = await response.json();
        orders = data.salesorders;
        hasMore = data.page_context.has_more_page;
    } else{
        const response = await fetch(`https://www.zohoapis.in/books/v3/salesorders?organization_id=60005679410&page=${page}&per_page=${per_page}`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ZohoResponse = await response.json();
        orders = data.salesorders;
        hasMore = data.page_context.has_more_page;
    }

    const opsStatuses = await Promise.all(orders.map(async (order) => {
        const stage0 = await db.stage0.findUnique({
            where: { SONumber: order.salesorder_number },
            select: { currentStage: true }
        });
        return {
            salesorder_number: order.salesorder_number,
            opsStatus: stage0 ? stage0.currentStage : null
        };
    }));

    let ordersWithOpsStatus = orders.map(order => ({
        ...order,
        opsStatus: opsStatuses.find(status => status.salesorder_number === order.salesorder_number)?.opsStatus
    }));

    if (opsStatusFilter !== 'all') {
        const filterValue = opsStatusFilter === 'null' ? null : Number(opsStatusFilter);
        ordersWithOpsStatus = ordersWithOpsStatus.filter(order => order.opsStatus === filterValue);
    }

    return {
        orders: ordersWithOpsStatus,
        currentPage: page,
        hasMore,
    };
};