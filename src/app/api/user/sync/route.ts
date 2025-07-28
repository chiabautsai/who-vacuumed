import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth/auth0'
import { syncUserWithDatabase, getCurrentUser } from '@/lib/auth/user-sync'

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await auth0.getSession(request)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { auth0Id, email, name, picture } = body

    // Verify the auth0Id matches the session
    if (auth0Id !== session.user.sub) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Sync user with database
    await syncUserWithDatabase({
      sub: auth0Id,
      email,
      name,
      picture,
    })

    // Get the updated user from database
    const user = await getCurrentUser(auth0Id)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found after sync' },
        { status: 500 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('User sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}