// src/routes/api/chat/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const POST = (async ({ request }) => {
  try {
    const { SOId, SONumber, username, message } = await request.json();
    
    const newMessage = await db.chatMessage.create({
      data: {
        SOId,
        SONumber,
        username,
        message
      }
    });
    
    return json(newMessage);
  } catch (error) {
    console.error('Error creating chat message:', error);
    return new Response('Failed to send message', { status: 500 });
  }
}) satisfies RequestHandler;