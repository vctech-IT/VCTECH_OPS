// src/routes/api/chat/[id]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const GET = (async ({ params }) => {
  const { id } = params;
  
  try {
    const messages = await db.chatMessage.findMany({
      where: {
        SOId: id
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    return json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return new Response('Failed to fetch messages', { status: 500 });
  }
}) satisfies RequestHandler;