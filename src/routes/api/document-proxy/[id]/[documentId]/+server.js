import { error } from '@sveltejs/kit';

export async function GET({ params, fetch, request, url }) {
    const { salesOrderId, documentId } = params;
    const organizationId = '60005679410';

    try {
        // Fetch token directly from Zoho (if you have a local API, use it)
        const tokenResponse = await fetch('/api/zohoAuthToken');
        const { token } = await tokenResponse.json();

        if (!token) {
            throw error(401, 'Authentication token not available');
        }

        // Construct Zoho API URL
        const documentUrl = `https://www.zohoapis.in/books/v3/salesorders/${salesOrderId}/documents/${documentId}?organization_id=${organizationId}`;

        // Fetch document from Zoho
        const response = await fetch(documentUrl, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`
            }
        });

        if (!response.ok) {
            console.error(`Error from Zoho API: ${response.status} ${response.statusText}`);
            throw error(response.status, 'Failed to fetch document from Zoho');
        }

        // Determine filename
        const filename = url.searchParams.get('filename') || 'document.pdf';

        // Create response headers
        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('content-type') || 'application/pdf');
        headers.set('Content-Disposition', request.headers.get('purpose') === 'download'
            ? `attachment; filename="${filename}"`
            : 'inline');

        return new Response(response.body, { status: 200, headers });
    } catch (err) {
        console.error('Document proxy error:', err);
        throw error(500, 'Failed to retrieve document');
    }
}
