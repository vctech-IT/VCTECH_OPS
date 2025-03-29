// src/routes/api/document-proxy/[id]/[documentId]/+server.js
import { json } from '@sveltejs/kit';

export async function GET({ params, fetch }) {
    const { id, documentId } = params;
    
    try {
        // Get the token
        const tokenResponse = await fetch('/api/zohoAuthToken');
        const { token } = await tokenResponse.json();
        
        // Make the request to Zoho
        const response = await fetch(
            `https://www.zohoapis.in/books/v3/salesorders/${id}/attachment/${documentId}?organization_id=60005679410`, 
            {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${token}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`Error fetching document: ${response.status}`);
        }
        
        // Get the document data as an array buffer
        const documentData = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        
        // Return the document with proper content type
        return new Response(documentData, {
            headers: {
                'Content-Type': contentType
            }
        });
    } catch (error) {
        console.error('Error proxying document:', error);
        return json({ error: 'Failed to fetch document' }, { status: 500 });
    }
}
