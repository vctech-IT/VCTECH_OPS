import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/database';


export const GET: RequestHandler = async ({ url }) => {
  const field = url.searchParams.get('field');
  const value = url.searchParams.get('value');

  if (!field || !value) {
    return json({ error: 'Missing field or value' }, { status: 400 });
  }

    let user;
    let email;
    let phone;
  let available = true;

  switch (field) {
    case 'username':
    user = await db.user.findUnique({ where: { username: value } });
      available = !user;
      break;
    case 'email':
    email = await db.user.findUnique({ where: { email: value } });
      available = !email;
      break;
    case 'phoneNo':
    phone = await db.user.findUnique({ where: { phoneNo: value } });
      available = !phone;
      break;
    default:
      return json({ error: 'Invalid field' }, { status: 400 });
  }

  return json({ available });
};