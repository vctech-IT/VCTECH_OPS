import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const POST: RequestHandler = async ({ locals, cookies }) => {
  if (locals.user) {
    await db.user.update({
      where: { id: locals.user.id },
      data: { lastLogout: new Date() }
    });
  }

  cookies.set('session', '', {
    path: '/',
    expires: new Date(0),
  });

  return json({ success: true });
};