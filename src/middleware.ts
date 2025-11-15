import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/take-remove', req.url));
    }

    if (
      path.startsWith('/inventory-check') &&
      token?.role !== 'ADMIN' &&
      token?.role !== 'PROBIE'
    ) {
      return NextResponse.redirect(new URL('/take-remove', req.url));
    }

    if (path.startsWith('/audit-logs') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/take-remove', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith('/login')) {
          return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

