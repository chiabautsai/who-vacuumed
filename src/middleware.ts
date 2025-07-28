import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth/auth0";

export async function middleware(request: NextRequest) {
  const authRes = await auth0.middleware(request);

  // Ensure Auth0 routes are handled by the SDK
  if (request.nextUrl.pathname.startsWith("/auth")) {
    return authRes;
  }

  // All routes require authentication (no public routes in this application)
  // Any route that gets to this point will be considered a protected route
  const { origin } = new URL(request.url);
  
  try {
    const session = await auth0.getSession(request);

    // If the user does not have a session, redirect to login
    if (!session) {
      return NextResponse.redirect(`${origin}/auth/login`);
    }

    // Check if session is expired or about to expire
    // Auth0 sessions typically include exp claim
    if (session.user && typeof session.user === 'object' && 'exp' in session.user) {
      const expirationTime = session.user.exp as number;
      const currentTime = Math.floor(Date.now() / 1000);
      
      // If session is expired, redirect to login
      if (expirationTime && currentTime >= expirationTime) {
        return NextResponse.redirect(`${origin}/auth/login`);
      }
    }

    // If a valid session exists, continue with the response from Auth0 middleware
    return authRes;
  } catch (error) {
    console.error('Session validation error:', error);
    // If there's an error validating the session, redirect to login
    return NextResponse.redirect(`${origin}/auth/login`);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}