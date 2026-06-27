import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize() {
        // Must be empty or simple stub in this shared config to avoid Node.js module imports (Mongoose/bcrypt) in Edge Middleware.
        // The actual verification takes place in auth.ts.
        return null;
      },
    }),
  ],
  session: { strategy: 'jwt' as const },
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
  callbacks: {
    jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? 'User';
      }
      return token;
    },
    session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
