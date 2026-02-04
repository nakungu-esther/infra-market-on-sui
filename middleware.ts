import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect API routes with middleware
  // Let client-side pages handle their own auth with useSession
  if (pathname.startsWith('/api')) {
    // API routes can check Authorization headers themselves
    return NextResponse.next();
  }

  // For page routes, let the client-side components handle authentication
  // This allows localStorage bearer tokens to work properly
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};