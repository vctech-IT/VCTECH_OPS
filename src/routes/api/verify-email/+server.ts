// src/routes/api/verify-email/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { otp } = body;

  if (!otp) {
    return json({ success: false, message: 'OTP is required' }, { status: 400 });
  }

  try {
    const user = await db.user.findFirst({
      where: { 
        otp,
        otpExpires: { gt: new Date() }
      },
    });

    if (!user) {
      return json({ success: false, message: 'Invalid or expired OTP' }, { status: 400 });
    }

    await db.user.update({
      where: { id: user.id },
      data: { 
        isVerified: true, 
        otp: null, 
        otpExpires: null 
      },
    });

    return json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error during email verification:', error);
    return json({ success: false, message: 'An error occurred during verification' }, { status: 500 });
  }
};