import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/database';
import bcrypt from 'bcrypt';

export const load: PageServerLoad = async ({ url }) => {
  const token = url.searchParams.get('token');
  
  if (!token) {
    throw redirect(302, '/login');
  }

  const user = await db.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    throw redirect(302, '/forgot-password?error=invalid-token');
  }

  return {};
};

export const actions: Actions = {
  resetPassword: async ({ request }) => {
    const data = await request.formData();
    const token = data.get('token')?.toString();
    const password = data.get('password')?.toString();
    const confirmPassword = data.get('confirmPassword')?.toString();

    if (!token) {
      return fail(400, { error: 'Invalid reset token.' });
    }

    if (!password || !confirmPassword) {
      return fail(400, { error: 'Please provide both passwords.' });
    }

    if (password !== confirmPassword) {
      return fail(400, { error: 'Passwords do not match.' });
    }

    if (password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters long.' });
    }

    try {
      const user = await db.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        return fail(400, { error: 'Invalid or expired reset token. Please request a new reset link.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await db.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        }
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return fail(500, { error: 'An error occurred while resetting your password. Please try again later.' });
    }
  }
};