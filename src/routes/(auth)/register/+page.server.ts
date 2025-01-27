import { fail, redirect } from '@sveltejs/kit'
import type { Action, Actions, PageServerLoad } from './$types'
import bcrypt from 'bcrypt'
import { db } from '$lib/database'
import { sendAdminNotification } from '$lib/emailService'

// // using an enum for user roles to avoid typos
// // if you're not using TypeScript use an object
enum Roles {
  ADMIN = 'ADMIN',
  USER = 'USER',
  OPERATION = 'OPERATION',
  WAREHOUSE = 'WAREHOUSE',
  MATERIALPROCURE = 'MATERIALPROCURE',
  ACCOUNTANT = 'ACCOUNTANT',
  MANAGER = 'MANAGER'
}

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user) {
    redirect(302, '/')
  }
}

//fetching the data of the reg form
const register: Action = async ({ request }) => {
  const data = await request.formData()
  const username = data.get('username')
  const password = data.get('password')
  const email = data.get('email')
  const phone = data.get('phoneNo')
  const role = data.get('role')

  // Server-side validation functions
  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return re.test(email);
  }

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    typeof email !== 'string' ||
    typeof phone !== 'string' ||
    typeof role !== 'string' ||
    !username ||
    !password ||
    !email ||
    !phone ||
    !role ||
    !(role in Roles) ||
    !validateEmail(email)
  ) {
    return fail(400, { invalid: true })
  }

  const user = await db.user.findUnique({
    where: { username },
  })
   
  const emailid = await db.user.findUnique({
    where: { email },
  })
  const phoneno = await db.user.findUnique({
    where: { phoneNo: phone },
  })
   
  if (user) {
    return fail(400, { user: true })
  }
  if (emailid) {
    return fail(400, { emailid: true })
  }
  if (phoneno) {
    return fail(400, { phoneno: true })
  }

  try {
    const newUser = await db.user.create({
      data: {
        username,
        passwordHash: await bcrypt.hash(password, 10),
        email,
        phoneNo: phone,
        userAuthToken: crypto.randomUUID(),
        role: { connect: { name: role as Roles } },
      },
      include: { role: true },
    })

    const adminUsers = await db.user.findMany({
      where: {
        AND: [
          { role: { name: 'ADMIN' } },
          { isApproved: true }
        ]
      },
      select: { email: true, username: true }
    })

    for (const admin of adminUsers) {
      await sendAdminNotification(newUser, admin.email, admin.username)
    }

    return {
      success: true,
      message: 'User registered successfully.'
    };
  } catch (error) {
    console.error('Error during registration:', error)
    return fail(500, { error: 'An error occurred during registration' })
  }
}


export const actions: Actions = {
  register: async (event) => {
    const result = await register(event);
    if (result && 'success' in result && result.success) {
      return { success: true };
    }
    return result;
  }
};