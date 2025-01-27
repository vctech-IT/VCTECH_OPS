import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/database';

export const GET: RequestHandler = async ({ params }) => {
  const salesOrderId = params.id;

  try {
    const logs = await db.activityLog.findMany({
      where: { salesOrderId },
      orderBy: { timestamp: 'desc' },
    });

    return json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
};