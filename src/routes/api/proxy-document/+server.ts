// src/routes/api/proxy-document/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { url, token } = body;
    
    // Make request to Zoho API
    const response = await fetch(url, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`
      }
    });
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch document' }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Get response data as blob
    const blob = await response.blob();
    
    // Return the blob with appropriate headers
    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': response.headers.get('Content-Disposition') || 'attachment'
      }
    });
  } catch (error) {
    console.error('Error in proxy-document endpoint:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
