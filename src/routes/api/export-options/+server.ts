import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [pmNames, orderStatuses, categories, clientNames] = await Promise.all([
      prisma.stage0.findMany({ select: { PMName: true }, distinct: ['PMName'] }),
      prisma.stage0.findMany({ select: { orderStatus: true }, distinct: ['orderStatus'] }),
      prisma.stage0.findMany({ select: { SOCategory: true }, distinct: ['SOCategory'] }),
      prisma.stage0.findMany({ select: { clientName: true }, distinct: ['clientName'] })
    ]);

    return json({
      pmNames: pmNames.map(p => p.PMName),
      orderStatuses: orderStatuses.map(o => o.orderStatus),
      categories: categories.map(c => c.SOCategory),
      clientNames: clientNames.map(c => c.clientName)
    });
  } catch (error) {
    console.error('Error fetching export options:', error);
    return json({ error: 'Failed to fetch export options' }, { status: 500 });
  }
}