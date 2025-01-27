import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const POST: RequestHandler = async ({ request }) => {
  const { salesOrderId, username, role, action, details, category } = await request.json();

  try {
    const newLog = await db.activityLog.create({
      data: {
        salesOrderId,
        username,
        role,
        action,
        details,
        category,
      },
    });

    return json({ success: true, log: newLog });
  } catch (error) {
    console.error('Error creating activity log:', error);
    return json({ success: false, error: 'Failed to create activity log' }, { status: 500 });
  }
};