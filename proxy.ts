import { NextRequest, NextResponse } from 'next/server';

import { getRequestSession } from '@/lib/requestAuth';

function isPublicAssetPath(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname === '/favicon.ico'
  );
}

function isPublicApiPath(pathname: string) {
  return pathname === '/api/health' || pathname === '/api/auth/login' || pathname === '/api/auth/logout';
}

function userAllowedPagePath(pathname: string) {
  return pathname === '/dashboard' || pathname.startsWith('/drive') || pathname.startsWith('/profile');
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public assets always
  if (isPublicAssetPath(pathname)) {
    return NextResponse.next();
  }

  // Public routes
  if (pathname.startsWith('/login') || isPublicApiPath(pathname)) {
    // Si ya hay sesión, evita volver al login
    const session = await getRequestSession(req);
    if (session && pathname.startsWith('/login')) {
      const next = req.nextUrl.searchParams.get('next') || '';
      const desired = next.startsWith('/') ? next : '';

      if (session.r === 'admin') {
        const url = req.nextUrl.clone();
        url.pathname = desired || '/admin';
        url.search = '';
        return NextResponse.redirect(url);
      }

      const url = req.nextUrl.clone();
      url.pathname = desired && userAllowedPagePath(desired) ? desired : '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  const session = await getRequestSession(req);

  if (!session) {
    // APIs: responder 401 en vez de redirigir
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // RBAC para APIs
  if (pathname.startsWith('/api/admin')) {
    if (session.r !== 'admin') {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }
    return NextResponse.next();
  }

  // RBAC para páginas
  if (pathname.startsWith('/admin')) {
    if (session.r !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (session.r === 'user') {
    // Usuarios normales: solo dashboard/drive/profile
    if (!userAllowedPagePath(pathname) && !pathname.startsWith('/api/')) {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
