import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getJavaApiBaseUrl } from './lib/api-config';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the request path starts with /api/
    if (pathname.startsWith('/api/')) {
        const javaApiBaseUrl = getJavaApiBaseUrl();
        if (!javaApiBaseUrl) {
            return NextResponse.json({ error: 'JAVA_API_URL is not set' }, { status: 500 });
        }
        const destination = `${javaApiBaseUrl}${pathname}${request.nextUrl.search}`;
        return NextResponse.rewrite(new URL(destination));
    }

    // If no rewrite is needed, continue to the next middleware or route
    return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
    matcher: '/api/:path*',
}; 