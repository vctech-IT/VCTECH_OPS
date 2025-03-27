import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ url }) => {
  try {
    const page = Number(url.searchParams.get('page') || 1);
    const limit = Number(url.searchParams.get('limit') || 200);
    const searchTerm = url.searchParams.get('search') || '';
    const sortColumn = url.searchParams.get('sortColumn') || 'date';
    const sortDirection = url.searchParams.get('sortDirection') || 'desc';

    // Prepare where clause for searching
    const whereClause: Prisma.InvoiceWhereInput = {
      OR: searchTerm 
        ? [
            { customer_name: { contains: searchTerm, mode: 'insensitive' } },
            { invoice_number: { contains: searchTerm, mode: 'insensitive' } },
            { reference_number: { contains: searchTerm, mode: 'insensitive' } }
          ]
        : undefined
    };

    // Prepare orderBy clause
    const orderBy: Prisma.InvoiceOrderByWithRelationInput = {
      [sortColumn]: sortDirection
    };

    // Fetch total count first
    const total = await prisma.invoice.count({ where: whereClause });

    // Fetch paginated invoices
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy,
      take: limit,
      skip: (page - 1) * limit
    });

    return json({ 
      invoices, 
      total,
      page,
      limit 
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return json({ error: 'Failed to fetch invoices' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};

// Separate export for export route
export const exportInvoices: RequestHandler = async ({ url }) => {
  try {
    const searchTerm = url.searchParams.get('search') || '';

    const whereClause: Prisma.InvoiceWhereInput = {
      OR: searchTerm 
        ? [
            { customer_name: { contains: searchTerm, mode: 'insensitive' } },
            { invoice_number: { contains: searchTerm, mode: 'insensitive' } },
            { reference_number: { contains: searchTerm, mode: 'insensitive' } }
          ]
        : undefined
    };

    // Fetch all matching invoices for export
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });

    return json({ invoices });
  } catch (error) {
    console.error('Error exporting invoices:', error);
    return json({ error: 'Failed to export invoices' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};
