import type { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { MagicToken } from "@prisma/client";

// Extend NextAuth session/JWT types
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
    };
  }
  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  providers: [
    // ── Google OAuth ─────────────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),

    // ── Email / Password + Magic Token ────────────────────────────────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        magicToken: { label: "Magic Token", type: "text" },
      },
      async authorize(credentials) {
        // ── Magic token login ────────────────────────────────────────────
        if (credentials?.magicToken) {
          const magic = await db.magicToken.findUnique({
            where: { token: credentials.magicToken },
          }) as MagicToken | null;

          if (!magic || magic.type !== "admin" || !magic.usedAt || magic.expiresAt < new Date(Date.now() - 5 * 60 * 1000)) {
            return null;
          }

          const user = await db.user.findUnique({ where: { email: magic.email } });
          if (!user) return null;

          return { id: user.id, email: user.email, name: user.name ?? undefined, role: user.role };
        }

        // ── Password login ───────────────────────────────────────────────
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;
        if (!user.password) return null; // OAuth-only account

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // ── Google: create or update User row on sign-in ─────────────────────────
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await db.user.findUnique({ where: { email: user.email } });

        if (!existing) {
          // Create new user with "user" role by default
          await db.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              image: user.image ?? null,
              provider: "google",
              role: "user",
            },
          });
        } else {
          // Update profile picture / name from Google on every login
          await db.user.update({
            where: { email: user.email },
            data: {
              image: user.image ?? existing.image,
              name: user.name ?? existing.name,
            },
          });
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // For Google sign-in the `user` object doesn't carry our DB role,
      // so we fetch it from the database on the first token creation.
      if (account?.provider === "google" && token.email) {
        const dbUser = await db.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
};
