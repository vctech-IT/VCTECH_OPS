import { PrismaClient } from '@prisma/client';
import { redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { sendUserDeclineNotification, sendUserApprovalNotification } from '$lib/emailService';

const prisma = new PrismaClient();

export const load: PageServerLoad = async ({ locals, depends }) => {
  // Redirect user if not logged in
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  // Add this line to create a dependency
  depends('app:users');

  const pendingUsers = await prisma.user.findMany({
    where: { isApproved: false },
    include: { role: true }
  });

  const approvedUsers = await prisma.user.findMany({
    where: { isApproved: true },
    select: {
      id: true,
      username: true,
      email: true,
      phoneNo: true,
      image: true,
      createdAt: true,
      lastLogin: true,
      lastLogout: true,
      role: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  const pendingUsersCount = await prisma.user.count({
    where: { isApproved: false }
  });

  const roles = await prisma.roles.findMany();

  return { pendingUsers, approvedUsers, roles, pendingUsersCount };
};

export const actions: Actions = {
  approve: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const userId = data.get('userId') as string;
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isApproved: true }
    });

   await sendUserApprovalNotification(updatedUser.email, updatedUser.username)

    return { success: true };
  },

  decline: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const userId = data.get('userId') as string;

    const userToDecline = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (userToDecline) {
      await sendUserDeclineNotification(userToDecline.email, userToDecline.username);
    }
    
    await prisma.user.delete({
      where: { id: userId }
    });

    return { success: true };
  },

  editUser: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const userId = data.get('userId') as string;
    const roleId = parseInt(data.get('roleId') as string);

    await prisma.user.update({
      where: { id: userId },
      data: { roleId }
    });

    return { success: true };
  },

  deleteUser: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const userId = data.get('userId') as string;

    await prisma.user.delete({
      where: { id: userId }
    });

    return { success: true };
  },

  logout: async ({ cookies, locals }) => {
    if (locals.user) {
      // Record the last logout time
      await prisma.user.update({
        where: { id: locals.user.id },
        data: { lastLogout: new Date() }
      });
    }

    cookies.set('session', '', {
      path: '/',
      expires: new Date(0),
    });

    throw redirect(302, '/login');
  }
};