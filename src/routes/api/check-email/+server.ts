import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const POST: RequestHandler = async ({ request }) => {
  const { email } = await request.json();
  
  const user = await db.user.findUnique({
    where: { email },
  });

  return json({ exists: !!user });
};