import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/db/prisma";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
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

/** Compared against when the user doesn't exist, so timing doesn't reveal valid emails. */
const DUMMY_PASSWORD_HASH =
  "$2b$12$Fajc/yyD0j5SpQmxLoZEIuE3ZuLS6GE48x/nO5PezHfDOAUkuzkS6";
const LOGIN_WINDOW_MS = 15 * 60_000;

// A guessable secret lets anyone forge session tokens. Refuse to serve with the
// .env.example placeholder or a short value (the build phase is exempt).
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  const secret = process.env.AUTH_SECRET ?? "";
  if (secret.length < 32 || secret.startsWith("change-me")) {
    throw new Error(
      "AUTH_SECRET is missing or insecure. Generate one with `npx auth secret`."
    );
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
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase();

        // /api/auth/callback/credentials is reachable directly, bypassing
        // loginAction's limits — throttle here too (per IP and per account).
        const ip = clientIpFromHeaders(request.headers);
        if (
          !rateLimit(`auth:ip:${ip}`, 30, LOGIN_WINDOW_MS).ok ||
          !rateLimit(`auth:email:${email}`, 10, LOGIN_WINDOW_MS).ok
        ) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash || !user.active) {
          await bcrypt.compare(parsed.data.password, DUMMY_PASSWORD_HASH);
          return null;
        }

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
        // Token predates the user's first password change: revoke it if it was
        // issued before that change, otherwise bind the claim.
        if (token.passwordChangedAt == null && changedAt != null) {
          const issuedAtMs = (token.iat ?? 0) * 1000;
          if (issuedAtMs < dbUser.passwordChangedAt!.getTime()) {
            return {};
          }
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
