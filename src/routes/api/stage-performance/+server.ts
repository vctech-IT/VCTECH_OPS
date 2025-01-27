// /api/stage-performance/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const GET: RequestHandler = async ({ url }) => {
  const stage = parseInt(url.searchParams.get('stage') || '0');

  const orders = await db.stage0.findMany({
    where: { currentStage: stage },
    select: {
      SONumber: true,
      clientName: true,
      stageStartDates: true,
      stageDurations: true,
      createdAt: true
    }
  });

  const now = new Date();
  const performanceData = orders.map(order => {
    const stageStart = new Date(order.stageStartDates[stage]);
    const currentDuration = (now.getTime() - stageStart.getTime()) / (1000 * 60 * 60 * 24);
    const totalDuration = Object.values(order.stageDurations).reduce((sum, duration) => sum + duration, 0) + currentDuration;

    return {
      SONumber: order.SONumber,
      clientName: order.clientName,
      currentStageDuration: currentDuration,
      totalDuration: totalDuration,
      createdAt: order.createdAt
    };
  });

  return json({ performanceData });
};