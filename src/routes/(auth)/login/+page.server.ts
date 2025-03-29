import { fail, redirect } from '@sveltejs/kit'
import bcrypt from 'bcrypt'
import type { Action, Actions, PageServerLoad } from './$types'
import { db } from '$lib/database'

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, '/')
  }
}

const login: Action = async ({ cookies, request }) => {
  try {
    const data = await request.formData()
    const username = data.get('username')
    const password = data.get('password')

    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !username ||
      !password
    ) {
      console.log('Invalid input data');
      return fail(400, { invalid: true })
    }

    const user = await db.user.findUnique({ where: { username } })

    if (!user) {
      console.log(`User not found: ${username}`);
      return fail(400, { credentials: true })
    }

    const userPassword = await bcrypt.compare(password, user.passwordHash)
    if (!userPassword) {
      console.log(`Invalid password for user: ${username}`);
      return fail(400, { credentials: true })
    }

    if (!user.isApproved) {
      console.log(`User not approved: ${username}`);
      return fail(400, { notApproved: true })
    }

    const now = new Date()

    // Update last login time, last activity, and generate new auth token
    const authenticatedUser = await db.user.update({
      where: { username: user.username },
      data: { 
        userAuthToken: crypto.randomUUID(),
        lastLogin: now,
        lastActivity: now,
        lastLogout: null // Clear last logout when logging in
      },
    })

    cookies.set('session', authenticatedUser.userAuthToken, {
      // send cookie for every page
      path: '/',
      // server side only cookie so you can't use `document.cookie`
      httpOnly: true,
      // only requests from same site can send cookies
      // https://developer.mozilla.org/en-US/docs/Glossary/CSRF
      sameSite: 'strict',
      // only sent over HTTPS in production
      secure: process.env.NODE_ENV === 'production',
      // set cookie to expire after a month
      maxAge: 60 * 60 * 24 * 30,
    })

    console.log(`User logged in successfully: ${username}`);
    throw redirect(302, '/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    return fail(500, { message: 'An unexpected error occurred' })
  }
}

export const actions: Actions = { login }
