import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const POST: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db.user.update({
    where: { id: locals.user.id },
    data: { lastActivity: new Date() }
  });

  return json({ success: true });
};