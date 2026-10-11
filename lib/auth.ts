import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/db/prisma";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role?: Role;
    passwordChangedAt?: string | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: Role;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    passwordChangedAt?: string | null;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Required on Vercel / reverse proxies (UntrustedHost otherwise).
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user?.passwordHash || !user.active) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name:
            user.name ??
            `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          role: user.role,
          passwordChangedAt: user.passwordChangedAt?.toISOString() ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.passwordChangedAt = user.passwordChangedAt ?? null;
        return token;
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, active: true, passwordChangedAt: true },
        });
        if (!dbUser || !dbUser.active) {
          return {};
        }
        const changedAt = dbUser.passwordChangedAt?.toISOString() ?? null;
        if (
          token.passwordChangedAt != null &&
          changedAt != null &&
          token.passwordChangedAt !== changedAt
        ) {
          return {};
        }
        // First login after adding passwordChangedAt: bind the claim.
        if (token.passwordChangedAt == null && changedAt != null) {
          token.passwordChangedAt = changedAt;
        }
        token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (!token?.id || !token?.role) {
        // Make session.user falsy so existing `if (!session?.user)` guards work.
        const { user: _removed, ...rest } = session;
        return rest as typeof session;
      }
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
});
