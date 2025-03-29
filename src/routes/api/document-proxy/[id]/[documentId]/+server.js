// src/routes/api/zoho-document/[salesOrderId]/[documentId]/+server.js
import { error } from '@sveltejs/kit';

export async function GET({ params, fetch, request, url }) {
    const { salesOrderId, documentId } = params;
    const organizationId = '60005679410';
    
    try {
        // Get the token
        const tokenResponse = await fetch('/api/zohoAuthToken');
        const { token } = await tokenResponse.json();
        
        if (!token) {
            throw error(401, 'Authentication token not available');
        }
        
        // Get the filename from the query parameter (if provided)
        const filename = url.searchParams.get('filename') || 'document';
        
        // Make the request to Zoho
        const documentUrl = `https://www.zohoapis.in/books/v3/salesorders/${salesOrderId}/documents/${documentId}?organization_id=${organizationId}`;
        
        const response = await fetch(documentUrl, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`
            }
        });
        
        if (!response.ok) {
            console.error(`Error from Zoho API: ${response.status} ${response.statusText}`);
            throw error(response.status, 'Failed to fetch document from Zoho');
        }
        
        // Get the document content and headers
        const documentData = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        
        // Create headers for the response
        const headers = new Headers();
        headers.set('Content-Type', contentType);
        
        // Set content disposition for download with the proper filename
        const disposition = request.headers.get('purpose') === 'download' 
            ? `attachment; filename="${encodeURIComponent(filename)}"` 
            : 'inline';
        
        headers.set('Content-Disposition', disposition);
        
        return new Response(documentData, {
            status: 200,
            headers
        });
    } catch (err) {
        console.error('Document proxy error:', err);
        throw error(500, 'Failed to retrieve document');
    }
}
