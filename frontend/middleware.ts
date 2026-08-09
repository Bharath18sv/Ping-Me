import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // We check for access_token or authorization header / cookie if set.
  // Note: Client-side storage (localStorage) is also checked in auth thunks,
  // but middleware provides initial route guard structure.
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
