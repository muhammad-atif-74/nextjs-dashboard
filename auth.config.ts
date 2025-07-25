import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const authConfig = {
    pages: {
        signIn: '/login', // If a user is not logged in and tries to visit a protected page, send them to /login
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) { // This function runs every time a user tries to open a page.

            // Check if the user is logged in
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isOnDashboard) {
                // If the user is logged in, allow access to the dashboard
                if (isLoggedIn) return true;
                // If the user is not logged in and tries to access the dashboard, redirect them to the login page
                return false;
            }
            else if (isLoggedIn) {
                // If the user is logged in and tries to access the login page, redirect them to the dashboard
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true; // Allow access to the login page if not logged in
        }
    },
    providers: [Credentials({})]
} satisfies NextAuthConfig;