import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/database';

export const load: PageServerLoad = async () => {
  throw redirect(302, '/');
};

export const actions: Actions = {
  default: async ({ cookies }) => {
    const session = cookies.get('session');

    if (session) {
      // Update last logout time
      await db.user.updateMany({
        where: { userAuthToken: session },
        data: { lastLogout: new Date() }
      });
    }

    // Clear the session cookie
    cookies.set('session', '', {
      path: '/',
      expires: new Date(0),
    });

    // Redirect the user
    throw redirect(302, '/login');
  },
};