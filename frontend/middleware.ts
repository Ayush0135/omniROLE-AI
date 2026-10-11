import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes (Landing Page, Auth Routes, Docs)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/docs',
]);

export default clerkMiddleware(async () => {
  // Allow all pages to open cleanly without blocking or throwing Clerk 404 rewrites
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|webmanifest|png|jpg|jpeg|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
