import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-compatible auth config (used by middleware).
 * Does not import Drizzle or any Node.js-only modules.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/finance') ||
        nextUrl.pathname.startsWith('/contributions') ||
        nextUrl.pathname.startsWith('/savings') ||
        nextUrl.pathname.startsWith('/purchases') ||
        nextUrl.pathname.startsWith('/evidence') ||
        nextUrl.pathname.startsWith('/members') ||
        nextUrl.pathname.startsWith('/roles') ||
        nextUrl.pathname.startsWith('/permissions') ||
        nextUrl.pathname.startsWith('/audit') ||
        nextUrl.pathname.startsWith('/settings');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        if (nextUrl.pathname === '/login' || nextUrl.pathname === '/') {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Extended user fields from authorize()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const extUser = user as any;
        token.classId = extUser.classId;
        token.roleId = extUser.roleId;
        token.roleName = extUser.roleName;
        token.roleCode = extUser.roleCode;
        token.gender = extUser.gender;
        token.avatarUrl = extUser.avatarUrl;
        token.permissions = extUser.permissions || [];
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = session as any;
        s.user.classId = token.classId;
        s.user.roleId = token.roleId;
        s.user.roleName = token.roleName;
        s.user.roleCode = token.roleCode;
        s.user.gender = token.gender;
        s.user.avatarUrl = token.avatarUrl;
        s.user.permissions = token.permissions || [];
      }
      return session;
    },
  },
  providers: [], // Providers added in auth.ts (not edge-compatible)
  session: {
    strategy: 'jwt',
  },
};
