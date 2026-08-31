import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { eq, and, or, ilike, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, classMembers, roles } from '@/lib/db/schema';
import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = (
          (credentials?.username as string) ||
          (credentials?.email as string) ||
          ''
        ).trim();
        const password = (credentials?.password as string) || '';

        if (!identifier || !password) {
          return null;
        }

        // Find user by name (username) or email
        const [user] = await db
          .select()
          .from(users)
          .where(
            and(
              or(
                ilike(users.name, identifier),
                ilike(users.email, identifier),
                ilike(users.email, `${identifier}@%`)
              ),
              isNull(users.deletedAt)
            )
          )
          .limit(1);

        if (!user) return null;

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // Check user status
        if (user.status !== 'ACTIVE') return null;

        // Get class membership, role, and permissions
        const [membership] = await db
          .select({
            classId: classMembers.classId,
            roleId: classMembers.roleId,
            roleName: roles.name,
            roleCode: roles.code,
          })
          .from(classMembers)
          .innerJoin(roles, eq(classMembers.roleId, roles.id))
          .where(
            and(
              eq(classMembers.userId, user.id),
              eq(classMembers.status, 'ACTIVE')
            )
          )
          .limit(1);

        let userPerms: string[] = [];
        if (membership?.roleId) {
          const { getUserPermissions } = await import('@/lib/permissions/check');
          userPerms = await getUserPermissions(user.id, membership.roleId);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          gender: user.gender,
          avatarUrl: user.avatarUrl,
          classId: membership?.classId ?? null,
          roleId: membership?.roleId ?? null,
          roleName: membership?.roleName ?? null,
          roleCode: membership?.roleCode ?? null,
          permissions: userPerms,
        };
      },
    }),
  ],
});
