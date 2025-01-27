// src/routes/api/chat/seen/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const POST = (async ({ request }) => {
  try {
    const { messageIds, username } = await request.json();
    
    // Update seen status for multiple messages
    await db.chatMessage.updateMany({
      where: {
        id: { in: messageIds },
        NOT: {
          seenBy: { has: username }
        }
      },
      data: {
        seenBy: {
          push: username
        }
      }
    });
    
    return json({ success: true });
  } catch (error) {
    console.error('Error updating message seen status:', error);
    return new Response('Failed to update seen status', { status: 500 });
  }
}) satisfies RequestHandler;