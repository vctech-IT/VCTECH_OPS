import { PrismaClient } from '@prisma/client';
import { sendUserApprovalNotification } from '$lib/emailService';
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ url }) => {
  const userId = url.searchParams.get('userId');
  const adminEmail = url.searchParams.get('adminEmail');

  if (!userId || !adminEmail) {
    return new Response('Missing userId or adminEmail', { status: 400 });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isApproved: true }
    });

    await sendUserApprovalNotification(updatedUser.email, updatedUser.username);

    return new Response(`
      <html>
        <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f4f4f4;">
          <div style="text-align: center; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <h1 style="color: #4CAF50;">User Approved Successfully</h1>
            <p>The user has been approved and notified via email.</p>
            <p>You can close this window now.</p>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: {
        'Content-Type': 'text/html'
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    return new Response('Error approving user', { status: 500 });
  }
};