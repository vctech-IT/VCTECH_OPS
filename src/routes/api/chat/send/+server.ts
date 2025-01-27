//api/chat/send/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Pusher from 'pusher';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
});

export const POST: RequestHandler = async ({ request }) => {
  const { salesOrderId, message } = await request.json();

  try {
    // Save the message to the database
    const savedMessage = await prisma.chatMessage.create({
      data: {
        salesOrderId,
        userId: message.userId,
        content: message.content,
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    const formattedMessage = {
      id: savedMessage.id,
      userId: savedMessage.userId,
      userName: savedMessage.user.name,
      content: savedMessage.content,
      timestamp: savedMessage.timestamp
    };

    // Trigger the Pusher event
    await pusher.trigger(`chat-${salesOrderId}`, 'new-message', {
      message: formattedMessage
    });

    return json({ success: true, message: formattedMessage });
  } catch (error) {
    console.error('Error processing message:', error);
    return json({ error: 'Failed to process message' }, { status: 500 });
  }
};