import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/database';

export const handle: Handle = async ({ event, resolve }) => {
  // get cookies from browser
  const session = event.cookies.get('session');

  if (!session) {
    // if there is no session load page as normal
    return await resolve(event);
  }

  // find the user based on the session
  const user = await db.user.findUnique({
    where: { userAuthToken: session },
    select: { 
      id: true, 
      username: true, 
      email: true, 
      phoneNo: true,
      role: { select: { name: true } },
      createdAt: true,
      image: true,
      lastLogin: true
    }
  });

  // if user exists set events.locals and update lastLogin
  if (user) {
    event.locals.user = {
      id: user.id,
      name: user.username,
      email: user.email,
      phoneNo: user.phoneNo,
      role: user.role.name,
      createdAt: user.createdAt,
      image: user.image,
      lastLogin: user.lastLogin,
      lastLogout: user.lastLogout
    };

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (!user.lastLogin || user.lastLogin < fiveMinutesAgo) {
      await db.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
    }

    // Update lastLogin
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
  }

  // load page as normal
  return await resolve(event);
};