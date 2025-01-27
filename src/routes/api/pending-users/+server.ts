// src/routes/api/pending-users.ts

import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ locals }) => {
  // Check if the user is authenticated and has the necessary permissions
  if (locals.user.role !== 'ADMIN') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pendingUsers = await prisma.user.findMany({
      where: {
        isApproved: false
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return json(pendingUsers);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};