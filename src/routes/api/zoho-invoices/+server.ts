// src/routes/api/zoho-invoices/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async () => {
  try {
    // Fetch invoices from the database
    const invoices = await prisma.invoice.findMany({
      orderBy: {
        date: 'desc' // Optional: sort by most recent invoices first
      }
    });

    return json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return json({ error: 'Failed to fetch invoices' }, { status: 500 });
  } finally {
    // Always disconnect Prisma client to prevent connection leaks
    await prisma.$disconnect();
  }
};
