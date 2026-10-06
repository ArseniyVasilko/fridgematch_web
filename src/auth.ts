/**
 * Authentication (Auth.js / NextAuth v5) with email + password.
 * Passwords are hashed with bcrypt; sessions are signed, http-only JWT
 * cookies (design document, 5.7).
 */
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

/** Used to keep timing the same when an email is not registered. */
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut, unstable_update: updateSession } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) throw new CredentialsSignin();
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user) {
          // compare anyway so response time does not reveal which emails exist
          await bcrypt.compare(parsed.data.password, DUMMY_HASH);
          throw new CredentialsSignin();
        }
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) throw new CredentialsSignin();
        return { id: String(user.id), email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user?.id) token.uid = user.id;
      // profile edits (updateSession) refresh the name and email shown in the header
      if (trigger === "update" && session?.user) {
        token.name = session.user.name;
        token.email = session.user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token.uid && session.user) session.user.id = String(token.uid);
      return session;
    },
  },
});
